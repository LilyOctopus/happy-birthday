import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
        pathname: "/storage/**",
      },
    ],
  },
  experimental: {
    serverActions: {
      // Allow multi-photo uploads (client compresses each image before sending).
      bodySizeLimit: "4.5mb",
    },
  },
};

export default nextConfig;
