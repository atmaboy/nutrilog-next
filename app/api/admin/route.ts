import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, meals, reports, dailyUsage, maintenanceConfig } from '@/drizzle/schema'
import { verifyAdminPwd, setAdminPwd, getCfg, setCfg, getGlobalLimit, getMaintenance } from '@/lib/admin'
import { signAdminToken } from '@/lib/auth'
import { ok, err, setCors } from '@/lib/utils'
import { eq, desc, count, sum } from 'drizzle-orm'

function jsonErr(msg: string, status = 500) {
  const h = new Headers()
  setCors(h)
  return Response.json({ error: msg }, { status, headers: h })
}

// ── OPTIONS (CORS preflight) ─────────────────────────────────────────────────
export async function OPTIONS() {
  const h = new Headers()
  setCors(h)
  return new Response(null, { status: 204, headers: h })
}

// ── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    // LOGIN
    if (action === 'login') {
      let body: { password?: string }
      try { body = await req.json() } catch { return jsonErr('Invalid JSON body', 400) }
      const { password } = body
      if (!password) return err('Password diperlukan')
      const valid = await verifyAdminPwd(password)
      if (!valid) return err('Password salah', 401)
      const token = await signAdminToken()
      const h = new Headers()
      setCors(h)
      h.set('Content-Type', 'application/json')
      h.set('Set-Cookie',
        `nl_admin_token=${token}; Path=/; HttpOnly; SameSite=Strict; Max-Age=14400`)
      return new Response(JSON.stringify({ token, message: 'Login berhasil' }), { status: 200, headers: h })
    }

    // LOGOUT
    if (action === 'logout') {
      const h = new Headers()
      setCors(h)
      h.set('Content-Type', 'application/json')
      h.set('Set-Cookie', 'nl_admin_token=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0')
      return new Response(JSON.stringify({ message: 'Logout berhasil' }), { status: 200, headers: h })
    }

    // UPDATE PASSWORD
    if (action === 'update_password') {
      const { newPassword } = await req.json()
      if (!newPassword || newPassword.length < 8) return err('Password minimal 8 karakter')
      await setAdminPwd(newPassword)
      return ok({ message: 'Password berhasil diubah' })
    }

    // UPDATE CONFIG
    if (action === 'update_config') {
      const body = await req.json()
      if (body.dailyLimit !== undefined) await setCfg('default_daily_limit', String(body.dailyLimit))
      if (body.anthropicApiKey !== undefined) await setCfg('anthropic_api_key', body.anthropicApiKey)
      return ok({ message: 'Konfigurasi disimpan' })
    }

    // UPDATE MAINTENANCE
    if (action === 'update_maintenance') {
      const body = await req.json()
      await db.insert(maintenanceConfig)
        .values({ enabled: body.enabled, title: body.title, description: body.description, updatedAt: new Date() })
        .onConflictDoUpdate({
          target: maintenanceConfig.id,
          set: { enabled: body.enabled, title: body.title, description: body.description, updatedAt: new Date() },
        })
      return ok({ message: 'Status maintenance disimpan' })
    }

    // CREATE USER
    if (action === 'create_user') {
      const { username, password, dailyLimit } = await req.json()
      if (!username || !password) return err('Username dan password diperlukan')
      const { hashPassword } = await import('@/lib/auth')
      const hash = await hashPassword(password)
      try {
        const [user] = await db.insert(users).values({
          username: username.toLowerCase().trim(),
          passwordHash: hash,
          dailyLimit: dailyLimit || null,
        }).returning()
        return ok({ user, message: 'User berhasil dibuat' })
      } catch {
        return err('Username sudah digunakan', 409)
      }
    }

    // UPDATE USER
    if (action === 'update_user') {
      const { id, isActive, dailyLimit } = await req.json()
      if (!id) return err('User ID diperlukan')
      await db.update(users)
        .set({ isActive, dailyLimit: dailyLimit ?? null, updatedAt: new Date() })
        .where(eq(users.id, id))
      return ok({ message: 'User berhasil diperbarui' })
    }

    // UPDATE REPORT STATUS
    if (action === 'update_report') {
      const { id, status } = await req.json()
      if (!id) return err('Report ID diperlukan')
      await db.update(reports).set({ status, updatedAt: new Date() }).where(eq(reports.id, id))
      return ok({ message: 'Status laporan diperbarui' })
    }

    return err('Action tidak dikenal')
  } catch (e) {
    console.error('[POST /api/admin] error:', e)
    return jsonErr(`Internal server error: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    // DASHBOARD STATS
    if (action === 'dashboard') {
      const [totalUsers]  = await db.select({ c: count() }).from(users)
      const [activeUsers] = await db.select({ c: count() }).from(users).where(eq(users.isActive, true))
      const [totalMeals]  = await db.select({ c: count() }).from(meals)
      const [openReports] = await db.select({ c: count() }).from(reports).where(eq(reports.status, 'open'))
      const [totalCals]   = await db.select({ s: sum(meals.totalCalories) }).from(meals)

      const recentUsers = await db.select({
        id: users.id, username: users.username, isActive: users.isActive, createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt)).limit(5)

      const today = new Date().toISOString().split('T')[0]
      const todayUsage = await db.select({ c: count() }).from(dailyUsage)
        .where(eq(dailyUsage.date, today))

      return ok({
        stats: {
          totalUsers:    totalUsers.c,
          activeUsers:   activeUsers.c,
          totalMeals:    totalMeals.c,
          openReports:   openReports.c,
          totalCalories: totalCals.s ?? 0,
          todayAnalyses: todayUsage[0]?.c ?? 0,
        },
        recentUsers,
      })
    }

    // LIST USERS
    if (action === 'users') {
      const page    = parseInt(req.nextUrl.searchParams.get('page') || '1')
      const perPage = parseInt(req.nextUrl.searchParams.get('per_page') || '20')
      const offset  = (page - 1) * perPage
      const list = await db.select().from(users).orderBy(desc(users.createdAt)).limit(perPage).offset(offset)
      const [{ c }] = await db.select({ c: count() }).from(users)
      return ok({ users: list, total: c, page, perPage })
    }

    // LIST REPORTS
    if (action === 'reports') {
      const status = req.nextUrl.searchParams.get('status') || 'all'
      const list = status === 'all'
        ? await db.select().from(reports).orderBy(desc(reports.createdAt)).limit(50)
        : await db.select().from(reports).where(eq(reports.status, status)).orderBy(desc(reports.createdAt)).limit(50)
      return ok({ reports: list })
    }

    // CONFIG
    if (action === 'config') {
      const dailyLimit      = await getGlobalLimit()
      const anthropicApiKey = await getCfg('anthropic_api_key')
      const maintenance     = await getMaintenance()
      return ok({ dailyLimit, anthropicApiKey: anthropicApiKey ? '••••••••' : '', maintenance })
    }

    // USER MEALS
    if (action === 'user_meals') {
      const userId = req.nextUrl.searchParams.get('user_id')
      if (!userId) return err('User ID diperlukan')
      const list = await db.select().from(meals).where(eq(meals.userId, userId)).orderBy(desc(meals.loggedAt)).limit(30)
      return ok({ meals: list })
    }

    return err('Action tidak dikenal')
  } catch (e) {
    console.error('[GET /api/admin] error:', e)
    return jsonErr(`Internal server error: ${e instanceof Error ? e.message : String(e)}`)
  }
}

// ── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'delete_user') {
      const { id } = await req.json()
      if (!id) return err('User ID diperlukan')
      await db.delete(users).where(eq(users.id, id))
      return ok({ message: 'User berhasil dihapus' })
    }

    if (action === 'delete_meal') {
      const { id } = await req.json()
      if (!id) return err('Meal ID diperlukan')
      await db.delete(meals).where(eq(meals.id, id))
      return ok({ message: 'Data makan berhasil dihapus' })
    }

    return err('Action tidak dikenal')
  } catch (e) {
    console.error('[DELETE /api/admin] error:', e)
    return jsonErr(`Internal server error: ${e instanceof Error ? e.message : String(e)}`)
  }
}
