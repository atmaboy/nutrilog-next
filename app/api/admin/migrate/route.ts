import { NextRequest } from 'next/server'
import { createHash } from 'crypto'
import { db } from '@/lib/db'
import { adminConfig, users, meals, reports, dailyUsage } from '@/drizzle/schema'
import { verifyToken, extractToken, hashPassword } from '@/lib/auth'
import { setCors } from '@/lib/utils'

type KvRow = {
  namespace?: string | null
  key?: string | null
  value?: unknown
  updated_at?: string | null
  updatedAt?: string | null
}

type LegacyUser = {
  username: string
  passwordHash?: string | null
  password?: string | null
  dailyLimit?: number | null
  isActive?: boolean
  createdAt?: string | null
  updatedAt?: string | null
}

type LegacyMeal = {
  username: string
  dishNames: string[]
  totalCalories: number
  totalProtein: number
  totalCarbs: number
  totalFat: number
  imageUrl?: string | null
  rawAnalysis?: unknown
  loggedAt?: string | null
}

type LegacyReport = {
  username?: string | null
  message: string
  status?: string | null
  createdAt?: string | null
  updatedAt?: string | null
}

type LegacyUsage = {
  username: string
  date: string
  count: number
}

function json(data: unknown, status = 200) {
  const h = new Headers()
  setCors(h)
  h.set('Content-Type', 'application/json')
  return new Response(JSON.stringify(data), { status, headers: h })
}

function stableUuid(seed: string) {
  const hex = createHash('sha256').update(seed).digest('hex')
  const part4 = ((parseInt(hex.slice(16, 18), 16) & 0x3f) | 0x80).toString(16).padStart(2, '0')
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    `4${hex.slice(13, 16)}`,
    `${part4}${hex.slice(18, 20)}`,
    hex.slice(20, 32),
  ].join('-')
}

function normUsername(v: unknown) {
  return String(v ?? '').trim().toLowerCase()
}

function toNum(v: unknown, fallback = 0) {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

function toBool(v: unknown, fallback = true) {
  if (typeof v === 'boolean') return v
  if (typeof v === 'string') {
    const s = v.trim().toLowerCase()
    if (['true', '1', 'yes', 'aktif', 'active'].includes(s)) return true
    if (['false', '0', 'no', 'nonaktif', 'inactive'].includes(s)) return false
  }
  return fallback
}

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? v as T[] : []
}

function parseMaybeJson(v: unknown): unknown {
  if (typeof v !== 'string') return v
  const s = v.trim()
  if (!s) return s
  try { return JSON.parse(s) } catch { return v }
}

function firstString(...vals: unknown[]) {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim()) return v.trim()
  }
  return ''
}

function toIsoMaybe(v: unknown) {
  if (!v) return null
  const d = new Date(String(v))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

function dateOnly(v: unknown) {
  const iso = toIsoMaybe(v)
  return iso ? iso.slice(0, 10) : null
}

function looksLikeMeal(obj: any) {
  if (!obj || typeof obj !== 'object') return false
  return (
    obj.dishNames !== undefined ||
    obj.dish_names !== undefined ||
    obj.totalCalories !== undefined ||
    obj.total_calories !== undefined ||
    obj.rawAnalysis !== undefined ||
    obj.raw_analysis !== undefined ||
    obj.imageUrl !== undefined ||
    obj.image_url !== undefined
  )
}

function looksLikeUser(obj: any) {
  if (!obj || typeof obj !== 'object') return false
  return !!(obj.username || obj.userName || obj.name) && (
    obj.passwordHash !== undefined ||
    obj.password_hash !== undefined ||
    obj.password !== undefined ||
    obj.dailyLimit !== undefined ||
    obj.daily_limit !== undefined ||
    obj.isActive !== undefined ||
    obj.is_active !== undefined
  )
}

function looksLikeReport(obj: any) {
  if (!obj || typeof obj !== 'object') return false
  return typeof obj.message === 'string' || typeof obj.text === 'string'
}

function normalizeDishNames(v: unknown): string[] {
  if (Array.isArray(v)) return v.map(x => String(x).trim()).filter(Boolean)
  if (typeof v === 'string') {
    return v.split(',').map(x => x.trim()).filter(Boolean)
  }
  return []
}

function pushUser(out: Map<string, LegacyUser>, raw: any, fallbackUsername?: string) {
  const username = normUsername(raw?.username ?? raw?.userName ?? raw?.name ?? fallbackUsername)
  if (!username) return

  const prev = out.get(username)
  out.set(username, {
    username,
    passwordHash: firstString(raw?.passwordHash, raw?.password_hash, prev?.passwordHash),
    password: firstString(raw?.password, raw?.pwd, prev?.password),
    dailyLimit: raw?.dailyLimit ?? raw?.daily_limit ?? prev?.dailyLimit ?? null,
    isActive: raw?.isActive ?? raw?.is_active ?? prev?.isActive ?? true,
    createdAt: firstString(raw?.createdAt, raw?.created_at, prev?.createdAt),
    updatedAt: firstString(raw?.updatedAt, raw?.updated_at, prev?.updatedAt),
  })
}

function pushMeal(out: LegacyMeal[], raw: any, fallbackUsername?: string) {
  const username = normUsername(raw?.username ?? raw?.userName ?? fallbackUsername)
  if (!username) return

  const rawAnalysis = raw?.rawAnalysis ?? raw?.raw_analysis ?? raw?.analysis ?? null
  const summary = rawAnalysis && typeof rawAnalysis === 'object'
    ? (rawAnalysis as any).summary ?? (rawAnalysis as any).totals ?? {}
    : {}

  const dishNames = normalizeDishNames(
    raw?.dishNames ??
    raw?.dish_names ??
    summary?.dish_names ??
    raw?.foods ??
    raw?.items
  )

  out.push({
    username,
    dishNames,
    totalCalories: toNum(raw?.totalCalories ?? raw?.total_calories ?? summary?.totalCalories ?? summary?.total_calories, 0),
    totalProtein: toNum(raw?.totalProtein ?? raw?.total_protein ?? summary?.totalProtein ?? summary?.total_protein, 0),
    totalCarbs: toNum(raw?.totalCarbs ?? raw?.total_carbs ?? summary?.totalCarbs ?? summary?.total_carbs, 0),
    totalFat: toNum(raw?.totalFat ?? raw?.total_fat ?? summary?.totalFat ?? summary?.total_fat, 0),
    imageUrl: firstString(raw?.imageUrl, raw?.image_url) || null,
    rawAnalysis,
    loggedAt: firstString(raw?.loggedAt, raw?.logged_at, raw?.createdAt, raw?.created_at, raw?.timestamp),
  })
}

function pushReport(out: LegacyReport[], raw: any, fallbackUsername?: string) {
  const message = firstString(raw?.message, raw?.text, raw?.content)
  if (!message) return

  out.push({
    username: normUsername(raw?.username ?? raw?.userName ?? fallbackUsername) || null,
    message,
    status: firstString(raw?.status) || 'open',
    createdAt: firstString(raw?.createdAt, raw?.created_at, raw?.timestamp),
    updatedAt: firstString(raw?.updatedAt, raw?.updated_at, raw?.timestamp),
  })
}

function pushUsage(out: LegacyUsage[], raw: any, fallbackUsername?: string) {
  const username = normUsername(raw?.username ?? fallbackUsername)
  const date = dateOnly(raw?.date ?? raw?.day ?? raw?.createdAt ?? raw?.created_at)
  const count = toNum(raw?.count ?? raw?.used ?? raw?.usage, 0)
  if (!username || !date) return
  out.push({ username, date, count })
}

function walkValue(
  compoundKey: string,
  value: unknown,
  usersMap: Map<string, LegacyUser>,
  mealsList: LegacyMeal[],
  reportsList: LegacyReport[],
  usageList: LegacyUsage[],
  cfg: Record<string, unknown>,
) {
  const parsed = parseMaybeJson(value)
  const key = compoundKey.toLowerCase()

  if (key.includes('default_daily_limit')) cfg.default_daily_limit = parsed
  if (key.includes('anthropic') && key.includes('api')) cfg.anthropic_api_key = parsed
  if (key.includes('admin_password_hash')) cfg.admin_password_hash = parsed
  if (key.includes('maintenance') && parsed && typeof parsed === 'object') cfg.maintenance = parsed

  if (Array.isArray(parsed)) {
    for (const item of parsed) {
      if (looksLikeUser(item)) pushUser(usersMap, item)
      else if (looksLikeMeal(item)) pushMeal(mealsList, item)
      else if (looksLikeReport(item)) pushReport(reportsList, item)
    }
    return
  }

  if (!parsed || typeof parsed !== 'object') return
  const obj = parsed as Record<string, any>

  if (obj.users && Array.isArray(obj.users)) {
    for (const item of obj.users) pushUser(usersMap, item)
  }

  if (obj.meals && Array.isArray(obj.meals)) {
    for (const item of obj.meals) pushMeal(mealsList, item)
  }

  if (obj.history && Array.isArray(obj.history)) {
    for (const item of obj.history) pushMeal(mealsList, item)
  }

  if (obj.reports && Array.isArray(obj.reports)) {
    for (const item of obj.reports) pushReport(reportsList, item)
  }

  if (obj.dailyUsage && Array.isArray(obj.dailyUsage)) {
    for (const item of obj.dailyUsage) pushUsage(usageList, item)
  }

  if (obj.usage && Array.isArray(obj.usage)) {
    for (const item of obj.usage) pushUsage(usageList, item)
  }

  if (looksLikeUser(obj)) pushUser(usersMap, obj)
  if (looksLikeMeal(obj)) pushMeal(mealsList, obj)
  if (looksLikeReport(obj)) pushReport(reportsList, obj)

  for (const [k, v] of Object.entries(obj)) {
    const childKey = `${key}:${k}`

    if (Array.isArray(v) && v.every(item => looksLikeMeal(item))) {
      const maybeUsername = normUsername(k)
      for (const item of v) pushMeal(mealsList, item, maybeUsername)
      continue
    }

    if (Array.isArray(v) && v.every(item => looksLikeReport(item))) {
      const maybeUsername = normUsername(k)
      for (const item of v) pushReport(reportsList, item, maybeUsername)
      continue
    }

    if (v && typeof v === 'object' && looksLikeUser(v)) {
      pushUser(usersMap, v, k)
      continue
    }

    if (v && typeof v === 'object' && looksLikeMeal(v)) {
      pushMeal(mealsList, v, k)
      continue
    }

    if (v && typeof v === 'object' && looksLikeReport(v)) {
      pushReport(reportsList, v, k)
      continue
    }
  }
}

async function fetchTableRows(table: 'nutrilog_kv' | 'kv_store'): Promise<KvRow[]> {
  const url = process.env.SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !key) {
    throw new Error('SUPABASE_URL atau SUPABASE_SERVICE_ROLE_KEY belum di-set')
  }

  const res = await fetch(`${url}/rest/v1/${table}?select=*`, {
    headers: {
      apikey: key,
      Authorization: `Bearer ${key}`,
      Accept: 'application/json',
    },
    cache: 'no-store',
  })

  if (res.status === 404) return []
  if (!res.ok) {
    const txt = await res.text()
    throw new Error(`Gagal membaca ${table}: ${res.status} ${txt}`)
  }

  const data = await res.json()
  return Array.isArray(data) ? data : []
}

async function authAdmin(req: NextRequest) {
  const bearer = extractToken(req.headers.get('Authorization'))
  const cookieToken = req.cookies.get('nl_admin_token')?.value ?? null
  const token = bearer || cookieToken
  if (!token) return null

  try {
    const payload = await verifyToken(token)
    return payload?.role === 'admin' ? payload : null
  } catch {
    return null
  }
}

export async function OPTIONS() {
  const h = new Headers()
  setCors(h)
  return new Response(null, { status: 204, headers: h })
}

export async function POST(req: NextRequest) {
  try {
    const admin = await authAdmin(req)
    if (!admin) return json({ error: 'Unauthorized' }, 401)

    const [rowsA, rowsB] = await Promise.all([
      fetchTableRows('nutrilog_kv'),
      fetchTableRows('kv_store'),
    ])

    const allRows = [...rowsA, ...rowsB]
    const legacyUsers = new Map<string, LegacyUser>()
    const legacyMeals: LegacyMeal[] = []
    const legacyReports: LegacyReport[] = []
    const legacyUsage: LegacyUsage[] = []
    const legacyConfig: Record<string, unknown> = {}

    for (const row of allRows) {
      const compoundKey = [row.namespace, row.key].filter(Boolean).join(':')
      walkValue(
        compoundKey || 'root',
        row.value,
        legacyUsers,
        legacyMeals,
        legacyReports,
        legacyUsage,
        legacyConfig,
      )
    }

    const userIdByUsername = new Map<string, string>()
    let migratedUsers = 0
    let migratedMeals = 0
    let migratedReports = 0
    let migratedUsage = 0
    let migratedConfig = 0

    for (const user of legacyUsers.values()) {
      const userId = stableUuid(`user:${user.username}`)
      userIdByUsername.set(user.username, userId)

      let finalHash = firstString(user.passwordHash)
      if (!finalHash && user.password) {
        finalHash = await hashPassword(user.password)
      }
      if (!finalHash) {
        finalHash = await hashPassword(`legacy-${user.username}`)
      }

      await db.insert(users).values({
        id: userId,
        username: user.username,
        passwordHash: finalHash,
        dailyLimit: user.dailyLimit ?? null,
        isActive: user.isActive ?? true,
        createdAt: user.createdAt ? new Date(user.createdAt) : new Date(),
        updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
      }).onConflictDoUpdate({
        target: users.username,
        set: {
          passwordHash: finalHash,
          dailyLimit: user.dailyLimit ?? null,
          isActive: user.isActive ?? true,
          updatedAt: user.updatedAt ? new Date(user.updatedAt) : new Date(),
        },
      })

      migratedUsers++
    }

    for (const meal of legacyMeals) {
      const userId = userIdByUsername.get(meal.username)
      if (!userId) continue

      const loggedAt = meal.loggedAt ? new Date(meal.loggedAt) : new Date()
      const mealId = stableUuid([
        'meal',
        meal.username,
        loggedAt.toISOString(),
        String(meal.totalCalories),
        meal.dishNames.join('|'),
        meal.imageUrl ?? '',
      ].join(':'))

      await db.insert(meals).values({
        id: mealId,
        userId,
        dishNames: meal.dishNames,
        totalCalories: meal.totalCalories,
        totalProtein: String(meal.totalProtein),
        totalCarbs: String(meal.totalCarbs),
        totalFat: String(meal.totalFat),
        imageUrl: meal.imageUrl ?? null,
        rawAnalysis: meal.rawAnalysis ?? null,
        loggedAt,
      }).onConflictDoNothing({ target: meals.id })

      migratedMeals++
    }

    for (const rep of legacyReports) {
      const createdAt = rep.createdAt ? new Date(rep.createdAt) : new Date()
      const reportId = stableUuid([
        'report',
        rep.username ?? '',
        createdAt.toISOString(),
        rep.message,
      ].join(':'))

      const userId = rep.username ? (userIdByUsername.get(rep.username) ?? null) : null

      await db.insert(reports).values({
        id: reportId,
        userId,
        username: rep.username ?? null,
        message: rep.message,
        status: rep.status || 'open',
        createdAt,
        updatedAt: rep.updatedAt ? new Date(rep.updatedAt) : createdAt,
      }).onConflictDoNothing({ target: reports.id })

      migratedReports++
    }

    for (const usage of legacyUsage) {
      const userId = userIdByUsername.get(usage.username)
      if (!userId) continue

      await db.insert(dailyUsage).values({
        userId,
        date: usage.date,
        count: usage.count,
      }).onConflictDoUpdate({
        target: [dailyUsage.userId, dailyUsage.date],
        set: { count: usage.count },
      })

      migratedUsage++
    }

    if (legacyConfig.default_daily_limit !== undefined) {
      await db.insert(adminConfig).values({
        key: 'default_daily_limit',
        value: String(legacyConfig.default_daily_limit),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: adminConfig.key,
        set: { value: String(legacyConfig.default_daily_limit), updatedAt: new Date() },
      })
      migratedConfig++
    }

    if (typeof legacyConfig.anthropic_api_key === 'string') {
      await db.insert(adminConfig).values({
        key: 'anthropic_api_key',
        value: legacyConfig.anthropic_api_key,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: adminConfig.key,
        set: { value: legacyConfig.anthropic_api_key, updatedAt: new Date() },
      })
      migratedConfig++
    }

    if (typeof legacyConfig.admin_password_hash === 'string') {
      await db.insert(adminConfig).values({
        key: 'admin_password_hash',
        value: legacyConfig.admin_password_hash,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: adminConfig.key,
        set: { value: legacyConfig.admin_password_hash, updatedAt: new Date() },
      })
      migratedConfig++
    }

    return json({
      ok: true,
      message: 'Migrasi selesai',
      scanned: {
        nutrilog_kv: rowsA.length,
        kv_store: rowsB.length,
        totalRows: allRows.length,
      },
      discovered: {
        users: legacyUsers.size,
        meals: legacyMeals.length,
        reports: legacyReports.length,
        dailyUsage: legacyUsage.length,
      },
      migrated: {
        users: migratedUsers,
        meals: migratedMeals,
        reports: migratedReports,
        dailyUsage: migratedUsage,
        config: migratedConfig,
      },
    })
  } catch (e) {
    console.error('[POST /api/admin/migrate] error:', e)
    return json({
      error: e instanceof Error ? e.message : 'Internal server error',
    }, 500)
  }
}