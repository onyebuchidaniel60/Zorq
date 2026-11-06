import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <div className="public-page max-w-3xl">
      <div className="landing-card">
        <p className="z-eyebrow">404</p>
        <h1 className="z-title-lg mt-3">Page not found</h1>
        <p className="z-copy mt-3">
          The requested route or resource does not exist. If you followed a link to
          an asset, job, license or run, it may not exist or may not be visible to
          the current wallet.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link className="z-button" href="/">
            Return home
          </Link>
          <Link className="z-button-secondary" href="/app">
            Open the app
          </Link>
          <Link className="z-button-secondary" href="/docs">
            Read documentation
          </Link>
        </div>
      </div>
    </div>
  );
}
