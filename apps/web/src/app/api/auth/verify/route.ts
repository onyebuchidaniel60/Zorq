import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, logEvent, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, clientIp, readJson } from "@/server/http/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { verifyAndConsumeNonce } from "@/server/auth/service";
import {
  createSessionToken,
  SESSION_COOKIE,
  sessionCookieOptions,
} from "@/server/auth/session";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  message: z.string().min(80).max(4096),
  signature: z.string().regex(/^(0x)?[0-9a-fA-F]{128}$/),
  signatureType: z.enum(["payload", "bytes"]).optional(),
});

export async function POST(request: Request) {
  const requestId = requestIdFor(request);

  try {
    assertSameOrigin(request);

    const limit = await consumeRateLimit({
      scope: "auth-verify-ip",
      identifier: clientIp(request),
      limit: 20,
      windowSeconds: 600,
    });

    if (!limit.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many verification attempts. Try again shortly.");
    }

    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "The sign-in response is incomplete.");
    }

    const user = await verifyAndConsumeNonce({
      message: parsed.data.message,
      signature: parsed.data.signature,
      signatureType: parsed.data.signatureType,
      requestId,
    });

    const session = await createSessionToken({
      walletAddress: user.walletAddress,
      ss58Address: user.ss58Address,
    });

    const response = NextResponse.json(
      {
        user: {
          walletAddress: user.walletAddress,
          ss58Address: user.ss58Address,
          displayName: user.displayName,
        },
        expiresAt: new Date(session.expiresAt * 1000).toISOString(),
      },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } },
    );

    response.cookies.set(SESSION_COOKIE, session.token, sessionCookieOptions());

    logEvent("info", "auth.signed_in", {
      requestId,
      walletAddress: user.walletAddress,
    });

    return response;
  } catch (error) {
    logEvent("warn", "auth.verify.failed", {
      requestId,
      code: error instanceof ApiError ? error.code : "INTERNAL_ERROR",
      origin: request.headers.get("origin") ?? null,
    });
    return jsonError(error, requestId, "Sign-in could not be completed.");
  }
}
