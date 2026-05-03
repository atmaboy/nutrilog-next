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
        <button
          onClick={() => setShowHistory(true)}
          title="Riwayat analisa makanan"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#BFDBFE] text-[#3B82F6] hover:bg-[#EFF6FF] transition"
        >
          Riwayat
        </button>
        <button
          onClick={() => setShowEdit(true)}
          title="Edit konfigurasi user"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition"
        >
          Edit
        </button>
      </div>

      {/* ── Popup Edit Konfigurasi ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) setShowEdit(false) }}
        >
          <div className="bg-white ring-1 ring-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Edit User</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">@{user.username}</p>
              </div>
              <button
                onClick={() => setShowEdit(false)}
                className="text-[#6B7280] hover:text-[#111827] text-lg leading-none transition"
              >✕</button>
            </div>

            {/* Status badge */}
            <div className="flex items-center gap-2 text-sm">
              <span className="text-[#6B7280]">Status saat ini:</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                user.isActive
                  ? 'bg-[#D4F5E4] text-[#1F9D57]'
                  : 'bg-[#F3F4F6] text-[#6B7280]'
              }`}>
                {user.isActive ? 'Aktif' : 'Nonaktif'}
              </span>
            </div>

            {/* Edit Limit Harian */}
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[#111827]">Limit Harian (foto/hari)</label>
              <div className="flex gap-2">
                <input
                  type="number" min={1} max={9999}
                  value={limit}
                  onChange={e => setLimit(e.target.value)}
                  placeholder={`Default global: ${globalLimit}`}
                  className="flex-1 border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white text-[#111827]
                    placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition"
                />
                {limit && (
                  <button
                    onClick={() => setLimit('')}
                    title="Reset ke global"
                    className="text-xs border border-[#E5E7EB] px-2.5 rounded-xl hover:bg-[#F3F4F6] text-[#6B7280] transition"
                  >↺</button>
                )}
              </div>
              <p className="text-xs text-[#6B7280]">
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
              className="w-full bg-[#2ECC71] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#28B765] transition disabled:opacity-50"
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
                  ? 'text-orange-600 border-orange-200 hover:bg-orange-50'
                  : 'text-[#2ECC71] border-[#BBF7D0] hover:bg-[#F0FDF4]'
              }`}
            >
              {user.isActive ? 'Nonaktifkan User' : 'Aktifkan User'}
            </button>

            {/* Divider */}
            <div className="border-t border-[#E5E7EB] pt-4">
              <p className="text-xs text-[#6B7280] mb-3">Zona Berbahaya</p>
              <button
                onClick={deleteUser}
                disabled={loading === 'delete'}
                className="w-full py-2 rounded-xl text-sm font-medium border border-red-200 text-red-500 hover:bg-red-50 transition disabled:opacity-50"
              >
                {loading === 'delete' ? 'Menghapus…' : 'Hapus User Permanen'}
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
