import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchWithAuth,
  readApiError,
  readJsonObject,
  transactionHash,
  userFacingError,
} from "@/lib/client-api";

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("client API error handling", () => {
  it("rejects an empty JSON response instead of reading properties from null", async () => {
    await expect(
      readJsonObject(new Response("", { status: 200 }), "The response was empty."),
    ).rejects.toThrow(/response was empty/i);
    await expect(
      readJsonObject(new Response("null", { status: 200 }), "The response was empty."),
    ).rejects.toThrow(/response was empty/i);
  });

  it("falls back safely when an error envelope is missing", async () => {
    await expect(readApiError(new Response("", { status: 502 }), "Request failed")).resolves.toBe(
      "Request failed (HTTP 502).",
    );
  });

  it("rejects a null transaction hash with a readable message", () => {
    expect(() => transactionHash(null)).toThrow(/did not return a transaction hash/i);
  });

  it("translates a null-property crash into a retryable user message", () => {
    expect(
      userFacingError(
        new TypeError("Cannot read properties of null (reading 'data')"),
        "The action failed.",
      ),
    ).toMatch(/empty response/i);
  });

  it("translates a wallet rejection without retrying", () => {
    expect(userFacingError(new Error("User rejected the request"), "The action failed.")).toBe(
      "The wallet request was rejected. Nothing was submitted.",
    );
  });
});

describe("authenticated fetch", () => {
  it("re-prompts sign-in and retries once on 401", async () => {
    const responses = [
      new Response("", { status: 401 }),
      new Response("{}", { status: 200 }),
    ];
    let calls = 0;
    vi.stubGlobal("fetch", vi.fn(async () => responses[calls++] ?? responses[1]));
    const signIn = vi.fn(async () => true);

    const response = await fetchWithAuth("/api/test", { method: "POST" }, signIn);

    expect(signIn).toHaveBeenCalledWith({ reload: false, wallet: undefined });
    expect(calls).toBe(2);
    expect(response.status).toBe(200);
  });

  it("does not prompt when the session is already valid", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("{}", { status: 200 })));
    const signIn = vi.fn(async () => true);

    const response = await fetchWithAuth("/api/test", { method: "POST" }, signIn);

    expect(signIn).not.toHaveBeenCalled();
    expect(response.status).toBe(200);
  });
});
