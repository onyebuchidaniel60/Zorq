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
import { createPublicClient, defineChain, encodeFunctionData, http } from "viem";
import { ZORQ_REGISTRY_ABI } from "../../src/server/chain/zorq-registry-abi";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(webDir, "../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });

const port = 3104;
const origin = `http://localhost:${port}`;
const contractAddress = process.env.ZORQ_CONTRACT_ADDRESS as `0x${string}`;
const assetId = process.env.ZORQ_TEST_ASSET_ID;
const jobId = process.env.ZORQ_TEST_JOB_ID;

if (!assetId || !jobId) {
  console.error("ZORQ_TEST_ASSET_ID and ZORQ_TEST_JOB_ID are required");
  process.exit(1);
}

const deployer = JSON.parse(fs.readFileSync(path.join(repoRoot, ".secrets/deployer.json"), "utf8")) as {
  seed: string;
  ss58: string;
  h160: `0x${string}`;
};
await cryptoWaitReady();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  Buffer.from(deployer.seed.slice(2), "hex"),
);
const walletAddress = ss58ToH160(pair.address).toLowerCase();
const chain = defineChain({
  id: 420420777,
  name: "Portaldot V3 Testnet",
  nativeCurrency: { name: "tPOT", symbol: "tPOT", decimals: 18 },
  rpcUrls: { default: { http: ["https://test-evm-rpc-v3.portaldot.dev"] } },
});
const publicClient = createPublicClient({ chain, transport: http() });

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";
const server = spawn(npmCommand, ["run", "dev", "--", "--port", String(port)], {
  cwd: webDir,
  detached: process.platform !== "win32",
  env: {
    ...process.env,
    APP_ORIGIN: origin,
    NEXT_PUBLIC_APP_URL: origin,
    ZORQ_CONTRACT_ADDRESS: contractAddress,
    NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS: contractAddress,
    PORTALDOT_CONFIRMATION_DEPTH: "1",
    PORT: String(port),
  },
  stdio: ["ignore", "pipe", "pipe"],
});

let serverOutput = "";
server.stdout.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });
server.stderr.on("data", (chunk: Buffer) => { serverOutput += chunk.toString(); });

let cookie = "";
const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {}
    await delay(1000);
  }
  throw new Error("server did not become ready");
}

async function api(pathname: string, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  headers.set("Origin", origin);
  headers.set("x-forwarded-for", testIp);
  if (cookie) headers.set("Cookie", cookie);
  if (init?.body) headers.set("Content-Type", "application/json");
  const response = await fetch(`${origin}${pathname}`, { ...init, headers });
  if (!response.ok) throw new Error(`${pathname} -> ${response.status}: ${await response.text()}`);
  return response;
}
async function apiJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  return (await (await api(pathname, init)).json()) as T;
}

async function connectApi() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try { return await getApi(); } catch (error) { lastError = error; resetApi(); await delay(3000); }
  }
  throw lastError;
}
const apiPromise = await connectApi();
const signer = keyringSigner(apiPromise, pair);

async function submitCall(functionName: string, args: readonly unknown[], depositPot = 19) {
  const data = encodeFunctionData({ abi: ZORQ_REGISTRY_ABI, functionName: functionName as never, args: args as never });
  const tx = apiPromise.tx.revive!.call!(
    contractAddress,
    0n,
    { refTime: 500_000_000_000n, proofSize: 5_000_000n },
    BigInt(depositPot) * 100_000_000_000_000n,
    data,
  );
  const outcome = await signer.submit(tx);
  if (!outcome.ok) throw new Error(outcome.error ?? "revive.call failed");
  return {
    hash: outcome.extrinsicHash as `0x${string}`,
    blockHash: outcome.blockHash as `0x${string}`,
    blockNumber: BigInt(outcome.blockNumber ?? 0),
  };
}

try {
  await waitForServer();
  console.log("PASS local server ready");
  const nonce = await apiJson<{ message: string }>("/api/auth/nonce", {
    method: "POST",
    body: JSON.stringify({ address: walletAddress, ss58Address: pair.address }),
  });
  const signature = `0x${Buffer.from(pair.sign(nonce.message)).toString("hex")}`;
  const verifyResponse = await api("/api/auth/verify", {
    method: "POST",
    body: JSON.stringify({ message: nonce.message, signature, signatureType: "payload" }),
  });
  cookie = (verifyResponse.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
  if (!cookie) throw new Error("no session cookie");
  console.log("PASS wallet session established");

  const now = BigInt(Math.floor(Date.now() / 1000));
  const draft = await apiJson<{ licenseId: string; args: [string, string, number, number] }>(
    "/api/licenses/drafts",
    {
      method: "POST",
      body: JSON.stringify({
        assetId,
        jobId,
        validFrom: new Date(Number(now + 300n) * 1000).toISOString(),
        validUntil: new Date(Number(now + 86400n) * 1000).toISOString(),
        idempotencyKey: `license-flow-${Date.now()}`,
      }),
    },
  );
  console.log(`PASS license draft (${draft.licenseId})`);

  const tx = await submitCall("issueLicense", [
    draft.args[0] as `0x${string}`,
    draft.args[1] as `0x${string}`,
    BigInt(draft.args[2]),
    BigInt(draft.args[3]),
  ]);
  await delay(7000);
  const confirmed = await apiJson<{ tokenId: string }>(`/api/licenses/${draft.licenseId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash: tx.hash, blockHash: tx.blockHash }),
  });
  console.log(`PASS license issued and confirmed (token ${confirmed.tokenId})`);

  const authBefore = await publicClient.readContract({
    address: contractAddress,
    abi: ZORQ_REGISTRY_ABI,
    functionName: "checkAuthorization",
    args: [BigInt(confirmed.tokenId), walletAddress as `0x${string}`, draft.args[1] as `0x${string}`],
  });
  if (authBefore[0] !== false || Number(authBefore[1]) !== 7) {
    throw new Error(`expected NOT_YET_VALID, got ${String(authBefore[0])}/${String(authBefore[1])}`);
  }
  console.log("PASS checkAuthorization returns NOT_YET_VALID for future window");

  const revokeTx = await submitCall("revokeLicense", [BigInt(confirmed.tokenId)], 19);
  await delay(7000);
  await api(`/api/licenses/${draft.licenseId}/revoke/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash: revokeTx.hash, blockHash: revokeTx.blockHash }),
  });
  console.log("PASS revocation confirmed");

  const authAfter = await publicClient.readContract({
    address: contractAddress,
    abi: ZORQ_REGISTRY_ABI,
    functionName: "checkAuthorization",
    args: [BigInt(confirmed.tokenId), walletAddress as `0x${string}`, draft.args[1] as `0x${string}`],
  });
  if (authAfter[0] !== false || Number(authAfter[1]) !== 4) {
    throw new Error(`expected REVOKED, got ${String(authAfter[0])}/${String(authAfter[1])}`);
  }
  console.log("PASS checkAuthorization returns REVOKED after revocation");
  console.log("PHASE 3 LICENSE FLOW PASSED");
} catch (error) {
  console.error("PHASE 3 LICENSE FLOW FAILED:", error instanceof Error ? error.message : "unknown");
  const sanitized = serverOutput
    .split("\n")
    .filter((line) => !/postgres(ql)?:\/\//.test(line) && !/SESSION|TOKEN|SECRET|PRIVATE/i.test(line))
    .slice(-20)
    .join("\n");
  if (sanitized) console.error("Server output (sanitized):\n", sanitized);
  process.exitCode = 1;
} finally {
  await apiPromise.disconnect().catch(() => undefined);
  try {
    if (process.platform === "win32") spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
    else if (server.pid) process.kill(-server.pid, "SIGTERM");
  } catch { server.kill("SIGTERM"); }
  await delay(1000);
  server.kill("SIGKILL");
  process.exit(process.exitCode ?? 0);
}
