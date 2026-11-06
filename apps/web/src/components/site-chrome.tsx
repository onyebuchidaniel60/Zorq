"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function SiteChrome({
  header,
  footer,
  children,
}: {
  header: ReactNode;
  footer: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const isApp = pathname?.startsWith("/app") ?? false;

  return (
    <>
      {isApp ? null : header}
      {children}
      {isApp ? null : footer}
    </>
  );
}
