import type { NextConfig } from "next";

const isDesktopBuild = process.env.TYCHE_DESKTOP === "1";

const nextConfig: NextConfig = {
  output: isDesktopBuild ? "export" : "standalone",
  trailingSlash: isDesktopBuild,
  images: isDesktopBuild ? { unoptimized: true } : undefined,
};

export default nextConfig;
