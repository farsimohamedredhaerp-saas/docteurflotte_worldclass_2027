import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: ['@docteurflotte/contracts'],
  async redirects() {
    return [
      {
        source: '/maps',
        destination: '/live-cockpit',
        permanent: false,
      },
      {
        source: '/map',
        destination: '/live-cockpit',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
