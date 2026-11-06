"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/ui-icon";

const appLinks: Array<{ href: string; label: string; icon: IconName }> = [
  { href: "/app", label: "Overview", icon: "grid" },
  { href: "/app/assets", label: "Assets", icon: "database" },
  { href: "/app/jobs", label: "Jobs", icon: "briefcase" },
  { href: "/app/licenses", label: "Licenses", icon: "license" },
];

export function AppNav({ variant = "rail" }: { variant?: "rail" | "mobile" }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="App navigation"
      className={variant === "rail" ? "app-rail-nav" : "app-mobile-nav"}
    >
      {appLinks.map((link) => {
        const active =
          link.href === "/app"
            ? pathname === link.href
            : pathname === link.href || pathname.startsWith(`${link.href}/`);

        if (variant === "mobile") {
          return (
            <Link
              key={link.href}
              href={link.href}
              aria-current={active ? "page" : undefined}
              className="app-mobile-link"
            >
              <Icon name={link.icon} className="size-4" />
              {link.label}
            </Link>
          );
        }

        return (
          <Link
            key={link.href}
            href={link.href}
            title={link.label}
            aria-label={link.label}
            aria-current={active ? "page" : undefined}
            className="app-rail-link"
          >
            <Icon name={link.icon} className="size-[18px]" />
          </Link>
        );
      })}
    </nav>
  );
}
