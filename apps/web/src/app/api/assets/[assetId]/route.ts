import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin } from "@/server/http/request";
import { deleteAssetDraft, getAssetForOwner } from "@/server/domain/assets";

export const dynamic = "force-dynamic";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    const session = await requireSession(request);
    const { assetId } = await params;
    const asset = await getAssetForOwner(assetId, session.walletAddress);
    return NextResponse.json({ asset }, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The asset could not be loaded.");
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ assetId: string }> },
) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const { assetId } = await params;
    const result = await deleteAssetDraft({
      assetId,
      walletAddress: session.walletAddress,
      requestId,
    });
    return NextResponse.json(result, {
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The asset draft could not be discarded.");
  }
}
