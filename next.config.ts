import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow the dev server and production server to accept requests from any
  // hostname/IP — required so the display is accessible directly on the LAN
  // without configuring allowed origins every time the machine's IP changes.
  allowedDevOrigins: ["*", "192.168.18.16"],
  
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:8080/api/:path*',
      },
      {
        source: '/ws',
        destination: 'http://localhost:8080/ws',
      },
    ];
  },
};

export default nextConfig;
