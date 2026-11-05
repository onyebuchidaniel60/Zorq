import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { setTimeout as delay } from "node:timers/promises";
import { config as loadEnv } from "dotenv";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { ss58ToH160 } from "@polkadot-apps/address";
import { getApi, keyringSigner, resetApi } from "twinkey-provider";
import {
  createPublicClient,
  defineChain,
  encodeFunctionData,
  http,
} from "viem";
import { ZORQ_REGISTRY_ABI } from "../../src/server/chain/zorq-registry-abi";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const webDir = path.resolve(currentDir, "../..");
const repoRoot = path.resolve(webDir, "../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });

const port = 3103;
const origin = `http://localhost:${port}`;
const contractAddress = process.env.ZORQ_CONTRACT_ADDRESS as `0x${string}`;
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl || !contractAddress) {
  console.error("DATABASE_URL and ZORQ_CONTRACT_ADDRESS are required");
  process.exit(1);
}

const deployer = JSON.parse(
  (await import("node:fs")).readFileSync(path.join(repoRoot, ".secrets/deployer.json"), "utf8"),
) as { seed: string; ss58: string; h160: `0x${string}` };

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
server.stdout.on("data", (chunk: Buffer) => {
  serverOutput += chunk.toString();
});
server.stderr.on("data", (chunk: Buffer) => {
  serverOutput += chunk.toString();
});

let cookie = "";
const testIp = `198.51.100.${Math.floor(Math.random() * 200) + 10}`;

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 120_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`${origin}/api/health`, { signal: AbortSignal.timeout(3000) });
      if (response.ok) return;
    } catch {
      // compiling
    }
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
  if (!response.ok) {
    throw new Error(`${pathname} -> ${response.status}: ${await response.text()}`);
  }
  return response;
}

async function apiJson<T>(pathname: string, init?: RequestInit): Promise<T> {
  return (await (await api(pathname, init)).json()) as T;
}

async function waitForConfirmations(blockNumber: bigint): Promise<void> {
  const client = createPublicClient({ chain, transport: http() });
  const target = blockNumber + 1n;
  const deadline = Date.now() + 180_000;
  while (Date.now() < deadline) {
    const head = await client.getBlockNumber();
    if (head >= target) return;
    await delay(2000);
  }
  throw new Error("confirmation depth was not reached");
}

async function connectApi() {
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    try {
      return await getApi();
    } catch (error) {
      lastError = error;
      resetApi();
      await delay(3000);
    }
  }
  throw lastError;
}
const apiPromise = await connectApi();
const signer = keyringSigner(apiPromise, pair);
const publicClient = createPublicClient({ chain, transport: http() });
const account = walletAddress as `0x${string}`;

async function submitContractCall(
  functionName: string,
  args: readonly unknown[],
  depositPot = 15,
): Promise<{ hash: `0x${string}`; blockHash: `0x${string}`; blockNumber: bigint }> {
  const data = encodeFunctionData({
    abi: ZORQ_REGISTRY_ABI,
    functionName: functionName as never,
    args: args as never,
  });
  const tx = apiPromise.tx.revive!.call!(
    contractAddress,
    0n,
    { refTime: 500_000_000_000n, proofSize: 5_000_000n },
    BigInt(depositPot) * 100_000_000_000_000n,
    data,
  );
  const outcome = await signer.submit(tx);
  if (!outcome.ok) {
    throw new Error(outcome.error ?? "revive.call failed");
  }
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
  console.log("PASS wallet session established for deployer");

  const assetDraft = await apiJson<{
    assetId: string;
    chainAssetId: `0x${string}`;
    metadataCommitment: `0x${string}`;
  }>("/api/assets/drafts", {
    method: "POST",
    body: JSON.stringify({
      displayName: `Deployer synthetic asset ${Date.now()}`,
      description: "On-chain Phase 3 integration test asset. Synthetic only.",
      demoPartitionId: 3,
      idempotencyKey: `asset-${Date.now()}`,
    }),
  });

  const assetTx = await submitContractCall("registerAsset", [
    assetDraft.chainAssetId,
    assetDraft.metadataCommitment,
  ]);
  await waitForConfirmations(assetTx.blockNumber);
  await api(`/api/assets/${assetDraft.assetId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash: assetTx.hash, blockHash: assetTx.blockHash }),
  });
  console.log(`PASS asset registered and confirmed (${assetDraft.assetId})`);

  const now = BigInt(Math.floor(Date.now() / 1000));
  const jobDraft = await apiJson<{
    jobId: string;
    chainJobId: `0x${string}`;
    purposeHash: `0x${string}`;
    modelConfigHash: `0x${string}`;
  }>("/api/jobs/drafts", {
    method: "POST",
    body: JSON.stringify({
      title: `Phase 3 integration job ${Date.now()}`,
      description: "Synthetic integration test job.",
      purposeText: "Verify job-scoped DataLicense authorization for a synthetic federated-learning demonstration.",
      startsAt: new Date(Number(now - 300n) * 1000).toISOString(),
      endsAt: new Date(Number(now + 172800n) * 1000).toISOString(),
      maxParticipants: 2,
      idempotencyKey: `job-${Date.now()}`,
    }),
  });

  const jobTx = await submitContractCall("createJob", [
    jobDraft.chainJobId,
    jobDraft.purposeHash,
    jobDraft.modelConfigHash,
    now - 300n,
    now + 172800n,
    2,
  ]);
  await waitForConfirmations(jobTx.blockNumber);
  await api(`/api/jobs/${jobDraft.jobId}/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash: jobTx.hash, blockHash: jobTx.blockHash }),
  });
  console.log(`PASS job created and confirmed (${jobDraft.jobId})`);

  const licenseDraft = await apiJson<{
    licenseId: string;
    args: [string, string, number, number];
  }>("/api/licenses/drafts", {
    method: "POST",
    body: JSON.stringify({
      assetId: assetDraft.assetId,
      jobId: jobDraft.jobId,
      validFrom: new Date(Number(now + 300n) * 1000).toISOString(),
      validUntil: new Date(Number(now + 86400n) * 1000).toISOString(),
      idempotencyKey: `license-${Date.now()}`,
    }),
  });

  const licenseTx = await submitContractCall("issueLicense", [
    licenseDraft.args[0] as `0x${string}`,
    licenseDraft.args[1] as `0x${string}`,
    BigInt(licenseDraft.args[2]),
    BigInt(licenseDraft.args[3]),
  ]);
  await waitForConfirmations(licenseTx.blockNumber);
  const confirmedLicense = await apiJson<{ tokenId: string }>(
    `/api/licenses/${licenseDraft.licenseId}/confirm`,
    {
      method: "POST",
      body: JSON.stringify({ txHash: licenseTx.hash, blockHash: licenseTx.blockHash }),
    },
  );
  console.log(`PASS license issued and confirmed (token ${confirmedLicense.tokenId})`);

  const authorization = await publicClient.readContract({
    address: contractAddress,
    abi: ZORQ_REGISTRY_ABI,
    functionName: "checkAuthorization",
    args: [BigInt(confirmedLicense.tokenId), account, jobDraft.chainJobId],
  });
  if (authorization[0] !== false || Number(authorization[1]) !== 7) {
    throw new Error(`checkAuthorization returned unexpected value: ${String(authorization[0])}/${String(authorization[1])}`);
  }
  console.log("PASS checkAuthorization returned NOT_YET_VALID for the future window");

  const revokeTx = await submitContractCall("revokeLicense", [
    BigInt(confirmedLicense.tokenId),
  ]);
  await waitForConfirmations(revokeTx.blockNumber);
  await api(`/api/licenses/${licenseDraft.licenseId}/revoke/confirm`, {
    method: "POST",
    body: JSON.stringify({ txHash: revokeTx.hash, blockHash: revokeTx.blockHash }),
  });
  console.log("PASS revocation confirmed through API");

  const licenses = await apiJson<{ licenses: Array<{ statusMirror: string }> }>("/api/licenses");
  if (!licenses.licenses.some((license) => license.statusMirror === "revoked")) {
    throw new Error("revoked license not mirrored");
  }
  console.log("PASS license mirror reflects revoked state");
  console.log("PHASE 3 DOMAIN FLOW PASSED");
} catch (error) {
  console.error(
    "PHASE 3 DOMAIN FLOW FAILED:",
    error instanceof Error ? error.message : "unknown error",
  );
  const sanitized = serverOutput
    .split("\n")
    .filter((line) => !/postgres(ql)?:\/\//.test(line) && !/SESSION|TOKEN|SECRET|PRIVATE/i.test(line))
    .slice(-25)
    .join("\n");
  if (sanitized) console.error("Server output (sanitized):\n", sanitized);
  process.exitCode = 1;
} finally {
  await apiPromise.disconnect().catch(() => undefined);
  try {
    if (process.platform === "win32") {
      spawn("taskkill", ["/pid", String(server.pid), "/f", "/t"], { stdio: "ignore" });
    } else if (server.pid) {
      process.kill(-server.pid, "SIGTERM");
    }
  } catch {
    server.kill("SIGTERM");
  }
  await delay(1000);
  server.kill("SIGKILL");
  process.exit(process.exitCode ?? 0);
}
