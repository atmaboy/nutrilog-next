'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BrandAnnouncement from '@/components/BrandAnnouncement'

type MaintenanceInfo = { title: string; description: string } | null

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [maintenance, setMaintenance] = useState<MaintenanceInfo>(null)

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    if (token) { router.replace('/main/catat'); return }
    document.documentElement.classList.remove('dark')

    const raw = localStorage.getItem('nl_maintenance')
    if (raw) {
      try { setMaintenance(JSON.parse(raw)) } catch {}
      localStorage.removeItem('nl_maintenance')
    }
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setMaintenance(null)
    try {
      const endpoint = tab === 'login' ? '/api/auth?action=login' : '/api/auth?action=register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      })
      const data = await res.json()

      if (data.maintenance) {
        setMaintenance({
          title: data.maintenance.title || 'Aplikasi Sedang Dalam Pemeliharaan',
          description: data.maintenance.description || 'Silakan coba beberapa saat lagi.',
        })
        return
      }

      if (!res.ok) { setError(data.error || 'Terjadi kesalahan'); return }

      localStorage.setItem('nl_token', data.token)
      localStorage.setItem('nl_user', JSON.stringify(data.user))
      router.replace('/main/catat')
    } catch {
      setError('Tidak dapat terhubung ke server')
    } finally {
      setLoading(false)
    }
  }

  const C = {
    bg: '#F9FAFB',
    white: '#FFFFFF',
    border: '#E5E7EB',
    border2: '#D1D5DB',
    text: '#111827',
    muted: '#6B7280',
    green: '#2ECC71',
    greenDim: '#D4F5E4',
    red: '#EF4444',
  }

  return (
    <div style={{
      minHeight: '100dvh',
      background: C.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 22px',
      fontFamily: "'Inter', sans-serif",
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24, gap: 10 }}>
          <svg width="52" height="52" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="16" cy="16" r="16" fill="#2ECC71"/>
            <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 600,
              fontSize: 28,
              color: C.text,
              lineHeight: 1.2,
            }}>Gizku</div>
            <div style={{ color: C.muted, fontSize: 13, marginTop: 4, fontWeight: 400 }}>
              AI Nutrition Companion
            </div>
          </div>
        </div>

        {/* Brand Announcement */}
        <BrandAnnouncement />

        {/* Maintenance Banner */}
        {maintenance && (
          <div style={{
            background: 'rgba(251,191,36,.08)',
            border: '1px solid rgba(251,191,36,.3)',
            borderRadius: 16,
            padding: '16px 18px',
            marginBottom: 18,
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔧</div>
            <div style={{ fontWeight: 700, fontSize: 15, color: '#D97706', marginBottom: 6 }}>
              {maintenance.title}
            </div>
            <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.5 }}>
              {maintenance.description}
            </div>
          </div>
        )}

        {/* Card */}
        <div style={{
          background: C.white,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 1px 8px rgba(0,0,0,.06)',
        }}>
          {/* Tabs login/register */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: C.bg,
            border: `1px solid ${C.border}`,
            borderRadius: 999,
            padding: 4,
            marginBottom: 20,
            height: 48,
            alignItems: 'center',
          }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError(''); setMaintenance(null) }} style={{
                flex: 1,
                height: '100%',
                borderRadius: 999,
                fontFamily: "'Inter', sans-serif",
                fontWeight: tab === t ? 600 : 500,
                fontSize: 14,
                background: tab === t ? C.greenDim : 'transparent',
                color: tab === t ? C.text : C.muted,
                border: 'none',
                cursor: 'pointer',
                transition: 'all .2s',
              }}>
                {t === 'login' ? 'Masuk' : 'Daftar'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div style={{
                background: 'rgba(239,68,68,.08)',
                border: '1px solid rgba(239,68,68,.2)',
                borderRadius: 10,
                padding: '9px 13px',
                color: C.red,
                fontSize: 13,
                marginBottom: 12,
              }}>{error}</div>
            )}

            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 5 }}>Username</div>
              <input
                type="text" value={username} onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username" required autoFocus
                style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
              />
            </div>

            <div style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 5 }}>Password</div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password" required
                  style={{ width: '100%', background: C.bg, border: `1px solid ${C.border2}`, borderRadius: 12, padding: '12px 44px 12px 14px', color: C.text, fontSize: 15, outline: 'none', boxSizing: 'border-box', fontFamily: "'Inter', sans-serif" }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16 }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: 14, background: C.green, borderRadius: 13,
              color: '#FFFFFF', fontFamily: "'Inter', sans-serif", fontWeight: 700, fontSize: 15,
              border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1, transition: 'opacity .2s',
            }}>
              {loading ? '⏳ Memproses...' : tab === 'login' ? '🚀 Masuk' : '✨ Daftar'}
            </button>
          </form>

          <div style={{ color: C.muted, fontSize: 12, textAlign: 'center', marginTop: 16, lineHeight: 1.6 }}>
            {tab === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <span
              onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError(''); setMaintenance(null) }}
              style={{ color: C.green, cursor: 'pointer', fontWeight: 600 }}
            >
              {tab === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
