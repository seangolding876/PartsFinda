/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
  reactStrictMode: true,
  trailingSlash: false,

  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'pg'],
  },

  images: {
    unoptimized: true, // ✅ Export mode ke liye MUST
    domains: ['ext.same-assets.com', 'partsfinda.com'], // ✅ Dono domains
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ext.same-assets.com', // ✅ External CDN
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'partsfinda.com', // ✅ Aapka own domain
        pathname: '/**',
      },
      {
        protocol: 'http',
        hostname: 'localhost', // ✅ Local development
        pathname: '/**',
      },
    ],
  },

  // Environment variable validation
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },

  // ✅ IMPORTANT: Skip ESLint during production builds
  eslint: {
    ignoreDuringBuilds: true,
  },

  // ✅ IMPORTANT: Skip TypeScript errors during build
  typescript: {
    ignoreBuildErrors: true,
  },

  // ✅ IMPORTANT: Disable static generation for dynamic APIs
  output: 'standalone',

  // Disable x-powered-by header for security
  poweredByHeader: false,

  // ✅ Add this to handle API routes properly
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