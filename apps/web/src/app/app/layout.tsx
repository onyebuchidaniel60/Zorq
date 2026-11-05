import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PrototypeNotice } from "@/components/prototype-notice";
import { WalletPanel } from "@/components/wallet/wallet-panel";
import { WalletProvider } from "@/components/wallet/wallet-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="lg:border-r lg:border-border lg:pr-5">
            <WalletPanel />
            <div className="mt-4">
              <AppNav />
            </div>
            <div className="mt-4 hidden rounded-lg bg-slate-100 p-3 text-xs leading-5 text-muted lg:block">
              <p className="font-semibold text-slate-700">Phase 2 session</p>
              <p className="mt-1">
                Wallet sign-in is live. Asset, job and license actions are still
                disabled until Phase 3.
              </p>
              <Link className="mt-2 inline-block underline underline-offset-2" href="/docs">
                Read the limitations
              </Link>
            </div>
          </aside>
          <div className="min-w-0 space-y-6">
            <PrototypeNotice />
            {children}
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
