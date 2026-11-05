import { NextResponse } from "next/server";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { readJson } from "@/server/http/request";
import { requireInternalToken } from "@/server/http/internal";
import { internalCompleteSchema } from "@/server/validation/domain";
import { completeRun } from "@/server/domain/runs";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ runId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    requireInternalToken(request);
    const parsed = internalCompleteSchema.safeParse(await readJson(request));
    if (!parsed.success) throw new ApiError(400, "INVALID_INPUT", "Invalid completion payload.");
    const { runId } = await params;
    const result = await completeRun({ runId, ...parsed.data });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The run could not be completed.");
  }
}
