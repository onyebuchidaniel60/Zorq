import { NextResponse } from "next/server";
import { requireSession } from "@/server/auth/session";
import { ApiError, jsonError, requestIdFor } from "@/server/http/api";
import { assertSameOrigin, readJson } from "@/server/http/request";
import { jobDraftSchema } from "@/server/validation/domain";
import { createJobDraft } from "@/server/domain/jobs";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const requestId = requestIdFor(request);
  try {
    assertSameOrigin(request);
    const session = await requireSession(request);
    const parsed = jobDraftSchema.safeParse(await readJson(request));
    if (!parsed.success) {
      throw new ApiError(400, "INVALID_INPUT", "Check the job title, purpose and window.");
    }
    const draft = await createJobDraft({
      walletAddress: session.walletAddress,
      title: parsed.data.title,
      description: parsed.data.description,
      purposeText: parsed.data.purposeText,
      startsAt: parsed.data.startsAt,
      endsAt: parsed.data.endsAt,
      maxParticipants: parsed.data.maxParticipants,
      idempotencyKey: parsed.data.idempotencyKey,
      requestId,
    });
    return NextResponse.json(draft, {
      status: 201,
      headers: { "Cache-Control": "no-store", "x-request-id": requestId },
    });
  } catch (error) {
    return jsonError(error, requestId, "The job draft could not be created.");
  }
}
