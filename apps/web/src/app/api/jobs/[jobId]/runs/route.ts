import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin } from "@/server/http/request";
import { startRun } from "@/server/domain/runs";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (!idempotencyKey || idempotencyKey.length < 8 || idempotencyKey.length > 128) {
      throw new ApiError(400, "INVALID_INPUT", "An Idempotency-Key header is required.");
    }
    const { jobId } = await params;
    const run = await startRun({
      jobId,
      walletAddress: session.walletAddress,
      idempotencyKey,
      requestId,
    });
    return NextResponse.json({ run }, { status: 202, headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The run could not be started.");
  }
}
