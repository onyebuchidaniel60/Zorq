"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-[#efffd2] p-6 font-sans text-[#0a0b09]">
        <main className="mx-auto max-w-2xl rounded-[22px] bg-[#0a0b09] p-8 text-[#f3f5ed]">
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#ff9b8c]">
            Fatal error
          </p>
          <h1 className="mt-3 text-2xl font-semibold tracking-[-0.04em]">
            Zorq could not load
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#9aa08f]">
            A global rendering error occurred. No wallet action was performed.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-[#727969]">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-[10px] bg-[#d9ff63] px-4 py-2.5 text-sm font-semibold text-[#11140a]"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
