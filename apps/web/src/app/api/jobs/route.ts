import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { listJobs } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFor(request);
  try {
    const session = await requireSession(request);
    const jobs = await listJobs(session.walletAddress);
    return NextResponse.json({ jobs }, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "Jobs could not be loaded.");
  }
}
