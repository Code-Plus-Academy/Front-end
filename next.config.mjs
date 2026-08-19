import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
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
  allowedDevOrigins: [
    'localhost:3000',
    '127.0.0.1:3000',
    '10.189.190.45:3000',
    '*.codeplusacademy.in',
  ],
  async headers() {
    return [
      {
        source: '/_next/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS' },
        ],
      },
      {
        // Prevent CDN/browser from serving stale HTML pointing to old static chunks across deployments
        source: '/((?!_next/static|_next/image|favicon.ico).*)',
        headers: [
          { key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' },
          { key: 'Pragma', value: 'no-cache' },
          { key: 'Expires', value: '0' },
        ],
      },
    ];
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
  async redirects() {
    return [
      {
        source: '/articel/:path*',
        destination: '/articles/:path*',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
