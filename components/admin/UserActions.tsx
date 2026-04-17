'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import MealHistoryModal from './MealHistoryModal'

type U = { id: string; username: string; dailyLimit: number | null; isActive: boolean }

export default function UserActions({ user, globalLimit }: { user: U; globalLimit: number }) {
  const [showEdit, setShowEdit]       = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [limit, setLimit]             = useState(user.dailyLimit?.toString() ?? '')
  const [loading, setLoading]         = useState<string | null>(null)
  const router = useRouter()

  const tok = () =>
    document.cookie.split(';').find(c => c.includes('nl_admin_token'))?.split('=')[1] ?? ''

  async function call(action: string, body: Record<string, unknown>) {
    setLoading(action)
    const r = await fetch(`/api/admin?action=${action}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify(body),
    })
    const d = await r.json()
    if (r.ok) { toast.success('Berhasil'); router.refresh(); setShowEdit(false) }
    else toast.error(d.error)
    setLoading(null)
  }

  async function deleteUser() {
    if (!confirm(`Hapus user "${user.username}"? Semua data akan ikut terhapus.`)) return
    setLoading('delete')
    const r = await fetch(`/api/admin?action=delete_user`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ id: user.id }),
    })
    const d = await r.json()
    if (r.ok) { toast.success('User dihapus'); router.refresh(); setShowEdit(false) }
    else toast.error(d.error)
    setLoading(null)
  }

  return (
    <>
      {/* ── Tombol Aksi ── */}
      <div className="flex items-center gap-1.5">
        {/* Riwayat Analisa */}
        <button
          onClick={() => setShowHistory(true)}
          title="Riwayat analisa makanan"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-blue-300 text-blue-600 hover:bg-blue-50 dark:border-blue-700 dark:text-blue-400 dark:hover:bg-blue-900/30 transition"
        >
          🍽 Riwayat
        </button>

        {/* Edit Konfigurasi */}
        <button
          onClick={() => setShowEdit(true)}
          title="Edit konfigurasi user"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-border hover:bg-muted transition"
        >
          ⚙️ Edit
        </button>
      </div>

      {/* ── Popup Edit Konfigurasi ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}
        >
          <div className="bg-card border rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Edit User</h2>
                <p className="text-xs text-muted-foreground mt-0.5">@{user.username}</p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="text-muted-foreground hover:text-foreground text-lg leading-none"
              >✕</button>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Status saat ini:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.isActive
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400'
                  : 'bg-muted text-muted-foreground'
              }`}>
                {user.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Edit Limit Harian */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Limit Harian (foto/hari)</label>
              <div className="flex gap-2">
                <input
                  type="number" min={1} max={9999}
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  placeholder={`Default global: ${globalLimit}`}
                  className="flex-1 border rounded-xl px-3 py-2 text-sm bg-background focus:outline-none focus:ring-2 focus:ring-ring"
                />
                {limit && (
                  <button
                    onClick={() => setLimit('')}
                    title="Reset ke global"
                    className="text-xs border px-2.5 rounded-xl hover:bg-muted text-muted-foreground"
                  >↺</button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Kosongkan untuk mengikuti limit global ({globalLimit}/hari)
              </p>
            </div>

            {/* Tombol Simpan Limit */}
            <button
              onClick={() => call('update_user', {
                id: user.id,
                dailyLimit: limit === '' ? null : parseInt(limit),
                isActive: user.isActive,
              })}
              disabled={loading === 'update_user'}
              className="w-full bg-primary text-primary-foreground py-2 rounded-xl text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
            >
              {loading === 'update_user' ? 'Menyimpan…' : 'Simpan Perubahan'}
            </button>

            {/* Toggle Aktif/Nonaktif */}
            <button
              onClick={() => call('update_user', {
                id: user.id,
                dailyLimit: user.dailyLimit,
                isActive: !user.isActive,
              })}
              disabled={loading === 'update_user'}
              className={`w-full py-2 rounded-xl text-sm font-medium border transition disabled:opacity-50 ${
                user.isActive
                  ? 'text-orange-600 border-orange-300 hover:bg-orange-50 dark:hover:bg-orange-900/20'
                  : 'text-green-600 border-green-300 hover:bg-green-50 dark:hover:bg-green-900/20'
              }`}
            >
              {user.isActive ? 'Nonaktifkan User' : 'Aktifkan User'}
            </button>

            {/* Divider */}
            <div className="border-t pt-4">
              <p className="text-xs text-muted-foreground mb-3">Zona Berbahaya</p>
              <button
                onClick={deleteUser}
                disabled={loading === 'delete'}
                className="w-full py-2 rounded-xl text-sm font-medium border border-destructive/40 text-destructive hover:bg-destructive/5 transition disabled:opacity-50"
              >
                {loading === 'delete' ? 'Menghapus…' : '🗑 Hapus User Permanen'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Popup Riwayat Analisa ── */}
      {showHistory && (
        <MealHistoryModal
          userId={user.id}
          username={user.username}
          onClose={() => setShowHistory(false)}
        />
      )}
    </>
  )
}