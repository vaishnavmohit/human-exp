import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    // Allow local images from public folder without optimization issues
    unoptimized: true,
  },
  // Ensure static files are served correctly
  output: 'standalone',
};

export default nextConfig;

