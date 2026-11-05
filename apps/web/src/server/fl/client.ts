import { ApiError } from "../http/api";
import { getServerEnv } from "../env";

export type FlParticipant = {
  assetId: string;
  partitionId: number;
  ownerWallet: string;
};

export async function startFlRun(input: {
  runId: string;
  jobId: string;
  totalRounds: number;
  participants: FlParticipant[];
}): Promise<void> {
  const env = getServerEnv();
  if (!env.FL_SERVICE_URL || !env.FL_SERVICE_SHARED_SECRET) {
    throw new ApiError(503, "FL_PROVIDER_UNAVAILABLE", "The FL service is not configured.");
  }

  try {
    const response = await fetch(`${env.FL_SERVICE_URL.replace(/\/$/, "")}/runs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.FL_SERVICE_SHARED_SECRET}`,
      },
      body: JSON.stringify(input),
      signal: AbortSignal.timeout(env.FL_SERVICE_TIMEOUT_MS),
      cache: "no-store",
    });
    if (!response.ok) {
      throw new ApiError(
        503,
        "FL_PROVIDER_UNAVAILABLE",
        "The FL service rejected the run request.",
      );
    }
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(503, "FL_PROVIDER_UNAVAILABLE", "The FL service is unavailable.");
  }
}
