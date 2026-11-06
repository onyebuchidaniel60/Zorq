import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, logEvent, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, readJson } from "@/server/http/request";
import { consumeRateLimit } from "@/server/rate-limit";
import { assetDraftSchema } from "@/server/validation/domain";
import { createAssetDraft } from "@/server/domain/assets";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const limit = await consumeRateLimit({
      scope: "assets-draft-wallet",
      identifier: session.walletAddress,
      limit: 30,
      windowSeconds: 60,
    });
    if (!limit.allowed) {
      throw new ApiError(429, "RATE_LIMITED", "Too many requests. Try again shortly.");
    }

    const parsed = assetDraftSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "Check the asset name, description and data source.");
    }

    const draft = await createAssetDraft({
      walletAddress: session.walletAddress,
      displayName: parsed.data.displayName,
      description: parsed.data.description,
      dataSource: parsed.data.dataSource,
      demoPartitionId: parsed.data.demoPartitionId,
      dbUrl: parsed.data.dbUrl,
      dbTable: parsed.data.dbTable,
      labelColumn: parsed.data.labelColumn,
      idempotencyKey: parsed.data.idempotencyKey,
      requestId,
    });

    logEvent("info", "asset.draft.created", { requestId, walletAddress: session.walletAddress });
    return NextResponse.json(draft, {
      status: 201,
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The asset draft could not be created.");
  }
}
