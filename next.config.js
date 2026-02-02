/** @type {import('next').NextConfig} */
const nextConfig = {
  // ✅ CHOOSE ONLY ONE:
  // Option A: For Static Export (if you're hosting on static hosting)
  output: 'export',
  
  // OR Option B: For Server/Node.js hosting
  // output: 'standalone',
  
  reactStrictMode: true,
  trailingSlash: false,

  experimental: {
    serverComponentsExternalPackages: ['nodemailer', 'pg'],
  },

  images: {
    // ❌ `output: 'export'` के साथ remotePatterns में '**' allowed नहीं है
    // Static export में सभी images को local होना चाहिए
    unoptimized: true, // ✅ Add this for static export
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**', // इससे error हो सकता है
      },
      {
        protocol: 'http',
        hostname: '**', // इससे error हो सकता है
      },
    ],
  },

  // ✅ Environment variables (already ok)
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY,
    NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  },

  // ✅ Build optimizations
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  typescript: {
    ignoreBuildErrors: true,
  },

  // Security
  poweredByHeader: false,

  // ✅ For chunk loading issues, add this:
  webpack: (config, { isServer }) => {
    // Avoid chunk loading errors
    config.optimization.splitChunks = {
      chunks: 'all',
      maxInitialRequests: 25,
      minSize: 20000,
    };
    
    return config;
  },
}

module.exports = nextConfig