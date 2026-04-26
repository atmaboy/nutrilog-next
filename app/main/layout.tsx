'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'

type User = { id: string; username: string }

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [user, setUser] = useState<User | null>(null)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportMsg, setReportMsg] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [dayKcal, setDayKcal] = useState<number | null>(null)
  const [theme, setTheme] = useState<'dark' | 'light'>('dark')

  const forceLogout = useCallback(() => {
    localStorage.removeItem('nl_token')
    localStorage.removeItem('nl_user')
    router.replace('/login')
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    const u = localStorage.getItem('nl_user')
    if (!token || !u) { router.replace('/login'); return }

    const savedTheme = (localStorage.getItem('nl_theme') || 'dark') as 'dark' | 'light'
    setTheme(savedTheme)
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }

    // Validate token against server — if 401, force logout immediately
    validateToken(token, u)
  }, [router])

  async function validateToken(token: string, userStr: string) {
    try {
      const res = await fetch('/api/history?action=today', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) {
        forceLogout()
        return
      }
      // Token valid — set user and load data
      setUser(JSON.parse(userStr))
      const data = await res.json()
      setDayKcal(data.summary?.totalCalories ?? 0)
      checkMaintenance(token)
    } catch {
      // Network error — still allow access, set user
      setUser(JSON.parse(userStr))
      checkMaintenance(token)
    }
  }

  async function checkMaintenance(token: string) {
    try {
      const res = await fetch('/api/maintenance', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      if (data?.enabled) {
        localStorage.setItem('nl_maintenance', JSON.stringify({
          title: data.title || 'Aplikasi Sedang Dalam Pemeliharaan',
          description: data.description || 'Kami sedang melakukan peningkatan sistem. Silakan coba beberapa saat lagi.',
        }))
        forceLogout()
      }
    } catch {
      // fail-open
    }
  }

  function toggleTheme() {
    const next = theme === 'dark' ? 'light' : 'dark'
    setTheme(next)
    localStorage.setItem('nl_theme', next)
    if (next === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }

  function logout() {
    localStorage.removeItem('nl_token')
    localStorage.removeItem('nl_user')
    router.replace('/login')
  }

  async function submitReport() {
    if (!reportMsg.trim()) return
    setReportSending(true)
    try {
      const token = localStorage.getItem('nl_token') || ''
      const res = await fetch('/api/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ message: reportMsg }),
      })
      if (res.status === 401) { forceLogout(); return }
      if (res.ok) { setReportDone(true); setReportMsg('') }
    } finally {
      setReportSending(false)
    }
  }

  // Still loading — validate token first before showing anything
  if (!user) return null

  const initial = user.username[0]?.toUpperCase() ?? 'U'

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&family=Fraunces:wght@700;900&display=swap" rel="stylesheet" />

      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'DM Sans', sans-serif",
      }}>
        {/* ── HEADER ── */}
        <header style={{
          background: 'var(--bg)',
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px 0',
          borderBottom: '1px solid var(--border-custom)',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
          transition: 'background .25s, border-color .25s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
            {/* Logo */}
            <div>
              <div style={{ fontFamily: "'Fraunces', serif", fontSize: 21, fontWeight: 900, color: 'var(--text)' }}>
                Nutri<span style={{ color: 'var(--accent-custom)' }}>Log</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 10, marginTop: 1 }}>AI Food Tracker</div>
            </div>

            {/* Right side */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
              {/* Day kcal pill */}
              {dayKcal !== null && dayKcal > 0 && (
                <div style={{
                  background: 'var(--accent-dim)',
                  border: '1px solid var(--border-custom)',
                  borderRadius: 10,
                  padding: '5px 9px',
                  textAlign: 'center',
                }}>
                  <div style={{ color: 'var(--accent-custom)', fontWeight: 700, fontSize: 14, fontFamily: "'Fraunces', serif" }}>
                    {dayKcal.toLocaleString('id-ID')}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: 9 }}>kkal hari ini</div>
                </div>
              )}

              {/* Theme toggle */}
              <button onClick={toggleTheme} style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'var(--surface)', border: '1px solid var(--border-custom)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 15, cursor: 'pointer',
              }}>
                {theme === 'dark' ? '☀️' : '🌙'}
              </button>

              {/* User chip */}
              <div onClick={() => setShowUserMenu(true)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--border-custom)',
                borderRadius: 20, padding: '5px 10px 5px 7px', cursor: 'pointer',
              }}>
                <div style={{
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'var(--accent-custom)', color: '#081520',
                  fontWeight: 700, fontSize: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {initial}
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.username}
                </span>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'flex', gap: 4,
            background: 'var(--surface)', borderRadius: 13,
            padding: 4, marginBottom: 12,
          }}>
            {[
              { href: '/main/catat', label: '📷 Catat Makan' },
              { href: '/main/riwayat', label: '📊 Riwayat' },
            ].map(({ href, label }) => (
              <Link key={href} href={href} style={{
                flex: 1, padding: '9px 0', borderRadius: 10,
                fontWeight: 600, fontSize: 13,
                textAlign: 'center', textDecoration: 'none',
                background: pathname === href ? 'var(--accent-custom)' : 'transparent',
                color: pathname === href ? '#081520' : 'var(--text-muted)',
                transition: 'all .22s',
              }}>
                {label}
              </Link>
            ))}
          </div>
        </header>

        {/* ── CONTENT ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)' }}>
          {children}
        </main>

        {/* Copyright */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 11, padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))' }}>
          © 2026 NutriLog · dev.wiryawan@gmail.com
        </div>
      </div>

      {/* ── USER MENU OVERLAY ── */}
      {showUserMenu && (
        <div onClick={() => setShowUserMenu(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '22px 22px 0 0',
            width: '100%', maxWidth: 480, padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))',
          }}>
            <div style={{ width: 36, height: 4, background: 'var(--border-custom)', borderRadius: 4, margin: '0 auto 20px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>@{user.username}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 20 }}>Akun NutriLog</div>

            <button onClick={() => { setShowUserMenu(false); setShowReport(true); setReportDone(false) }} style={{
              width: '100%', padding: '13px 16px', borderRadius: 13, marginBottom: 8,
              background: 'var(--surface2)', border: '1px solid var(--border-custom)',
              color: 'var(--text)', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              🚩 Kirim Laporan / Masukan
            </button>

            <button onClick={logout} style={{
              width: '100%', padding: '13px 16px', borderRadius: 13,
              background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
              color: '#F87171', fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left',
            }}>
              🚶 Keluar
            </button>
          </div>
        </div>
      )}

      {/* ── REPORT OVERLAY ── */}
      {showReport && (
        <div onClick={() => setShowReport(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 100,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '22px 22px 0 0',
            width: '100%', maxWidth: 480, padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))',
            maxHeight: '80vh', overflowY: 'auto',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)' }}>🚩 Kirim Laporan</div>
              <button onClick={() => setShowReport(false)} style={{
                background: 'var(--surface2)', border: '1px solid var(--border-custom)',
                borderRadius: 9, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>✕ Tutup</button>
            </div>

            {reportDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 8 }}>Laporan Terkirim!</div>
                <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>Terima kasih atas masukan kamu.</div>
                <button onClick={() => setReportDone(false)} style={{
                  marginTop: 16, padding: '10px 20px', borderRadius: 12,
                  background: 'var(--surface2)', border: '1px solid var(--border-custom)',
                  color: 'var(--text)', fontWeight: 600, fontSize: 13, cursor: 'pointer',
                }}>Kirim Laporan Lain</button>
              </div>
            ) : (
              <>
                <textarea
                  value={reportMsg}
                  onChange={e => setReportMsg(e.target.value.slice(0, 2000))}
                  placeholder="Ceritakan kendalamu atau berikan masukan untuk NutriLog..."
                  rows={6}
                  style={{
                    width: '100%', background: 'var(--surface2)', border: '1px solid var(--border2)',
                    borderRadius: 12, padding: '12px 14px', color: 'var(--text)', fontSize: 14,
                    outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8,
                  }}
                />
                <div style={{ textAlign: 'right', color: 'var(--text-muted)', fontSize: 11, marginBottom: 12 }}>
                  {reportMsg.length}/2000
                </div>
                <button onClick={submitReport} disabled={reportSending || !reportMsg.trim()} style={{
                  width: '100%', padding: 14, borderRadius: 13,
                  background: 'var(--accent-custom)', color: '#081520',
                  fontWeight: 700, fontSize: 15, border: 'none',
                  cursor: reportSending ? 'not-allowed' : 'pointer',
                  opacity: reportSending || !reportMsg.trim() ? 0.6 : 1,
                }}>
                  {reportSending ? '⏳ Mengirim...' : '📤 Kirim Laporan'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
