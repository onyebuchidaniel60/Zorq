import { SignJWT, jwtVerify } from "jose";
import { getServerEnv } from "../env";
import { ApiError } from "../http/api";

export const SESSION_COOKIE = "zorq_session";
export const SESSION_TTL_SECONDS = 8 * 60 * 60;

export type Session = {
  walletAddress: string;
  ss58Address: string;
  expiresAt: number;
};

function signingKey(): Uint8Array {
  return new TextEncoder().encode(getServerEnv().SESSION_SECRET);
}

export async function createSessionToken(session: {
  walletAddress: string;
  ss58Address: string;
}): Promise<{ token: string; expiresAt: number }> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const token = await new SignJWT({
    ss58: session.ss58Address,
    wallet: session.walletAddress,
  })
    .setProtectedHeader({ alg: "HS256", typ: "JWT" })
    .setSubject(session.walletAddress)
    .setIssuer(new URL(getServerEnv().APP_ORIGIN).origin)
    .setAudience("zorq-web")
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .setJti(crypto.randomUUID())
    .sign(signingKey());

  return { token, expiresAt };
}

export async function verifySessionToken(token: string): Promise<Session> {
  try {
    const { payload } = await jwtVerify(token, signingKey(), {
      issuer: new URL(getServerEnv().APP_ORIGIN).origin,
      audience: "zorq-web",
      algorithms: ["HS256"],
    });

    if (
      typeof payload.sub !== "string" ||
      typeof payload.ss58 !== "string" ||
      typeof payload.exp !== "number"
    ) {
      throw new Error("Malformed session");
    }

    return {
      walletAddress: payload.sub,
      ss58Address: payload.ss58,
      expiresAt: payload.exp,
    };
  } catch {
    throw new ApiError(401, "UNAUTHENTICATED", "Your session is missing or has expired.");
  }
}

function readCookie(request: Request, name: string): string | undefined {
  const header = request.headers.get("cookie");
  if (!header) {
    return undefined;
  }

  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    const key = part.slice(0, separator).trim();
    if (key === name) {
      return decodeURIComponent(part.slice(separator + 1).trim());
    }
  }

  return undefined;
}

export async function getSession(request: Request): Promise<Session | null> {
  const token = readCookie(request, SESSION_COOKIE);
  if (!token) {
    return null;
  }

  try {
    return await verifySessionToken(token);
  } catch {
    return null;
  }
}

export async function requireSession(request: Request): Promise<Session> {
  const session = await getSession(request);
  if (!session) {
    throw new ApiError(401, "UNAUTHENTICATED", "Sign in with your wallet to continue.");
  }
  return session;
}

export function sessionCookieOptions(): {
  httpOnly: true;
  secure: boolean;
  sameSite: "lax";
  path: string;
  maxAge: number;
} {
  return {
    httpOnly: true,
    secure: new URL(getServerEnv().APP_ORIGIN).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_TTL_SECONDS,
  };
}
