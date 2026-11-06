"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const appLinks = [
  { href: "/app", label: "Overview", icon: "grid" },
  { href: "/app/assets", label: "Assets", icon: "database" },
  { href: "/app/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/app/licenses", label: "Licenses", icon: "license" },
];

function Icon({ name }: { name: string }) {
  const common = {
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "database") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" {...common}>
        <ellipse cx="12" cy="5" rx="7" ry="3" />
        <path d="M5 5v7c0 1.7 3.1 3 7 3s7-1.3 7-3V5" />
        <path d="M5 12v7c0 1.7 3.1 3 7 3s7-1.3 7-3v-7" />
      </svg>
    );
  }
  if (name === "briefcase") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" {...common}>
        <rect x="3" y="7" width="18" height="13" rx="2" />
        <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2M3 12h18" />
      </svg>
    );
  }
  if (name === "license") {
    return (
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" {...common}>
        <path d="M7 3h7l4 4v14H7z" />
        <path d="M14 3v5h5M10 13h5M10 17h5" />
      </svg>
    );
  }
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" {...common}>
      <rect x="3" y="3" width="7" height="7" rx="1.5" />
      <rect x="14" y="3" width="7" height="7" rx="1.5" />
      <rect x="3" y="14" width="7" height="7" rx="1.5" />
      <rect x="14" y="14" width="7" height="7" rx="1.5" />
    </svg>
  );
}

export function AppNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="App navigation" className="flex flex-wrap gap-1 lg:flex-col lg:items-center">
      {appLinks.map((link) => {
        const active = link.href === "/app"
          ? pathname === link.href
          : pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            aria-label={link.label}
            aria-current={active ? "page" : undefined}
            className="icon-rail-link"
          >
            <Icon name={link.icon} />
          </Link>
        );
      })}
    </nav>
  );
}
