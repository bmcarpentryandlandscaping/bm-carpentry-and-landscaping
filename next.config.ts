import type { NextConfig } from "next";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Makes the wrangler.jsonc bindings (KV, D1) available under `next dev`.
initOpenNextCloudflareForDev();

const securityHeaders = [
  // The site is HTTPS-only behind Cloudflare. Two years, subdomains included.
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: dirname(fileURLToPath(import.meta.url)),
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
};

export default nextConfig;
