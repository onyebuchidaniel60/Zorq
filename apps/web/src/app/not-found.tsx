import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <p className="font-mono text-sm font-semibold text-accent">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The requested route or resource does not exist. If you followed a link to
        an asset, job, license or run, it may not be implemented yet or may not be
        visible to the current wallet.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        <Link className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white" href="/">
          Return home
        </Link>
        <Link
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold"
          href="/app"
        >
          Open the app
        </Link>
        <Link
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold"
          href="/docs"
        >
          Read documentation
        </Link>
      </div>
    </div>
  );
}
