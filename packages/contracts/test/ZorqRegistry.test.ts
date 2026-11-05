import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { network } from "hardhat";
import type { Hex } from "viem";

type RawTestClient = {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
};

const ZERO = `0x${"00".repeat(32)}` as Hex;
const ASSET_A = `0x${"a1".repeat(32)}` as Hex;
const ASSET_B = `0x${"b2".repeat(32)}` as Hex;
const ASSET_C = `0x${"c3".repeat(32)}` as Hex;
const JOB = `0x${"d4".repeat(32)}` as Hex;
const JOB_TWO = `0x${"e5".repeat(32)}` as Hex;
const PURPOSE = `0x${"11".repeat(32)}` as Hex;
const MODEL = `0x${"22".repeat(32)}` as Hex;
const COMMITMENT = `0x${"33".repeat(32)}` as Hex;

async function setup() {
  const { viem } = await network.create();
  const [owner, other] = await viem.getWalletClients();
  if (!owner.account || !other.account) {
    throw new Error("Hardhat did not provide test accounts");
  }
  const publicClient = await viem.getPublicClient();
  const testClient = (await viem.getTestClient()) as unknown as RawTestClient;
  const contract = await viem.deployContract("ZorqRegistry", [owner.account.address]);
  return { viem, owner, other, publicClient, testClient, contract };
}

async function latestTimestamp(publicClient: Awaited<ReturnType<typeof setup>>["publicClient"]) {
  const block = await publicClient.getBlock({ blockTag: "latest" });
  return block.timestamp;
}

async function advance(
  testClient: RawTestClient,
  seconds: number,
) {
  await testClient.request({ method: "evm_increaseTime", params: [seconds] });
  await testClient.request({ method: "evm_mine", params: [] });
}

describe("ZorqRegistry", () => {
  it("deploys with ERC-721 metadata and the configured owner", async () => {
    const { contract, owner } = await setup();
    assert.equal(await contract.read.name(), "Zorq DataLicense");
    assert.equal(await contract.read.symbol(), "ZORQ");
    assert.equal(
      (await contract.read.owner()).toLowerCase(),
      owner.account.address.toLowerCase(),
    );
    assert.equal(await contract.read.supportsInterface(["0x80ac58cd"]), true);
  });

  it("registers and deactivates an asset only as its owner", async () => {
    const { contract, viem, owner, other } = await setup();
    await viem.assertions.emitWithArgs(
      contract.write.registerAsset([ASSET_A, COMMITMENT]),
      contract,
      "AssetRegistered",
      [ASSET_A, owner.account.address, COMMITMENT],
    );

    const [assetOwner, commitment, active] = await contract.read.assets([ASSET_A]);
    assert.equal(assetOwner.toLowerCase(), owner.account.address.toLowerCase());
    assert.equal(commitment, COMMITMENT);
    assert.equal(active, true);

    await viem.assertions.revertWithCustomError(
      contract.write.registerAsset([ASSET_A, COMMITMENT]),
      contract,
      "AssetAlreadyExists",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.deactivateAsset([ASSET_A], { account: other.account }),
      contract,
      "NotAssetOwner",
    );
    await viem.assertions.emit(contract.write.deactivateAsset([ASSET_A]), contract, "AssetDeactivated");
    assert.equal((await contract.read.assets([ASSET_A]))[2], false);
    await viem.assertions.revertWithCustomError(
      contract.write.deactivateAsset([ASSET_A]),
      contract,
      "AssetInactive",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.registerAsset([ZERO, COMMITMENT]),
      contract,
      "InvalidIdentifier",
    );
  });

  it("creates a job with a bounded window and participant cap", async () => {
    const { contract, viem, publicClient, owner } = await setup();
    const now = await latestTimestamp(publicClient);
    const startsAt = now + 100n;
    const endsAt = now + 86_400n * 10n;

    await viem.assertions.emitWithArgs(
      contract.write.createJob([JOB, PURPOSE, MODEL, startsAt, endsAt, 3]),
      contract,
      "JobCreated",
      [JOB, owner.account.address, PURPOSE, MODEL, startsAt, endsAt],
    );

    const [, purpose, model, start, end, max, distinct, state] = await contract.read.jobs([JOB]);
    assert.equal(purpose, PURPOSE);
    assert.equal(model, MODEL);
    assert.equal(start, startsAt);
    assert.equal(end, endsAt);
    assert.equal(max, 3);
    assert.equal(distinct, 0);
    assert.equal(state, 0);

    await viem.assertions.revertWithCustomError(
      contract.write.createJob([JOB, PURPOSE, MODEL, startsAt, endsAt, 3]),
      contract,
      "JobAlreadyExists",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.createJob([JOB_TWO, PURPOSE, MODEL, startsAt, startsAt, 3]),
      contract,
      "InvalidJobWindow",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.createJob([JOB_TWO, PURPOSE, MODEL, startsAt, endsAt, 1]),
      contract,
      "InvalidParticipantLimit",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.createJob([JOB_TWO, PURPOSE, MODEL, startsAt, now + 31n * 86_400n, 3]),
      contract,
      "InvalidJobWindow",
    );
  });

  it("enforces creator-only job transitions and closed termination", async () => {
    const { contract, viem, publicClient, other } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 10_000n, 2]);

    await viem.assertions.revertWithCustomError(
      contract.write.setJobState([JOB, 1], { account: other.account }),
      contract,
      "NotJobCreator",
    );
    await viem.assertions.emit(contract.write.setJobState([JOB, 1]), contract, "JobStateChanged");
    assert.equal((await contract.read.jobs([JOB]))[7], 1);
    await viem.assertions.revertWithCustomError(
      contract.write.setJobState([JOB, 1]),
      contract,
      "InvalidJobTransition",
    );
    await contract.write.setJobState([JOB, 0]);
    await contract.write.setJobState([JOB, 2]);
    assert.equal((await contract.read.jobs([JOB]))[7], 2);
    await viem.assertions.revertWithCustomError(
      contract.write.setJobState([JOB, 0]),
      contract,
      "InvalidJobTransition",
    );
  });

  it("issues a non-transferable license bound to one asset and one job", async () => {
    const { contract, viem, publicClient, testClient, owner, other } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 30_000n, 2]);
    await advance(testClient, 20);

    const current = await latestTimestamp(publicClient);
    const validFrom = current + 10n;
    const validUntil = current + 10_000n;
    await viem.assertions.emitWithArgs(
      contract.write.issueLicense([ASSET_A, JOB, validFrom, validUntil]),
      contract,
      "LicenseIssued",
      [1n, ASSET_A, JOB, owner.account.address, 1, validFrom, validUntil],
    );

    const [assetId, jobId, from, until, revision, revoked] = await contract.read.licenses([1n]);
    assert.equal(assetId, ASSET_A);
    assert.equal(jobId, JOB);
    assert.equal(from, validFrom);
    assert.equal(until, validUntil);
    assert.equal(revision, 1);
    assert.equal(revoked, false);
    assert.equal((await contract.read.ownerOf([1n])).toLowerCase(), owner.account.address.toLowerCase());
    assert.equal(await contract.read.latestLicenseId([ASSET_A, JOB]), 1n);

    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, validFrom, validUntil], { account: other.account }),
      contract,
      "NotAssetOwner",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, validFrom, validUntil]),
      contract,
      "ActiveLicenseExists",
    );

    await viem.assertions.revertWithCustomError(
      contract.write.transferFrom([owner.account.address, other.account.address, 1n]),
      contract,
      "Soulbound",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.approve([other.account.address, 1n]),
      contract,
      "Soulbound",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.setApprovalForAll([other.account.address, true]),
      contract,
      "Soulbound",
    );
  });

  it("allows a new revision after revocation and never releases the cohort slot", async () => {
    const { contract, viem, publicClient, testClient } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.registerAsset([ASSET_B, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 30_000n, 2]);
    await advance(testClient, 20);

    const current = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, current + 5n, current + 9_000n]);
    await contract.write.issueLicense([ASSET_B, JOB, current + 5n, current + 9_000n]);
    assert.deepEqual((await contract.read.jobs([JOB])).slice(5, 7), [2, 2]);

    await contract.write.revokeLicense([1n]);
    assert.equal((await contract.read.licenses([1n]))[5], true);
    await viem.assertions.revertWithCustomError(
      contract.write.revokeLicense([1n]),
      contract,
      "LicenseAlreadyRevoked",
    );

    const next = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, next + 5n, next + 8_000n]);
    assert.equal(await contract.read.latestLicenseId([ASSET_A, JOB]), 3n);
    assert.deepEqual((await contract.read.jobs([JOB])).slice(5, 7), [2, 2]);

    await contract.write.registerAsset([ASSET_C, COMMITMENT]);
    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_C, JOB, next + 5n, next + 8_000n]),
      contract,
      "ParticipantLimitReached",
    );
  });

  it("returns deterministic authorization reasons", async () => {
    const { contract, viem, publicClient, testClient, owner, other } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 20_000n, 2]);
    await contract.write.createJob([JOB_TWO, PURPOSE, MODEL, now + 10n, now + 20_000n, 2]);
    await advance(testClient, 20);
    const current = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, current + 50n, current + 10_000n]);

    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      7,
    ]);
    assert.deepEqual(await contract.read.checkAuthorization([999n, owner.account.address, JOB]), [
      false,
      1,
    ]);
    assert.deepEqual(await contract.read.checkAuthorization([1n, other.account.address, JOB]), [
      false,
      2,
    ]);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB_TWO]), [
      false,
      3,
    ]);

    await advance(testClient, 60);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      true,
      0,
    ]);

    await contract.write.revokeLicense([1n]);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      4,
    ]);

    await contract.write.registerAsset([ASSET_B, COMMITMENT]);
    const next = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_B, JOB, next + 5n, next + 5_000n]);
    await contract.write.deactivateAsset([ASSET_B]);
    assert.deepEqual(await contract.read.checkAuthorization([2n, owner.account.address, JOB]), [
      false,
      5,
    ]);

    await contract.write.setJobState([JOB, 1]);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      4,
    ]);
  });

  it("distinguishes paused, job-expired and license-expired denials", async () => {
    const { contract, publicClient, testClient, owner } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 2_000n, 2]);
    await advance(testClient, 20);
    const current = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, current + 5n, current + 500n]);

    await advance(testClient, 10);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      true,
      0,
    ]);

    await contract.write.setJobState([JOB, 1]);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      6,
    ]);
    await contract.write.setJobState([JOB, 0]);

    await advance(testClient, 600);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      8,
    ]);

    await advance(testClient, 2_000);
    assert.deepEqual(await contract.read.checkAuthorization([1n, owner.account.address, JOB]), [
      false,
      10,
    ]);
  });

  it("rejects revocation by a non-owner", async () => {
    const { contract, viem, publicClient, testClient, other } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 10_000n, 2]);
    await advance(testClient, 20);
    const current = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, current + 5n, current + 9_000n]);

    await viem.assertions.revertWithCustomError(
      contract.write.revokeLicense([1n], { account: other.account }),
      contract,
      "NotLicenseOwner",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.revokeLicense([999n]),
      contract,
      "LicenseNotFound",
    );
  });

  it("does not let the contract owner mint or revoke for users, and pause never blocks revocation", async () => {
    const { contract, viem, publicClient, testClient, owner } = await setup();
    const now = await latestTimestamp(publicClient);
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, now + 10n, now + 30_000n, 2]);
    await advance(testClient, 20);
    const current = await latestTimestamp(publicClient);
    await contract.write.issueLicense([ASSET_A, JOB, current + 5n, current + 9_000n]);

    await contract.write.setCreationPaused([true]);
    assert.equal(await contract.read.creationPaused(), true);
    await viem.assertions.revertWithCustomError(
      contract.write.registerAsset([ASSET_B, COMMITMENT]),
      contract,
      "CreationPaused",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, current + 5n, current + 9_000n]),
      contract,
      "CreationPaused",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.setCreationPaused([false], { account: (await viem.getWalletClients())[1].account }),
      contract,
      "OwnableUnauthorizedAccount",
    );
    await contract.write.revokeLicense([1n]);
    assert.equal((await contract.read.licenses([1n]))[5], true);
    await contract.write.setCreationPaused([false]);
  });

  it("rejects licenses whose window is outside the job or in the past", async () => {
    const { contract, viem, publicClient, testClient } = await setup();
    const now = await latestTimestamp(publicClient);
    const startsAt = now + 10n;
    const endsAt = now + 20_000n;
    await contract.write.registerAsset([ASSET_A, COMMITMENT]);
    await contract.write.createJob([JOB, PURPOSE, MODEL, startsAt, endsAt, 2]);
    await advance(testClient, 20);
    const current = await latestTimestamp(publicClient);

    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, current - 2n, current + 1_000n]),
      contract,
      "InvalidLicenseWindow",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, current + 10n, current + 10n]),
      contract,
      "InvalidLicenseWindow",
    );
    await viem.assertions.revertWithCustomError(
      contract.write.issueLicense([ASSET_A, JOB, current + 10n, endsAt + 1n]),
      contract,
      "InvalidLicenseWindow",
    );
  });
});
