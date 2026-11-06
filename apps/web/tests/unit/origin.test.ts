import { describe, expect, it } from "vitest";
import { assertSameOrigin } from "@/server/http/request";

function requestWithOrigin(origin: string): Request {
  return new Request("https://example.test/api/auth/nonce", {
    method: "POST",
    headers: { origin },
  });
}

describe("browser origin validation", () => {
  it("accepts the production zorq-six alias and normalizes a trailing slash", () => {
    const previous = process.env.VERCEL_ENV;
    process.env.VERCEL_ENV = "production";
    try {
      expect(assertSameOrigin(requestWithOrigin("https://zorq-six.vercel.app/"))).toBe(
        "https://zorq-six.vercel.app",
      );
    } finally {
      if (previous === undefined) {
        delete process.env.VERCEL_ENV;
      } else {
        process.env.VERCEL_ENV = previous;
      }
    }
  });

  it("rejects an origin outside the trusted set", () => {
    expect(() => assertSameOrigin(requestWithOrigin("https://evil.example"))).toThrow(
      /origin is not allowed/i,
    );
  });

  it("rejects a request with no Origin header", () => {
    expect(() =>
      assertSameOrigin(new Request("https://example.test/api/auth/nonce", { method: "POST" })),
    ).toThrow(/could not be verified/i);
  });
});
