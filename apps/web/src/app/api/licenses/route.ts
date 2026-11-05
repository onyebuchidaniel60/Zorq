import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { listLicenses } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFor(request);
  try {
    const session = await requireSession(request);
    const rows = await listLicenses(session.walletAddress);
    return NextResponse.json({ licenses: rows }, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "Licenses could not be loaded.");
  }
}
