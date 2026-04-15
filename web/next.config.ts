import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Avoid dev/HMR issues when opening via 127.0.0.1 vs localhost or LAN IP
  // Add your LAN hostname/IP if you open the dev URL from another device on the network
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
