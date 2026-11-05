import { chromium } from "@playwright/test";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import { randomBytes } from "node:crypto";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import postgres from "postgres";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });

const origin = process.env.PREVIEW_ORIGIN ?? "https://zorq-preview-uhhh2.vercel.app";
const databaseUrl = process.env.DATABASE_URL;

await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  new Uint8Array(randomBytes(32)),
);
const walletAddress = ss58ToH160(pair.address).toLowerCase();

const browser = await chromium.launch({
  headless: false,
  args: ["--disable-blink-features=AutomationControlled"],
});
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();

let failures = 0;
function pass(message) {
  console.log(`PASS ${message}`);
}
function fail(message) {
  failures += 1;
  console.error(`FAIL ${message}`);
}

async function solveChallenge(attempts = 40) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    const title = await page.title();
    if (!title.toLowerCase().includes("security checkpoint")) {
      return;
    }
    await page.mouse.move(120 + (attempt % 8) * 80, 160 + (attempt % 5) * 70, {
      steps: 6,
    });
    await page.waitForTimeout(750);
  }
  throw new Error("Vercel security checkpoint did not clear");
}

async function open(pathname) {
  await page.goto(`${origin}${pathname}`, {
    waitUntil: "domcontentloaded",
    timeout: 30_000,
  });
  await solveChallenge();
  await page.locator("h1").first().waitFor({ state: "visible", timeout: 20_000 });
  return page.title();
}

try {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await solveChallenge();
  pass("preview challenge cleared");

  const routes = [
    "/",
    "/docs",
    "/privacy",
    "/terms",
    "/support",
    "/app",
    "/app/assets",
    "/app/assets/new",
    "/app/assets/sample-asset-id",
    "/app/jobs",
    "/app/jobs/new",
    "/app/jobs/sample-job-id",
    "/app/licenses",
    "/app/licenses/sample-license-id",
    "/app/runs/sample-run-id",
  ];

  for (const route of routes) {
    const title = await open(route);
    if (!title || title.toLowerCase().includes("security checkpoint")) {
      fail(`route ${route} did not render`);
    } else {
      pass(`route ${route}`);
    }
  }

  const health = await page.evaluate(async () => {
    const response = await fetch("/api/health");
    return { status: response.status, body: await response.json() };
  });
  if (health.status === 200 && health.body?.status === "ok") {
    pass("health endpoint live on preview");
  } else {
    fail(`health endpoint returned ${health.status}`);
  }

  await page.exposeFunction("__zorqSign", (message) => {
    return `0x${Buffer.from(pair.sign(message)).toString("hex")}`;
  });

  const auth = await page.evaluate(async ({ walletAddress, ss58Address }) => {
    const nonceResponse = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress, ss58Address }),
    });
    const challenge = await nonceResponse.json();
    if (!nonceResponse.ok) {
      return { stage: "nonce", status: nonceResponse.status, body: challenge };
    }
    const signature = await window.__zorqSign(challenge.message);
    const verifyResponse = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: challenge.message,
        signature,
        signatureType: "payload",
      }),
    });
    const verified = await verifyResponse.json();
    if (!verifyResponse.ok) {
      return { stage: "verify", status: verifyResponse.status, body: verified };
    }
    const meResponse = await fetch("/api/auth/me");
    const me = await meResponse.json();
    return {
      stage: "ok",
      status: verifyResponse.status,
      user: me.user,
      meStatus: meResponse.status,
      message: challenge.message,
      signature,
    };
  }, { walletAddress, ss58Address: pair.address });

  if (auth.stage !== "ok" || auth.user?.walletAddress !== walletAddress) {
    fail(`preview wallet sign-in failed: ${JSON.stringify(auth)}`);
  } else {
    pass("preview sr25519 SIWE sign-in and session cookie");
  }

  const cookies = await context.cookies(origin);
  const session = cookies.find((cookie) => cookie.name === "zorq_session");
  if (session?.httpOnly && session.secure && session.sameSite === "Lax") {
    pass("preview session cookie is HttpOnly, Secure and SameSite=Lax");
  } else {
    fail(`preview session cookie flags are wrong: ${JSON.stringify(session ?? null)}`);
  }

  if (auth.stage === "ok") {
    const replay = await page.evaluate(async ({ message, signature }) => {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, signature, signatureType: "payload" }),
      });
      return { status: response.status, body: await response.json() };
    }, { message: auth.message, signature: auth.signature });
    if (replay.status === 401 && replay.body?.error?.code === "NONCE_REUSED") {
      pass("preview nonce replay rejected");
    } else {
      fail(`preview nonce replay was not rejected: ${JSON.stringify(replay)}`);
    }
  }

  const logout = await page.evaluate(async () => {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    return response.status;
  });
  if (logout === 200) {
    pass("preview logout");
  } else {
    fail(`preview logout returned ${logout}`);
  }
} catch (error) {
  fail(error instanceof Error ? error.message : "preview smoke failed");
} finally {
  await browser.close();
  if (databaseUrl) {
    try {
      const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => undefined });
      await sql`delete from audit_events where actor_wallet = ${walletAddress}`;
      await sql`delete from auth_nonces where wallet_address = ${walletAddress}`;
      await sql`delete from users where wallet_address = ${walletAddress}`;
      await sql.end({ timeout: 5 });
      pass("preview test rows cleaned up");
    } catch {
      console.error("Preview cleanup skipped");
    }
  }
  if (failures > 0) {
    process.exitCode = 1;
  }
}
