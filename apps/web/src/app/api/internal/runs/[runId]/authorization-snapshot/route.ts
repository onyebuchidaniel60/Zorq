import { NextResponse } from "next/server";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { readJson } from "@/server/http/request";
import { requireInternalToken } from "@/server/http/internal";
import { internalSnapshotSchema } from "@/server/validation/domain";
import { authorizationSnapshot } from "@/server/domain/runs";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    requireInternalToken(request);
    const parsed = internalSnapshotSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "Invalid snapshot request.");
    }
    const { runId } = await params;
    const snapshot = await authorizationSnapshot({
      runId,
      roundNumber: parsed.data.roundNumber,
      requestId,
    });
    return NextResponse.json(snapshot, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The authorization snapshot could not be produced.");
  }
}
