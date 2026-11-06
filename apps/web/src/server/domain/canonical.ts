import { encodeAbiParameters, keccak256, toBytes } from "viem";
import { randomBytes } from "node:crypto";

export const MODEL_KEY = "synthetic-binary-classifier-v1";

export const MODEL_CONFIG = {
  modelKey: MODEL_KEY,
  inputFeatures: 8,
  architecture: "torch.nn.Linear(8, 1)",
  output: "binary logit",
  loss: "BCEWithLogitsLoss",
  optimizer: "SGD",
  learningRate: 0.05,
  batchSize: 32,
  localEpochs: 2,
  serverRounds: 3,
  aggregation: "FedAvg weighted by local example count",
  samplesPerParticipant: 256,
  evaluationSamples: 512,
  featureDistribution: "eight-dimensional standard normal",
  teacherWeights: [0.6, -0.8, 0.4, 0.2, -0.3, 0.7, -0.5, 0.1],
  partitionBias: "(partitionId - 2) * 0.15",
  evaluationBias: 0,
  dataSeed: 20261104,
} as const;

function sortValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortValue);
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, sortValue(child)]),
    );
  }
  return value;
}

export function canonicalJson(value: Record<string, unknown>): string {
  return JSON.stringify(sortValue(value));
}

export function normalizePurpose(text: string): string {
  return text
    .normalize("NFKC")
    .replace(/\r\n?/g, "\n")
    .replace(/\s+/g, " ")
    .trim();
}

export function hashText(text: string): `0x${string}` {
  return keccak256(toBytes(text));
}

export function purposeHash(purposeText: string): `0x${string}` {
  return hashText(normalizePurpose(purposeText));
}

export function modelConfigHash(): `0x${string}` {
  return hashText(canonicalJson(MODEL_CONFIG as unknown as Record<string, unknown>));
}

export function randomBytes32(): `0x${string}` {
  return `0x${randomBytes(32).toString("hex")}`;
}

export function metadataCommitment(input: {
  chainAssetId: string;
  ownerWallet: string;
  displayName: string;
  description: string | null;
  dataSource?: "demo" | "external";
  demoPartitionId: number | null;
  dbTable?: string | null;
  labelColumn?: string | null;
  salt: string;
}): `0x${string}` {
  const digest = hashText(
    canonicalJson({
      assetId: input.chainAssetId,
      ownerAddressLowercase: input.ownerWallet.toLowerCase(),
      displayName: input.displayName,
      description: input.description ?? "",
      dataSource: input.dataSource ?? "demo",
      demoPartitionId: input.demoPartitionId,
      dbTable: input.dbTable ?? null,
      labelColumn: input.labelColumn ?? null,
    }),
  );

  return keccak256(
    encodeAbiParameters(
      [{ type: "bytes32" }, { type: "bytes32" }],
      [digest, input.salt as `0x${string}`],
    ),
  );
}
