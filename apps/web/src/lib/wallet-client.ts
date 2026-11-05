"use client";

import { ss58ToH160 } from "@polkadot-apps/address";
import { fromExtension } from "twinkey-provider";

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
  const { injected, address } = await fromExtension();
  const wallet: ConnectedWallet = {
    ss58Address: address,
    walletAddress: ss58ToH160(address).toLowerCase(),
    injected: injected as InjectedExtension,
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
