import { chromium } from "@playwright/test";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import fs from "node:fs";
import path from "node:path";

const key = JSON.parse(fs.readFileSync("/root/Zorq/.secrets/deployer.json", "utf8"));
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(Buffer.from(key.seed.slice(2), "hex"));
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const origin = process.env.PREVIEW_ORIGIN ?? "https://zorq-preview-uhhh2.vercel.app";
const outDir = "/root/Zorq/docs/demo/raw";
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({ headless: false, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({
  viewport: { width: 1280, height: 720 },
  recordVideo: { dir: outDir, size: { width: 1280, height: 720 } },
});
await context.setExtraHTTPHeaders({
  "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 10}`,
});
const page = await context.newPage();

async function solveChallenge() {
  for (let i = 0; i < 40; i += 1) {
    const title = await page.title();
    if (!title.toLowerCase().includes("security checkpoint")) return;
    await page.mouse.move(120 + (i % 8) * 80, 160 + (i % 5) * 70, { steps: 6 });
    await page.waitForTimeout(750);
  }
  throw new Error("challenge did not clear");
}

async function dwell(ms) {
  await page.waitForTimeout(ms);
}

try {
  await page.goto(origin, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await solveChallenge();
  await dwell(1500);

  await page.exposeFunction("__zorqSign", (message) =>
    `0x${Buffer.from(pair.sign(message)).toString("hex")}`,
  );
  const auth = await page.evaluate(async ({ walletAddress, ss58Address }) => {
    const nonce = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress, ss58Address }),
    });
    const challenge = await nonce.json();
    if (!nonce.ok) {
      return { nonce: nonce.status, verify: 0 };
    }
    const signature = await window.__zorqSign(challenge.message);
    const verify = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: challenge.message, signature, signatureType: "payload" }),
    });
    return { nonce: nonce.status, verify: verify.status };
  }, { walletAddress, ss58Address: pair.address });
  if (auth.nonce !== 200 || auth.verify !== 200) {
    throw new Error(`capture authentication failed: ${JSON.stringify(auth)}`);
  }

  // Landing
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.mouse.move(700, 420, { steps: 12 });
  await dwell(9000);
  await page.mouse.wheel(0, 520);
  await dwell(5000);
  await page.mouse.wheel(0, 280);
  await dwell(8000);
  await page.mouse.wheel(0, 280);
  await dwell(8000);

  // Overview
  await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.getByRole("button", { name: /sign out/i }).first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await page.getByText(/Authorization overview/i).first().waitFor({
    state: "visible",
    timeout: 30_000,
  });
  await dwell(12000);

  // Assets
  await page.goto(`${origin}/app/assets`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.mouse.move(640, 520, { steps: 10 });
  await dwell(10000);

  // Job
  await page.goto(`${origin}/app/jobs/a37f6074-bd7d-44fc-a00c-c737b8a78b77`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.mouse.wheel(0, 380);
  await dwell(12000);

  // Run monitor
  await page.goto(`${origin}/app/runs/e18c1749-21f4-4cf4-b74a-2ed107f5d6cf`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await dwell(8000);
  await page.mouse.wheel(0, 600);
  await dwell(10000);
  await page.mouse.wheel(0, 500);
  await dwell(8000);

  // Revoked license
  await page.goto(`${origin}/app/licenses/88a3af2f-58ba-4092-b900-3ffa0b0294ed`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await dwell(10000);

  // Docs
  await page.goto(`${origin}/docs`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.mouse.wheel(0, 350);
  await dwell(10000);

  const video = page.video();
  await context.close();
  const videoPath = await video?.path();
  await browser.close();
  if (!videoPath) throw new Error("No video recorded");
  const target = path.join(outDir, "capture.webm");
  fs.copyFileSync(videoPath, target);
  console.log(target);
} catch (error) {
  await context.close().catch(() => undefined);
  await browser.close().catch(() => undefined);
  throw error;
}
