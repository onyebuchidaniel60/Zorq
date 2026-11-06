import { chromium } from "@playwright/test";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import fs from "node:fs";

const key = JSON.parse(fs.readFileSync("/root/Zorq/.secrets/deployer.json", "utf8"));
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  Buffer.from(key.seed.slice(2), "hex"),
);
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const origin = process.env.PREVIEW_ORIGIN ?? "http://localhost:3100";

const browser = await chromium.launch({ headless: false, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
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
try {
  await page.goto(origin, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.exposeFunction("__sign", (message) =>
    `0x${Buffer.from(pair.sign(message)).toString("hex")}`,
  );
  const auth = await page.evaluate(async ({ walletAddress, ss58Address }) => {
    const nonce = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress, ss58Address }),
    });
    const challenge = await nonce.json();
    const signature = await window.__sign(challenge.message);
    const verify = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: challenge.message, signature, signatureType: "payload" }),
    });
    return { nonce: nonce.status, verify: verify.status };
  }, { walletAddress, ss58Address: pair.address });
  if (auth.nonce !== 200 || auth.verify !== 200) throw new Error(JSON.stringify(auth));

  await page.goto(`${origin}/app/assets/new`, { waitUntil: "domcontentloaded" });
  await solveChallenge();
  await page.locator('input[name="data-source"][value="external"]').check({ force: true });
  await page.locator("#asset-db-url").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#asset-db-table").waitFor({ state: "visible", timeout: 30_000 });
  await page.locator("#asset-label-column").waitFor({ state: "visible", timeout: 30_000 });
  await page.screenshot({ path: "/root/Zorq/docs/evidence/external-database-form.png", fullPage: true });
  console.log("EXTERNAL DATABASE FORM PASSED");
} finally {
  await browser.close();
}
