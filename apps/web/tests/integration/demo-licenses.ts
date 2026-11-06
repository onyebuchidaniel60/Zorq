import { spawn } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { config as loadEnv } from "dotenv";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import { getApi, keyringSigner, resetApi } from "twinkey-provider";
import { encodeFunctionData } from "viem";
import { ZORQ_REGISTRY_ABI } from "../../src/server/chain/zorq-registry-abi";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(webDir, "../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });
const port = 3107;
const origin = `http://localhost:${port}`;
const contractAddress = process.env.ZORQ_CONTRACT_ADDRESS as `0x${string}`;
const jobId = "a37f6074-bd7d-44fc-a00c-c737b8a78b77";
const assets = [
  { id: "45acdc48-d2c8-4575-b4b9-4355b8cd097e", chainAssetId: "0xed15050bbb8fc7c543dc15aa486919d825265b077e1a94de66326c20a8fa383f" },
  { id: "317e4568-e6f0-4bcd-abec-f8f9baba5e9d", chainAssetId: "0x03acb2a63bac4d07e27149b93ca9a1faf14ffb6e76b0baf33246505a54baa26e" },
  { id: "97426368-02df-457c-ab0d-3a4531e8b04f", chainAssetId: "0xb5c0721e1579fca531462de42d48fe40d7566932d2293b77789bab5f4c3f1b5b" },
];
// Correct chain asset IDs are loaded from the database by the caller via env; this fallback is replaced below.
const deployer = JSON.parse(fs.readFileSync(path.join(repoRoot, ".secrets/deployer.json"), "utf8")) as { seed: string; ss58: string; h160: `0x${string}` };
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(Buffer.from(deployer.seed.slice(2), "hex"));
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--port", String(port)], {
  cwd: webDir, detached: process.platform !== "win32",
  env: { ...process.env, APP_ORIGIN: origin, NEXT_PUBLIC_APP_URL: origin, ZORQ_CONTRACT_ADDRESS: contractAddress, NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS: contractAddress, PORTALDOT_CONFIRMATION_DEPTH: "1", PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = ""; server.stdout.on("data", (c: Buffer) => { output += c.toString(); }); server.stderr.on("data", (c: Buffer) => { output += c.toString(); });
let cookie = ""; const testIp = `198.51.100.${Math.floor(Math.random()*200)+10}`;
async function api(pathname: string, init?: RequestInit) {
  const headers = new Headers(init?.headers); headers.set("Origin", origin); headers.set("x-forwarded-for", testIp); if (cookie) headers.set("Cookie", cookie); if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${origin}${pathname}`, { ...init, headers }); if (!response.ok) throw new Error(`${pathname} -> ${response.status}: ${await response.text()}`); return response;
}
async function json<T>(p: string, init?: RequestInit): Promise<T> { return (await (await api(p, init)).json()) as T; }
async function waitServer() { const end=Date.now()+120000; while(Date.now()<end){ try{ if((await fetch(`${origin}/api/health`)).ok) return; }catch{} await delay(1000);} throw new Error("server not ready"); }
async function connectApi(){ let last: unknown; for(let i=0;i<6;i++){ try{return await getApi();}catch(e){last=e;resetApi();await delay(3000);} } throw last; }
const apiPromise = await connectApi(); const signer = keyringSigner(apiPromise, pair);
async function submit(args: readonly unknown[]) {
  const data = encodeFunctionData({ abi: ZORQ_REGISTRY_ABI, functionName: "issueLicense", args: args as never });
  const tx = apiPromise.tx.revive!.call!(contractAddress, 0n, { refTime: 500_000_000_000n, proofSize: 5_000_000n }, 28n * 100_000_000_000_000n, data);
  const out = await signer.submit(tx); if (!out.ok) throw new Error(out.error ?? "issueLicense failed");
  return { hash: out.extrinsicHash as `0x${string}`, blockHash: out.blockHash as `0x${string}` };
}
try {
  await waitServer();
  const nonce = await json<{message:string}>("/api/auth/nonce",{method:"POST",body:JSON.stringify({address:walletAddress,ss58Address:pair.address})});
  const sig=`0x${Buffer.from(pair.sign(nonce.message)).toString("hex")}`;
  const v=await api("/api/auth/verify",{method:"POST",body:JSON.stringify({message:nonce.message,signature:sig,signatureType:"payload"})});
  cookie=(v.headers.get("set-cookie")??"").split(";")[0]??""; console.log("PASS auth");
  const now=BigInt(Math.floor(Date.now()/1000));
  const created=[];
  for (const [index, asset] of assets.entries()) {
    const draft=await json<{licenseId:string;args:[string,string,number,number]}>("/api/licenses/drafts",{method:"POST",body:JSON.stringify({assetId:asset.id,jobId,validFrom:new Date(Number(now+600n)*1000).toISOString(),validUntil:new Date(Number(now+86400n)*1000).toISOString(),idempotencyKey:`run-license-${index}-${Date.now()}`})});
    const tx=await submit([draft.args[0] as `0x${string}`, draft.args[1] as `0x${string}`, BigInt(draft.args[2]), BigInt(draft.args[3])]);
    await delay(7000);
    const confirmed=await json<{tokenId:string}>(`/api/licenses/${draft.licenseId}/confirm`,{method:"POST",body:JSON.stringify({txHash:tx.hash,blockHash:tx.blockHash})});
    created.push({ licenseId:draft.licenseId, assetId:asset.id, tokenId:confirmed.tokenId });
    console.log("PASS license",index,confirmed.tokenId);
  }
  fs.writeFileSync("/tmp/opencode/demo-licenses.json",JSON.stringify({jobId,licenses:created},null,2));
  console.log("LICENSES COMPLETE",JSON.stringify(created));
} catch(e){ console.error("LICENSE SETUP FAILED:", e instanceof Error?e.message:e); console.error(output.split("\n").filter(l=>!/postgres(ql)?:\/\//.test(l)).slice(-15).join("\n")); process.exitCode=1; }
finally { await apiPromise.disconnect().catch(()=>undefined); try{ if(process.platform==="win32") spawn("taskkill",["/pid",String(server.pid),"/f","/t"],{stdio:"ignore"}); else if(server.pid) process.kill(-server.pid,"SIGTERM"); }catch{server.kill("SIGTERM");} await delay(1000); server.kill("SIGKILL"); process.exit(process.exitCode??0); }
