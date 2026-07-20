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
    let apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || 'https://api.codeplusacademy.in/api';
    apiBase = apiBase.replace(/\/$/, '');
    
    let origin = 'https://api.codeplusacademy.in';
    try {
      if (apiBase.startsWith('http')) {
        const url = new URL(apiBase);
        origin = url.origin;
      }
    } catch (e) {
      console.error('Failed to parse NEXT_PUBLIC_API_BASE_URL:', e);
    }

    return [
      {
        source: '/api/auth/:path*',
        destination: `${origin}/api/auth/:path*`,
      },
    ];
  },
};

export default nextConfig;
