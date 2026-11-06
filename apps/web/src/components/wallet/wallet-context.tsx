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
  sessionReady: boolean;
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

export function WalletProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: SessionUser | null;
}) {
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [user, setUser] = useState<SessionUser | null>(initialUser);
  const [sessionReady, setSessionReady] = useState(Boolean(initialUser));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadSession() {
      for (let attempt = 0; attempt < 2; attempt += 1) {
        try {
          const response = await fetch("/api/auth/me", { cache: "no-store" });
          if (response.ok) {
            const body = (await response.json()) as { user?: SessionUser };
            if (!cancelled && body?.user?.walletAddress) {
              setUser(body.user);
            }
            break;
          }
          if (response.status === 401 || attempt === 1) {
            break;
          }
        } catch {
          if (attempt === 1) {
            break;
          }
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
      if (!cancelled) {
        setSessionReady(true);
      }
    }

    void loadSession();

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
        message?: unknown;
      };
      if (typeof challenge?.message !== "string" || !challenge.message.trim()) {
        setError("The sign-in challenge was empty. Retry once.");
        return;
      }

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

      const verified = (await verifyResponse.json()) as { user?: SessionUser };
      if (!verified?.user?.walletAddress) {
        setError("The sign-in response was incomplete. Request a new challenge.");
        return;
      }
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
      sessionReady,
      busy,
      error,
      connect,
      signIn,
      logout,
      clearError: () => setError(null),
    }),
    [wallet, user, sessionReady, busy, error, connect, signIn, logout],
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
