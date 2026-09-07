import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "i.pravatar.cc" },
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "api.dicebear.com" },
    ],
  },
  experimental: {
    // Autorise les Server Actions à recevoir des fichiers volumineux (uploads).
    serverActions: {
      bodySizeLimit: "12mb",
    },
  },
};

export default nextConfig;
