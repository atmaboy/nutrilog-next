/**
 * Maintenance helper — dipakai oleh API routes (Node.js runtime, bisa import drizzle).
 * Middleware TIDAK import file ini (Edge runtime).
 */
import { db } from '@/lib/db'
import { maintenanceConfig } from '@/drizzle/schema'

let cache: { enabled: boolean; ts: number } | null = null
const TTL_MS = 10_000 // cache 10 detik agar tidak hit DB tiap request

export async function checkMaintenance(): Promise<{
  enabled: boolean
  title: string
  description: string
}> {
  const now = Date.now()

  // Serve from cache jika masih fresh
  if (cache && now - cache.ts < TTL_MS) {
    if (!cache.enabled) return { enabled: false, title: '', description: '' }
  }

  try {
    const rows = await db.select().from(maintenanceConfig).limit(1)
    const row  = rows[0]

    cache = { enabled: row?.enabled ?? false, ts: now }

    return {
      enabled:     row?.enabled     ?? false,
      title:       row?.title       ?? 'NutriLog sedang dalam perbaikan',
      description: row?.description ?? 'Kami sedang melakukan peningkatan sistem.',
    }
  } catch {
    // Kalau DB error, jangan block user — fail open
    return { enabled: false, title: '', description: '' }
  }
}

/** Invalidate cache setelah admin update maintenance status */
export function invalidateMaintenanceCache() {
  cache = null
}

/** Helper: buat Response 503 JSON standar untuk API routes */
export function maintenanceResponse() {
  return new Response(
    JSON.stringify({
      ok: false,
      error: 'Aplikasi sedang dalam mode maintenance. Coba lagi beberapa saat.',
      maintenance: true,
    }),
    {
      status: 503,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '300',
      },
    },
  )
}
