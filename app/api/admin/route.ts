import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, meals, reports, maintenanceConfig } from '@/drizzle/schema'
import { verifyAdminPwd, setAdminPwd, getCfg, setCfg, getGlobalLimit, getMaintenance } from '@/lib/admin'
import { signAdminToken } from '@/lib/auth'
import { ok, err, setCors } from '@/lib/utils'
import { invalidateMaintenanceCache } from '@/lib/maintenance'
import { eq, desc, count } from 'drizzle-orm'

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}

function jsonErr(msg: string, status = 500) {
  const h = new Headers()
  setCors(h)
  return Response.json({ error: msg }, { status, headers: h })
}

export async function OPTIONS() {
  const h = new Headers()
  setCors(h)
  return new Response(null, { status: 204, headers: h })
}

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
      const { enabled, title, description } = body

      const existing = await db.select({ id: maintenanceConfig.id })
        .from(maintenanceConfig).limit(1)

      if (existing.length > 0) {
        await db.update(maintenanceConfig)
          .set({
            enabled:     enabled     ?? false,
            title:       title       ?? 'NutriLog sedang dalam perbaikan',
            description: description ?? 'Kami sedang melakukan peningkatan sistem.',
            updatedAt:   new Date(),
          })
          .where(eq(maintenanceConfig.id, existing[0].id))
      } else {
        await db.insert(maintenanceConfig).values({
          enabled:     enabled     ?? false,
          title:       title       ?? 'NutriLog sedang dalam perbaikan',
          description: description ?? 'Kami sedang melakukan peningkatan sistem.',
          updatedAt:   new Date(),
        })
      }

      invalidateMaintenanceCache()
      return ok({ message: `Mode maintenance ${enabled ? 'diaktifkan' : 'dinonaktifkan'}` })
    }

    // CREATE USER
    if (action === 'create_user') {
      const { username, password, dailyLimit, email } = await req.json()
      if (!username || !password) return err('Username dan password diperlukan')
      if (password.length < 6) return err('Password minimal 6 karakter')

      let resolvedEmail: string | null = null
      if (email && typeof email === 'string' && email.trim() !== '') {
        const trimmedEmail = email.trim().toLowerCase()
        if (!isValidEmail(trimmedEmail)) return err('Format email tidak valid')
        const [existingEmail] = await db.select({ id: users.id })
          .from(users).where(eq(users.email, trimmedEmail)).limit(1)
        if (existingEmail) return err('Email sudah digunakan', 409)
        resolvedEmail = trimmedEmail
      }

      const { hashPassword } = await import('@/lib/auth')
      const hash = await hashPassword(password)
      try {
        const [user] = await db.insert(users)
          .values({
            username: username.toLowerCase().trim(),
            passwordHash: hash,
            dailyLimit: dailyLimit || null,
            email: resolvedEmail,
          })
          .returning({ id: users.id, username: users.username })
        return ok({ user })
      } catch {
        return err('Username sudah digunakan', 409)
      }
    }

    // UPDATE USER
    if (action === 'update_user') {
      const { userId, isActive, dailyLimit, email } = await req.json()
      if (!userId) return err('userId diperlukan')

      const updateData: Record<string, unknown> = { updatedAt: new Date() }
      if (isActive !== undefined) updateData.isActive = isActive
      if (dailyLimit !== undefined) updateData.dailyLimit = dailyLimit === '' ? null : Number(dailyLimit)

      if (email !== undefined) {
        if (email === '' || email === null) {
          updateData.email = null
        } else {
          const trimmedEmail = String(email).trim().toLowerCase()
          if (!isValidEmail(trimmedEmail)) return err('Format email tidak valid')
          const [existingEmail] = await db.select({ id: users.id })
            .from(users).where(eq(users.email, trimmedEmail)).limit(1)
          if (existingEmail && existingEmail.id !== userId) return err('Email sudah digunakan', 409)
          updateData.email = trimmedEmail
        }
      }

      await db.update(users).set(updateData).where(eq(users.id, userId))
      return ok({ message: 'User diperbarui' })
    }

    // DELETE USER
    if (action === 'delete_user') {
      const { userId } = await req.json()
      if (!userId) return err('userId diperlukan')
      await db.delete(users).where(eq(users.id, userId))
      return ok({ message: 'User dihapus' })
    }

    return err('Action tidak dikenal')
  } catch (e) {
    console.error('[admin POST]', e)
    return jsonErr('Internal server error')
  }
}

export async function GET(req: NextRequest) {
  try {
    const action = req.nextUrl.searchParams.get('action')

    if (action === 'users') {
      const allUsers = await db.select({
        id: users.id,
        username: users.username,
        email: users.email,
        isActive: users.isActive,
        dailyLimit: users.dailyLimit,
        createdAt: users.createdAt,
      }).from(users).orderBy(desc(users.createdAt))
      return ok({ users: allUsers })
    }

    if (action === 'stats') {
      const [userCount]   = await db.select({ total: count() }).from(users)
      const [mealCount]   = await db.select({ total: count() }).from(meals)
      const [reportCount] = await db.select({ total: count() }).from(reports)
      return ok({
        users: userCount.total,
        meals: mealCount.total,
        reports: reportCount.total,
      })
    }

    if (action === 'config') {
      const globalLimit = await getGlobalLimit()
      const apiKey      = await getCfg('anthropic_api_key')
      const maintenance = await getMaintenance()
      return ok({ globalLimit, apiKey: apiKey ? '••••••••' : '', maintenance })
    }

    return err('Action tidak dikenal')
  } catch (e) {
    console.error('[admin GET]', e)
    return jsonErr('Internal server error')
  }
}
