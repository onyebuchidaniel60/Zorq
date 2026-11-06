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
import postgres from "postgres";
import { ZORQ_REGISTRY_ABI } from "../../src/server/chain/zorq-registry-abi";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(webDir, "../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });
const port = 3108;
const origin = `http://localhost:${port}`;
const contractAddress = process.env.ZORQ_CONTRACT_ADDRESS as `0x${string}`;
const databaseUrl = process.env.DATABASE_URL!;
const jobId = "a37f6074-bd7d-44fc-a00c-c737b8a78b77";
const revokedLicenseId = "88a3af2f-58ba-4092-b900-3ffa0b0294ed";
const revokedTokenId = 3n;
const deployer = JSON.parse(fs.readFileSync(path.join(repoRoot, ".secrets/deployer.json"), "utf8")) as { seed: string; ss58: string; h160: `0x${string}` };
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(Buffer.from(deployer.seed.slice(2), "hex"));
const walletAddress = ss58ToH160(pair.address).toLowerCase();

const sql = postgres(databaseUrl, { max: 1, prepare: false, onnotice: () => undefined });
const rows = await sql<{ min_valid: Date }[]>`select min(valid_from) as min_valid from licenses where job_id = ${jobId} and status_mirror = 'active'`;
const minValid = rows[0]?.min_valid;
if (!minValid) throw new Error("No active license window found");
const startAt = new Date(minValid).getTime() + 90_000;
const waitMs = startAt - Date.now();
if (waitMs > 0) {
  console.log(`Waiting ${Math.ceil(waitMs / 1000)}s for the license window to open...`);
  await delay(waitMs);
}

const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--port", String(port)], {
  cwd: webDir, detached: process.platform !== "win32",
  env: { ...process.env, APP_ORIGIN: origin, NEXT_PUBLIC_APP_URL: origin, ZORQ_CONTRACT_ADDRESS: contractAddress, NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS: contractAddress, PORTALDOT_CONFIRMATION_DEPTH: "1", FL_SERVICE_URL: "https://zorq-fl-service.onrender.com", PORT: String(port) },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = ""; server.stdout.on("data", (c: Buffer) => { output += c.toString(); }); server.stderr.on("data", (c: Buffer) => { output += c.toString(); });
let cookie = ""; const testIp = `198.51.100.${Math.floor(Math.random()*200)+10}`;
async function api(pathname: string, init?: RequestInit) {
  const headers = new Headers(init?.headers); headers.set("Origin", origin); headers.set("x-forwarded-for", testIp); if (cookie) headers.set("Cookie", cookie); if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${origin}${pathname}`, { ...init, headers }); if (!response.ok) throw new Error(`${pathname} -> ${response.status}: ${await response.text()}`); return response;
}
async function json<T>(p: string, init?: RequestInit): Promise<T> { return (await (await api(p, init)).json()) as T; }
async function waitServer(){const end=Date.now()+120000;while(Date.now()<end){try{if((await fetch(`${origin}/api/health`)).ok)return;}catch{}await delay(1000);}throw new Error("server not ready");}
async function connectApi(){let last:unknown;for(let i=0;i<6;i++){try{return await getApi();}catch(e){last=e;resetApi();await delay(3000);}}throw last;}
const apiPromise = await connectApi(); const signer = keyringSigner(apiPromise, pair);
async function submitRevoke(){
  const data=encodeFunctionData({abi:ZORQ_REGISTRY_ABI,functionName:"revokeLicense",args:[revokedTokenId]});
  const tx=apiPromise.tx.revive!.call!(contractAddress,0n,{refTime:300_000_000_000n,proofSize:3_000_000n},14n*100_000_000_000_000n,data);
  const out=await signer.submit(tx); if(!out.ok) throw new Error(out.error??"revoke failed");
  return {hash:out.extrinsicHash as `0x${string}`,blockHash:out.blockHash as `0x${string}`};
}

try {
  await waitServer();
  const nonce=await json<{message:string}>("/api/auth/nonce",{method:"POST",body:JSON.stringify({address:walletAddress,ss58Address:pair.address})});
  const sig=`0x${Buffer.from(pair.sign(nonce.message)).toString("hex")}`;
  const v=await api("/api/auth/verify",{method:"POST",body:JSON.stringify({message:nonce.message,signature:sig,signatureType:"payload"})});
  cookie=(v.headers.get("set-cookie")??"").split(";")[0]??""; console.log("PASS auth");

  const started=await json<{run:{id:string}}>(`/api/jobs/${jobId}/runs`,{method:"POST",headers:{"Idempotency-Key":`demo-run-${Date.now()}-abcdefgh`}});
  const runId=started.run.id; console.log("PASS run started",runId);

  const pollDeadline=Date.now()+240000;
  let run=await json<{run:any;rounds:any[];checks:any[]}>(`/api/runs/${runId}`);
  while (run.run.currentRound < 1 && run.run.status !== "failed" && Date.now()<pollDeadline) {
    await delay(2000); run=await json<{run:any;rounds:any[];checks:any[]}>(`/api/runs/${runId}`);
  }
  if (run.run.status === "failed") throw new Error(`run failed early: ${run.run.failureCode} ${run.run.failureMessage}`);
  console.log("PASS round 1 completed; revoking license", revokedLicenseId);

  const revokeTx=await submitRevoke(); await delay(7000);
  await api(`/api/licenses/${revokedLicenseId}/revoke/confirm`,{method:"POST",body:JSON.stringify({txHash:revokeTx.hash,blockHash:revokeTx.blockHash})});
  console.log("PASS license revoked");

  while (!["completed","failed"].includes(run.run.status) && Date.now()<pollDeadline+180000) {
    await delay(3000); run=await json<{run:any;rounds:any[];checks:any[]}>(`/api/runs/${runId}`);
  }
  const rounds=await json<{rounds:any[];checks:any[]}>(`/api/runs/${runId}/rounds`);
  const summary={
    runId,
    status: run.run.status,
    failureCode: run.run.failureCode,
    finalModelHash: run.run.finalModelHash,
    rounds: rounds.rounds.map((r:any)=>({round:r.roundNumber,status:r.status,block:r.snapshotBlockNumber,hash:r.snapshotBlockHash,authorized:r.authorizedCount,aggregated:r.aggregatedCount,metrics:r.aggregateMetrics})),
    checks: rounds.checks.map((c:any)=>({roundId:c.roundId,licenseId:c.licenseId,allowed:c.allowed,reason:c.reasonCode,block:c.snapshotBlockNumber})),
    revokedTokenId: revokedTokenId.toString(),
  };
  fs.writeFileSync("/tmp/opencode/demo-run.json",JSON.stringify(summary,null,2));
  console.log(JSON.stringify(summary,null,2));
  if (run.run.status !== "completed") throw new Error(`run did not complete: ${run.run.status} ${run.run.failureCode}`);
  console.log("DEMO RUN COMPLETE");
} catch(e){ console.error("DEMO RUN FAILED:",e instanceof Error?e.message:e); console.error(output.split("\n").filter(l=>!/postgres(ql)?:\/\//.test(l)).slice(-25).join("\n")); process.exitCode=1; }
finally { await apiPromise.disconnect().catch(()=>undefined); await sql.end({timeout:5}); try{if(process.platform==="win32")spawn("taskkill",["/pid",String(server.pid),"/f","/t"],{stdio:"ignore"});else if(server.pid)process.kill(-server.pid,"SIGTERM");}catch{server.kill("SIGTERM");} await delay(1000); server.kill("SIGKILL"); process.exit(process.exitCode??0); }
