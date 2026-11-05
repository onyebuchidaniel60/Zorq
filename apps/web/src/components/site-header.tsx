import Link from "next/link";

const publicLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-border bg-surface/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md text-lg font-semibold tracking-tight"
          >
            <span
              aria-hidden="true"
              className="grid size-8 place-items-center rounded-md bg-accent text-sm font-bold text-white"
            >
              Z
            </span>
            Zorq
          </Link>
          <span className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-amber-800">
            Portaldot testnet
          </span>
        </div>

        <nav aria-label="Public navigation" className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {publicLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="rounded-sm text-slate-600 transition-colors hover:text-accent-strong"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/app"
            className="rounded-md bg-foreground px-3.5 py-2 font-semibold text-white transition-colors hover:bg-slate-700"
          >
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
