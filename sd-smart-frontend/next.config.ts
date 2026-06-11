import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  basePath: "/sd-smart-ecommerce",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
};

export default nextConfig;

