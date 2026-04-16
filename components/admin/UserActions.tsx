'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type U = { id: string; username: string; dailyLimit: number | null; isActive: boolean }

export default function UserActions({ user, globalLimit }: { user: U; globalLimit: number }) {
  const [limit, setLimit] = useState(user.dailyLimit?.toString() ?? '')
  const [loading, setLoading] = useState<string | null>(null)
  const router = useRouter()
  const tok = () =>
    document.cookie
      .split(';')
      .find(c => c.includes('nl_admin_token'))
      ?.split('=')[1] ?? ''

  async function call(action: string, body: Record<string, unknown>) {
    setLoading(action)
    const r = await fetch(`/api/admin?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    r.ok ? (toast.success('Berhasil'), router.refresh()) : toast.error(d.error)
    setLoading(null)
  }

  async function del() {
    if (!confirm(`Hapus user "${user.username}"?`)) return
    setLoading('delete')
    const r = await fetch(`/api/admin?action=delete-user&userId=${user.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tok()}` },
    })
    const d = await r.json()
    r.ok ? (toast.success('Dihapus'), router.refresh()) : toast.error(d.error)
    setLoading(null)
  }

  return (
    <div className="flex items-center gap-1.5 flex-wrap">
      <input
        type="number" min={1} max={9999}
        value={limit} onChange={e => setLimit(e.target.value)}
        placeholder={`Global: ${globalLimit}`}
        className="w-20 border rounded-lg px-2 py-1 text-xs bg-background focus:outline-none focus:ring-1 focus:ring-ring"
      />
      <button
        onClick={() => call('set-user-limit', { userId: user.id, dailyLimit: limit === '' ? null : parseInt(limit) })}
        disabled={loading === 'set-user-limit'}
        className="text-xs bg-primary text-primary-foreground px-2.5 py-1 rounded-lg disabled:opacity-50"
      >
        {loading === 'set-user-limit' ? '…' : '💾'}
      </button>
      {user.dailyLimit && (
        <button
          onClick={() => { setLimit(''); call('set-user-limit', { userId: user.id, dailyLimit: null }) }}
          className="text-xs border px-2 py-1 rounded-lg hover:bg-muted text-muted-foreground"
        >↺</button>
      )}
      <button
        onClick={() => call('toggle-user', { userId: user.id, isActive: !user.isActive })}
        disabled={loading === 'toggle-user'}
        className={`text-xs px-2.5 py-1 rounded-lg border disabled:opacity-50 ${
          user.isActive
            ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
            : 'text-green-600 border-green-200 hover:bg-green-50'
        }`}
      >
        {loading === 'toggle-user' ? '…' : user.isActive ? 'Nonaktifkan' : 'Aktifkan'}
      </button>
      <button
        onClick={del} disabled={loading === 'delete'}
        className="text-xs text-destructive border border-destructive/30 px-2.5 py-1 rounded-lg hover:bg-destructive/5"
      >🗑</button>
    </div>
  )
}