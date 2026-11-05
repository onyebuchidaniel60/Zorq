import { describe, expect, it } from "vitest";
import { rateLimitKey } from "@/server/rate-limit";

describe("rate-limit bucket keys", () => {
  it("is deterministic for the same scope and identifier", () => {
    expect(rateLimitKey("auth-nonce-ip", "203.0.113.4")).toBe(
      rateLimitKey("auth-nonce-ip", "203.0.113.4"),
    );
  });

  it("separates scopes and identifiers", () => {
    const base = rateLimitKey("auth-nonce-ip", "203.0.113.4");
    expect(rateLimitKey("auth-verify-ip", "203.0.113.4")).not.toBe(base);
    expect(rateLimitKey("auth-nonce-ip", "203.0.113.5")).not.toBe(base);
  });

  it("does not contain the raw identifier", () => {
    const identifier = "wallet-0x1234567890abcdef";
    expect(rateLimitKey("auth", identifier)).not.toContain(identifier);
  });
});
