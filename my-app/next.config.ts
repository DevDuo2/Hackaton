import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Mock ma'lumotlardagi rasmlar Unsplash'dan keladi; next/image uchun host
  // oldindan ruxsat etilishi shart, aks holda rasm 400 bilan qaytadi.
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  experimental: {
    agentFeedback: true,
    cpus: 4,
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
