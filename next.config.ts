import withPWA from "next-pwa";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
};

// next-pwa v5 types expect Next.js 13 — cast through unknown to bridge the version gap.
export default withPWA({
  dest: "public",
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === "development",
})(nextConfig as unknown as Parameters<ReturnType<typeof withPWA>>[0]);
