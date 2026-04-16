import { db } from '@/lib/db'
import { adminConfig, maintenanceConfig } from '@/drizzle/schema'
import { hashPassword } from '@/lib/auth'
import { eq } from 'drizzle-orm'

const SALT = 'nutrilog_admin_2024'

export async function getCfg(key: string): Promise<string | null> {
  const r = await db.select().from(adminConfig).where(eq(adminConfig.key, key)).limit(1)
  return r[0]?.value ?? null
}

export async function setCfg(key: string, value: string) {
  await db.insert(adminConfig).values({ key, value })
    .onConflictDoUpdate({ target: adminConfig.key, set: { value, updatedAt: new Date() } })
}

export async function verifyAdminPwd(pwd: string): Promise<boolean> {
  const stored  = await getCfg('admin_password_hash')
  const hash    = await hashPassword(pwd, SALT)
  if (!stored || stored === '') {
    const defHash = await hashPassword(process.env.ADMIN_DEFAULT_PASSWORD || 'Admin1234!', SALT)
    return hash === defHash
  }
  return hash === stored
}

export async function setAdminPwd(pwd: string) {
  await setCfg('admin_password_hash', await hashPassword(pwd, SALT))
}

export async function getGlobalLimit(): Promise<number> {
  const v = await getCfg('default_daily_limit')
  const n = parseInt(v ?? '5', 10)
  return isNaN(n) ? 5 : n
}

export async function getMaintenance() {
  const r = await db.select().from(maintenanceConfig).limit(1)
  return {
    enabled:     r[0]?.enabled     ?? false,
    title:       r[0]?.title       ?? 'NutriLog sedang dalam perbaikan',
    description: r[0]?.description ?? 'Kami sedang melakukan peningkatan sistem.',
  }
}
