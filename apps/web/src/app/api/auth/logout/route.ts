import { NextResponse } from "next/server";
import { getDb } from "@zorq/db";
import { appendAuditEvent } from "@/server/audit";
import { getSession, SESSION_COOKIE, sessionCookieOptions } from "@/server/auth/session";
import { ApiError, jsonError, logEvent, requestIdFor } from "@/server/http/api";
import { assertSameOrigin } from "@/server/http/request";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);

  try {
    assertSameOrigin(request);
    const session = await getSession(request);

    if (session) {
      try {
        const db = getDb();
        await db.transaction(async (tx) => {
          await appendAuditEvent(tx, {
            actorWallet: session.walletAddress,
            entityType: "user",
            entityId: session.walletAddress,
            action: "auth.signed_out",
            requestId,
          });
        });
      } catch {
        logEvent("warn", "auth.logout.audit_failed", { requestId });
      }
    }

    const response = NextResponse.json(
      { signedOut: true },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } },
    );
    response.cookies.set(SESSION_COOKIE, "", { ...sessionCookieOptions(), maxAge: 0 });
    return response;
  } catch (error) {
    if (error instanceof ApiError) {
      return jsonError(error, requestId, "Sign-out could not be completed.");
    }
    return jsonError(error, requestId, "Sign-out could not be completed.");
  }
}
