import { NextResponse } from "next/server";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { requireSession } from "@/server/auth/session";
import { getUser } from "@/server/auth/service";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestId = requestIdFor(request);

  try {
    const session = await requireSession(request);
    const user = await getUser(session.walletAddress);

    if (!user) {
      throw new ApiError(401, "UNAUTHENTICATED", "Your session is no longer valid.");
    }
    if (user.status !== "active") {
      throw new ApiError(403, "FORBIDDEN", "This wallet is not permitted to use Zorq.");
    }

    return NextResponse.json(
      {
        user: {
          walletAddress: user.walletAddress,
          ss58Address: user.ss58Address,
          displayName: user.displayName,
        },
        expiresAt: new Date(session.expiresAt * 1000).toISOString(),
      },
      { headers: { "Cache-Control": "no-store", "x-request-id": requestId } },
    );
  } catch (error) {
    return jsonError(error, requestId, "The session could not be read.");
  }
}
