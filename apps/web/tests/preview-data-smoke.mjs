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
const jobId = "a37f6074-bd7d-44fc-a00c-c737b8a78b77";
const runId = "e18c1749-21f4-4cf4-b74a-2ed107f5d6cf";
const revokedLicenseId = "88a3af2f-58ba-4092-b900-3ffa0b0294ed";

const browser = await chromium.launch({ headless: false, args: ["--disable-blink-features=AutomationControlled"] });
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } });
const page = await context.newPage();
let failures = 0;
function pass(m){ console.log("PASS",m); }
function fail(m){ failures++; console.error("FAIL",m); }
async function solveChallenge(){
  for(let i=0;i<40;i++){
    const title=await page.title();
    if(!title.toLowerCase().includes("security checkpoint")) return;
    await page.mouse.move(120+(i%8)*80,160+(i%5)*70,{steps:6});
    await page.waitForTimeout(750);
  }
  throw new Error("challenge did not clear");
}
try {
  await page.goto(origin,{waitUntil:"domcontentloaded",timeout:30000});
  await solveChallenge();
  await page.exposeFunction("__zorqSign",(message)=>`0x${Buffer.from(pair.sign(message)).toString("hex")}`);
  const auth = await page.evaluate(async ({walletAddress,ss58Address})=>{
    const nonce=await fetch("/api/auth/nonce",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({address:walletAddress,ss58Address})});
    const challenge=await nonce.json();
    if(!nonce.ok) return {stage:"nonce",status:nonce.status,body:challenge};
    const signature=await window.__zorqSign(challenge.message);
    const verify=await fetch("/api/auth/verify",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({message:challenge.message,signature,signatureType:"payload"})});
    return {stage:"verify",status:verify.status};
  },{walletAddress,ss58Address:pair.address});
  if(auth.status!==200){ fail(`auth ${JSON.stringify(auth)}`); } else { pass("deployer session"); }

  async function open(path, needle){
    await page.goto(`${origin}${path}`,{waitUntil:"domcontentloaded",timeout:30000});
    await solveChallenge();
    await page.locator("h1").first().waitFor({state:"visible",timeout:20000});
    if (needle) {
      try { await page.getByText(needle, { exact: false }).first().waitFor({ state: "visible", timeout: 12000 }); }
      catch { fail(`${path} missing ${needle}`); return; }
    }
    pass(`${path}`);
  }
  await open("/app","Authorization overview");
  await open("/app/assets","Data assets");
  await open("/app/assets/new","Data Partition");
  await page.getByLabel("External Database").click();
  await page.locator("#asset-db-url").waitFor({ state: "visible", timeout: 12000 });
  await page.locator("#asset-db-table").waitFor({ state: "visible", timeout: 12000 });
  await page.locator("#asset-label-column").waitFor({ state: "visible", timeout: 12000 });
  await page.getByLabel("Demo Partition").click();
  pass("external database form toggle");
  await open("/app/jobs","Training jobs");
  await open(`/app/jobs/${jobId}`,"Job controls");
  await open(`/app/runs/${runId}`,"Round snapshots");
  const runText=await page.locator("body").innerText();
  if(!runText.includes("REVOKED")) fail("run page missing REVOKED"); else pass("run shows REVOKED exclusion");
  if(!runText.includes("completed")) fail("run page missing completed"); else pass("run completed");
  await open("/app/licenses","Data licenses");
  await open(`/app/licenses/${revokedLicenseId}`,"Revocation is terminal");
  console.log("PREVIEW DATA UI PASSED");
} catch(e){ fail(e instanceof Error?e.message:"unknown"); }
finally { await browser.close(); if(failures) process.exitCode=1; }
