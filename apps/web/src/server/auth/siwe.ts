import { randomBytes } from "node:crypto";
import { SiweMessage } from "siwe";
import { getAddress } from "viem";
import { ss58ToH160 } from "@polkadot-apps/address";
import { cryptoWaitReady, decodeAddress, signatureVerify } from "@polkadot/util-crypto";
import { getServerEnv } from "../env";
import { ApiError } from "../http/api";

export const NONCE_TTL_SECONDS = 5 * 60;

let cryptoReady: Promise<void> | undefined;

async function ensureCryptoReady(): Promise<void> {
  cryptoReady ??= cryptoWaitReady().then(() => undefined);
  await cryptoReady;
}

export function normaliseWalletAddress(address: string): string {
  return address.trim().toLowerCase();
}

export function ss58ToWalletAddress(ss58Address: string): string {
  try {
    return normaliseWalletAddress(ss58ToH160(ss58Address));
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "The wallet address is not a valid SS58 account.");
  }
}

export function createNonceValue(): string {
  return randomBytes(16).toString("hex");
}

export function expectedDomain(): string {
  return new URL(getServerEnv().APP_ORIGIN).host;
}

export function expectedUri(): string {
  return new URL(getServerEnv().APP_ORIGIN).origin;
}

export function buildSiweMessage(options: {
  walletAddress: string;
  nonce: string;
  issuedAt: Date;
  expiresAt: Date;
}): string {
  const message = new SiweMessage({
    domain: expectedDomain(),
    address: getAddress(options.walletAddress),
    statement: "Sign in to Zorq to manage job-specific DataLicenses.",
    uri: expectedUri(),
    version: "1",
    chainId: getServerEnv().PORTALDOT_CHAIN_ID,
    nonce: options.nonce,
    issuedAt: options.issuedAt.toISOString(),
    expirationTime: options.expiresAt.toISOString(),
  });

  return message.prepareMessage();
}

export function parseAndValidateSiweMessage(
  rawMessage: string,
  expectedWallet: string,
): SiweMessage {
  let message: SiweMessage;
  try {
    message = new SiweMessage(rawMessage);
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "The SIWE message could not be parsed.");
  }

  const now = Date.now();
  const issuedAt = message.issuedAt ? Date.parse(message.issuedAt) : NaN;
  const expiresAt = message.expirationTime ? Date.parse(message.expirationTime) : NaN;
  const notBefore = message.notBefore ? Date.parse(message.notBefore) : null;

  if (message.domain !== expectedDomain()) {
    throw new ApiError(401, "ORIGIN_MISMATCH", "The SIWE domain does not match this application.");
  }
  if (message.uri !== expectedUri()) {
    throw new ApiError(401, "ORIGIN_MISMATCH", "The SIWE URI does not match this application.");
  }
  if (message.chainId !== getServerEnv().PORTALDOT_CHAIN_ID) {
    throw new ApiError(400, "WRONG_CHAIN", "The SIWE message was signed for the wrong chain.");
  }
  if (message.version !== "1") {
    throw new ApiError(400, "INVALID_INPUT", "Unsupported SIWE message version.");
  }
  if (!message.nonce || message.nonce.length < 8) {
    throw new ApiError(400, "INVALID_INPUT", "The SIWE message is missing a valid nonce.");
  }
  if (!Number.isFinite(issuedAt) || issuedAt > now + 60_000) {
    throw new ApiError(400, "INVALID_INPUT", "The SIWE message issue time is invalid.");
  }
  if (!Number.isFinite(expiresAt) || expiresAt <= now) {
    throw new ApiError(401, "NONCE_EXPIRED", "The SIWE message has expired.");
  }
  if (notBefore !== null && Number.isFinite(notBefore) && notBefore > now) {
    throw new ApiError(401, "NONCE_EXPIRED", "The SIWE message is not valid yet.");
  }
  if (normaliseWalletAddress(message.address) !== normaliseWalletAddress(expectedWallet)) {
    throw new ApiError(401, "INVALID_SIGNATURE", "The SIWE address does not match the challenge.");
  }

  return message;
}

export async function verifySiweSignature(options: {
  message: string;
  signature: string;
  ss58Address: string;
  signatureType?: "payload" | "bytes";
}): Promise<boolean> {
  await ensureCryptoReady();

  let publicKey: Uint8Array;
  try {
    publicKey = decodeAddress(options.ss58Address);
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "The SS58 account is not valid.");
  }

  const raw = new TextEncoder().encode(options.message);
  const wrapped = new TextEncoder().encode(`<Bytes>${options.message}</Bytes>`);
  const candidates =
    options.signatureType === "bytes" ? [wrapped] : options.signatureType === "payload" ? [raw] : [raw, wrapped];

  for (const candidate of candidates) {
    try {
      if (signatureVerify(candidate, options.signature, publicKey).isValid) {
        return true;
      }
    } catch {
      // Try the next representation without exposing signature details.
    }
  }

  return false;
}
