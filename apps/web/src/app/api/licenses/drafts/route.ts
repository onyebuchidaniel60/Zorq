import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, readJson } from "@/server/http/request";
import { licenseDraftSchema } from "@/server/validation/domain";
import { createLicenseDraft } from "@/server/domain/licenses";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const parsed = licenseDraftSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "Check the license asset, job and validity window.");
    }
    const draft = await createLicenseDraft({
      walletAddress: session.walletAddress,
      assetId: parsed.data.assetId,
      jobId: parsed.data.jobId,
      validFrom: parsed.data.validFrom,
      validUntil: parsed.data.validUntil,
      idempotencyKey: parsed.data.idempotencyKey,
      requestId,
    });
    return NextResponse.json(draft, {
      status: 201,
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The license draft could not be created.");
  }
}
