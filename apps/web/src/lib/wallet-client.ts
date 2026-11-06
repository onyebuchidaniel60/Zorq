"use client";

import { ss58ToH160 } from "@polkadot-apps/address";
import { createTwinKeyProvider, fromExtension, getApi } from "twinkey-provider";
import { encodeFunctionData } from "viem";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";
import {
  createPublicClient,
  createWalletClient,
  custom,
  defineChain,
} from "viem";

type InjectedExtension = {
  accounts?: {
    get?: () => Promise<Array<{ address: string; name?: string }>>;
  };
  signer?: {
    signPayload?: (payload: unknown) => Promise<{ id?: number; signature: string }>;
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
  if (wallet.injected.accounts?.get) {
    const accounts = await wallet.injected.accounts.get();
    if (accounts.length === 0) {
      throw new Error(
        "The wallet returned no accounts. Unlock the extension, reconnect and retry.",
      );
    }
  }
  const api = await getApi();
  await api.isReady;
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

export async function submitContractTransaction(
  wallet: ConnectedWallet,
  functionName: string,
  args: readonly unknown[],
  storageDepositLimitPot = 25n,
): Promise<{ hash: `0x${string}`; blockHash: `0x${string}` }> {
  if (!wallet.injected.signer) {
    throw new Error(
      "The wallet signer is unavailable. Reconnect the extension and retry the transaction.",
    );
  }
  const api = await getApi();
  await api.isReady;
  const revive = api.tx.revive;
  if (!revive?.call) {
    throw new Error("The Portaldot revive transaction API is unavailable.");
  }

  const data = encodeFunctionData({
    abi: ZORQ_REGISTRY_ABI,
    functionName: functionName as never,
    args: args as never,
  });
  const tx = revive.call(
    contractAddress(),
    0n,
    { refTime: 500_000_000_000n, proofSize: 5_000_000n },
    storageDepositLimitPot * 100_000_000_000_000n,
    data,
  );

  return new Promise((resolve, reject) => {
    let unsub: (() => void) | undefined;
    let settling = false;
    const timer = setTimeout(() => {
      unsub?.();
      reject(new Error("The transaction was not included before the timeout."));
    }, 180_000);

    async function settleIncluded(hash: `0x${string}`, blockHash: `0x${string}`) {
      if (settling) return;
      settling = true;
      try {
        const includedHeader = await api.rpc.chain.getHeader(blockHash);
        const included = includedHeader.number.toNumber();
        const requiredDepth = 8;
        while (true) {
          const head = await api.rpc.chain.getHeader();
          if (head.number.toNumber() - included >= requiredDepth) break;
          await new Promise((wait) => setTimeout(wait, 2_000));
        }
        clearTimeout(timer);
        unsub?.();
        console.info(`[zorq:tx] confirmed ${hash} at ${blockHash}`);
        resolve({ hash, blockHash });
      } catch (error) {
        clearTimeout(timer);
        unsub?.();
        reject(error);
      }
    }

    void tx
      .signAndSend(
        wallet.ss58Address,
        { signer: wallet.injected.signer as never },
        (result) => {
          if (result.dispatchError) {
            clearTimeout(timer);
            unsub?.();
            let message = result.dispatchError.toString();
            if (result.dispatchError.isModule) {
              const decoded = api.registry.findMetaError(result.dispatchError.asModule);
              message = `${decoded.section}.${decoded.name}: ${decoded.docs.join(" ")}`;
            }
            reject(new Error(message));
            return;
          }
          const status = result.status;
          if (status.isInBlock || status.isFinalized) {
            const blockHash = (status.isFinalized
              ? status.asFinalized
              : status.asInBlock
            ).toHex() as `0x${string}`;
            void settleIncluded(result.txHash.toHex() as `0x${string}`, blockHash);
          }
        },
      )
      .then((stop) => {
        unsub = stop;
      })
      .catch((error: unknown) => {
        clearTimeout(timer);
        reject(error);
      });
  });
}
