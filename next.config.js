/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow cross-origin images from the backend
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },

  // Proxy API calls to the Express backend in development
  async rewrites() {
    return process.env.NODE_ENV === 'development'
      ? [
          {
            source: '/api/:path*',
            destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000'}/api/:path*`,
          },
        ]
      : [];
  },
};

module.exports = nextConfig;
