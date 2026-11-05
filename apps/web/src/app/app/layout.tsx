import Link from "next/link";
import { AppNav } from "@/components/app-nav";
import { PrototypeNotice } from "@/components/prototype-notice";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
        <aside className="lg:border-r lg:border-border lg:pr-5">
          <div className="rounded-xl border border-border bg-surface p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
              Session
            </p>
            <p className="mt-2 text-sm font-medium">Not signed in</p>
            <p className="mt-1 text-xs leading-5 text-muted">
              Wallet authentication arrives in Phase 2.
            </p>
            <button
              type="button"
              disabled
              className="mt-3 w-full cursor-not-allowed rounded-md border border-slate-300 bg-slate-100 px-3 py-2 text-sm font-semibold text-slate-500"
            >
              Connect wallet · planned
            </button>
          </div>
          <div className="mt-4">
            <AppNav />
          </div>
          <div className="mt-4 hidden rounded-lg bg-slate-100 p-3 text-xs leading-5 text-muted lg:block">
            <p className="font-semibold text-slate-700">Read-only preview</p>
            <p className="mt-1">
              No wallet session, transaction or training run is active on this
              page.
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
  );
}
