import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { getLicense } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    const session = await requireSession(request);
    const { licenseId } = await params;
    const result = await getLicense(licenseId, session.walletAddress);
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The license could not be loaded.");
  }
}
