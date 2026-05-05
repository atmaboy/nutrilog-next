import { NextRequest } from 'next/server'
import { getCfg, setCfg } from '@/lib/admin'
import { ok, err, setCors } from '@/lib/utils'

export async function OPTIONS() {
  const h = new Headers()
  setCors(h)
  return new Response(null, { status: 204, headers: h })
}

// Public GET — dipakai BrandAnnouncement component
export async function GET() {
  const enabled  = await getCfg('announcement_enabled')
  const title    = await getCfg('announcement_title')
  const body     = await getCfg('announcement_body')
  const icon     = await getCfg('announcement_icon')
  const version  = await getCfg('announcement_version') // increment untuk reset dismiss semua user

  return ok({
    enabled:  enabled === '1',
    title:    title    ?? '',
    body:     body     ?? '',
    icon:     icon     ?? '📢',
    version:  version  ?? '1',
  })
}

// Admin POST — simpan config
export async function POST(req: NextRequest) {
  try {
    const { enabled, title, body, icon, resetDismiss } = await req.json()

    // Auth check via Authorization header
    const auth = req.headers.get('authorization') ?? ''
    if (!auth.startsWith('Bearer ')) return err('Unauthorized', 401)

    if (enabled   !== undefined) await setCfg('announcement_enabled', enabled ? '1' : '0')
    if (title     !== undefined) await setCfg('announcement_title',   title)
    if (body      !== undefined) await setCfg('announcement_body',    body)
    if (icon      !== undefined) await setCfg('announcement_icon',    icon)

    // Reset dismiss = naikkan version, semua user akan lihat notif lagi
    if (resetDismiss) {
      const cur = await getCfg('announcement_version')
      const next = String((parseInt(cur ?? '1', 10) || 1) + 1)
      await setCfg('announcement_version', next)
    }

    return ok({ message: 'Notifikasi disimpan' })
  } catch (e) {
    console.error('[announcement POST]', e)
    return err('Internal server error')
  }
}
