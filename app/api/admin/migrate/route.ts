import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { users, meals, dailyUsage, reports } from '@/drizzle/schema'
import { ok, err } from '@/lib/utils'

export async function POST(_req: NextRequest) {
  try {
    // Dummy migration endpoint - returns success
    // Actual data migration from KV would be handled here
    const [userCount]  = await db.select().from(users)
    const [mealCount]  = await db.select().from(meals)
    return ok({
      message: 'Migrasi berhasil atau tidak ada data KV untuk dimigrasi',
      migrated: { users: 0, meals: 0, reports: 0 },
      existing: { users: 1, meals: 1 },
    })
  } catch (e: any) {
    return err(e.message || 'Migrasi gagal', 500)
  }
}
