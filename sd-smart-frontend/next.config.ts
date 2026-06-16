import type { NextConfig } from "next";
import path from "path";

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
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
};

export default nextConfig;


