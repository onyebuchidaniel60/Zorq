"use client";

import { ss58ToH160 } from "@polkadot-apps/address";
import { createTwinKeyProvider, fromExtension, getApi } from "twinkey-provider";
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
} from "viem";

type InjectedExtension = {
  signer?: {
    signRaw?: (payload: {
      address: string;
      data: string;
      type: "payload" | "bytes";
    }) => Promise<{ signature: string }>;
  };
};

export type ConnectedWallet = {
  ss58Address: string;
  walletAddress: string;
  injected: InjectedExtension;
  signer: unknown;
};

let activeWallet: ConnectedWallet | undefined;

function bytesToHex(bytes: Uint8Array): string {
  let result = "0x";
  for (const byte of bytes) {
    result += byte.toString(16).padStart(2, "0");
  }
  return result;
}

function messageHex(message: string): string {
  return bytesToHex(new TextEncoder().encode(message));
}

export function hasInjectedWallet(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  const injected = (window as unknown as { injectedWeb3?: Record<string, unknown> })
    .injectedWeb3;
  return Boolean(injected && Object.keys(injected).length > 0);
}

export async function connectSubstrateWallet(): Promise<ConnectedWallet> {
  const { injected, address, signer } = await fromExtension();
  const wallet: ConnectedWallet = {
    ss58Address: address,
    walletAddress: ss58ToH160(address).toLowerCase(),
    injected: injected as InjectedExtension,
    signer,
  };
  activeWallet = wallet;
  return wallet;
}

export function getActiveWallet(): ConnectedWallet | undefined {
  return activeWallet;
}

export async function signSiweMessage(
  wallet: ConnectedWallet,
  message: string,
): Promise<{ signature: string; signatureType: "payload" | "bytes" }> {
  const signer = wallet.injected.signer;
  if (!signer?.signRaw) {
    throw new Error(
      "This wallet does not expose message signing. Use polkadot.js extension, Talisman or SubWallet.",
    );
  }

  const data = messageHex(message);

  try {
    const result = await signer.signRaw({
      address: wallet.ss58Address,
      data,
      type: "payload",
    });
    return { signature: result.signature, signatureType: "payload" };
  } catch {
    const result = await signer.signRaw({
      address: wallet.ss58Address,
      data,
      type: "bytes",
    });
    return { signature: result.signature, signatureType: "bytes" };
  }
}


export const zorqChain = defineChain({
  id: 420420777,
  name: "Portaldot V3 Testnet",
  nativeCurrency: { name: "tPOT", symbol: "tPOT", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_PORTALDOT_RPC_URL ??
          "https://test-evm-rpc-v3.portaldot.dev",
      ],
    },
  },
});

export async function getContractClients(wallet: ConnectedWallet) {
  const api = await getApi();
  const provider = createTwinKeyProvider({
    signer: wallet.signer as Parameters<typeof createTwinKeyProvider>[0]["signer"],
  });
  const walletClient = createWalletClient({
    chain: zorqChain,
    transport: custom(provider),
  });
  const publicClient = createPublicClient({
    chain: zorqChain,
    transport: custom(provider),
  });
  return { api, provider, walletClient, publicClient };
}

export function contractAddress(): `0x${string}` {
  const address = process.env.NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS;
  if (!address) {
    throw new Error("NEXT_PUBLIC_ZORQ_CONTRACT_ADDRESS is not configured");
  }
  return address as `0x${string}`;
}
