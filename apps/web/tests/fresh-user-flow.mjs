import { chromium } from "@playwright/test";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import { config as loadEnv } from "dotenv";
import { getApi } from "twinkey-provider";
import fs from "node:fs";
import path from "node:path";
import postgres from "postgres";

loadEnv({ path: path.join(process.cwd(), "../../.env.local"), quiet: true });
const key = JSON.parse(
  fs.readFileSync(
    process.env.E2E_WALLET_PATH ?? "/root/Zorq/.secrets/e2e-wallet.json",
    "utf8",
  ),
);
await cryptoWaitReady();
const api = await getApi();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  Buffer.from(key.seed.slice(2), "hex"),
);
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const origin = process.env.PREVIEW_ORIGIN ?? "http://localhost:3100";

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
await context.setExtraHTTPHeaders({
  "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 10}`,
});
await context.addInitScript(({ ss58 }) => {
  const signatureHex = (bytes) => `0x${Buffer.from(bytes).toString("hex")}`;
  const signer = {
    signRaw: async ({ data }) => ({
      signature: await window.__signRaw(data),
    }),
    signPayload: async (payload) => ({
      id: Date.now(),
      signature: await window.__signPayload(payload),
    }),
  };
  window.injectedWeb3 = {
    "polkadot-js": {
      enable: async () => ({
        accounts: { get: async () => [{ address: ss58, name: "Zorq E2E" }] },
        signer,
      }),
    },
  };
  window.__signatureHex = signatureHex;
}, { ss58: pair.address });

const page = await context.newPage();
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(`PAGEERROR ${error.message}`));

try {
  await page.exposeFunction("__signRaw", (data) =>
    `0x${Buffer.from(pair.sign(Buffer.from(data.slice(2), "hex"))).toString("hex")}`,
  );
  await page.exposeFunction("__signPayload", (payload) => {
    const extrinsicPayload = api.registry.createType("ExtrinsicPayload", payload, {
      version: payload.version,
    });
    return extrinsicPayload.sign(pair).signature;
  });

  await page.goto(`${origin}/app/assets/new`, { waitUntil: "domcontentloaded" });
  await page.getByRole("button", { name: /connect wallet/i }).first().click();
  await page.getByRole("button", { name: /^sign in$/i }).first().click();
  await page.getByRole("button", { name: /sign out/i }).first().waitFor({ state: "visible", timeout: 90_000 });
  await page.locator("#asset-name").waitFor({ state: "visible", timeout: 90_000 });
  console.log("PASS connect and sign in");

  await page.locator("#asset-name").fill("Provider Dataset Alpha");
  await page.locator("#asset-description").fill("Fresh end-to-end verification asset.");
  await page.locator("#asset-partition").selectOption("0");
  await page.getByRole("button", { name: /^register asset$/i }).click();
  await page.waitForURL(/\/app\/assets\/[0-9a-f-]{36}$/, { timeout: 180_000 });
  await page.getByText(/Data source/i).first().waitFor({ state: "visible", timeout: 30_000 });
  console.log("PASS register asset", page.url());

  await page.goto(`${origin}/app/jobs/new`, { waitUntil: "domcontentloaded" });
  await page.locator("#job-title").fill("Portaldot Federated Pilot");
  await page.locator("#job-description").fill("Fresh end-to-end verification job.");
  await page.locator("#job-purpose").fill("Verify execution-scoped DataLicense authorization on the Portaldot testnet.");
  await page.locator("#job-max").selectOption("2");
  await page.getByRole("button", { name: /^publish job$/i }).click();
  await page.waitForURL(/\/app\/jobs\/[0-9a-f-]{36}$/, { timeout: 180_000 });
  await page.getByText(/Job controls/i).first().waitFor({ state: "visible", timeout: 30_000 });
  console.log("PASS create job", page.url());

  await page.locator("#license-asset").selectOption({ index: 0 });
  await page.getByRole("button", { name: /^issue datalicense$/i }).click();
  await page.getByText(/License issued/i).first().waitFor({ state: "visible", timeout: 180_000 });
  console.log("PASS issue license");

  const sql = postgres(process.env.DATABASE_URL, {
    max: 1,
    prepare: false,
    onnotice: () => undefined,
  });
  try {
    const assets = await sql`select id, display_name, data_source, demo_partition_id, status, chain_tx_hash, chain_block_number from data_assets order by created_at desc`;
    const jobs = await sql`select id, title, status, chain_tx_hash, chain_block_number from fl_jobs order by created_at desc`;
    const licenses = await sql`select id, asset_id, job_id, token_id, status_mirror, chain_tx_hash, chain_block_number from licenses order by created_at desc`;
    const transactions = await sql`select entity_type, entity_id, event_name, tx_hash, block_number from chain_transactions order by created_at`;
    const evidence = {
      completedAt: new Date().toISOString(),
      origin,
      walletAddress,
      assets,
      jobs,
      licenses,
      transactions,
      consoleErrors,
    };
    fs.writeFileSync("docs/evidence/fresh-user-flow.json", JSON.stringify(evidence, null, 2));
    console.log("EVIDENCE", JSON.stringify(evidence));
  } finally {
    await sql.end({ timeout: 5 });
  }

  if (consoleErrors.some((message) => /Cannot read properties of null|empty response/i.test(message))) {
    throw new Error(`transaction errors were logged: ${JSON.stringify(consoleErrors)}`);
  }
  console.log("FRESH USER FLOW PASSED");
} finally {
  await browser.close();
  await api.disconnect().catch(() => undefined);
}
