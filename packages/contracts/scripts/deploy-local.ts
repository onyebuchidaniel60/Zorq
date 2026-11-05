import { network } from "hardhat";

const { viem } = await network.create();
const [wallet] = await viem.getWalletClients();
if (!wallet || !wallet.account) {
  throw new Error("No local wallet account available");
}

const contract = await viem.deployContract("ZorqRegistry", [wallet.account.address]);
console.log(`ZorqRegistry deployed locally at ${contract.address}`);
console.log(`Initial owner: ${wallet.account.address}`);
