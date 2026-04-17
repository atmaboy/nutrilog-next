import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-change-in-production-32ch'
)

// ─── Fetch maintenance status from DB via internal API ───────────────────────
// Middleware runs on the Edge runtime → tidak bisa import drizzle langsung.
// Kita pakai fetch ke Supabase REST API untuk baca tabel maintenanceConfig.
async function isMaintenanceEnabled(req: NextRequest): Promise<boolean> {
  try {
    const supabaseUrl = process.env.SUPABASE_URL
    const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!supabaseUrl || !serviceKey) return false

    const res = await fetch(
      `${supabaseUrl}/rest/v1/maintenance_config?select=enabled&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
          Accept: 'application/json',
        },
        cache: 'no-store',
      },
    )
    if (!res.ok) return false
    const data = await res.json()
    return Array.isArray(data) && data[0]?.enabled === true
  } catch {
    return false
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── 1. Admin routes – selalu lolos (admin perlu masuk untuk matikan maintenance) ──
  if (pathname === '/admin/login') return NextResponse.next()

  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('nl_admin_token')?.value
    if (!token) return NextResponse.redirect(new URL('/admin/login', req.url))
    try {
      const { payload } = await jwtVerify(token, secret)
      if (payload.role !== 'admin') throw new Error()
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url))
      res.cookies.delete('nl_admin_token')
      return res
    }
    return NextResponse.next()
  }

  // ── 2. Maintenance mode check untuk route user-facing ──────────────────────
  // Routes yang harus diblokir saat maintenance:
  //   - /login, /main (halaman)
  //   - /api/auth   (POST login & register)
  //   - /api/analyze
  //   - /api/history
  //   - /api/report
  //   - /api/user
  const isUserRoute =
    pathname === '/login' ||
    pathname.startsWith('/main') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/analyze') ||
    pathname.startsWith('/api/history') ||
    pathname.startsWith('/api/report') ||
    pathname.startsWith('/api/user')

  if (isUserRoute) {
    const maintenance = await isMaintenanceEnabled(req)
    if (maintenance) {
      // Untuk API request → kembalikan JSON 503
      if (pathname.startsWith('/api/')) {
        return new Response(
          JSON.stringify({
            ok: false,
            error: 'Aplikasi sedang dalam mode maintenance. Coba lagi beberapa saat.',
            maintenance: true,
          }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
      // Untuk halaman → redirect ke /maintenance
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  // ── 3. Jangan loop: halaman /maintenance lolos langsung ──────────────────────
  if (pathname === '/maintenance') return NextResponse.next()

  return NextResponse.next()
}

export const config = {
  // Tambah semua route yang perlu dicek
  matcher: [
    '/admin/:path*',
    '/login',
    '/main/:path*',
    '/maintenance',
    '/api/auth/:path*',
    '/api/analyze/:path*',
    '/api/history/:path*',
    '/api/report/:path*',
    '/api/user/:path*',
  ],
}
