import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { reports } from '@/drizzle/schema'
import { verifyToken, extractToken } from '@/lib/auth'
import { ok, err, setCors } from '@/lib/utils'
import { eq, and, desc } from 'drizzle-orm'

export async function OPTIONS() {
  const h = new Headers(); setCors(h)
  return new Response(null, { status: 204, headers: h })
}

async function authUser(req: NextRequest) {
  const token = extractToken(req.headers.get('Authorization'))
  if (!token) return null
  try {
    const p = await verifyToken(token)
    return p as { userId: string; username: string; role: string }
  } catch { return null }
}

export async function POST(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return err('Token tidak valid', 401)

  const { message } = await req.json()
  if (!message || message.trim().length < 10)
    return err('Pesan minimal 10 karakter')
  if (message.length > 1000)
    return err('Pesan maksimal 1000 karakter')

  const [report] = await db.insert(reports).values({
    userId:   user.userId,
    username: user.username,
    message:  message.trim(),
    status:   'open',
  }).returning()

  return ok({ report, message: 'Laporan berhasil dikirim' })
}

export async function GET(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return err('Token tidak valid', 401)

  const list = await db.select().from(reports)
    .where(eq(reports.userId, user.userId))
    .orderBy(desc(reports.createdAt))
    .limit(20)

  return ok({ reports: list })
}
