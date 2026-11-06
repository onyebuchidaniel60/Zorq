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
  if (!injected || !address || !signer) {
    throw new Error(
      "The wallet connected without an account or signer. Unlock the wallet and try again.",
    );
  }
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

function validSignature(value: unknown): value is string {
  return typeof value === "string" && /^0x[0-9a-fA-F]{128}$/.test(value);
}

function walletRejected(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return /reject|declined|cancel|denied|4001/i.test(message);
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

  async function sign(type: "payload" | "bytes"): Promise<string> {
    const result = await signer!.signRaw!({
      address: wallet.ss58Address,
      data,
      type,
    });
    if (!result || !validSignature(result.signature)) {
      throw new Error(
        "The wallet returned an empty signature. Unlock the wallet, reconnect and try again.",
      );
    }
    return result.signature;
  }

  try {
    return { signature: await sign("payload"), signatureType: "payload" };
  } catch (cause) {
    if (walletRejected(cause)) {
      throw cause;
    }
    return { signature: await sign("bytes"), signatureType: "bytes" };
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
  if (!wallet.signer) {
    throw new Error(
      "The wallet signer is unavailable. Disconnect, reconnect and approve the transaction again.",
    );
  }
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
