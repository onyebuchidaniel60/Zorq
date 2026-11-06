import Link from "next/link";
import { Icon } from "@/components/ui-icon";

const publicLinks = [
  { href: "/docs", label: "Documentation" },
  { href: "/privacy", label: "Privacy" },
  { href: "/terms", label: "Terms" },
  { href: "/support", label: "Support" },
];

export function SiteHeader() {
  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="flex items-center gap-3" aria-label="Zorq home">
          <span aria-hidden="true" className="brand-mark">
            Z
          </span>
          <span className="brand-word">Zorq</span>
          <span className="ml-1 hidden items-center gap-1.5 rounded-full bg-[#0a0b09] px-2.5 py-1 text-[10px] font-semibold text-[#d9ff63] sm:inline-flex">
            <span className="size-1 rounded-full bg-[#d9ff63]" aria-hidden="true" />
            Portaldot testnet
          </span>
        </Link>

        <nav aria-label="Public navigation" className="flex items-center gap-5">
          <div className="hidden items-center gap-5 md:flex">
            {publicLinks.map((link) => (
              <Link key={link.href} href={link.href} className="public-nav-link">
                {link.label}
              </Link>
            ))}
          </div>
          <Link
            href="/app"
            className="inline-flex items-center gap-2 rounded-[10px] bg-[#0a0b09] px-3.5 py-2.5 text-[12px] font-semibold text-[#f3f5ed] transition-colors hover:text-[#d9ff63]"
          >
            Open app
            <Icon name="arrow-up-right" className="size-3.5" />
          </Link>
        </nav>
      </div>
    </header>
  );
}
