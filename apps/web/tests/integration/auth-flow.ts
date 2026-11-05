import { spawn } from "node:child_process";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { config as loadEnv } from "dotenv";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import postgres from "postgres";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(webDir, "../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });

const port = 3101;
const externalOrigin = process.env.AUTH_TEST_ORIGIN?.replace(/\/$/, "");
const origin = externalOrigin ?? `http://localhost:${port}`;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required for the auth integration test");
  process.exit(1);
}

await cryptoWaitReady();
const seed = new Uint8Array(randomBytes(32));
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(seed);
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const server = externalOrigin
  ? null
  : spawn(npmCommand, ["run", "dev", "--", "--port", String(port)], {
      cwd: webDir,
      detached: process.platform !== "win32",
      env: {
        ...process.env,
        APP_ORIGIN: origin,
        NEXT_PUBLIC_APP_URL: origin,
        PORT: String(port),
      },
      stdio: ["ignore", "pipe", "pipe"],
    });

let serverOutput = "";
if (server) {
  server.stdout.on("data", (chunk: Buffer) => {
    serverOutput += chunk.toString();
  });
  server.stderr.on("data", (chunk: Buffer) => {
    serverOutput += chunk.toString();
  });
}

function fail(message: string): never {
  throw new Error(message);
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`, {
        signal: AbortSignal.timeout(10_000),
      });
      if (response.ok) {
        return;
      }
    } catch {
      // Server is still compiling or unreachable.
    }
    await delay(1000);
  }
  throw new Error("Next.js server did not become ready");
}

function cookieFrom(response: Response): string {
  const header = response.headers.get("set-cookie");
  if (!header) {
    fail("verify response did not set a session cookie");
  }
  return header.split(";")[0] ?? fail("session cookie is malformed");
}

async function jsonBody(response: Response): Promise<Record<string, unknown>> {
  return (await response.json()) as Record<string, unknown>;
}

try {
  await waitForServer();
  console.log("PASS server ready");

  const nonceResponse = await fetch(`${origin}/api/auth/nonce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }),
  });
  if (nonceResponse.status !== 200) {
    fail(`nonce endpoint returned ${nonceResponse.status}: ${JSON.stringify(await jsonBody(nonceResponse))}`);
  }
  const challenge = (await jsonBody(nonceResponse)) as { message?: string; nonce?: string };
  if (!challenge.message || !challenge.nonce) {
    fail("nonce response is missing message or nonce");
  }
  console.log("PASS nonce created");

  const signature = `0x${Buffer.from(pair.sign(challenge.message)).toString("hex")}`;
  const verifyResponse = await fetch(`${origin}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({
      message: challenge.message,
      signature,
      signatureType: "payload",
    }),
  });
  if (verifyResponse.status !== 200) {
    fail(`verify endpoint returned ${verifyResponse.status}: ${JSON.stringify(await jsonBody(verifyResponse))}`);
  }
  const cookie = cookieFrom(verifyResponse);
  const setCookie = verifyResponse.headers.get("set-cookie") ?? "";
  if (!/httponly/i.test(setCookie)) {
    fail("session cookie is missing HttpOnly");
  }
  if (!/samesite=lax/i.test(setCookie)) {
    fail("session cookie is missing SameSite=Lax");
  }
  if (!/path=\//i.test(setCookie)) {
    fail("session cookie is missing Path=/");
  }
  if (!/max-age=28800/i.test(setCookie)) {
    fail("session cookie does not have the eight-hour lifetime");
  }
  const verified = (await jsonBody(verifyResponse)) as {
    user?: { walletAddress?: string; ss58Address?: string };
  };
  if (verified.user?.walletAddress !== walletAddress || verified.user.ss58Address !== pair.address) {
    fail("verified user does not match the test wallet");
  }
  console.log("PASS signature verified and secure session cookie issued");

  const meResponse = await fetch(`${origin}/api/auth/me`, {
    headers: { Cookie: cookie },
  });
  if (meResponse.status !== 200) {
    fail(`me endpoint returned ${meResponse.status}`);
  }
  console.log("PASS session cookie authenticates /api/auth/me");

  const replayResponse = await fetch(`${origin}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({
      message: challenge.message,
      signature,
      signatureType: "payload",
    }),
  });
  const replayBody = (await jsonBody(replayResponse)) as {
    error?: { code?: string };
  };
  if (replayResponse.status !== 401 || replayBody.error?.code !== "NONCE_REUSED") {
    fail(`replay was not rejected correctly: ${replayResponse.status} ${JSON.stringify(replayBody)}`);
  }
  console.log("PASS nonce replay rejected");

  const tamperedNonceResponse = await fetch(`${origin}/api/auth/nonce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }),
  });
  const tamperedChallenge = (await jsonBody(tamperedNonceResponse)) as { message?: string };
  if (!tamperedChallenge.message) {
    fail("second nonce challenge was not created");
  }
  const tamperedSignature = `0x${Buffer.from(pair.sign(tamperedChallenge.message)).toString("hex")}`;
  const flipped = `${tamperedSignature.slice(0, -2)}${tamperedSignature.endsWith("00") ? "01" : "00"}`;
  const tamperedResponse = await fetch(`${origin}/api/auth/verify`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: origin,
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({
      message: tamperedChallenge.message,
      signature: flipped,
      signatureType: "payload",
    }),
  });
  const tamperedBody = (await jsonBody(tamperedResponse)) as { error?: { code?: string } };
  if (tamperedResponse.status !== 401 || tamperedBody.error?.code !== "INVALID_SIGNATURE") {
    fail(`tampered signature was not rejected: ${tamperedResponse.status} ${JSON.stringify(tamperedBody)}`);
  }
  console.log("PASS invalid signature rejected");

  const wrongOriginResponse = await fetch(`${origin}/api/auth/nonce`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Origin: "https://evil.example",
      "x-forwarded-for": testIp,
    },
    body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }),
  });
  if (wrongOriginResponse.status !== 403) {
    fail(`wrong origin returned ${wrongOriginResponse.status}`);
  }
  console.log("PASS wrong origin rejected");

  const logoutResponse = await fetch(`${origin}/api/auth/logout`, {
    method: "POST",
    headers: { Origin: origin, Cookie: cookie },
  });
  if (logoutResponse.status !== 200) {
    fail(`logout returned ${logoutResponse.status}`);
  }
  const clearedCookie = logoutResponse.headers.get("set-cookie") ?? "";
  if (!/zorq_session=;/i.test(clearedCookie) || !/max-age=0/i.test(clearedCookie)) {
    fail("logout did not clear the session cookie");
  }
  const meAfterLogout = await fetch(`${origin}/api/auth/me`);
  if (meAfterLogout.status !== 401) {
    fail(`unauthenticated request returned ${meAfterLogout.status}`);
  }
  console.log("PASS logout clears the session cookie");

  const rateIp = `203.0.113.${Math.floor(Math.random() * 200) + 10}`;
  let lastStatus = 0;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const response = await fetch(`${origin}/api/auth/nonce`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Origin: origin,
        "x-forwarded-for": rateIp,
      },
      body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }),
    });
    lastStatus = response.status;
  }
  if (lastStatus !== 429) {
    fail(`nonce rate limit did not trigger; last status ${lastStatus}`);
  }
  console.log("PASS nonce rate limit enforced");

  console.log("AUTH INTEGRATION TESTS PASSED");
} catch (error) {
  console.error(
    "AUTH INTEGRATION TESTS FAILED:",
    error instanceof Error ? error.message : "unknown error",
  );
  const sanitized = serverOutput
    .split("\n")
    .filter((line) => !/postgres(ql)?:\/\//.test(line) && !/SESSION|TOKEN|SECRET|PRIVATE/i.test(line))
    .slice(-20)
    .join("\n");
  if (sanitized) {
    console.error("Server output (sanitized):\n", sanitized);
  }
  process.exitCode = 1;
} finally {
  if (server) {
    try {
      if (process.platform === "win32") {
        spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
      } else if (server.pid) {
        process.kill(-server.pid, "SIGTERM");
      }
    } catch {
      server.kill("SIGTERM");
    }
    await delay(1000);
    server.kill("SIGKILL");
  }

  try {
    const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => undefined });
    await sql`delete from audit_events where actor_wallet = ${walletAddress}`;
    await sql`delete from auth_nonces where wallet_address = ${walletAddress}`;
    await sql`delete from users where wallet_address = ${walletAddress}`;
    await sql.end({ timeout: 5 });
    console.log("Test rows cleaned up");
  } catch {
    console.error("Test cleanup skipped");
  }

  process.exit(process.exitCode ?? 0);
}
