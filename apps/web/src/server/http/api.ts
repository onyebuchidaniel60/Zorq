import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export type ApiErrorCode =
  | "INVALID_INPUT"
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "WRONG_CHAIN"
  | "INVALID_SIGNATURE"
  | "NONCE_EXPIRED"
  | "NONCE_REUSED"
  | "ORIGIN_MISMATCH"
  | "RATE_LIMITED"
  | "IDEMPOTENCY_CONFLICT"
  | "DATABASE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly details?: Record<string, unknown>;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export function requestIdFor(request: Request): string {
  const incoming = request.headers.get("x-request-id");
  if (incoming && /^[a-zA-Z0-9_-]{8,64}$/.test(incoming)) {
    return incoming;
  }
  return randomUUID();
}

export function jsonError(
  error: unknown,
  requestId: string,
  fallbackMessage = "The request could not be completed.",
  extraHeaders?: Record<string, string>,
): NextResponse {
  const baseHeaders = {
    "Cache-Control": "no-store",
    "x-request-id": requestId,
    ...extraHeaders,
  };

  if (error instanceof ApiError) {
    return NextResponse.json(
      {
        error: {
          code: error.code,
          message: error.message,
          requestId,
          details: error.details ?? {},
        },
      },
      { status: error.status, headers: baseHeaders },
    );
  }

  return NextResponse.json(
    {
      error: {
        code: "INTERNAL_ERROR",
        message: fallbackMessage,
        requestId,
        details: {},
      },
    },
    { status: 500, headers: baseHeaders },
  );
}

export function logEvent(
  level: "info" | "warn" | "error",
  event: string,
  fields: Record<string, unknown>,
): void {
  console[level](
    JSON.stringify({
      level,
      event,
      timestamp: new Date().toISOString(),
      ...fields,
    }),
  );
}
