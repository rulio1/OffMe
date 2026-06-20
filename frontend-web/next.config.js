/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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