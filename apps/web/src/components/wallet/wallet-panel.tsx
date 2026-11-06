"use client";

import { Icon } from "@/components/ui-icon";
import { useWallet } from "./wallet-context";

function shortAddress(address: string): string {
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function initials(address: string): string {
  return address.replace(/^0x/, "").slice(0, 2);
}

export function WalletPanel() {
  const { wallet, user, sessionReady, busy, error, connect, signIn, logout, clearError } =
    useWallet();

  return (
    <div className="wallet-panel">
      <div className="wallet-row">
        {!sessionReady ? (
          <span className="wallet-identity">
            <span className="wallet-avatar wallet-avatar-muted" aria-hidden="true">
              …
            </span>
            <span className="wallet-address">Checking session…</span>
          </span>
        ) : user ? (
          <>
            <span className="wallet-identity" title="Signed in">
              <span className="wallet-avatar" aria-hidden="true">
                {initials(user.walletAddress)}
              </span>
              <span className="wallet-status" aria-hidden="true" />
              <span className="wallet-address">{shortAddress(user.walletAddress)}</span>
            </span>
            <button
              type="button"
              onClick={() => void logout()}
              disabled={busy}
              className="z-button-ghost"
            >
              <Icon name="logout" className="size-3.5" />
              {busy ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : wallet ? (
          <>
            <span className="wallet-identity">
              <span className="wallet-avatar" aria-hidden="true">
                {initials(wallet.walletAddress)}
              </span>
              <span className="wallet-address">{shortAddress(wallet.walletAddress)}</span>
            </span>
            <button
              type="button"
              onClick={() => void signIn()}
              disabled={busy}
              className="z-button"
            >
              <Icon name="wallet" className="size-3.5" />
              {busy ? "Waiting for wallet…" : "Sign in"}
            </button>
          </>
        ) : (
          <button
            type="button"
            onClick={() => void connect()}
            disabled={busy}
            className="z-button"
          >
            <Icon name="wallet" className="size-3.5" />
            {busy ? "Connecting…" : "Connect wallet"}
          </button>
        )}
      </div>

      {error ? (
        <div role="alert" className="z-alert z-alert-danger z-alert-compact max-w-sm">
          <span>{error}</span>
          <button
            type="button"
            onClick={clearError}
            className="ml-2 font-semibold underline underline-offset-2"
          >
            Dismiss
          </button>
        </div>
      ) : null}
    </div>
  );
}
