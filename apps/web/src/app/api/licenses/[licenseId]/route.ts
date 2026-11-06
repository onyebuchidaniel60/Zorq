import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin } from "@/server/http/request";
import { deleteLicenseDraft, getLicense } from "@/server/domain/licenses";

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
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The license could not be loaded.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ licenseId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const { licenseId } = await params;
    const result = await deleteLicenseDraft({
      licenseId,
      walletAddress: session.walletAddress,
      requestId,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The license draft could not be discarded.");
  }
}
