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
    <div className="public-page max-w-3xl">
      <div className="landing-card">
        <p className="z-eyebrow text-[#ff9b8c]">Error</p>
        <h1 className="z-title-lg mt-3">Something went wrong</h1>
        <p className="z-copy mt-3">
          The page could not be rendered. No transaction or training action was
          submitted. You can retry, or return to a stable page.
        </p>
        {error.digest ? (
          <p className="mt-3 font-mono text-xs text-[#727969]">Reference: {error.digest}</p>
        ) : null}
        <div className="mt-6 flex flex-wrap gap-3">
          <button type="button" onClick={reset} className="z-button">
            Try again
          </button>
          <Link className="z-button-secondary" href="/">
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}
