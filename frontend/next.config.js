/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: '/api/analyze/:path*',
        destination: `${process.env.BACKEND_URL || 'http://localhost:8000'}/analyze/:path*`,
      },
    ]
  },
}

module.exports = nextConfig
