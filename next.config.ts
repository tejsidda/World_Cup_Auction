import type { NextConfig } from 'next';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: path.join(__dirname),
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'digitalhub.fifa.com',
      },
      {
        protocol: 'https',
        hostname: 'play.fifa.com',
      },
    ],
  },
};

export default nextConfig;
