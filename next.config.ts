import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite acceder al dev server desde orígenes adicionales (ej: IP de la LAN).
  // Ver docs: node_modules/next/dist/docs/.../allowedDevOrigins.md
  allowedDevOrigins: ["192.168.0.171"],
  output: "standalone",
  reactCompiler: true,
  serverExternalPackages: ["pdf-parse", "pdfjs-dist"],
};

export default nextConfig;
