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
  const [showEmailForm, setShowEmailForm] = useState(false)
  const [reportMsg, setReportMsg] = useState('')
  const [reportSending, setReportSending] = useState(false)
  const [reportDone, setReportDone] = useState(false)
  const [dayKcal, setDayKcal] = useState<number | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [emailInput, setEmailInput] = useState('')
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailError, setEmailError] = useState('')
  const [emailSuccess, setEmailSuccess] = useState(false)

  const forceLogout = useCallback(() => {
    localStorage.removeItem('nl_token')
    localStorage.removeItem('nl_user')
    router.replace('/login')
  }, [router])

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    const u = localStorage.getItem('nl_user')
    if (!token || !u) { router.replace('/login'); return }
    document.documentElement.classList.remove('dark')
    validateToken(token, u)
  }, [router])

  async function validateToken(token: string, userStr: string) {
    try {
      const res = await fetch('/api/history?action=today', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (res.status === 401) { forceLogout(); return }
      setUser(JSON.parse(userStr))
      const data = await res.json()
      setDayKcal(data.summary?.totalCalories ?? 0)
      checkMaintenance(token)
      fetchEmail(token)
    } catch {
      setUser(JSON.parse(userStr))
      checkMaintenance(token)
    }
  }

  async function fetchEmail(token: string) {
    try {
      const res = await fetch('/api/user?action=profile', {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      })
      if (!res.ok) return
      const data = await res.json()
      setUserEmail(data.user?.email ?? null)
    } catch { /* fail-open */ }
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
    } catch { /* fail-open */ }
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

  async function saveEmail() {
    const trimmed = emailInput.trim().toLowerCase()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!trimmed) { setEmailError('Email tidak boleh kosong'); return }
    if (!emailRegex.test(trimmed)) { setEmailError('Format email tidak valid'); return }
    setEmailSaving(true)
    setEmailError('')
    try {
      const token = localStorage.getItem('nl_token') || ''
      const res = await fetch('/api/user?action=update_email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ email: trimmed }),
      })
      const data = await res.json()
      if (!res.ok) { setEmailError(data.error || 'Gagal menyimpan email'); return }
      setUserEmail(trimmed)
      setEmailSuccess(true)
      setShowEmailForm(false)
      setEmailInput('')
      setTimeout(() => setEmailSuccess(false), 3000)
    } catch {
      setEmailError('Tidak dapat terhubung ke server')
    } finally {
      setEmailSaving(false)
    }
  }

  if (!user) return null

  const initial = user.username[0]?.toUpperCase() ?? 'U'

  const C = {
    bg: '#F9FAFB',
    white: '#FFFFFF',
    border: '#E5E7EB',
    text: '#111827',
    muted: '#6B7280',
    green: '#2ECC71',
    greenDim: '#D4F5E4',
    red: '#EF4444',
    orange: '#F59E0B',
    orangeDim: '#FEF3C7',
  }

  // SVG icons — consistent with backoffice sidebar
  const IconReport = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  )

  const IconLogout = (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  )

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Montserrat:wght@600;700&display=swap" rel="stylesheet" />

      <div style={{
        maxWidth: 480,
        margin: '0 auto',
        minHeight: '100dvh',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', sans-serif",
        background: C.bg,
      }}>

        {/* ── HEADER ── */}
        <header style={{
          background: C.bg,
          padding: 'calc(10px + env(safe-area-inset-top, 0px)) 16px 0',
          position: 'sticky',
          top: 0,
          zIndex: 10,
          flexShrink: 0,
        }}>
          <div style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="16" cy="16" r="16" fill="#2ECC71"/>
                <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
                <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
                <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
              <div>
                <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 600, fontSize: 20, color: C.text, lineHeight: 1.2 }}>Gizku</div>
                <div style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 12, color: C.muted, lineHeight: 1.2 }}>AI Nutrition Companion</div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 96, height: 40, background: C.white, border: `1px solid ${C.border}`, borderRadius: 999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 600, fontSize: 16, color: C.text, lineHeight: 1.1 }}>
                  {dayKcal !== null ? dayKcal.toLocaleString('id-ID') : '—'}
                </span>
                <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 400, fontSize: 11, color: C.muted, lineHeight: 1.1 }}>kkal hari ini</span>
              </div>

              <div onClick={() => setShowUserMenu(true)} style={{ display: 'flex', alignItems: 'center', gap: 6, background: C.white, border: `1px solid ${C.border}`, borderRadius: 999, padding: '5px 10px 5px 7px', cursor: 'pointer', flexShrink: 0, position: 'relative' }}>
                <div style={{ width: 24, height: 24, borderRadius: '50%', background: C.green, color: '#fff', fontWeight: 700, fontSize: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Montserrat', sans-serif" }}>{initial}</div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text, maxWidth: 72, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</span>
                {/* Dot indicator kalau belum ada email */}
                {userEmail === null && (
                  <span style={{ position: 'absolute', top: 4, right: 4, width: 7, height: 7, borderRadius: '50%', background: C.orange, border: `1.5px solid ${C.white}` }} />
                )}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', background: C.white, border: `1px solid ${C.border}`, borderRadius: 999, padding: 4, marginTop: 8, marginBottom: 12, height: 56, alignItems: 'center' }}>
            {([
              { href: '/main/catat', label: 'Catat Makan', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></svg>) },
              { href: '/main/riwayat', label: 'Riwayat', icon: (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>) },
            ] as const).map(({ href, label, icon }) => {
              const active = pathname === href
              return (
                <Link key={href} href={href} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, height: '100%', borderRadius: 999, fontFamily: "'Inter', sans-serif", fontWeight: active ? 600 : 500, fontSize: 14, textDecoration: 'none', background: active ? C.greenDim : 'transparent', color: active ? C.text : C.muted, transition: 'all .2s' }}>
                  <span style={{ color: active ? C.green : C.muted }}>{icon}</span>
                  {label}
                </Link>
              )
            })}
          </div>
        </header>

        <main style={{ flex: 1, overflowY: 'auto', padding: '14px 16px calc(env(safe-area-inset-bottom, 0px) + 14px)', background: C.bg }}>
          {children}
        </main>

        <div style={{ textAlign: 'center', color: C.muted, fontSize: 11, fontFamily: "'Inter', sans-serif", padding: '8px 0 calc(8px + env(safe-area-inset-bottom, 0px))', background: C.bg }}>
          © 2026 Gizku · dev.wiryawan@gmail.com
        </div>
      </div>

      {/* ── USER MENU OVERLAY ── */}
      {showUserMenu && (
        <div onClick={() => { setShowUserMenu(false); setShowEmailForm(false); setEmailError(''); setEmailInput('') }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480, padding: '20px 20px calc(20px + env(safe-area-inset-bottom, 0px))', boxShadow: '0 -4px 24px rgba(0,0,0,.08)' }}>
            <div style={{ width: 36, height: 4, background: '#E5E7EB', borderRadius: 4, margin: '0 auto 20px' }} />
            <div style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 2, fontFamily: "'Montserrat', sans-serif" }}>@{user.username}</div>

            {/* Email section */}
            <div style={{ marginBottom: 20 }}>
              {userEmail ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ color: C.muted, fontSize: 13 }}>✉️ {userEmail}</span>
                  <button onClick={() => { setShowEmailForm(f => !f); setEmailInput(userEmail ?? ''); setEmailError('') }} style={{ fontSize: 12, color: C.green, fontWeight: 600, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>Ubah</button>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: C.orangeDim, border: `1px solid rgba(245,158,11,.25)`, borderRadius: 10, padding: '8px 12px' }}>
                  <span style={{ color: '#92400E', fontSize: 13, fontWeight: 500 }}>✉️ Tambah Email</span>
                  <button onClick={() => { setShowEmailForm(f => !f); setEmailInput(''); setEmailError('') }} style={{ fontSize: 12, color: C.orange, fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer', padding: '2px 6px' }}>+ Tambah</button>
                </div>
              )}

              {/* Inline email form */}
              {showEmailForm && (
                <div style={{ marginTop: 10 }}>
                  {emailError && (
                    <div style={{ background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', borderRadius: 8, padding: '7px 11px', color: C.red, fontSize: 12, marginBottom: 8 }}>{emailError}</div>
                  )}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      type="email" value={emailInput} onChange={e => { setEmailInput(e.target.value); setEmailError('') }}
                      placeholder="email@contoh.com"
                      style={{ flex: 1, background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '10px 12px', color: C.text, fontSize: 14, outline: 'none', fontFamily: "'Inter', sans-serif" }}
                    />
                    <button onClick={saveEmail} disabled={emailSaving} style={{ padding: '10px 16px', background: C.green, color: '#fff', borderRadius: 10, border: 'none', fontWeight: 600, fontSize: 13, cursor: emailSaving ? 'not-allowed' : 'pointer', opacity: emailSaving ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>
                      {emailSaving ? '...' : 'Simpan'}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Success toast */}
            {emailSuccess && (
              <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 10, padding: '8px 12px', color: '#15803D', fontSize: 13, fontWeight: 500, marginBottom: 12 }}>✅ Email berhasil disimpan</div>
            )}

            <button
              onClick={() => { setShowUserMenu(false); setShowEmailForm(false); setShowReport(true); setReportDone(false) }}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 13, marginBottom: 8, background: '#F9FAFB', border: `1px solid ${C.border}`, color: C.text, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ color: C.muted, display: 'flex', alignItems: 'center' }}>{IconReport}</span>
              Kirim Laporan / Masukan
            </button>

            <button
              onClick={logout}
              style={{ width: '100%', padding: '13px 16px', borderRadius: 13, background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)', color: C.red, fontWeight: 600, fontSize: 14, cursor: 'pointer', textAlign: 'left', display: 'flex', alignItems: 'center', gap: 10 }}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>{IconLogout}</span>
              Keluar
            </button>
          </div>
        </div>
      )}

      {/* ── REPORT OVERLAY ── */}
      {showReport && (
        <div onClick={() => setShowReport(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 100, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#FFFFFF', borderRadius: '22px 22px 0 0', width: '100%', maxWidth: 480, padding: '20px 20px calc(24px + env(safe-area-inset-bottom, 0px))', maxHeight: '80vh', overflowY: 'auto', boxShadow: '0 -4px 24px rgba(0,0,0,.08)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ fontWeight: 700, fontSize: 16, color: C.text, fontFamily: "'Montserrat', sans-serif", display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: C.muted, display: 'flex', alignItems: 'center' }}>{IconReport}</span>
                Kirim Laporan
              </div>
              <button onClick={() => setShowReport(false)} style={{ background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 9, padding: '6px 12px', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>✕ Tutup</button>
            </div>

            {reportDone ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 12 }}>✅</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.text, marginBottom: 8, fontFamily: "'Montserrat', sans-serif" }}>Laporan Terkirim!</div>
                <div style={{ color: C.muted, fontSize: 13 }}>Terima kasih atas masukan kamu.</div>
                <button onClick={() => setReportDone(false)} style={{ marginTop: 16, padding: '10px 20px', borderRadius: 12, background: '#F9FAFB', border: `1px solid ${C.border}`, color: C.text, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>Kirim Laporan Lain</button>
              </div>
            ) : (
              <>
                <textarea
                  value={reportMsg} onChange={e => setReportMsg(e.target.value.slice(0, 2000))}
                  placeholder="Ceritakan kendalamu atau berikan masukan untuk Gizku..."
                  rows={6}
                  style={{ width: '100%', background: '#F9FAFB', border: `1px solid ${C.border}`, borderRadius: 12, padding: '12px 14px', color: C.text, fontSize: 14, outline: 'none', resize: 'none', boxSizing: 'border-box', marginBottom: 8, fontFamily: "'Inter', sans-serif" }}
                />
                <div style={{ textAlign: 'right', color: C.muted, fontSize: 11, marginBottom: 12 }}>{reportMsg.length}/2000</div>
                <button onClick={submitReport} disabled={reportSending || !reportMsg.trim()} style={{ width: '100%', padding: 14, borderRadius: 13, background: C.green, color: '#FFFFFF', fontWeight: 700, fontSize: 15, border: 'none', cursor: reportSending ? 'not-allowed' : 'pointer', opacity: reportSending || !reportMsg.trim() ? 0.6 : 1, fontFamily: "'Inter', sans-serif" }}>
                  {reportSending ? '⏳ Mengirim...' : 'Kirim Laporan'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  )
}
