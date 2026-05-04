import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Remove "X-Powered-By: Next.js" header
  poweredByHeader: false,

  // Enable gzip/brotli compression on all responses
  compress: true,

  images: {
    remotePatterns: [{ protocol: 'https', hostname: '**.supabase.co' }],
    // Serve modern formats: AVIF (best compression) with WebP fallback
    formats: ['image/avif', 'image/webp'],
    // Reasonable size limits for a mobile-first app
    deviceSizes: [390, 480, 750, 1080],
    imageSizes: [64, 128, 256, 384],
  },

  async headers() {
    return [
      // ── Static assets: hash-based filenames → immutable forever ──
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      // ── Public folder (icons, manifest, images) → 7 days + revalidate ──
      {
        source: '/:path((?!_next|api).*\\.(ico|svg|png|jpg|webp|avif|woff2|woff|ttf|json|txt)$)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=604800, stale-while-revalidate=86400',
          },
        ],
      },
      // ── API routes: always fresh, no caching ──
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, no-cache, must-revalidate',
          },
        ],
      },
      // ── Security headers on all routes ──
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options',  value: 'nosniff' },
          { key: 'X-Frame-Options',         value: 'SAMEORIGIN' },
          { key: 'Referrer-Policy',         value: 'strict-origin-when-cross-origin' },
          { key: 'X-DNS-Prefetch-Control',  value: 'on' },
        ],
      },
    ]
  },
}

export default nextConfig
