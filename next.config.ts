import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The /api/generate route reads the icon SVGs off disk to composite puzzle
  // thumbnails server-side. public/ isn't in the serverless bundle by default,
  // so trace these in explicitly or the reads 404 in production.
  outputFileTracingIncludes: {
    "/api/generate": ["./public/icons/**"],
  },
};

export default nextConfig;
