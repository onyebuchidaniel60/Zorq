"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import {
  readApiError,
  transactionHash,
  userFacingError,
} from "@/lib/client-api";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

export function RevokeLicenseButton({
  licenseId,
  tokenId,
}: {
  licenseId: string;
  tokenId: string;
}) {
  const router = useRouter();
  const { wallet } = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (
      !wallet ||
      !window.confirm(
        "Revoke this license? Revocation is terminal. A contribution already admitted to the current round may finish; the next round will exclude it.",
      )
    ) {
      return;
    }
    setError(null);

    try {
      setStatus("Confirm the revocation in your wallet…");
      const { walletClient, publicClient } = await getContractClients(wallet);
      const hash = transactionHash(
        await walletClient.writeContract({
          address: contractAddress(),
          abi: ZORQ_REGISTRY_ABI,
          functionName: "revokeLicense",
          args: [BigInt(tokenId)],
          account: wallet.walletAddress as `0x${string}`,
          chain: null,
        }),
      );
      setStatus("Waiting for block confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({
        hash,
        timeout: 120_000,
      });
      const response = await fetch(`/api/licenses/${licenseId}/revoke/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
      });
      if (!response.ok) {
        throw new Error(await readApiError(response, "The revocation could not be confirmed."));
      }
      setStatus("Revoked");
      router.refresh();
    } catch (cause) {
      setError(
        userFacingError(
          cause,
          "The license could not be revoked. No revocation was confirmed.",
        ),
      );
      setStatus(null);
    }
  }

  return (
    <div className="z-button-stack">
      <button type="button" onClick={() => void revoke()} className="z-button-secondary z-button-full">
        {status ?? "Revoke license"}
      </button>
      {error ? (
        <p role="alert" className="z-alert z-alert-danger z-alert-compact">
          {error}
        </p>
      ) : null}
    </div>
  );
}
