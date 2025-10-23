/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  trailingSlash: true, // ✅ Change to true for better compatibility

  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'pg'],
  },

  images: {
    unoptimized: true, // ✅ ADD THIS for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
  },

  // ✅ REMOVE env object - Next.js automatically handles env variables
  // ✅ KEEP ESLint and TypeScript settings
  eslint: {
    ignoreDuringBuilds: true,
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ Choose ONE output option:

  // OPTION A: For static hosting (Recommended for now)
  output: 'export',

  // OR

  // OPTION B: For Node.js server
  // output: 'standalone',

  poweredByHeader: false,

  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          { key: 'Access-Control-Allow-Credentials', value: 'true' },
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,DELETE,PATCH,POST,PUT' },
          { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization' },
        ]
      }
    ]
  }
}

module.exports = nextConfig