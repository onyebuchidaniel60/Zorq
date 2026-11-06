import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PrototypeNotice } from "@/components/prototype-notice";
import { WalletPanel } from "@/components/wallet/wallet-panel";
import { WalletProvider } from "@/components/wallet/wallet-context";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <WalletProvider>
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="grid gap-5 lg:grid-cols-[72px_1fr]">
          <aside className="hidden lg:flex lg:flex-col lg:items-center lg:justify-between lg:rounded-full lg:bg-white lg:py-5">
            <Link
              href="/"
              aria-label="Zorq home"
              className="grid size-9 place-items-center rounded-full bg-black text-sm font-bold text-white"
            >
              Z
            </Link>
            <AppNav />
            <span className="size-2 rounded-full bg-[#2d6a4a]" aria-hidden="true" />
          </aside>

          <div className="min-w-0 space-y-5">
            <div className="flex flex-col gap-4 rounded-[1.75rem] bg-white px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3">
                <div className="lg:hidden">
                  <AppNav />
                </div>
                <div>
                  <p className="text-sm font-semibold tracking-tight">Zorq workspace</p>
                  <p className="text-xs text-[#8a8a8f]">Job-scoped DataLicenses · Portaldot testnet</p>
                </div>
              </div>
              <WalletPanel />
            </div>

            <PrototypeNotice />
            {children}
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
