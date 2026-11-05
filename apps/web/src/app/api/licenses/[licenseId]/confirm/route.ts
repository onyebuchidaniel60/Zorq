import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, readJson } from "@/server/http/request";
import { confirmSchema } from "@/server/validation/domain";
import { confirmLicense } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const parsed = confirmSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "A valid transaction hash is required.");
    }
    const { licenseId } = await params;
    const result = await confirmLicense({
      licenseId,
      walletAddress: session.walletAddress,
      txHash: parsed.data.txHash as `0x${string}`,
      blockHash: parsed.data.blockHash as `0x${string}` | undefined,
      requestId,
    });
    return NextResponse.json(result, { headers: { "Cache-Control": "no-store", "x-request-id": requestId } });
  } catch (error) {
    return jsonError(error, requestId, "The license transaction could not be confirmed.");
  }
}
