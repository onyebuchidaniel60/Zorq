import { chromium } from "@playwright/test";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import fs from "node:fs";

const key = JSON.parse(fs.readFileSync("/root/Zorq/.secrets/deployer.json", "utf8"));
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(Buffer.from(key.seed.slice(2), "hex"));
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const origin = process.env.PREVIEW_ORIGIN ?? "https://zorq-preview-uhhh2.vercel.app";

const browser = await chromium.launch({ headless: false, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
await context.addInitScript(({ ss58 }) => {
  const injected = {
    enable: async () => ({
      accounts: { get: async () => [{ address: ss58, name: "Zorq test account" }] },
      signer: {
        signRaw: async ({ data }) => {
          const signature = await window.__zorqSignHex(data);
          return { signature };
        },
      },
    }),
  };
  window.injectedWeb3 = { "polkadot-js": injected };
}, { ss58: pair.address });
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
  await page.goto(`${origin}/app`, { waitUntil: "domcontentloaded", timeout: 30_000 });
  await solveChallenge();
  await page.exposeFunction("__zorqSignHex", (hex) => {
    const signature = pair.sign(Buffer.from(hex.slice(2), "hex"));
    return `0x${Buffer.from(signature).toString("hex")}`;
  });

  await page.getByRole("button", { name: /connect wallet/i }).first().click();
  await page.getByRole("button", { name: /^sign in$/i }).first().waitFor({ state: "visible", timeout: 90_000 });

  const nonceResponse = page.waitForResponse(
    (response) => response.url().includes("/api/auth/nonce"),
    { timeout: 90_000 },
  );
  await page.getByRole("button", { name: /^sign in$/i }).first().click();
  const nonce = await nonceResponse;
  console.log("nonce status", nonce.status(), "url", page.url()); console.log("nonce body", (await nonce.text()).slice(0,500));
  if (nonce.status() !== 200) throw new Error(`nonce returned ${nonce.status()}`);
  await page.getByText(/Signed in/i).first().waitFor({ state: "visible", timeout: 90_000 });
  await page.screenshot({ path: "/tmp/opencode/zorq-signin-success.png" });
  console.log("SIGN-IN UI PASSED", walletAddress);
} finally {
  await browser.close();
}
