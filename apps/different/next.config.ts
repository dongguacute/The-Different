import path from "path";
import type { NextConfig } from "next";

const repoRoot = path.join(__dirname, "../..");

const nextConfig: NextConfig = {
  transpilePackages: ["@the-different/core"],
  output: "export",
  images: {
    unoptimized: true,
  },
  turbopack: {
    root: repoRoot,
  },
};

export default nextConfig;
