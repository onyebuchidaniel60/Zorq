import { createHmac } from "node:crypto";
import { getSql } from "@zorq/db";
import { getServerEnv } from "./env";

export function rateLimitKey(scope: string, identifier: string): string {
  const secret = getServerEnv().RATE_LIMIT_SECRET;
  return createHmac("sha256", secret)
    .update(`${scope}:${identifier}`)
    .digest("hex");
}

export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  limit: number;
  retryAfterSeconds: number;
};

export async function consumeRateLimit(options: {
  scope: string;
  identifier: string;
  limit: number;
  windowSeconds: number;
}): Promise<RateLimitResult> {
  const { scope, identifier, limit, windowSeconds } = options;
  const bucketKey = rateLimitKey(scope, identifier);
  const sql = getSql();

  const rows = await sql<{ request_count: number }[]>`
    INSERT INTO rate_limit_buckets (bucket_key, window_start, request_count, updated_at)
    VALUES (${bucketKey}, now(), 1, now())
    ON CONFLICT (bucket_key) DO UPDATE SET
      request_count = CASE
        WHEN rate_limit_buckets.window_start < now() - (${windowSeconds} * interval '1 second')
          THEN 1
        ELSE rate_limit_buckets.request_count + 1
      END,
      window_start = CASE
        WHEN rate_limit_buckets.window_start < now() - (${windowSeconds} * interval '1 second')
          THEN now()
        ELSE rate_limit_buckets.window_start
      END,
      updated_at = now()
    RETURNING request_count
  `;

  const count = Number(rows[0]?.request_count ?? 1);
  return {
    allowed: count <= limit,
    remaining: Math.max(0, limit - count),
    limit,
    retryAfterSeconds: count <= limit ? 0 : windowSeconds,
  };
}
