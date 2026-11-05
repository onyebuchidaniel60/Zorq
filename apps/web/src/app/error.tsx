"use client";

import Link from "next/link";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-20 sm:px-6">
      <p className="font-mono text-sm font-semibold text-red-700">Error</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-3 text-sm leading-6 text-muted">
        The page could not be rendered. No transaction or training action was
        submitted. You can retry, or return to a stable page.
      </p>
      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted">Reference: {error.digest}</p>
      ) : null}
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-md bg-foreground px-4 py-2 text-sm font-semibold text-white"
        >
          Try again
        </button>
        <Link
          className="rounded-md border border-border bg-surface px-4 py-2 text-sm font-semibold"
          href="/"
        >
          Return home
        </Link>
      </div>
    </div>
  );
}
