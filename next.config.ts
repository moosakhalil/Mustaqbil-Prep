import type { NextConfig } from "next";
import { withSerwist } from "@serwist/turbopack";

// Headers every page and reply carries
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()" },
];

const nextConfig: NextConfig = {
  // A second build folder lets the browser tests build and run while `pnpm dev` is using `.next`
  distDir: process.env.NEXT_DIST_DIR || ".next",
  poweredByHeader: false,
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Everything under /api is private to the signed-in person
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "private, no-store" }] },
    ];
  },
};

export default withSerwist(nextConfig);
