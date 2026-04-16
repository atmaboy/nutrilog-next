'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLogin() {
  const [pwd, setPwd] = useState('')
  const [loading, setLoading] = useState(false)
  const [msg, setMsg] = useState('')
  const router = useRouter()

async function login(e: React.FormEvent) {
  e.preventDefault(); setLoading(true); setMsg('')
  const r = await fetch('/api/admin?action=login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: pwd }),
  })
  const d = await r.json()
  if (r.ok) {
    // Set cookie lalu hard redirect (bukan Next.js router)
    document.cookie = `nl_admin_token=${d.token}; path=/; max-age=14400; samesite=strict`
    window.location.href = '/admin'   // ← pakai window.location, bukan router.push
  } else {
    setMsg(d.error || 'Login gagal')
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-card border rounded-2xl shadow-md p-8">
        <div className="mb-8 text-center">
          <div className="text-3xl mb-2">🥗</div>
          <h1 className="text-2xl font-bold">NutriLog Admin</h1>
          <p className="text-sm text-muted-foreground mt-1">Masuk ke panel backoffice</p>
        </div>
        <form onSubmit={login} className="space-y-4">
          <div>
            <label className="text-sm font-medium block mb-1.5">Password</label>
            <input type="password" value={pwd} onChange={e => setPwd(e.target.value)}
              placeholder="••••••••" autoFocus required
              className="w-full border rounded-xl px-4 py-2.5 text-sm bg-background
                focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>
          {msg && <p className="text-sm text-destructive">{msg}</p>}
          <button type="submit" disabled={loading || !pwd}
            className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold
              hover:opacity-90 transition disabled:opacity-50">
            {loading ? 'Masuk…' : 'Masuk'}
          </button>
        </form>
      </div>
    </div>
  )
}