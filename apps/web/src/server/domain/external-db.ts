import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from "node:crypto";
import { getServerEnv } from "../env";

const PREFIX = "v1";

function key(): Buffer {
  return scryptSync(getServerEnv().SESSION_SECRET, "zorq-external-db-v1", 32);
}

export function encryptDbUrl(value: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", key(), iv);
  const encrypted = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [PREFIX, iv.toString("base64url"), tag.toString("base64url"), encrypted.toString("base64url")].join(".");
}

export function decryptDbUrl(value: string): string {
  const [prefix, iv, tag, ciphertext] = value.split(".");
  if (prefix !== PREFIX || !iv || !tag || !ciphertext) {
    throw new Error("The external database reference is invalid.");
  }
  const decipher = createDecipheriv("aes-256-gcm", key(), Buffer.from(iv, "base64url"));
  decipher.setAuthTag(Buffer.from(tag, "base64url"));
  return Buffer.concat([
    decipher.update(Buffer.from(ciphertext, "base64url")),
    decipher.final(),
  ]).toString("utf8");
}

export function isSupportedExternalDbUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "postgres:" || url.protocol === "postgresql:";
  } catch {
    return false;
  }
}
