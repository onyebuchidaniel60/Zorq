import type { NextConfig } from "next";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const currentDir = path.dirname(fileURLToPath(import.meta.url));

// Local development uses the repository-level .env.local. Hosted environments
// receive the same names from Vercel/Render project settings.
loadEnv({ path: path.join(currentDir, "../../.env.local"), quiet: true });

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(currentDir, "../.."),
  poweredByHeader: false,
  reactStrictMode: true,
  devIndicators: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  transpilePackages: ["@zorq/db"],
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
