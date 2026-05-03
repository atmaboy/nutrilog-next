import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Toaster } from 'sonner'
import { Analytics } from '@vercel/analytics/next'
import { SpeedInsights } from '@vercel/speed-insights/next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Gizku',
  description: 'Analisa nutrisi makanan dengan AI',
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-touch-icon.svg',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Gizku',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
  themeColor: '#2ECC71',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Ensure always light mode — no dark class */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){ document.documentElement.classList.remove('dark'); })();`,
          }}
        />
      </head>
      <body className={inter.className}>
        {children}
        <Toaster richColors position="top-center" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
