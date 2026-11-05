import { ApiError } from "./api";
import { allowedBrowserOrigins } from "../env";

export function assertSameOrigin(request: Request): void {
  const origin = request.headers.get("origin");
  if (!origin) {
    throw new ApiError(403, "ORIGIN_MISMATCH", "The request origin could not be verified.");
  }

  if (!allowedBrowserOrigins().has(origin)) {
    throw new ApiError(403, "ORIGIN_MISMATCH", "The request origin is not allowed.");
  }
}

export function clientIp(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) {
      return first;
    }
  }
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.toLowerCase().includes("application/json")) {
    throw new ApiError(415, "INVALID_INPUT", "Expected an application/json request body.");
  }

  const length = Number(request.headers.get("content-length") ?? "0");
  if (Number.isFinite(length) && length > 16_384) {
    throw new ApiError(413, "INVALID_INPUT", "The request body is too large.");
  }

  try {
    return await request.json();
  } catch {
    throw new ApiError(400, "INVALID_INPUT", "The request body is not valid JSON.");
  }
}
