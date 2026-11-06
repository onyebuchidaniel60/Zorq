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

const port = 3106;
const origin = `http://localhost:${port}`;
const contractAddress = process.env.ZORQ_CONTRACT_ADDRESS as `0x${string}`;
const deployer = JSON.parse(fs.readFileSync(path.join(repoRoot, ".secrets/deployer.json"), "utf8")) as {
  seed: string;
  ss58: string;
  h160: `0x${string}`;
};
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(Buffer.from(deployer.seed.slice(2), "hex"));
const walletAddress = ss58ToH160(pair.address).toLowerCase();

const server = spawn(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "dev", "--", "--port", String(port)], {
  cwd: webDir,
  detached: process.platform !== "win32",
  env: {
    ...process.env,
    APP_ORIGIN: origin,
    NEXT_PUBLIC_APP_URL: origin,
    ZORQ_CONTRACT_ADDRESS: contractAddress,
    NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS: contractAddress,
    PORTALDOT_CONFIRMATION_DEPTH: "1",
    FL_SERVICE_URL: "https://zorq-fl-service.onrender.com",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});
let output = "";
server.stdout.on("data", (c: Buffer) => { output += c.toString(); });
server.stderr.on("data", (c: Buffer) => { output += c.toString(); });

let cookie = "";
const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;
async function api(pathname: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Origin", origin); headers.set("x-forwarded-for", testIp);
  if (cookie) headers.set("Cookie", cookie);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${origin}${pathname}`, { ...init, headers });
  if (!response.ok) throw new Error(`${pathname} -> ${response.status}: ${await response.text()}`);
  return response;
}
async function json<T>(pathname: string, init?: RequestInit): Promise<T> { return (await (await api(pathname, init)).json()) as T; }
async function waitServer() {
  const end = Date.now() + 120000;
  while (Date.now() < end) { try { if ((await fetch(`${origin}/api/health`)).ok) return; } catch {} await delay(1000); }
  throw new Error("server not ready");
}
async function connectApi() {
  let last: unknown;
  for (let i=0;i<6;i++){ try { return await getApi(); } catch(e){ last=e; resetApi(); await delay(3000); } }
  throw last;
}
const apiPromise = await connectApi();
const signer = keyringSigner(apiPromise, pair);
async function submit(functionName: string, args: readonly unknown[], deposit = 25) {
  const data = encodeFunctionData({ abi: ZORQ_REGISTRY_ABI, functionName: functionName as never, args: args as never });
  const tx = apiPromise.tx.revive!.call!(contractAddress, 0n, { refTime: 500_000_000_000n, proofSize: 5_000_000n }, BigInt(deposit) * 100_000_000_000_000n, data);
  const out = await signer.submit(tx);
  if (!out.ok) throw new Error(out.error ?? "revive.call failed");
  return { hash: out.extrinsicHash as `0x${string}`, blockHash: out.blockHash as `0x${string}` };
}

try {
  await waitServer();
  const nonce = await json<{ message: string }>("/api/auth/nonce", { method: "POST", body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }) });
  const sig = `0x${Buffer.from(pair.sign(nonce.message)).toString("hex")}`;
  const v = await api("/api/auth/verify", { method: "POST", body: JSON.stringify({ message: nonce.message, signature: sig, signatureType: "payload" }) });
  cookie = (v.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  console.log("PASS auth");

  const now = BigInt(Math.floor(Date.now() / 1000));
  const jobDraft = await json<{ jobId: string; chainJobId: `0x${string}`; purposeHash: `0x${string}`; modelConfigHash: `0x${string}` }>("/api/jobs/drafts", {
    method: "POST",
    body: JSON.stringify({
      title: `Zorq demo run ${Date.now()}`,
      description: "Three-participant synthetic FL demo with one revocation between rounds.",
      purposeText: "Demonstrate job-scoped DataLicense authorization and revocation at a federated-learning round boundary.",
      startsAt: new Date(Number(now - 300n) * 1000).toISOString(),
      endsAt: new Date(Number(now + 172800n) * 1000).toISOString(),
      maxParticipants: 3,
      idempotencyKey: `demo-job-${Date.now()}`,
    }),
  });
  const jobTx = await submit("createJob", [jobDraft.chainJobId, jobDraft.purposeHash, jobDraft.modelConfigHash, now - 300n, now + 172800n, 3], 25);
  await delay(7000);
  await api(`/api/jobs/${jobDraft.jobId}/confirm`, { method: "POST", body: JSON.stringify({ txHash: jobTx.hash, blockHash: jobTx.blockHash }) });
  console.log("PASS job", jobDraft.jobId);

  const assets: Array<{ id: string; chainAssetId: `0x${string}` }> = [
    { id: "45acdc48-d2c8-4575-b4b9-4355b8cd097e", chainAssetId: "0xed15050bbb8fc7c543dc15aa486919d825265b077e1a94de66326c20a8fa383f" },
  ];
  for (const partition of [1, 2]) {
    const draft = await json<{ assetId: string; chainAssetId: `0x${string}`; metadataCommitment: `0x${string}` }>("/api/assets/drafts", {
      method: "POST",
      body: JSON.stringify({ displayName: `Synthetic demo asset ${partition}`, description: "Synthetic Phase 5 demo partition.", demoPartitionId: partition, idempotencyKey: `demo-asset-${partition}-${Date.now()}` }),
    });
    const tx = await submit("registerAsset", [draft.chainAssetId, draft.metadataCommitment], 25);
    await delay(7000);
    await api(`/api/assets/${draft.assetId}/confirm`, { method: "POST", body: JSON.stringify({ txHash: tx.hash, blockHash: tx.blockHash }) });
    assets.push({ id: draft.assetId, chainAssetId: draft.chainAssetId });
    console.log("PASS asset", partition, draft.assetId);
  }

  const licenses: Array<{ id: string; assetId: string }> = [];
  for (const [index, asset] of assets.entries()) {
    const draft = await json<{ licenseId: string; args: [string, string, number, number] }>("/api/licenses/drafts", {
      method: "POST",
      body: JSON.stringify({
        assetId: asset.id,
        jobId: jobDraft.jobId,
        validFrom: new Date(Number(now + 600n) * 1000).toISOString(),
        validUntil: new Date(Number(now + 86400n) * 1000).toISOString(),
        idempotencyKey: `demo-license-${index}-${Date.now()}`,
      }),
    });
    const tx = await submit("issueLicense", [draft.args[0] as `0x${string}`, draft.args[1] as `0x${string}`, BigInt(draft.args[2]), BigInt(draft.args[3])], 25);
    await delay(7000);
    const confirmed = await json<{ tokenId: string }>(`/api/licenses/${draft.licenseId}/confirm`, { method: "POST", body: JSON.stringify({ txHash: tx.hash, blockHash: tx.blockHash }) });
    licenses.push({ id: draft.licenseId, assetId: asset.id });
    console.log("PASS license", index, confirmed.tokenId);
  }

  const record = { jobId: jobDraft.jobId, chainJobId: jobDraft.chainJobId, assets, licenses, createdAt: new Date().toISOString() };
  fs.writeFileSync("/tmp/opencode/demo-setup.json", JSON.stringify(record, null, 2));
  console.log("DEMO SETUP COMPLETE", JSON.stringify(record));
} catch (error) {
  console.error("DEMO SETUP FAILED:", error instanceof Error ? error.message : error);
  console.error(output.split("\n").filter((l) => !/postgres(ql)?:\/\//.test(l)).slice(-20).join("\n"));
  process.exitCode = 1;
} finally {
  await apiPromise.disconnect().catch(() => undefined);
  try { if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" }); else if (server.pid) process.kill(-server.pid, "SIGTERM"); } catch { server.kill("SIGTERM"); }
  await delay(1000); server.kill("SIGKILL");
  process.exit(process.exitCode ?? 0);
}
