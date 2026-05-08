'use client'
import { useState } from 'react'

function GizkuLogo() {
  return (
    <svg width="48" height="48" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Gizku">
      <rect x="1.5" y="1.5" width="25" height="25" rx="10" fill="#EAFBF1" stroke="#BBF7D0"/>
      <path d="M8 12.5C8 16.09 10.91 19 14.5 19H18.5C18.78 19 19 18.78 19 18.5C19 18.22 18.78 18 18.5 18H14.5C11.46 18 9 15.54 9 12.5V11.75C9 11.34 9.34 11 9.75 11H20.25C20.66 11 21 11.34 21 11.75V12.5C21 13.33 20.33 14 19.5 14H18" stroke="#2ECC71" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 9C11.6 7.8 12.7 7 14 7C15.1 7 16.1 7.6 16.7 8.5" stroke="#2ECC71" strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M13 14.2L14.4 15.6L17.4 12.6" stroke="#111827" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')

  async function login(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setMsg('')
    const r = await fetch('/api/admin?action=login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pwd }),
    })
    const d = await r.json()
    if (r.ok) {
      document.cookie = `nl_admin_token=${d.token}; path=/; max-age=14400; samesite=strict`
      window.location.href = '/admin'
    } else {
      setMsg(d.error || 'Login gagal')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F9FAFB] flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white ring-1 ring-[#E5E7EB] rounded-2xl shadow-[0_8px_24px_rgba(16,24,40,0.06)] p-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-3">
            <GizkuLogo />
          </div>
          <h1 className="text-[22px] font-semibold text-[#111827] tracking-[-0.02em]">Gizku Admin</h1>
          <p className="text-sm text-[#6B7280] mt-1">Masuk ke panel backoffice</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#111827] block mb-1.5">Password</label>
            <input
              type="password"
              value={pwd}
              onChange={e => setPwd(e.target.value)}
              placeholder="••••••••"
              autoFocus
              required
              className="w-full border border-[#E5E7EB] rounded-xl px-4 py-2.5 text-sm bg-white text-[#111827]
                placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition"
            />
          </div>
          {msg && <p className="text-sm text-red-500">{msg}</p>}
          <button
            type="submit"
            disabled={loading || !pwd}
            className="w-full bg-[#2ECC71] text-white py-2.5 rounded-xl text-sm font-semibold
              hover:bg-[#28B765] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}
