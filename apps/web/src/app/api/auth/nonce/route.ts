import { NextResponse } from "next/server";
import { z } from "zod";
import { ApiError, jsonError, logEvent, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, clientIp, readJson } from "@/server/http/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { createAuthNonce } from "@/server/auth/service";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const bodySchema = z.object({
  address: z.string().regex(/^0x[0-9a-fA-F]{40}$/),
  ss58Address: z.string().min(40).max(64),
});

export async function POST(request: Request) {
  const requestId = requestIdFor(request);

  try {
    assertSameOrigin(request);

    const limit = await consumeRateLimit({
      scope: "auth-nonce-ip",
      identifier: clientIp(request),
      limit: 5,
      windowSeconds: 600,
    });

    if (!limit.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many sign-in attempts. Try again shortly.");
    }

    const parsed = bodySchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "Enter a valid wallet address.");
    }

    const create = () =>
      createAuthNonce({
        walletAddress: parsed.data.address,
        ss58Address: parsed.data.ss58Address,
        requestId,
      });

    let created;
    try {
      created = await create();
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      const transient = /timeout|ECONNRESET|ECONNREFUSED|too many connections|57P01|08006/i.test(message);
      if (!transient) throw error;
      logEvent("warn", "auth.nonce.retry", { requestId });
      await new Promise((resolve) => setTimeout(resolve, 400));
      created = await create();
    }

    logEvent("info", "auth.nonce.created", {
      requestId,
      walletAddress: parsed.data.address.toLowerCase(),
    });

    return NextResponse.json(created, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    logEvent("warn", "auth.nonce.failed", {
      requestId,
      code: error instanceof ApiError ? error.code : "INTERNAL_ERROR",
      message: error instanceof Error ? error.message.slice(0, 200) : "unknown",
    });
    return jsonError(error, requestId, "The sign-in service is temporarily unavailable. Retry in a moment.");
  }
}
