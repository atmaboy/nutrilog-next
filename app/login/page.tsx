'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [tab, setTab] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    if (token) router.replace('/main/catat')
  }, [router])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const endpoint = tab === 'login' ? '/api/auth/login' : '/api/auth/register'
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim().toLowerCase(), password }),
      })
      const data = await res.json()
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

  return (
    <div style={{
      minHeight: '100dvh',
      background: 'var(--bg)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '32px 22px',
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{ width: '100%', maxWidth: 380 }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <div style={{
            fontFamily: "'Fraunces', serif",
            fontSize: 32,
            fontWeight: 900,
            color: 'var(--text)',
          }}>
            Nutri<span style={{ color: 'var(--accent)' }}>Log</span>
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginTop: 4 }}>
            Analisa nutrisi makananmu dengan AI
          </div>
        </div>

        {/* Card */}
        <div style={{
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 22,
          padding: 24,
        }}>
          {/* Tabs */}
          <div style={{
            display: 'flex',
            gap: 4,
            background: 'var(--bg)',
            borderRadius: 13,
            padding: 4,
            marginBottom: 20,
          }}>
            {(['login', 'register'] as const).map(t => (
              <button key={t} onClick={() => { setTab(t); setError('') }} style={{
                flex: 1,
                padding: '9px 0',
                borderRadius: 10,
                fontWeight: 600,
                fontSize: 13,
                background: tab === t ? 'var(--accent)' : 'transparent',
                color: tab === t ? '#081520' : 'var(--text-muted)',
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
                background: 'rgba(248,113,113,.1)',
                border: '1px solid rgba(248,113,113,.25)',
                borderRadius: 10,
                padding: '9px 13px',
                color: '#F87171',
                fontSize: 13,
                marginBottom: 12,
              }}>{error}</div>
            )}

            {/* Username */}
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                Username
              </div>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="Masukkan username"
                required
                autoFocus
                style={{
                  width: '100%',
                  background: 'var(--surface2)',
                  border: '1px solid var(--border2)',
                  borderRadius: 12,
                  padding: '12px 14px',
                  color: 'var(--text)',
                  fontSize: 15,
                  outline: 'none',
                  boxSizing: 'border-box',
                }}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom: 13 }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 5 }}>
                Password
              </div>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  required
                  style={{
                    width: '100%',
                    background: 'var(--surface2)',
                    border: '1px solid var(--border2)',
                    borderRadius: 12,
                    padding: '12px 44px 12px 14px',
                    color: 'var(--text)',
                    fontSize: 15,
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
                <button type="button" onClick={() => setShowPass(s => !s)} style={{
                  position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                  background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 16,
                }}>
                  {showPass ? '🙈' : '👁'}
                </button>
              </div>
            </div>

            <button type="submit" disabled={loading} style={{
              width: '100%',
              padding: 14,
              background: 'var(--accent)',
              borderRadius: 13,
              color: '#081520',
              fontWeight: 700,
              fontSize: 15,
              border: 'none',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity .2s',
            }}>
              {loading ? '⏳ Memproses...' : tab === 'login' ? '🚀 Masuk' : '✨ Daftar'}
            </button>
          </form>

          <div style={{ color: 'var(--text-muted)', fontSize: 12, textAlign: 'center', marginTop: 14, lineHeight: 1.6 }}>
            {tab === 'login' ? 'Belum punya akun? ' : 'Sudah punya akun? '}
            <span onClick={() => { setTab(tab === 'login' ? 'register' : 'login'); setError('') }}
              style={{ color: 'var(--accent)', cursor: 'pointer' }}>
              {tab === 'login' ? 'Daftar sekarang' : 'Masuk'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}