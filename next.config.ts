import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server through Tailscale IP
  allowedDevOrigins: ["http://100.68.66.76:3060", "http://10.1.10.134:3060"],
};

export default nextConfig;
