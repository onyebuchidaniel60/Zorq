import {
  createPublicClient,
  defineChain,
  http,
  type PublicClient,
} from "viem";
import { getServerEnv } from "../env";
import { ZORQ_REGISTRY_ABI } from "./zorq-registry-abi";

export const portaldotChain = defineChain({
  id: 420420777,
  name: "Portaldot V3 Testnet",
  nativeCurrency: { name: "tPOT", symbol: "tPOT", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://test-evm-rpc-v3.portaldot.dev"] },
  },
});

let publicClient: PublicClient | undefined;

export function getPublicClient(): PublicClient {
  if (!publicClient) {
    const env = getServerEnv();
    publicClient = createPublicClient({
      chain: portaldotChain,
      transport: http(env.PORTALDOT_EVM_RPC_URL),
    });
  }
  return publicClient;
}

export function contractAddress(): `0x${string}` {
  const address = getServerEnv().ZORQ_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("ZORQ_CONTRACT_ADDRESS is not configured");
  }
  return address as `0x${string}`;
}

export function registryAbi() {
  return ZORQ_REGISTRY_ABI;
}
