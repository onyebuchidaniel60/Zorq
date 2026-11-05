"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  connectSubstrateWallet,
  signSiweMessage,
  type ConnectedWallet,
} from "@/lib/wallet-client";

export type SessionUser = {
  walletAddress: string;
  ss58Address: string;
  displayName: string | null;
};

type WalletContextValue = {
  wallet: ConnectedWallet | null;
  user: SessionUser | null;
  busy: boolean;
  error: string | null;
  connect: () => Promise<void>;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
};

const WalletContext = createContext<WalletContextValue | null>(null);

type ErrorEnvelope = {
  error?: { code?: string; message?: string };
};

async function readError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as ErrorEnvelope;
    return body.error?.message ?? `Request failed (${response.status}).`;
  } catch {
    return `Request failed (${response.status}).`;
  }
}

export function WalletProvider({ children }: { children: ReactNode }) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [user, setUser] = useState<SessionUser | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/me", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) {
          return;
        }
        const body = (await response.json()) as { user: SessionUser };
        if (!cancelled) {
          setUser(body.user);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, []);

  const connect = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      const connected = await connectSubstrateWallet();
      setWallet(connected);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "The wallet could not be connected.",
      );
    } finally {
      setBusy(false);
    }
  }, []);

  const signIn = useCallback(async () => {
    if (!wallet) {
      setError("Connect a wallet before signing in.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      const nonceResponse = await fetch("/api/auth/nonce", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.walletAddress,
          ss58Address: wallet.ss58Address,
        }),
      });

      if (!nonceResponse.ok) {
        setError(await readError(nonceResponse));
        return;
      }

      const challenge = (await nonceResponse.json()) as {
        message: string;
      };

      const signed = await signSiweMessage(wallet, challenge.message);

      const verifyResponse = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: challenge.message,
          signature: signed.signature,
          signatureType: signed.signatureType,
        }),
      });

      if (!verifyResponse.ok) {
        setError(await readError(verifyResponse));
        return;
      }

      const verified = (await verifyResponse.json()) as { user: SessionUser };
      setUser(verified.user);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Sign-in could not be completed.",
      );
    } finally {
      setBusy(false);
    }
  }, [wallet]);

  const logout = useCallback(async () => {
    setBusy(true);
    setError(null);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      setUser(null);
    } catch {
      setError("Sign-out could not be completed.");
    } finally {
      setBusy(false);
    }
  }, []);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      user,
      busy,
      error,
      connect,
      signIn,
      logout,
      clearError: () => setError(null),
    }),
    [wallet, user, busy, error, connect, signIn, logout],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWallet(): WalletContextValue {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used inside WalletProvider");
  }
  return context;
}
