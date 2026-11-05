import { and, eq, gt, isNull, lt } from "drizzle-orm";
import { authNonces, getDb, users } from "@zorq/db";
import { SiweMessage } from "siwe";
import { ApiError } from "../http/api";
import { appendAuditEvent } from "../audit";
import {
  buildSiweMessage,
  createNonceValue,
  expectedDomain,
  expectedUri,
  NONCE_TTL_SECONDS,
  normaliseWalletAddress,
  parseAndValidateSiweMessage,
  ss58ToWalletAddress,
  verifySiweSignature,
} from "./siwe";

export type CreatedNonce = {
  nonce: string;
  message: string;
  expiresAt: string;
};

export async function createAuthNonce(input: {
  walletAddress: string;
  ss58Address: string;
  requestId: string;
}): Promise<CreatedNonce> {
  const walletAddress = normaliseWalletAddress(input.walletAddress);
  const mapped = ss58ToWalletAddress(input.ss58Address);

  if (mapped !== walletAddress) {
    throw new ApiError(
      400,
      "INVALID_INPUT",
      "The SS58 account does not map to the supplied EVM address.",
    );
  }

  const db = getDb();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + NONCE_TTL_SECONDS * 1000);
  const nonce = createNonceValue();
  const message = buildSiweMessage({ walletAddress, nonce, issuedAt: now, expiresAt });

  await db.transaction(async (tx) => {
    await tx
      .delete(authNonces)
      .where(lt(authNonces.expiresAt, new Date(now.getTime() - 24 * 60 * 60 * 1000)));

    await tx.insert(authNonces).values({
      nonce,
      walletAddress,
      ss58Address: input.ss58Address,
      domain: expectedDomain(),
      uri: expectedUri(),
      chainId: Number(process.env.PORTALDOT_CHAIN_ID ?? 420420777),
      createdAt: now,
      expiresAt,
    });

    await appendAuditEvent(tx, {
      actorWallet: walletAddress,
      entityType: "auth_nonce",
      entityId: nonce,
      action: "auth.nonce.created",
      requestId: input.requestId,
    });
  });

  return { nonce, message, expiresAt: expiresAt.toISOString() };
}

export type AuthenticatedUser = {
  walletAddress: string;
  ss58Address: string;
  displayName: string | null;
  status: string;
};

export async function verifyAndConsumeNonce(input: {
  message: string;
  signature: string;
  signatureType?: "payload" | "bytes";
  requestId: string;
}): Promise<AuthenticatedUser> {
  let parsed: SiweMessage;
  try {
    parsed = new SiweMessage(input.message);
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "The SIWE message could not be parsed.");
  }

  const db = getDb();
  const [record] = await db
    .select()
    .from(authNonces)
    .where(eq(authNonces.nonce, parsed.nonce))
    .limit(1);

  if (!record) {
    throw new ApiError(401, "NONCE_EXPIRED", "Request a new sign-in challenge.");
  }
  if (record.consumedAt) {
    throw new ApiError(401, "NONCE_REUSED", "This sign-in challenge has already been used.");
  }
  if (record.expiresAt.getTime() <= Date.now()) {
    throw new ApiError(401, "NONCE_EXPIRED", "This sign-in challenge has expired.");
  }

  const validated = parseAndValidateSiweMessage(input.message, record.walletAddress);

  if (
    validated.nonce !== record.nonce ||
    normaliseWalletAddress(validated.address) !== normaliseWalletAddress(record.walletAddress)
  ) {
    throw new ApiError(401, "INVALID_SIGNATURE", "The sign-in challenge does not match.");
  }

  const signatureValid = await verifySiweSignature({
    message: input.message,
    signature: input.signature,
    ss58Address: record.ss58Address,
    signatureType: input.signatureType,
  });

  if (!signatureValid) {
    throw new ApiError(401, "INVALID_SIGNATURE", "The wallet signature could not be verified.");
  }

  return db.transaction(async (tx) => {
    const consumed = await tx
      .update(authNonces)
      .set({ consumedAt: new Date() })
      .where(
        and(
          eq(authNonces.nonce, record.nonce),
          isNull(authNonces.consumedAt),
          gt(authNonces.expiresAt, new Date()),
        ),
      )
      .returning({ nonce: authNonces.nonce });

    if (consumed.length !== 1) {
      throw new ApiError(401, "NONCE_REUSED", "This sign-in challenge has already been used.");
    }

    const now = new Date();
    const [user] = await tx
      .insert(users)
      .values({
        walletAddress: record.walletAddress,
        ss58Address: record.ss58Address,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      })
      .onConflictDoUpdate({
        target: users.walletAddress,
        set: {
          ss58Address: record.ss58Address,
          lastSeenAt: now,
          updatedAt: now,
        },
      })
      .returning();

    if (!user) {
      throw new ApiError(500, "INTERNAL_ERROR", "The user record could not be created.");
    }

    if (user.status !== "active") {
      throw new ApiError(403, "FORBIDDEN", "This wallet is not permitted to sign in.");
    }

    await appendAuditEvent(tx, {
      actorWallet: user.walletAddress,
      entityType: "user",
      entityId: user.walletAddress,
      action: "auth.signed_in",
      requestId: input.requestId,
    });

    return {
      walletAddress: user.walletAddress,
      ss58Address: user.ss58Address,
      displayName: user.displayName,
      status: user.status,
    };
  });
}

export async function getUser(walletAddress: string): Promise<AuthenticatedUser | null> {
  const db = getDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.walletAddress, normaliseWalletAddress(walletAddress)))
    .limit(1);

  if (!user) {
    return null;
  }

  return {
    walletAddress: user.walletAddress,
    ss58Address: user.ss58Address,
    displayName: user.displayName,
    status: user.status,
  };
}
