"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from "@/components/wallet/wallet-context";
import { contractAddress, getContractClients } from "@/lib/wallet-client";
import { ZORQ_REGISTRY_ABI } from "@/server/chain/zorq-registry-abi";

export function RevokeLicenseButton({ licenseId, tokenId }: { licenseId: string; tokenId: string }) {
  const router = useRouter();
  const { wallet } = useWallet();
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function revoke() {
    if (!wallet || !window.confirm("Revoke this license? Revocation is terminal. A contribution already admitted to the current round may finish; the next round will exclude it.")) return;
    try {
      setStatus("Waiting for wallet signature…");
      const { walletClient, publicClient } = await getContractClients(wallet);
      const hash = await walletClient.writeContract({
        address: contractAddress(),
        abi: ZORQ_REGISTRY_ABI,
        functionName: "revokeLicense",
        args: [BigInt(tokenId)],
        account: wallet.walletAddress as `0x${string}`,
        chain: null,
      });
      setStatus("Waiting for confirmation…");
      const receipt = await publicClient.waitForTransactionReceipt({ hash, timeout: 120_000 });
      const response = await fetch(`/api/licenses/${licenseId}/revoke/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ txHash: hash, blockHash: receipt.blockHash }),
      });
      if (!response.ok) throw new Error((await response.json()).error?.message ?? "Revocation failed");
      setStatus("Revoked");
      router.refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "The license could not be revoked.");
      setStatus(null);
    }
  }

  return (
    <div>
      <button type="button" onClick={() => void revoke()} className="pill-button-secondary">{status ?? "Revoke license"}</button>
      {error ? <p role="alert" className="mt-2 rounded-2xl bg-[#f8ecec] px-4 py-2 text-xs text-[#7a2626]">{error}</p> : null}
    </div>
  );
}
