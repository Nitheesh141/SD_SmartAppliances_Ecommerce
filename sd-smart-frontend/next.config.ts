import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 95],
    dangerouslyAllowLocalIP: true,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5001",
      },
      {
        protocol: "http",
        hostname: "localhost",
        port: "5000",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
      {
        protocol: "https",
        hostname: "sdsmart.in",
      },
      {
        protocol: "https",
        hostname: "*.sdsmart.in",
      },
    ],
    localPatterns: [
      {
        pathname: "/**",
      },
    ],
  },
  turbopack: {
    root: path.resolve(__dirname, ".."),
  },
  async rewrites() {
    return [
      {
        source: "/categories/:category",
        destination: "/shop?category=:category",
      },
      {
        source: "/products/:id",
        destination: "/product/:id",
      },
    ];
  },
};

export default nextConfig;


