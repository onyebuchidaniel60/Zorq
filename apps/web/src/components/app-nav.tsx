"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appLinks = [
  { href: "/app", label: "Overview", exact: true },
  { href: "/app/assets", label: "Assets" },
  { href: "/app/jobs", label: "Jobs" },
  { href: "/app/licenses", label: "Licenses" },
];

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="App navigation" className="flex flex-wrap gap-1 lg:flex-col">
      {appLinks.map((link) => {
        const active = link.exact
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);

        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
              active
                ? "bg-teal-50 text-accent-strong"
                : "text-slate-600 hover:bg-slate-100 hover:text-foreground"
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
