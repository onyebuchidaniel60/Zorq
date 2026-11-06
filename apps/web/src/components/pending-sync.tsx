"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

type PendingItem = {
  id: string;
  txHash: string;
  blockHash: string;
};

export function PendingSync({
  kind,
  items,
}: {
  kind: "assets" | "licenses" | "jobs";
  items: PendingItem[];
}) {
  const router = useRouter();
  const working = useRef(false);

  useEffect(() => {
    if (items.length === 0) {
      return;
    }
    let cancelled = false;

    async function sync() {
      if (working.current) return;
      working.current = true;
      let confirmed = false;
      try {
        for (const item of items) {
          const response = await fetch(`/api/${kind}/${item.id}/confirm`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              txHash: item.txHash,
              blockHash: item.blockHash,
            }),
            cache: "no-store",
          });
          if (response.ok) {
            confirmed = true;
          }
        }
      } catch {
        // Keep the pending badge and retry on the next interval.
      } finally {
        working.current = false;
      }
      if (confirmed && !cancelled) {
        router.refresh();
      }
    }

    void sync();
    const timer = setInterval(() => void sync(), 4_000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [items, kind, router]);

  return null;
}
