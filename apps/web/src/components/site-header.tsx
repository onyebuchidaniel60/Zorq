import Link from "next/link";

const publicLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="border-b border-black/5 bg-[#eeeeef]/90 backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-6 px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3 rounded-full">
          <span
            aria-hidden="true"
            className="grid size-9 place-items-center rounded-full bg-black text-sm font-bold text-white"
          >
            Z
          </span>
          <span className="text-lg font-semibold tracking-tight">Zorq</span>
          <span className="mint-chip hidden sm:inline-flex">Portaldot testnet</span>
        </Link>

        <nav aria-label="Public navigation" className="flex items-center gap-5 text-sm">
          <div className="hidden items-center gap-5 md:flex">
            {publicLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[#6f6f74] transition-colors hover:text-black"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <Link href="/app" className="pill-button">
            Open app
          </Link>
        </nav>
      </div>
    </header>
  );
}
