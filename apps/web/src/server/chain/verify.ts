import { decodeEventLog, type Hex } from "viem";
import { getApi } from "twinkey-provider";
import { ss58ToH160 } from "@polkadot-apps/address";
import { ZORQ_REGISTRY_ABI } from "./zorq-registry-abi";
import { contractAddress, getPublicClient } from "./contract";
import { ApiError } from "../http/api";
import { getServerEnv } from "../env";

export type VerifiedContractEvent = {
  txHash: `0x${string}`;
  blockNumber: number;
  blockHash: `0x${string}`;
  eventName: string;
  args: Record<string, unknown>;
};

type ExpectedEvent = {
  eventName: string;
  args: Record<string, string | number | bigint | boolean>;
  senderWallet: string;
};

type SubstrateEvent = {
  event: {
    section: string;
    method: string;
    data: Array<{
      toString: () => string;
      toHex: () => string;
    }>;
  };
  phase?: {
    isApplyExtrinsic?: boolean;
    asApplyExtrinsic?: { toNumber: () => number };
  };
};

type SubstrateSignedBlock = {
  block: {
    header: {
      number: { toNumber: () => number };
    };
    extrinsics: Array<{
      hash: { toHex: () => string };
      isSigned: boolean;
      signer?: { toString: () => string };
    }>;
  };
};

function normalise(value: unknown): string {
  if (typeof value === "bigint") {
    return value.toString();
  }
  if (typeof value === "boolean") {
    return value ? "true" : "false";
  }
  return String(value).toLowerCase();
}

function matchesArgs(
  decoded: Record<string, unknown>,
  expected: Record<string, string | number | bigint | boolean>,
): boolean {
  return Object.entries(expected).every(([key, value]) => {
    return normalise(decoded[key]) === normalise(value);
  });
}

function decodeRegistryLog(topics: Hex[], data: Hex): {
  eventName: string;
  args: Record<string, unknown>;
} | null {
  try {
    const decoded = decodeEventLog({
      abi: ZORQ_REGISTRY_ABI,
      topics: topics as [Hex, ...Hex[]],
      data,
      strict: true,
    });
    return {
      eventName: decoded.eventName,
      args: decoded.args as Record<string, unknown>,
    };
  } catch {
    return null;
  }
}

async function verifyFromEvmReceipt(
  txHash: `0x${string}`,
  expected: ExpectedEvent,
): Promise<VerifiedContractEvent | null> {
  const client = getPublicClient();
  const receipt = await client.getTransactionReceipt({ hash: txHash }).catch(() => null);
  if (!receipt) {
    return null;
  }

  if (receipt.status !== "success") {
    throw new ApiError(422, "TX_REVERTED", "The transaction reverted.");
  }
  if (receipt.from.toLowerCase() !== expected.senderWallet.toLowerCase()) {
    throw new ApiError(403, "TX_WRONG_SENDER", "The transaction was signed by another wallet.");
  }
  if (!receipt.to || receipt.to.toLowerCase() !== contractAddress().toLowerCase()) {
    throw new ApiError(400, "TX_WRONG_CONTRACT", "The transaction did not call the Zorq registry.");
  }

  for (const log of receipt.logs) {
    if (log.address.toLowerCase() !== contractAddress().toLowerCase()) {
      continue;
    }
    const decoded = decodeRegistryLog(
      log.topics as Hex[],
      log.data as Hex,
    );
    if (decoded && decoded.eventName === expected.eventName && matchesArgs(decoded.args, expected.args)) {
      return {
        txHash,
        blockNumber: Number(receipt.blockNumber),
        blockHash: receipt.blockHash,
        eventName: decoded.eventName,
        args: decoded.args,
      };
    }
  }

  throw new ApiError(400, "TX_EVENT_MISMATCH", "The expected contract event was not found.");
}

async function verifyFromSubstrate(
  txHash: `0x${string}`,
  blockHash: `0x${string}`,
  expected: ExpectedEvent,
): Promise<VerifiedContractEvent> {
  const api = await getApi();
  const signedBlock = (await api.rpc.chain.getBlock(blockHash)) as unknown as SubstrateSignedBlock;
  const extrinsicIndex = signedBlock.block.extrinsics.findIndex(
    (extrinsic) => extrinsic.hash.toHex().toLowerCase() === txHash.toLowerCase(),
  );

  if (extrinsicIndex === -1) {
    throw new ApiError(404, "TX_NOT_FOUND", "The transaction was not found in the supplied block.");
  }

  const extrinsic = signedBlock.block.extrinsics[extrinsicIndex];
  if (!extrinsic?.isSigned || !extrinsic.signer) {
    throw new ApiError(403, "TX_WRONG_SENDER", "The transaction is not signed.");
  }

  const sender = ss58ToH160(extrinsic.signer.toString()).toLowerCase();
  if (sender !== expected.senderWallet.toLowerCase()) {
    throw new ApiError(403, "TX_WRONG_SENDER", "The transaction was signed by another wallet.");
  }

  const blockNumber = signedBlock.block.header.number.toNumber();
  const events = (await api.query!.system!.events!.at(blockHash)) as unknown as SubstrateEvent[];
  let succeeded = false;

  for (const record of events) {
    const { event } = record;
    if (
      event.section === "system" &&
      event.method === "ExtrinsicSuccess" &&
      record.phase?.isApplyExtrinsic &&
      record.phase.asApplyExtrinsic?.toNumber() === extrinsicIndex
    ) {
      succeeded = true;
    }
    if (
      event.section === "system" &&
      event.method === "ExtrinsicFailed" &&
      record.phase?.isApplyExtrinsic &&
      record.phase.asApplyExtrinsic?.toNumber() === extrinsicIndex
    ) {
      throw new ApiError(422, "TX_REVERTED", "The transaction failed.");
    }
  }

  if (!succeeded) {
    throw new ApiError(422, "TX_REVERTED", "The transaction did not report success.");
  }

  for (const record of events) {
    const { event } = record;
    if (event.section !== "revive" || event.method !== "ContractEmitted") {
      continue;
    }
    const emittedContract = event.data[0]?.toString();
    if (!emittedContract || emittedContract.toLowerCase() !== contractAddress().toLowerCase()) {
      continue;
    }
    const data = event.data[1]?.toHex() as Hex | undefined;
    const topics = event.data[2] as unknown as Array<{ toHex(): Hex }> | undefined;
    if (!data || !topics) {
      continue;
    }
    const decoded = decodeRegistryLog(
      topics.map((topic) => topic.toHex()),
      data,
    );
    if (decoded && decoded.eventName === expected.eventName && matchesArgs(decoded.args, expected.args)) {
      const depth = getServerEnv().PORTALDOT_CONFIRMATION_DEPTH;
      const head = await api.rpc.chain.getHeader();
      if (head.number.toNumber() - blockNumber < depth) {
        throw new ApiError(409, "TX_NOT_FOUND", "The transaction is not yet sufficiently confirmed.");
      }
      return {
        txHash,
        blockNumber,
        blockHash,
        eventName: decoded.eventName,
        args: decoded.args,
      };
    }
  }

  throw new ApiError(400, "TX_EVENT_MISMATCH", "The expected contract event was not found.");
}

export async function verifyContractEvent(input: {
  txHash: `0x${string}`;
  blockHash?: `0x${string}`;
  eventName: string;
  args: Record<string, string | number | bigint | boolean>;
  senderWallet: string;
}): Promise<VerifiedContractEvent> {
  const expected: ExpectedEvent = {
    eventName: input.eventName,
    args: input.args,
    senderWallet: input.senderWallet,
  };

  const receipt = await verifyFromEvmReceipt(input.txHash, expected);
  if (receipt) {
    return receipt;
  }

  if (!input.blockHash) {
    throw new ApiError(
      400,
      "TX_NOT_FOUND",
      "The block hash is required to verify a Portaldot native-path transaction.",
    );
  }

  return verifyFromSubstrate(input.txHash, input.blockHash, expected);
}
