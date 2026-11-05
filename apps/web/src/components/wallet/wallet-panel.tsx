"use client";

import { useWallet } from "./wallet-context";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

export function WalletPanel() {
  const { wallet, user, busy, error, connect, signIn, logout, clearError } = useWallet();

  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
        Session
      </p>

      {user ? (
        <>
          <p className="mt-2 text-sm font-medium">Signed in</p>
          <p className="mt-1 font-mono text-xs text-slate-600">
            {shortAddress(user.walletAddress)}
          </p>
          <p className="mt-1 text-xs leading-5 text-muted">
            Session expires after eight hours. Signing in does not send a
            transaction.
          </p>
          <button
            type="button"
            onClick={() => void logout()}
            disabled={busy}
            className="mt-3 w-full rounded-md border border-border px-3 py-2 text-sm font-semibold transition-colors hover:border-accent disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "Signing out…" : "Sign out"}
          </button>
        </>
      ) : (
        <>
          <p className="mt-2 text-sm font-medium">
            {wallet ? "Wallet connected" : "Not signed in"}
          </p>
          {wallet ? (
            <p className="mt-1 font-mono text-xs text-slate-600">
              {shortAddress(wallet.walletAddress)}
            </p>
          ) : (
            <p className="mt-1 text-xs leading-5 text-muted">
              Connect a Substrate wallet to prove control of your account.
            </p>
          )}

          {wallet ? (
            <button
              type="button"
              onClick={() => void signIn()}
              disabled={busy}
              className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Waiting for wallet…" : "Sign in with wallet"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void connect()}
              disabled={busy}
              className="mt-3 w-full rounded-md bg-accent px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            >
              {busy ? "Connecting…" : "Connect wallet"}
            </button>
          )}
        </>
      )}

      {error ? (
        <div
          role="alert"
          className="mt-3 rounded-md border border-red-200 bg-red-50 p-3 text-xs leading-5 text-red-800"
        >
          <p>{error}</p>
          <button
            type="button"
            onClick={clearError}
            className="mt-2 font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}

      <p className="mt-3 text-[11px] leading-4 text-muted">
        Supported: polkadot.js extension, Talisman or SubWallet. The H160 address
        is derived from your SS58 account by the chain runtime.
      </p>
    </div>
  );
}
