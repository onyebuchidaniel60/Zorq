"use client";

import { useWallet } from "./wallet-context";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletPanel() {
  const { wallet, user, busy, error, connect, signIn, logout, clearError } = useWallet();

  return (
    <div className="flex flex-col items-stretch gap-2 sm:items-end">
      <div className="flex flex-wrap items-center justify-end gap-2">
        {user ? (
          <>
            <span className="mint-chip">Signed in · {shortAddress(user.walletAddress)}</span>
            <button type="button" onClick={() => void logout()} disabled={busy} className="pill-button-secondary">
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : wallet ? (
          <>
            <span className="rounded-full bg-[#f4f4f5] px-3 py-1.5 font-mono text-xs text-[#6f6f74]">
              {shortAddress(wallet.walletAddress)}
            </span>
            <button type="button" onClick={() => void signIn()} disabled={busy} className="pill-button">
              {busy ? "Waiting for wallet…" : "Sign in"}
            </button>
          </>
        ) : (
          <button type="button" onClick={() => void connect()} disabled={busy} className="pill-button">
            {busy ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>
      {error ? (
        <div role="alert" className="max-w-sm rounded-2xl bg-[#f8ecec] px-3 py-2 text-xs leading-5 text-[#7a2626]">
          {error}
          <button type="button" onClick={clearError} className="ml-2 font-semibold underline underline-offset-2">
            Dismiss
          </button>
        </div>
      ) : null}
      <p className="text-[10px] text-[#9a9aa0]">
        polkadot.js · Talisman · SubWallet
      </p>
    </div>
  );
}
