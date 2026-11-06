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
const origin = process.env.PREVIEW_ORIGIN ?? "http://127.0.0.1:3100";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.setExtraHTTPHeaders({
  "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 10}`,
});
await context.addInitScript(({ ss58 }) => {
  const injected = {
    enable: async () => ({
      accounts: { get: async () => [{ address: ss58, name: "Zorq test account" }] },
      signer: {
        signRaw: async ({ data }) => ({
          signature: await window.__zorqSignHex(data),
        }),
      },
    }),
  };
  window.injectedWeb3 = { "polkadot-js": injected };
}, { ss58: pair.address });

const page = await context.newPage();
let draftCalls = 0;
let authPrompts = 0;

try {
  await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded" });
  await page.exposeFunction("__zorqSignHex", (hex) =>
    `0x${Buffer.from(pair.sign(Buffer.from(hex.slice(2), "hex"))).toString("hex")}`,
  );
  await page.exposeFunction("__signSiweMessage", (message) =>
    `0x${Buffer.from(pair.sign(message)).toString("hex")}`,
  );

  const session = await page.evaluate(async ({ walletAddress, ss58Address }) => {
    const nonce = await fetch("/api/auth/nonce", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ address: walletAddress, ss58Address }),
    });
    const challenge = await nonce.json();
    const signature = await window.__signSiweMessage(challenge.message);
    const verify = await fetch("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: challenge.message, signature, signatureType: "payload" }),
    });
    const verifyBody = await verify.json().catch(() => null);
    return { nonce: nonce.status, verify: verify.status, verifyBody };
  }, { walletAddress, ss58Address: pair.address });
  if (session.nonce !== 200 || session.verify !== 200) {
    throw new Error(`session setup failed: ${JSON.stringify(session)}`);
  }

  await page.route("**/api/auth/nonce", async (route) => {
    authPrompts += 1;
    await route.continue();
  });
  await page.route("**/api/assets/drafts", async (route) => {
    draftCalls += 1;
    if (draftCalls === 1) {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({
          error: { code: "UNAUTHENTICATED", message: "Session expired." },
        }),
      });
      return;
    }
    await route.fulfill({
      status: 500,
      contentType: "application/json",
      body: JSON.stringify({
        error: { code: "TEST_STOP", message: "SESSION_RETRY_REACHED" },
      }),
    });
  });

  await page.goto(`${origin}/app/assets/new`, { waitUntil: "domcontentloaded" });
  await page.getByText(/Signed in|Sign out/i).first().waitFor({ state: "visible", timeout: 30_000 });

  await page.getByLabel("Display name").fill("Auth state verification");
  await page.getByLabel("Description").fill("Session and wallet hydration check.");
  await page.getByRole("button", { name: /register asset/i }).click();

  await page.getByText("SESSION_RETRY_REACHED").waitFor({ state: "visible", timeout: 30_000 });
  if (draftCalls !== 2) throw new Error(`expected 2 draft attempts, got ${draftCalls}`);
  if (authPrompts < 1) throw new Error("expected an automatic SIWE prompt after 401");
  const body = await page.locator("body").innerText();
  if (body.includes("Connect and sign in with your wallet first.")) {
    throw new Error("stale auth-state error still rendered");
  }

  console.log("AUTH STATE SMOKE PASSED", {
    session,
    draftCalls,
    authPrompts,
  });
} finally {
  await browser.close();
}
