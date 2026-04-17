import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-change-in-production-32ch'
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // ── Admin routes ─────────────────────────────────────────────────────────
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

  // ── Halaman /maintenance jangan di-loop ───────────────────────────────────
  if (pathname === '/maintenance') return NextResponse.next()

  // ── Untuk halaman user: cek header x-maintenance yang di-set API ─────────
  // Pendekatan hybrid: halaman redirect via cookie flag yang di-set saat
  // frontend pertama kali gagal karena 503 maintenance dari API.
  // Middleware ringan — tidak fetch DB, cukup cek cookie.
  const maintenanceCookie = req.cookies.get('nl_maintenance')?.value
  const isPageRoute = !pathname.startsWith('/api/')

  if (isPageRoute && maintenanceCookie === '1') {
    // Jangan redirect loop jika sudah di /maintenance
    if (pathname !== '/maintenance') {
      return NextResponse.redirect(new URL('/maintenance', req.url))
    }
  }

  return NextResponse.next()
}

export const config = {
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
