import type { Metadata } from "next";
import "./globals.css";
import { SiteFooter } from "@/components/site-footer";
import { SiteHeader } from "@/components/site-header";
import { SiteChrome } from "@/components/site-chrome";

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: {
    default: "Zorq — DataLicenses for federated learning",
    template: "%s · Zorq",
  },
  description:
    "Zorq is programmable authorization for federated machine learning. Issue job-specific, time-bounded, non-transferable DataLicenses on the Portaldot V3 EVM testnet.",
  applicationName: "Zorq",
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: "Zorq — DataLicenses for federated learning",
    description:
      "Job-specific, time-bounded, non-transferable DataLicenses checked at every training-round boundary. Enterprise authorization infrastructure on the Portaldot V3 testnet.",
    type: "website",
    url: appUrl,
    siteName: "Zorq",
  },
  twitter: {
    card: "summary",
    title: "Zorq — DataLicenses for federated learning",
    description:
      "Execution-scoped authorization for federated learning on the Portaldot V3 EVM testnet.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <a className="skip-link" href="#main-content">
          Skip to main content
        </a>
        <SiteChrome header={<SiteHeader />} footer={<SiteFooter />}>
          <main id="main-content" className="flex-1">
            {children}
          </main>
        </SiteChrome>
      </body>
    </html>
  );
}
