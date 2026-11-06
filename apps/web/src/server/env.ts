import { z } from "zod";

const envSchema = z.object({
  APP_ORIGIN: z.string().url(),
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
  ALLOWED_ORIGINS: z.string().optional(),
  SESSION_SECRET: z.string().min(32),
  DATABASE_URL: z.string().min(1),
  PORTALDOT_CHAIN_ID: z.coerce.number().int().positive(),
  PORTALDOT_EVM_RPC_URL: z.string().url(),
  PORTALDOT_CONFIRMATION_DEPTH: z.coerce.number().int().min(0).default(6),
  ZORQ_CONTRACT_ADDRESS: z
    .string()
    .regex(/^0x[0-9a-fA-F]{40}$/)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  RATE_LIMIT_SECRET: z.string().min(32),
  FL_SERVICE_URL: z.string().url().optional().or(z.literal("").transform(() => undefined)),
  FL_SERVICE_SHARED_SECRET: z
    .string()
    .min(32)
    .optional()
    .or(z.literal("").transform(() => undefined)),
  FL_SERVICE_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
});

export type ServerEnv = z.infer<typeof envSchema>;

let cached: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  if (cached) {
    return cached;
  }

  const origin =
    process.env.APP_ORIGIN ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "http://localhost:3100";

  const parsed = envSchema.safeParse({
    ...process.env,
    APP_ORIGIN: origin,
  });

  if (!parsed.success) {
    const missing = parsed.error.issues.map((issue) => issue.path.join(".")).join(", ");
    throw new Error(`Invalid server environment: ${missing}`);
  }

  cached = parsed.data;
  return cached;
}

export function canonicalOrigin(): string {
  return new URL(getServerEnv().APP_ORIGIN).origin;
}

const VERCEL_ORIGINS: Record<string, readonly string[]> = {
  production: [
    "https://zorq-uhhh2.vercel.app",
    "https://zorq-six.vercel.app",
    "https://zorq-git-main-uhhh2.vercel.app",
  ],
  preview: [
    "https://zorq-preview-uhhh2.vercel.app",
    "https://zorq-git-preview-uhhh2.vercel.app",
  ],
};

function addOrigin(origins: Set<string>, value: string | undefined): void {
  if (!value) {
    return;
  }
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return;
    }
    if (process.env.NODE_ENV === "production" && url.protocol !== "https:") {
      return;
    }
    origins.add(url.origin);
  } catch {
    // Ignore malformed optional entries; required env values are validated.
  }
}

export function allowedBrowserOrigins(): Set<string> {
  const env = getServerEnv();
  const origins = new Set<string>();

  addOrigin(origins, env.APP_ORIGIN);
  addOrigin(origins, env.NEXT_PUBLIC_APP_URL);

  for (const value of (env.ALLOWED_ORIGINS ?? "").split(",")) {
    addOrigin(origins, value);
  }

  for (const value of VERCEL_ORIGINS[process.env.VERCEL_ENV ?? ""] ?? []) {
    addOrigin(origins, value);
  }

  if (process.env.NODE_ENV !== "production") {
    origins.add("http://localhost:3100");
    origins.add("http://127.0.0.1:3100");
  }

  return origins;
}
