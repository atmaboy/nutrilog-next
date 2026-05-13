'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

type LandingRow = {
  id: number
  section: string
  slug: string
  title: string
  subtitle: string | null
  body: string | null
  meta: Record<string, unknown> | null
  isActive: boolean
  sortOrder: number
}

type LandingData = Record<string, LandingRow[]>

// Default fallback kalau API belum ada data
const DEFAULTS: LandingData = {
  hero: [{
    id: 0, section: 'hero', slug: 'hero-main',
    title: 'Makan Cerdas. Hidup Lebih Baik.',
    subtitle: 'AI Nutrition Companion yang membuat pelacakan kalori jadi mudah, informatif, dan personal.',
    body: null,
    meta: { cta_label: 'Mulai Sekarang', cta_url_guest: '/login', cta_url_auth: '/main/catat' },
    isActive: true, sortOrder: 0,
  }],
  how_it_works: [
    { id: 1, section: 'how_it_works', slug: 'step-1', title: 'Foto Makananmu', subtitle: 'Ambil foto makanan dari kamera atau galeri.', body: null, meta: { icon: '📸', step: 1 }, isActive: true, sortOrder: 1 },
    { id: 2, section: 'how_it_works', slug: 'step-2', title: 'AI Analisa Otomatis', subtitle: 'AI kami mendeteksi bahan dan menghitung nutrisi secara instan.', body: null, meta: { icon: '🤖', step: 2 }, isActive: true, sortOrder: 2 },
    { id: 3, section: 'how_it_works', slug: 'step-3', title: 'Pantau Progressmu', subtitle: 'Lihat ringkasan harian kalori, protein, karbo, dan lemak.', body: null, meta: { icon: '📊', step: 3 }, isActive: true, sortOrder: 3 },
  ],
  features: [
    { id: 4, section: 'features', slug: 'fitur-scan',    title: 'Scan & Catat dalam Detik', subtitle: 'Cukup foto, AI langsung kenali makanan dan hitung nutrisinya.', body: null, meta: { icon: '🔍' }, isActive: true, sortOrder: 1 },
    { id: 5, section: 'features', slug: 'fitur-insight', title: 'Insight AI Personal',      subtitle: 'Rekomendasi nutrisi disesuaikan dengan target dan riwayat makanmu.', body: null, meta: { icon: '💡' }, isActive: true, sortOrder: 2 },
    { id: 6, section: 'features', slug: 'fitur-habit',   title: 'Bangun Kebiasaan Sehat',   subtitle: 'Streak harian dan ringkasan mingguan membuatmu tetap konsisten.', body: null, meta: { icon: '🌱' }, isActive: true, sortOrder: 3 },
  ],
  stats: [
    { id: 7, section: 'stats', slug: 'stat-users',    title: '10.000+',  subtitle: 'Pengguna Aktif',      body: null, meta: { icon: '👥' }, isActive: true, sortOrder: 1 },
    { id: 8, section: 'stats', slug: 'stat-meals',    title: '500.000+', subtitle: 'Makanan Dianalisa',   body: null, meta: { icon: '🍽️' }, isActive: true, sortOrder: 2 },
    { id: 9, section: 'stats', slug: 'stat-accuracy', title: '95%',      subtitle: 'Akurasi Analisa AI',  body: null, meta: { icon: '🎯' }, isActive: true, sortOrder: 3 },
  ],
  cta: [{
    id: 10, section: 'cta', slug: 'cta-bottom',
    title: 'Mulai Perjalanan Sehatmu Hari Ini',
    subtitle: 'Gratis. Tanpa kartu kredit. Langsung pakai.',
    body: null,
    meta: { cta_label: 'Mulai Sekarang', cta_url_guest: '/login', cta_url_auth: '/main/catat' },
    isActive: true, sortOrder: 0,
  }],
}

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [content, setContent]       = useState<LandingData>(DEFAULTS)

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    if (token) setIsLoggedIn(true)
  }, [])

  useEffect(() => {
    fetch('/api/landing-content')
      .then(r => r.json())
      .then(j => { if (j.data && Object.keys(j.data).length > 0) setContent(j.data) })
      .catch(() => { /* pakai default */ })
  }, [])

  function ctaUrl(meta: Record<string, unknown> | null) {
    if (!meta) return isLoggedIn ? '/main/catat' : '/login'
    return isLoggedIn
      ? (meta.cta_url_auth as string) ?? '/main/catat'
      : (meta.cta_url_guest as string) ?? '/login'
  }

  function ctaLabel(meta: Record<string, unknown> | null, fallback = 'Mulai Sekarang') {
    return (meta?.cta_label as string) ?? fallback
  }

  const hero     = content.hero?.[0]
  const steps    = content.how_it_works ?? []
  const features = content.features ?? []
  const stats    = content.stats ?? []
  const cta      = content.cta?.[0]

  const C = {
    green: '#2ECC71', greenDark: '#27AE60', greenLight: '#D4F5E4',
    greenMid: '#E8FAF0', text: '#111827', muted: '#6B7280',
    bg: '#F9FAFB', white: '#FFFFFF', border: '#E5E7EB',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.white, minHeight: '100dvh', color: C.text }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px', height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill={C.green}/>
            <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: C.text }}>Gizku</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLoggedIn ? (
            <button onClick={() => router.push('/main/catat')} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>
              Buka Aplikasi
            </button>
          ) : (
            <>
              <button onClick={() => router.push('/login')} style={{ background: 'transparent', color: C.muted, border: 'none', fontSize: 14, fontWeight: 500, cursor: 'pointer', padding: '8px 12px' }}>Masuk</button>
              <button onClick={() => router.push('/login')} style={{ background: C.green, color: C.white, border: 'none', borderRadius: 999, padding: '8px 20px', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Daftar Gratis</button>
            </>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{ padding: '72px 24px 0', textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, background: C.greenMid, border: `1px solid ${C.greenLight}`, borderRadius: 999, padding: '6px 16px', fontSize: 13, fontWeight: 600, color: C.greenDark, marginBottom: 28 }}>
          <span style={{ fontSize: 15 }}>✨</span> Didukung teknologi AI
        </div>
        <h1 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(2.2rem, 6vw, 3.5rem)', lineHeight: 1.15, color: C.text, marginBottom: 24, letterSpacing: '-0.02em' }}>
          {hero?.title.includes('.') ? (
            <>
              {hero.title.split('.').filter(Boolean).map((part, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1
                    ? <span style={{ color: C.green }}>{part.trim()}.</span>
                    : <>{part.trim()}.<br /></>}
                </span>
              ))}
            </>
          ) : (
            <>{hero?.title.split(' ').map((w, i, arr) => i >= arr.length - 2 ? <span key={i} style={{ color: C.green }}>{w} </span> : <span key={i}>{w} </span>)}</>
          )}
        </h1>
        <p style={{ fontSize: 'clamp(1rem, 2.5vw, 1.2rem)', color: C.muted, lineHeight: 1.7, maxWidth: 560, margin: '0 auto 40px' }}>
          {hero?.subtitle ?? 'AI Nutrition Companion yang membuat pelacakan kalori jadi mudah, informatif, dan personal.'}
        </p>
        <button
          onClick={() => router.push(ctaUrl(hero?.meta ?? null))}
          style={{ background: C.green, color: C.white, border: 'none', borderRadius: 999, padding: '16px 40px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px rgba(46,204,113,0.35)`, transition: 'transform 0.15s, box-shadow 0.15s', marginBottom: 16 }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(46,204,113,0.45)' }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(46,204,113,0.35)' }}
        >
          {isLoggedIn ? '🥗 Catat Makan Sekarang' : ctaLabel(hero?.meta ?? null)}
        </button>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 64 }}>Tidak perlu kartu kredit · Langsung bisa dipakai</div>

        {/* App Preview Card */}
        <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 24, padding: 24, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', maxWidth: 360, margin: '0 auto', textAlign: 'left' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🥗</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Gado-gado</div>
              <div style={{ fontSize: 12, color: C.muted }}>Makan siang · barusan</div>
            </div>
            <div style={{ marginLeft: 'auto', background: C.greenLight, color: C.greenDark, borderRadius: 999, padding: '4px 12px', fontSize: 12, fontWeight: 700 }}>340 kal</div>
          </div>
          {[{ label: 'Protein', val: 18, pct: 30, color: '#2563EB' }, { label: 'Karbo', val: 42, pct: 21, color: '#D97706' }, { label: 'Lemak', val: 14, pct: 20, color: '#DC2626' }].map(m => (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.muted, fontWeight: 500 }}>{m.label}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{m.val}g</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: C.border }}>
                <div style={{ height: '100%', width: `${m.pct}%`, borderRadius: 999, background: m.color }} />
              </div>
            </div>
          ))}
          <div style={{ marginTop: 16, background: C.greenMid, border: `1px solid ${C.greenLight}`, borderRadius: 12, padding: '10px 14px', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, marginBottom: 2 }}>AI Insight</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>Pilihan bagus! Gado-gado kaya serat dan protein nabati.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WAVE ─── */}
      <div style={{ marginTop: 64, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={C.greenMid}/>
        </svg>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ background: C.greenMid, padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: C.text, marginBottom: 12 }}>Cara kerja Gizku</h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>Tiga langkah mudah untuk mulai memahami nutrisi makananmu setiap hari.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={step.id} style={{ background: C.white, borderRadius: 20, padding: 28, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(0,0,0,0.04)' }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: C.greenLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>
                  {(step.meta?.icon as string) ?? ['📸','🧠','📊'][i] ?? '✨'}
                </div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: 1, marginBottom: 8 }}>LANGKAH 0{(step.meta?.step as number) ?? i + 1}</div>
                <h3 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 10 }}>{step.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{step.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAVE 2 ─── */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
          <path d="M0,40 C360,0 1080,80 1440,40 L1440,0 L0,0 Z" fill={C.greenMid}/>
        </svg>
      </div>

      {/* ─── FEATURES ─── */}
      <section style={{ background: C.white, padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(1.5rem, 4vw, 2.2rem)', color: C.text, marginBottom: 12 }}>Fitur unggulan</h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>Dirancang agar mencatat nutrisi terasa natural, bukan beban.</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {features.map(f => (
              <div key={f.id} style={{ borderRadius: 16, padding: '20px 22px', border: `1px solid ${C.border}`, background: C.bg }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{(f.meta?.icon as string) ?? '✨'}</div>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ background: C.green, padding: '56px 24px' }}>
        <div style={{ maxWidth: 720, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 32, textAlign: 'center' }}>
          {stats.map(s => (
            <div key={s.id}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{(s.meta?.icon as string) ?? '📊'}</div>
              <div style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(1.6rem, 4vw, 2.2rem)', color: C.white, marginBottom: 6 }}>{s.title}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{s.subtitle}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section style={{ background: C.bg, padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 'clamp(1.6rem, 4vw, 2.5rem)', color: C.text, marginBottom: 16 }}>
            {cta?.title.split(' ').map((w, i, arr) =>
              i >= arr.length - 2
                ? <span key={i} style={{ color: C.green }}>{w} </span>
                : <span key={i}>{w} </span>
            )}
          </h2>
          <p style={{ color: C.muted, fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>{cta?.subtitle ?? 'Bergabung sekarang dan mulai pahami apa yang kamu makan setiap hari.'}</p>
          <button
            onClick={() => router.push(ctaUrl(cta?.meta ?? null))}
            style={{ background: C.green, color: C.white, border: 'none', borderRadius: 999, padding: '16px 44px', fontSize: 17, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 20px rgba(46,204,113,0.35)`, transition: 'transform 0.15s, box-shadow 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(46,204,113,0.45)' }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'; (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(46,204,113,0.35)' }}
          >
            {isLoggedIn ? '🥗 Catat Makan Sekarang' : ctaLabel(cta?.meta ?? null)}
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ background: C.text, color: 'rgba(255,255,255,0.6)', padding: '32px 24px', textAlign: 'center', fontSize: 13 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill={C.green}/>
            <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: '#fff' }}>Gizku</span>
        </div>
        <div style={{ marginBottom: 8 }}>AI Nutrition Companion · Analisa nutrisi dari foto makananmu</div>
        <div>© {new Date().getFullYear()} Gizku. Dibuat dengan 💚 untuk hidup lebih sehat.</div>
      </footer>
    </div>
  )
}
