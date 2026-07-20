import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: 'localhost' },
    ],
  },
  webpack: (config) => {
    config.resolve.alias['react-router-dom'] = path.resolve(__dirname, './src/utils/routerShim.js');
    return config;
  },
  turbopack: {
    resolveAlias: {
      'react-router-dom': './src/utils/routerShim.js',
    },
  },
  async rewrites() {
    const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.codeplusacademy.in/api';
    const apiHost = apiBase.endsWith('/api') ? apiBase.slice(0, -4) : apiBase;
    return [
      {
        source: '/api/auth/:path*',
        destination: `${apiHost}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
