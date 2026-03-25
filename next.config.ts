import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
