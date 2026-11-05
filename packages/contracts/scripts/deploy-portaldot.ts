import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { Keyring } from "@polkadot/keyring";
import { cryptoWaitReady } from "@polkadot/util-crypto";
import { getApi } from "twinkey-provider";
import { encodeAbiParameters } from "viem";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(currentDir, "../../..");
loadEnv({ path: path.join(repoRoot, ".env.local"), quiet: true });

const artifactPath = path.resolve(
  currentDir,
  "../artifacts/contracts/ZorqRegistry.sol/ZorqRegistry.json",
);
const deploymentPath = path.resolve(currentDir, "../deployments/portaldot-v3.json");
const keyPath = path.join(repoRoot, ".secrets/deployer.json");

if (!fs.existsSync(artifactPath)) {
  console.error("Contract artifact missing. Run `npm run build --workspace @zorq/contracts` first.");
  process.exit(1);
}
if (!fs.existsSync(keyPath)) {
  console.error("Deployer key is missing from .secrets/deployer.json");
  process.exit(1);
}

const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as {
  abi: unknown[];
  bytecode: `0x${string}`;
  deployedBytecode: `0x${string}`;
};
const deployer = JSON.parse(fs.readFileSync(keyPath, "utf8")) as {
  seed: string;
  ss58: string;
  h160: `0x${string}`;
};

const owner = (process.env.CONTRACT_OWNER_ADDRESS || deployer.h160) as `0x${string}`;
const constructorArgs = encodeAbiParameters([{ type: "address" }], [owner]);
const creationCode = `${artifact.bytecode}${constructorArgs.slice(2)}` as `0x${string}`;
const weightLimit = { refTime: 1_200_000_000_000n, proofSize: 12_000_000n };
const deployedCodeBytes = Math.floor((artifact.deployedBytecode.length - 2) / 2);
const estimatedDeposit = BigInt(Math.ceil(deployedCodeBytes * 90_000_000_000));
const estimatedFee = 100_000_000_000_000n;
const existentialDeposit = 10_000_000_000_000n;
const minimumBalance = estimatedDeposit + estimatedFee + existentialDeposit;

await cryptoWaitReady();
const api = await getApi();
const pair = new Keyring({ type: "sr25519", ss58Format: 42 }).addFromSeed(
  Buffer.from(deployer.seed.slice(2), "hex"),
);

try {
  console.log(`Deploying ZorqRegistry from ${deployer.h160} (SS58 ${deployer.ss58})`);
  console.log(`Initial owner: ${owner}`);

  const account = await api.query!.system!.account!(pair.address);
  const accountData = account as unknown as { data: { free: { toString(): string } } };
  const free = BigInt(accountData.data.free.toString());
  const freePot = Number(free) / 1e14;
  const minimumPot = Number(minimumBalance) / 1e14;
  console.log(
    `Balance ${freePot.toFixed(4)} POT; estimated minimum ${minimumPot.toFixed(4)} POT (code ${deployedCodeBytes} bytes)`,
  );
  if (free < minimumBalance) {
    throw new Error(
      "Insufficient balance for the estimated storage deposit, fee and existential deposit. No transaction was sent.",
    );
  }

  const storageDepositLimit = free - 1_200_000_000_000_000n;

  const tx = api.tx.revive!.instantiateWithCode!(
    0n,
    weightLimit,
    storageDepositLimit,
    creationCode,
    "0x",
    null,
  );

  const outcome = await new Promise<{
    txHash: string;
    blockHash: string;
    blockNumber: number;
    contractAddress: string;
    events: unknown[];
  }>((resolve, reject) => {
    let included = false;

    tx.signAndSend(pair, { nonce: undefined }, (result) => {
      const { status, events, dispatchError, txHash } = result;

      if (dispatchError) {
        if (dispatchError.isModule) {
          const decoded = api.registry.findMetaError(dispatchError.asModule);
          reject(new Error(`${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`));
        } else {
          reject(new Error(dispatchError.toString()));
        }
        return;
      }

      if (status.isInBlock && !included) {
        included = true;
        const blockHash = status.asInBlock.toHex();
        const instantiated = events.find(
          (event) =>
            event.event.section === "revive" && event.event.method === "Instantiated",
        );
        if (!instantiated) {
          reject(new Error("revive.Instantiated event was not emitted"));
          return;
        }
        const contract = instantiated.event.data[1]!.toString();
        void api.rpc.chain
          .getHeader(blockHash)
          .then((header) => {
            resolve({
              txHash: txHash.toHex(),
              blockHash,
              blockNumber: header.number.toNumber(),
              contractAddress: contract,
              events: events.map((event) => ({
                section: event.event.section,
                method: event.event.method,
              })),
            });
          })
          .catch(reject);
      }

      if (status.isFinalized && !included) {
        reject(new Error("Transaction finalized without an inclusion callback"));
      }
    }).catch(reject);
  });

  console.log(`Contract address: ${outcome.contractAddress}`);
  console.log(`Deployment extrinsic: ${outcome.txHash}`);
  console.log(`Block: ${outcome.blockNumber} (${outcome.blockHash})`);

  const record = {
    network: "Portaldot V3 Testnet",
    chainId: 420420777,
    contractName: "ZorqRegistry",
    contractAddress: outcome.contractAddress,
    initialOwner: owner,
    deployerH160: deployer.h160,
    deployerSs58: deployer.ss58,
    deploymentTx: outcome.txHash,
    blockNumber: outcome.blockNumber,
    blockHash: outcome.blockHash,
    compiler: "solc 0.8.24",
    optimizer: { enabled: true, runs: 200 },
    constructorArgs,
    deployedAt: new Date().toISOString(),
  };

  fs.mkdirSync(path.dirname(deploymentPath), { recursive: true });
  fs.writeFileSync(deploymentPath, `${JSON.stringify(record, null, 2)}\n`);
  console.log(`Deployment record written to ${deploymentPath}`);
} catch (error) {
  console.error(
    "Deployment failed:",
    error instanceof Error ? error.message : "unknown error",
  );
  process.exitCode = 1;
} finally {
  await api.disconnect();
}
