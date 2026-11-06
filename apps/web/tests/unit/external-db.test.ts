import { describe, expect, it } from "vitest";
import {
  decryptDbUrl,
  encryptDbUrl,
  isSupportedExternalDbUrl,
} from "@/server/domain/external-db";

describe("external database reference", () => {
  it("encrypts and decrypts a PostgreSQL URL without exposing the plaintext", () => {
    const url = "postgresql://analyst:secret@db.example.com:5432/training";
    const encrypted = encryptDbUrl(url);

    expect(encrypted).not.toContain("analyst");
    expect(encrypted).not.toContain("secret");
    expect(decryptDbUrl(encrypted)).toBe(url);
  });

  it("rejects a tampered ciphertext", () => {
    const encrypted = encryptDbUrl("postgresql://user:pass@db.example.com/training");
    const tampered = `${encrypted.slice(0, -2)}xx`;
    expect(() => decryptDbUrl(tampered)).toThrow();
  });

  it("accepts PostgreSQL schemes and rejects unrelated schemes", () => {
    expect(isSupportedExternalDbUrl("postgresql://user:pass@host/db")).toBe(true);
    expect(isSupportedExternalDbUrl("postgres://user:pass@host/db")).toBe(true);
    expect(isSupportedExternalDbUrl("sqlite:///etc/passwd")).toBe(false);
    expect(isSupportedExternalDbUrl("https://example.com")).toBe(false);
  });
});
