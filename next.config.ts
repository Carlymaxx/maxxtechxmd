import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Empty turbopack config to silence the warning
  turbopack: {},
  
  // Server-side external packages
  serverExternalPackages: ['jimp', 'sharp', '@whiskeysockets/baileys'],
};

export default nextConfig;
