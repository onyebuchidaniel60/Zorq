import { afterEach, describe, expect, it } from "vitest";
import { explorerTxUrl } from "@/lib/explorer";

const TX = `0x${"a".repeat(64)}`;

afterEach(() => {
  delete process.env.NEXT_PUBLIC_PORTALDOT_EXPLORER_URL;
});

describe("explorer transaction links", () => {
  it("builds a hash route to the extrinsic detail page", () => {
    expect(explorerTxUrl(TX)).toBe(
      `https://scanner-testnet-v3.portaldot.dev/#/extrinsics/${TX}`,
    );
  });

  it("normalises a trailing slash on the configured explorer base", () => {
    process.env.NEXT_PUBLIC_PORTALDOT_EXPLORER_URL =
      "https://scanner-testnet-v3.portaldot.dev/";
    expect(explorerTxUrl(TX)).toBe(
      `https://scanner-testnet-v3.portaldot.dev/#/extrinsics/${TX}`,
    );
  });

  it("rejects missing or malformed hashes", () => {
    expect(explorerTxUrl(null)).toBeNull();
    expect(explorerTxUrl("0x1234")).toBeNull();
    expect(explorerTxUrl("not-a-hash")).toBeNull();
  });
});
