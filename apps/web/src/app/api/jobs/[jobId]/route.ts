import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin } from "@/server/http/request";
import { deleteJobDraft, getJob } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    const session = await requireSession(request);
    const { jobId } = await params;
    const result = await getJob(jobId, session.walletAddress);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The job could not be loaded.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const { jobId } = await params;
    const result = await deleteJobDraft({
      jobId,
      walletAddress: session.walletAddress,
      requestId,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The job draft could not be discarded.");
  }
}
