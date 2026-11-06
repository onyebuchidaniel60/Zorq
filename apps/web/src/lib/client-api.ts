import type { ConnectedWallet } from "@/lib/wallet-client";

type SignIn = (options?: {
  reload?: boolean;
  wallet?: ConnectedWallet;
}) => Promise<boolean>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit,
  signIn: SignIn,
  wallet?: ConnectedWallet,
): Promise<Response> {
  const response = await fetch(input, init);
  if (response.status !== 401) {
    return response;
  }
  const signedIn = await signIn({ reload: false, wallet });
  if (!signedIn) {
    return response;
  }
  return fetch(input, init);
}

async function readBody(response: Response): Promise<unknown> {
  try {
    const text = await response.text();
    if (!text.trim()) {
      return null;
    }
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

export async function readApiError(
  response: Response,
  fallback: string,
): Promise<string> {
  const body = await readBody(response);
  if (isRecord(body) && isRecord(body.error)) {
    const message = body.error.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
  }
  return `${fallback} (HTTP ${response.status}).`;
}

export async function readJsonObject<T>(
  response: Response,
  fallback: string,
): Promise<T> {
  const body = await readBody(response);
  if (!isRecord(body)) {
    throw new Error(fallback);
  }
  return body as T;
}

export function transactionHash(value: unknown): `0x${string}` {
  if (typeof value !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(value)) {
    throw new Error(
      "Your wallet did not return a transaction hash. Nothing was submitted; reconnect the wallet and retry.",
    );
  }
  return value as `0x${string}`;
}

export function logClientError(context: string, cause: unknown): void {
  console.error(`[zorq:${context}]`, cause);
  if (cause instanceof Error && cause.cause) {
    console.error(`[zorq:${context}:cause]`, cause.cause);
  }
}

export function shouldDiscardDraft(cause: unknown): boolean {
  const message = cause instanceof Error ? cause.message : String(cause ?? "");
  return !/not included before the timeout|timed out|timeout|network|disconnected|connection|socket/i.test(
    message,
  );
}

export async function discardDraft(
  path: string,
  signIn: SignIn,
  wallet?: ConnectedWallet,
): Promise<void> {
  try {
    const response = await fetchWithAuth(path, { method: "DELETE" }, signIn, wallet);
    if (!response.ok && response.status !== 404) {
      console.warn(`[zorq:draft-cleanup] ${path} -> HTTP ${response.status}`);
    }
  } catch (cause) {
    console.warn("[zorq:draft-cleanup] request failed", cause);
  }
}

export function userFacingError(cause: unknown, fallback: string): string {
  const message = cause instanceof Error ? cause.message.trim() : "";

  if (
    /user rejected|rejected by user|declined|cancelled|canceled|denied|4001/i.test(
      message,
    )
  ) {
    return "The wallet request was rejected. Nothing was submitted.";
  }
  if (
    /StorageDeposit(?:LimitExhausted|NotEnoughFunds)|storage deposit|insufficient|balance too low|not enough funds|payment/i.test(
      message,
    )
  ) {
    return "Insufficient testnet POT for the storage deposit. Fund the wallet and retry.";
  }
  if (/cannot read properties of null|undefined is not an object/i.test(message)) {
    return `${fallback} The wallet or server returned an empty response; retry once.`;
  }
  if (!message) {
    return fallback;
  }
  return message.length > 240 ? `${message.slice(0, 240)}…` : message;
}
