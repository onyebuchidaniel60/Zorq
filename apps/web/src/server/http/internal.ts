import { timingSafeEqual } from "node:crypto";
import { ApiError } from "./api";
import { getServerEnv } from "../env";

export function requireInternalToken(request: Request): void {
  const expected = getServerEnv().FL_SERVICE_SHARED_SECRET;
  if (!expected) {
    throw new ApiError(503, "INTERNAL_ERROR", "The internal service token is not configured.");
  }
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Bearer ")) {
    throw new ApiError(401, "UNAUTHENTICATED", "Missing internal service token.");
  }
  const provided = Buffer.from(header.slice("Bearer ".length).trim());
  const expectedBuffer = Buffer.from(expected);
  if (
    provided.length !== expectedBuffer.length ||
    !timingSafeEqual(provided, expectedBuffer)
  ) {
    throw new ApiError(401, "UNAUTHENTICATED", "Invalid internal service token.");
  }
}
