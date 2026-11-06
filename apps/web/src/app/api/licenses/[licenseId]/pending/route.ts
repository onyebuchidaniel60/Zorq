import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, readJson } from "@/server/http/request";
import { pendingTransactionSchema } from "@/server/validation/domain";
import { markLicensePending } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const parsed = pendingTransactionSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "A valid transaction hash and block hash are required.");
    }
    const { licenseId } = await params;
    const result = await markLicensePending({
      licenseId,
      walletAddress: session.walletAddress,
      txHash: parsed.data.txHash as `0x${string}`,
      blockHash: parsed.data.blockHash as `0x${string}`,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The license transaction could not be marked pending.");
  }
}
