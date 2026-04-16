import { NextResponse, type NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

const secret = new TextEncoder().encode(
  process.env.JWT_SECRET || 'fallback-change-in-production-32ch'
)

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  // Izinkan /admin/login tanpa token
  if (pathname === '/admin/login') {
    return NextResponse.next()
  }

  // Proteksi semua /admin/* selain login
  if (pathname.startsWith('/admin')) {
    const token = req.cookies.get('nl_admin_token')?.value

    if (!token) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }

    try {
      const { payload } = await jwtVerify(token, secret)
      if (payload.role !== 'admin') throw new Error('not admin')
    } catch {
      const res = NextResponse.redirect(new URL('/admin/login', req.url))
      res.cookies.delete('nl_admin_token')
      return res
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*'],
}