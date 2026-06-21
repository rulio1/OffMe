/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: process.env.DOCKER_BUILD === 'true' ? 'standalone' : undefined,
  experimental: {
    optimizePackageImports: ['lucide-react', 'date-fns'],
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200],
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost', port: '9000', pathname: '/offme-media/**' },
      { protocol: 'https', hostname: '**.amazonaws.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com', pathname: '/**' },
      { protocol: 'https', hostname: '**.r2.dev', pathname: '/**' },
      { protocol: 'https', hostname: 'i.ibb.co', pathname: '/**' },
      { protocol: 'https', hostname: '**.imgbb.com', pathname: '/**' },
    ],
  },
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL;
    if (!gateway) return [];

    // Auth fica nas Route Handlers locais (PostgreSQL).
    // Demais rotas podem ser proxy para o gateway Scala.
    return [
      {
        source: '/api/v1/timeline/:path*',
        destination: `${gateway}/api/v1/timeline/:path*`,
      },
      {
        source: '/api/v1/posts/:path*',
        destination: `${gateway}/api/v1/posts/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;