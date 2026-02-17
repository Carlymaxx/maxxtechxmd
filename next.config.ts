import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ['jimp', 'sharp', '@whiskeysockets/baileys'],
  devIndicators: false,
  allowedDevOrigins: ['48b54ea0-147e-4cfe-a023-7a63909cf273-00-wy60f8gy1tyz.spock.replit.dev'],
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cache-Control', value: 'no-store, no-cache, must-revalidate' },
        ],
      },
    ];
  },
};

export default nextConfig;
