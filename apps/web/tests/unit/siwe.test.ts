import { describe, expect, it } from "vitest";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import { getAddress } from "viem";
import {
  buildSiweMessage,
  createNonceValue,
  parseAndValidateSiweMessage,
  ss58ToWalletAddress,
  verifySiweSignature,
} from "@/server/auth/siwe";

await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  new Uint8Array(32).fill(7),
);
const walletAddress = ss58ToH160(pair.address).toLowerCase();

describe("SIWE message construction", () => {
  it("binds the H160 address, chain ID, nonce and expiry", () => {
    const issuedAt = new Date("2026-11-05T10:00:00.000Z");
    const expiresAt = new Date("2026-11-05T10:05:00.000Z");
    const nonce = createNonceValue();
    const message = buildSiweMessage({ walletAddress, nonce, issuedAt, expiresAt });

    expect(message).toContain("wants you to sign in with your Ethereum account:");
    expect(message).toContain(getAddress(walletAddress));
    expect(message).toContain("Chain ID: 420420777");
    expect(message).toContain(`Nonce: ${nonce}`);
    expect(message).toContain("Expiration Time: 2026-11-05T10:05:00.000Z");
  });

  it("rejects a message with the wrong domain", () => {
    const nonce = createNonceValue();
    const message = buildSiweMessage({
      walletAddress,
      nonce,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
    });
    const tampered = message.replace("localhost:3100", "evil.example");
    expect(() => parseAndValidateSiweMessage(tampered, walletAddress)).toThrow(
      /domain/i,
    );
  });

  it("rejects an expired message", () => {
    const nonce = createNonceValue();
    const message = buildSiweMessage({
      walletAddress,
      nonce,
      issuedAt: new Date(Date.now() - 600_000),
      expiresAt: new Date(Date.now() - 300_000),
    });
    expect(() => parseAndValidateSiweMessage(message, walletAddress)).toThrow(
      /expired/i,
    );
  });
});

describe("SS58 mapping", () => {
  it("derives the same H160 used by the chain runtime", () => {
    expect(ss58ToWalletAddress(pair.address)).toBe(walletAddress);
  });

  it("rejects an invalid SS58 address", () => {
    expect(() => ss58ToWalletAddress("not-an-address")).toThrow(/SS58/i);
  });
});

describe("sr25519 signature verification", () => {
  it("accepts a signature over the exact SIWE message bytes", async () => {
    const nonce = createNonceValue();
    const message = buildSiweMessage({
      walletAddress,
      nonce,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
    });
    const signature = `0x${Buffer.from(pair.sign(message)).toString("hex")}`;

    await expect(
      verifySiweSignature({
        message,
        signature,
        ss58Address: pair.address,
        signatureType: "payload",
      }),
    ).resolves.toBe(true);
  });

  it("rejects a signature over a different message", async () => {
    const nonce = createNonceValue();
    const message = buildSiweMessage({
      walletAddress,
      nonce,
      issuedAt: new Date(),
      expiresAt: new Date(Date.now() + 300_000),
    });
    const signature = `0x${Buffer.from(pair.sign(`${message} tampered`)).toString("hex")}`;

    await expect(
      verifySiweSignature({
        message,
        signature,
        ss58Address: pair.address,
        signatureType: "payload",
      }),
    ).resolves.toBe(false);
  });
});
