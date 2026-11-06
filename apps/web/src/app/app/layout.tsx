import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PrototypeNotice } from "@/components/prototype-notice";
import { WalletPanel } from "@/components/wallet/wallet-panel";
import { WalletProvider } from "@/components/wallet/wallet-context";
import { Icon } from "@/components/ui-icon";
import { getSessionFromCookies } from "@/server/auth/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
  const session = await getSessionFromCookies();
  const initialUser = session
    ? {
        walletAddress: session.walletAddress,
        ss58Address: session.ss58Address,
        displayName: null,
      }
    : null;

  return (
    <WalletProvider initialUser={initialUser}>
      <div className="app-stage">
        <div className="app-frame">
          <aside className="app-rail">
            <Link
              href="/"
              aria-label="Zorq home"
              className="grid size-9 place-items-center rounded-[10px] bg-[#d9ff63] text-[13px] font-extrabold tracking-[-0.05em] text-[#11140a]"
            >
              Z
            </Link>

            <AppNav />

            <div className="app-rail-bottom">
              <Link
                href="/docs"
                title="Documentation"
                aria-label="Documentation"
                className="app-rail-link"
              >
                <Icon name="link" className="size-[18px]" />
              </Link>
              <div className="app-rail-meta">
                <span className="status-dot" aria-hidden="true" />
                <span>testnet</span>
              </div>
            </div>
          </aside>

          <div className="app-main">
            <header className="app-topbar">
              <div className="app-topbar-title">
                <span className="hidden size-8 place-items-center rounded-[9px] bg-[#d9ff63] text-[11px] font-extrabold text-[#11140a] sm:grid lg:hidden">
                  Z
                </span>
                <div>
                  <h2>Dashboard</h2>
                  <p>Job-scoped DataLicenses · polkadot.js / Talisman / SubWallet</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-end gap-2">
                <span className="hidden items-center gap-1.5 rounded-[9px] border border-white/10 bg-white/[0.03] px-2.5 py-1.5 text-[10px] font-semibold text-[#c9cec0] sm:inline-flex">
                  <Icon name="clock" className="size-3.5 text-[#727969]" />
                  {today}
                </span>
                <span className="z-chip z-chip-lime">Testnet</span>
                <WalletPanel />
              </div>
            </header>

            <AppNav variant="mobile" />

            <main className="app-content">
              <PrototypeNotice />
              {children}
            </main>
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}
