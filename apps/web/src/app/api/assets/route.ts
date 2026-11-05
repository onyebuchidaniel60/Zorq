import { NextResponse } from "next/server";
import { getSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { listAssets } from "@/server/domain/assets";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFor(request);
  try {
    const session = await getSession(request);
    if (!session) {
      throw new ApiError(401, "UNAUTHENTICATED", "Sign in with your wallet to continue.");
    }
    const rows = await listAssets(session.walletAddress);
    return NextResponse.json(
      { assets: rows },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } },
    );
  } catch (error) {
    return jsonError(error, requestId, "Assets could not be loaded.");
  }
}
