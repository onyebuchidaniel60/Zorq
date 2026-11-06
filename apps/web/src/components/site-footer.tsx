import Link from "next/link";
import { Icon } from "@/components/ui-icon";

const githubUrl = "https://github.com/onyebuchidaniel60/Zorq";

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div>
          <div className="flex items-center gap-3">
            <span aria-hidden="true" className="brand-mark">
              Z
            </span>
            <p className="text-sm font-semibold tracking-[-0.03em] text-white">Zorq</p>
          </div>
          <p className="mt-4 max-w-sm text-sm leading-6 text-[#c9cec0]">
            Programmable authorization for federated machine learning. A testnet
            prototype using synthetic data only.
          </p>
          <p className="mt-3 text-xs leading-5 text-[#727969]">
            Not for real personal, medical, financial or customer data.
          </p>
        </div>
        <nav aria-label="Footer product links" className="text-sm">
          <p className="footer-heading">Product</p>
          <ul className="mt-4 space-y-2.5">
            <li><Link className="footer-link" href="/app">App overview</Link></li>
            <li><Link className="footer-link" href="/docs">Documentation</Link></li>
            <li><Link className="footer-link" href="/docs#limitations">Scope and limitations</Link></li>
          </ul>
        </nav>
        <nav aria-label="Footer project links" className="text-sm">
          <p className="footer-heading">Project</p>
          <ul className="mt-4 space-y-2.5">
            <li>
              <a className="footer-link inline-flex items-center gap-1.5" href={githubUrl} rel="noreferrer" target="_blank">
                GitHub repository
                <Icon name="external" className="size-3" />
              </a>
            </li>
            <li><Link className="footer-link" href="/support">Support</Link></li>
            <li><Link className="footer-link" href="/privacy">Privacy</Link></li>
            <li><Link className="footer-link" href="/terms">Experimental terms</Link></li>
          </ul>
        </nav>
      </div>
      <div className="mt-3 flex flex-col gap-2 px-2 text-[11px] text-[#5f6755] sm:flex-row sm:items-center sm:justify-between">
        <p>© 2026 Zorq. Testnet demonstration.</p>
        <p>Chain ID 420420777 · Synthetic data only · No native FL/ZKP claim</p>
      </div>
    </footer>
  );
}
