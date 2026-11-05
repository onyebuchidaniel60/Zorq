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
      <body className="bg-slate-50 p-8 font-sans text-slate-900">
        <main className="mx-auto max-w-2xl">
          <h1 className="text-2xl font-semibold">Zorq could not load</h1>
          <p className="mt-3 text-sm leading-6 text-slate-600">
            A global rendering error occurred. No wallet action was performed.
          </p>
          {error.digest ? (
            <p className="mt-3 font-mono text-xs text-slate-500">
              Reference: {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            className="mt-6 rounded-md bg-slate-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
