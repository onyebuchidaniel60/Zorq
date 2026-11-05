import Link from "next/link";

const githubUrl = "https://github.com/onyebuchidaniel60/Zorq";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight">Zorq</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            Programmable authorization for federated machine learning. A
            testnet prototype using synthetic data only.
          </p>
          <p className="mt-3 text-xs text-muted">
            Not for real personal, medical, financial or customer data.
          </p>
        </div>
        <nav aria-label="Footer product links" className="text-sm">
          <p className="font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li>
              <Link className="hover:text-accent-strong" href="/app">
                App overview
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent-strong" href="/docs">
                Documentation
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent-strong" href="/docs#limitations">
                Scope and limitations
              </Link>
            </li>
          </ul>
        </nav>
        <nav aria-label="Footer project links" className="text-sm">
          <p className="font-semibold">Project</p>
          <ul className="mt-3 space-y-2 text-muted">
            <li>
              <a
                className="hover:text-accent-strong"
                href={githubUrl}
                rel="noreferrer"
                target="_blank"
              >
                GitHub repository
              </a>
            </li>
            <li>
              <Link className="hover:text-accent-strong" href="/support">
                Support
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent-strong" href="/privacy">
                Privacy
              </Link>
            </li>
            <li>
              <Link className="hover:text-accent-strong" href="/terms">
                Experimental terms
              </Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-border">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-4 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Zorq. Testnet demonstration.</p>
          <p>
            Chain ID 420420777 · Synthetic data only · Features ship in phases
          </p>
        </div>
      </div>
    </footer>
  );
}
