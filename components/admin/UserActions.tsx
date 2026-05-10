'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import MealHistoryModal from './MealHistoryModal'

type U = {
  id: string
  username: string
  dailyLimit: number | null
  isActive: boolean
  passwordChangedAt?: Date | string | null
  passwordChangedBy?: string | null
  mustChangePassword?: boolean | null
  adminResetBy?: string | null
}

export default function UserActions({ user, globalLimit }: { user: U; globalLimit: number }) {
  const [showEdit, setShowEdit]       = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [activeTab, setActiveTab]     = useState<'config' | 'reset'>('config')
  const [limit, setLimit]             = useState(user.dailyLimit?.toString() ?? '')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPwd, setShowNewPwd]   = useState(false)
  const [showConfirmPwd, setShowConfirmPwd] = useState(false)
  const [loading, setLoading]         = useState<string | null>(null)
  const [resetDone, setResetDone]     = useState(false)
  const router = useRouter()

  const tok = () =>
    document.cookie.split(';').find(c => c.includes('nl_admin_token'))?.split('=')[1] ?? ''

  function closeEdit() {
    setShowEdit(false)
    setActiveTab('config')
    setNewPassword('')
    setConfirmPassword('')
    setShowNewPwd(false)
    setShowConfirmPwd(false)
    setResetDone(false)
  }

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

  async function handleResetPassword() {
    if (!newPassword || newPassword.length < 6) {
      toast.error('Password minimal 6 karakter')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('Konfirmasi password tidak cocok')
      return
    }
    if (!confirm(`Reset password untuk user "${user.username}"? User wajib ganti password saat login berikutnya.`)) return

    setLoading('reset_password')
    const adminUsername = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('nl_admin_username='))
      ?.split('=')?.[1] ?? 'admin'

    const r = await fetch('/api/admin?action=reset_user_password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ userId: user.id, newPassword, adminUsername }),
    })
    const d = await r.json()
    if (r.ok) {
      setResetDone(true)
      router.refresh()
    } else {
      toast.error(d.error)
    }
    setLoading(null)
  }

  async function deleteUser() {
    if (!confirm(`Hapus user "${user.username}"? Semua data akan ikut terhapus.`)) return
    setLoading('delete')
    const r = await fetch('/api/admin?action=delete_user', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ userId: user.id }),
    })
    const d = await r.json()
    if (r.ok) { toast.success('User dihapus'); router.refresh(); closeEdit() }
    else toast.error(d.error)
    setLoading(null)
  }

  const pwdMismatch = confirmPassword.length > 0 && newPassword !== confirmPassword

  function fmtAudit(dt: Date | string | null | undefined) {
    if (!dt) return null
    return new Date(dt).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
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
          onClick={() => { setActiveTab('config'); setShowEdit(true) }}
          title="Edit konfigurasi user"
          className="text-xs px-2.5 py-1.5 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition"
        >
          Edit
        </button>
      </div>

      {/* ── Popup Edit User ── */}
      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={e => { if (e.target === e.currentTarget) closeEdit() }}
        >
          <div className="bg-white ring-1 ring-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-sm overflow-hidden">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-0">
              <div>
                <h2 className="text-base font-semibold text-[#111827]">Edit User</h2>
                <p className="text-xs text-[#6B7280] mt-0.5">@{user.username}</p>
              </div>
              <button
                onClick={closeEdit}
                className="text-[#6B7280] hover:text-[#111827] text-lg leading-none transition"
              >✕</button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-[#E5E7EB] mt-4 px-6">
              <button
                onClick={() => setActiveTab('config')}
                className={`pb-2.5 text-sm font-medium border-b-2 mr-6 transition ${
                  activeTab === 'config'
                    ? 'border-[#2ECC71] text-[#111827]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >Konfigurasi</button>
              <button
                onClick={() => { setActiveTab('reset'); setResetDone(false) }}
                className={`pb-2.5 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
                  activeTab === 'reset'
                    ? 'border-red-500 text-[#111827]'
                    : 'border-transparent text-[#6B7280] hover:text-[#111827]'
                }`}
              >
                Reset Password
                {user.mustChangePassword && (
                  <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">!</span>
                )}
              </button>
            </div>

            {/* Tab: Konfigurasi */}
            {activeTab === 'config' && (
              <div className="p-6 space-y-5">
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
                  <p className="text-xs text-[#6B7280]">Kosongkan untuk mengikuti limit global ({globalLimit}/hari)</p>
                </div>

                <button
                  onClick={() => call('update_user', {
                    userId: user.id,
                    dailyLimit: limit === '' ? null : parseInt(limit),
                    isActive: user.isActive,
                  })}
                  disabled={loading === 'update_user'}
                  className="w-full bg-[#2ECC71] text-white py-2 rounded-xl text-sm font-medium hover:bg-[#28B765] transition disabled:opacity-50"
                >
                  {loading === 'update_user' ? 'Menyimpan…' : 'Simpan Perubahan'}
                </button>

                <button
                  onClick={() => call('update_user', {
                    userId: user.id,
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
            )}

            {/* Tab: Reset Password */}
            {activeTab === 'reset' && (
              <div className="p-6 space-y-4">

                {/* Audit Trail */}
                <div className="bg-[#F9FAFB] rounded-xl p-3.5 space-y-2 text-xs">
                  <p className="font-medium text-[#111827] text-sm">Riwayat Password</p>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Terakhir diubah</span>
                    <span className="text-[#111827] font-medium">
                      {fmtAudit(user.passwordChangedAt) ?? '—'}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Diubah oleh</span>
                    <span>
                      {user.passwordChangedBy === 'admin' ? (
                        <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-medium">
                          Admin{user.adminResetBy ? ` (${user.adminResetBy})` : ''}
                        </span>
                      ) : user.passwordChangedBy === 'user' ? (
                        <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">User sendiri</span>
                      ) : (
                        <span className="text-[#9CA3AF] italic">—</span>
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between text-[#6B7280]">
                    <span>Status wajib ganti</span>
                    <span>
                      {user.mustChangePassword ? (
                        <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium">⚠ Belum diganti</span>
                      ) : (
                        <span className="bg-[#D4F5E4] text-[#1F9D57] px-2 py-0.5 rounded-full font-medium">✓ Normal</span>
                      )}
                    </span>
                  </div>
                </div>

                {resetDone ? (
                  <div className="text-center py-4 space-y-2">
                    <div className="text-3xl">🔐</div>
                    <p className="text-sm font-medium text-[#111827]">Password berhasil direset!</p>
                    <p className="text-xs text-[#6B7280]">User @{user.username} wajib mengganti password saat login berikutnya.</p>
                    <button
                      onClick={closeEdit}
                      className="mt-2 text-xs px-4 py-1.5 rounded-lg bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] transition"
                    >Tutup</button>
                  </div>
                ) : (
                  <>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[#111827]">Password Baru</label>
                      <div className="relative">
                        <input
                          type={showNewPwd ? 'text' : 'password'}
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          placeholder="Min. 6 karakter"
                          className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2 pr-10 text-sm bg-white text-[#111827]
                            placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-transparent transition"
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] text-xs transition"
                          tabIndex={-1}
                        >
                          {showNewPwd ? '🙈' : '👁'}
                        </button>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-[#111827]">Konfirmasi Password</label>
                      <div className="relative">
                        <input
                          type={showConfirmPwd ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={e => setConfirmPassword(e.target.value)}
                          placeholder="Ulangi password baru"
                          className={`w-full border rounded-xl px-3 py-2 pr-10 text-sm bg-white text-[#111827]
                            placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 transition ${
                            pwdMismatch
                              ? 'border-red-300 focus:ring-red-200'
                              : 'border-[#E5E7EB] focus:ring-red-300 focus:border-transparent'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPwd(v => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] text-xs transition"
                          tabIndex={-1}
                        >
                          {showConfirmPwd ? '🙈' : '👁'}
                        </button>
                      </div>
                      {pwdMismatch && (
                        <p className="text-xs text-red-500">Password tidak cocok</p>
                      )}
                    </div>

                    {/* Info box */}
                    <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 space-y-1">
                      <p className="font-medium">⚠ Perhatian</p>
                      <p>Setelah direset, user akan dipaksa mengganti password saat login berikutnya. Beritahu user password sementara ini secara langsung.</p>
                    </div>

                    <button
                      onClick={handleResetPassword}
                      disabled={loading === 'reset_password' || pwdMismatch || newPassword.length < 6}
                      className="w-full py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {loading === 'reset_password' ? 'Mereset…' : '🔑 Reset Password User'}
                    </button>
                  </>
                )}
              </div>
            )}
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
