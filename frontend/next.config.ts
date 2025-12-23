import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://91.98.157.75:8010/api/:path*',
      },
      {
        source: '/test-report',
        destination: 'http://host.docker.internal:8888/',
      },
      {
        source: '/test-report.pdf',
        destination: 'http://host.docker.internal:8888/',
      },
    ];
  },
};

export default nextConfig;
