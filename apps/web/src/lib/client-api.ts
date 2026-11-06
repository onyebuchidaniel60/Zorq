function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
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

export function userFacingError(cause: unknown, fallback: string): string {
  const message = cause instanceof Error ? cause.message.trim() : "";

  if (
    /user rejected|rejected by user|declined|cancelled|canceled|denied|4001/i.test(
      message,
    )
  ) {
    return "The wallet request was rejected. Nothing was submitted.";
  }
  if (/insufficient|balance too low|not enough funds/i.test(message)) {
    return "The wallet does not have enough testnet POT to complete this transaction.";
  }
  if (/cannot read properties of null|undefined is not an object/i.test(message)) {
    return `${fallback} The wallet or server returned an empty response; retry once.`;
  }
  if (!message) {
    return fallback;
  }
  return message.length > 240 ? `${message.slice(0, 240)}…` : message;
}
