import Link from "next/link";

const githubUrl = "https://github.com/onyebuchidaniel60/Zorq";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-black/5 bg-[#eeeeef]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <p className="text-sm font-semibold tracking-tight">Zorq</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#6f6f74]">
            Programmable authorization for federated machine learning. A
            testnet prototype using synthetic data only.
          </p>
          <p className="mt-3 text-xs text-[#8a8a8f]">
            Not for real personal, medical, financial or customer data.
          </p>
        </div>
        <nav aria-label="Footer product links" className="text-sm">
          <p className="font-semibold">Product</p>
          <ul className="mt-3 space-y-2 text-[#6f6f74]">
            <li><Link className="hover:text-black" href="/app">App overview</Link></li>
            <li><Link className="hover:text-black" href="/docs">Documentation</Link></li>
            <li><Link className="hover:text-black" href="/docs#limitations">Scope and limitations</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer project links" className="text-sm">
          <p className="font-semibold">Project</p>
          <ul className="mt-3 space-y-2 text-[#6f6f74]">
            <li><a className="hover:text-black" href={githubUrl} rel="noreferrer" target="_blank">GitHub repository</a></li>
            <li><Link className="hover:text-black" href="/support">Support</Link></li>
            <li><Link className="hover:text-black" href="/privacy">Privacy</Link></li>
            <li><Link className="hover:text-black" href="/terms">Experimental terms</Link></li>
          </ul>
        </nav>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-5 text-xs text-[#8a8a8f] sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>© 2026 Zorq. Testnet demonstration.</p>
          <p>Chain ID 420420777 · Synthetic data only · No native FL/ZKP claim</p>
        </div>
      </div>
    </footer>
  );
}
