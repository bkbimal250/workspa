

/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,

  poweredByHeader: false,

  images: {
    // ONLY list real production domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'workspa.in',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'www.workspa.in',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: 'spajob.api.spajob.spajobs.co.in',
        pathname: '/uploads/**',
      },

    ],

    formats: ['image/webp', 'image/avif'],
  },

  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
    };

    config.resolve.modules = [
      ...(config.resolve.modules || []),
      path.resolve(__dirname, 'lib'),
      path.resolve(__dirname),
    ];

    return config;
  },

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'origin-when-cross-origin' },
        ],
      },
      {
        source: '/uploads/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
