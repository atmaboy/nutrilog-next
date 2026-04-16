import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { meals, dailyUsage } from '@/drizzle/schema'
import { verifyToken, extractToken } from '@/lib/auth'
import { getGlobalLimit } from '@/lib/admin'
import { ok, err, setCors, todayISO } from '@/lib/utils'
import { eq, and, desc, gte, lte, count } from 'drizzle-orm'

export async function OPTIONS() {
  const h = new Headers(); setCors(h)
  return new Response(null, { status: 204, headers: h })
}

async function authUser(req: NextRequest) {
  const token = extractToken(req.headers.get('Authorization'))
  if (!token) return null
  try {
    const p = await verifyToken(token)
    if (!p.userId) return null
    return p as { userId: string; username: string; role: string }
  } catch { return null }
}

export async function GET(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return err('Token tidak valid', 401)

  const action = req.nextUrl.searchParams.get('action') || 'list'

  // LIST meals with pagination
  if (action === 'list') {
    const page    = parseInt(req.nextUrl.searchParams.get('page') || '1')
    const perPage = parseInt(req.nextUrl.searchParams.get('per_page') || '10')
    const offset  = (page - 1) * perPage
    const dateFrom = req.nextUrl.searchParams.get('date_from')
    const dateTo   = req.nextUrl.searchParams.get('date_to')

    let query = db.select().from(meals).where(eq(meals.userId, user.userId))
    const list = await db.select().from(meals)
      .where(eq(meals.userId, user.userId))
      .orderBy(desc(meals.loggedAt))
      .limit(perPage)
      .offset(offset)

    const [{ c }] = await db.select({ c: count() }).from(meals).where(eq(meals.userId, user.userId))

    return ok({ meals: list, total: c, page, perPage, totalPages: Math.ceil(c / perPage) })
  }

  // TODAY summary
  if (action === 'today') {
    const today = todayISO()
    const todayMeals = await db.select().from(meals)
      .where(eq(meals.userId, user.userId))
      .orderBy(desc(meals.loggedAt))

    const filtered = todayMeals.filter(m =>
      new Date(m.loggedAt).toISOString().split('T')[0] === today
    )

    const totalCals    = filtered.reduce((s, m) => s + m.totalCalories, 0)
    const totalProtein = filtered.reduce((s, m) => s + parseFloat(String(m.totalProtein)), 0)
    const totalCarbs   = filtered.reduce((s, m) => s + parseFloat(String(m.totalCarbs)), 0)
    const totalFat     = filtered.reduce((s, m) => s + parseFloat(String(m.totalFat)), 0)

    // Usage
    const [usage] = await db.select().from(dailyUsage)
      .where(and(eq(dailyUsage.userId, user.userId), eq(dailyUsage.date, today))).limit(1)

    const { users } = await import('@/drizzle/schema')
    const { eq: eqOp } = await import('drizzle-orm')
    const [userData] = await db.select({ dailyLimit: users.dailyLimit }).from(users)
      .where(eqOp(users.id, user.userId)).limit(1)

    const globalLimit = await getGlobalLimit()
    const userLimit   = userData?.dailyLimit ?? globalLimit

    return ok({
      meals: filtered,
      summary: { totalCalories: totalCals, totalProtein, totalCarbs, totalFat },
      usage: {
        used: usage?.count ?? 0,
        limit: userLimit,
        remaining: Math.max(0, userLimit - (usage?.count ?? 0)),
      },
    })
  }

  // DELETE single meal
  if (action === 'delete') {
    const id = req.nextUrl.searchParams.get('id')
    if (!id) return err('Meal ID diperlukan')
    const [meal] = await db.select().from(meals)
      .where(and(eq(meals.id, id), eq(meals.userId, user.userId))).limit(1)
    if (!meal) return err('Data tidak ditemukan', 404)
    await db.delete(meals).where(eq(meals.id, id))
    return ok({ message: 'Data berhasil dihapus' })
  }

  return err('Action tidak dikenal')
}

export async function DELETE(req: NextRequest) {
  const user = await authUser(req)
  if (!user) return err('Token tidak valid', 401)
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return err('Meal ID diperlukan')
  const [meal] = await db.select().from(meals)
    .where(and(eq(meals.id, id), eq(meals.userId, user.userId))).limit(1)
  if (!meal) return err('Data tidak ditemukan', 404)
  await db.delete(meals).where(eq(meals.id, id))
  return ok({ message: 'Data berhasil dihapus' })
}
