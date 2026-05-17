'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

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
    { id: 1, section: 'how_it_works', slug: 'step-1', title: 'Foto Makananmu', subtitle: 'Ambil foto makanan dari kamera atau galeri — tidak perlu input manual.', body: null, meta: { step: 1 }, isActive: true, sortOrder: 1 },
    { id: 2, section: 'how_it_works', slug: 'step-2', title: 'AI Analisa Otomatis', subtitle: 'AI kami mendeteksi bahan dan menghitung nutrisi secara instan dan akurat.', body: null, meta: { step: 2 }, isActive: true, sortOrder: 2 },
    { id: 3, section: 'how_it_works', slug: 'step-3', title: 'Pantau Progressmu', subtitle: 'Lihat ringkasan harian kalori, protein, karbo, dan lemak setiap saat.', body: null, meta: { step: 3 }, isActive: true, sortOrder: 3 },
  ],
  features: [
    { id: 4, section: 'features', slug: 'fitur-scan',    title: 'Scan & Catat dalam Detik', subtitle: 'Cukup foto, AI langsung kenali makanan dan hitung nutrisinya secara otomatis.', body: null, meta: null, isActive: true, sortOrder: 1 },
    { id: 5, section: 'features', slug: 'fitur-insight', title: 'Insight AI Personal',       subtitle: 'Rekomendasi nutrisi disesuaikan dengan target dan riwayat makanmu.', body: null, meta: null, isActive: true, sortOrder: 2 },
    { id: 6, section: 'features', slug: 'fitur-habit',   title: 'Bangun Kebiasaan Sehat',    subtitle: 'Streak harian dan ringkasan mingguan membuatmu tetap konsisten.', body: null, meta: null, isActive: true, sortOrder: 3 },
  ],
  stats: [
    { id: 7, section: 'stats', slug: 'stat-users',    title: '10.000+',  subtitle: 'Pengguna Aktif',     body: null, meta: null, isActive: true, sortOrder: 1 },
    { id: 8, section: 'stats', slug: 'stat-meals',    title: '500.000+', subtitle: 'Makanan Dianalisa',  body: null, meta: null, isActive: true, sortOrder: 2 },
    { id: 9, section: 'stats', slug: 'stat-accuracy', title: '95%',      subtitle: 'Akurasi Analisa AI', body: null, meta: null, isActive: true, sortOrder: 3 },
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

// ─── Icon components (no external deps) ───────────────────────────────────────

function IconCamera() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  )
}

function IconCpu() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2"/>
      <rect x="9" y="9" width="6" height="6"/>
      <path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M20 9h3M1 15h3M20 15h3"/>
    </svg>
  )
}

function IconTrendingUp() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
      <polyline points="17 6 23 6 23 12"/>
    </svg>
  )
}

function IconZap() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  )
}

function IconTarget() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <circle cx="12" cy="12" r="6"/>
      <circle cx="12" cy="12" r="2"/>
    </svg>
  )
}

function IconLeaf() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 19.5A10 10 0 0 0 21.97 8.4C18.97 7.76 14 8 9 14"/>
    </svg>
  )
}

function IconUsers() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

const STEP_ICONS = [<IconCamera key="cam" />, <IconCpu key="cpu" />, <IconTrendingUp key="trend" />]
const FEATURE_ICONS = [<IconZap key="zap" />, <IconTarget key="target" />, <IconLeaf key="leaf" />]

// ─── Main component ────────────────────────────────────────────────────────────

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [content, setContent] = useState<LandingData>(DEFAULTS)

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

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');

        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html { scroll-behavior: smooth; }

        .gizku-root {
          font-family: 'Plus Jakarta Sans', sans-serif;
          background: #ffffff;
          color: #111827;
          min-height: 100dvh;
          -webkit-font-smoothing: antialiased;
        }

        /* Navbar */
        .gk-nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(255,255,255,0.92);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          border-bottom: 1px solid #E5E7EB;
          padding: 0 clamp(16px, 5vw, 40px);
          height: 64px;
          display: flex; align-items: center; justify-content: space-between;
        }
        .gk-logo { display: flex; align-items: center; gap: 9px; text-decoration: none; }
        .gk-logo-text { font-size: 20px; font-weight: 800; color: #111827; }
        .gk-nav-links { display: flex; align-items: center; gap: 8px; }
        .gk-btn-ghost {
          background: transparent; border: none; color: #6B7280;
          font-size: 14px; font-weight: 500; cursor: pointer;
          padding: 8px 14px; border-radius: 8px;
          transition: color 0.15s, background 0.15s;
        }
        .gk-btn-ghost:hover { color: #111827; background: #F3F4F6; }
        .gk-btn-primary {
          background: #2ECC71; color: #fff; border: none;
          border-radius: 999px; padding: 9px 22px;
          font-size: 14px; font-weight: 700; cursor: pointer;
          transition: transform 0.15s, box-shadow 0.15s, background 0.15s;
          box-shadow: 0 2px 12px rgba(46,204,113,0.3);
          font-family: inherit;
        }
        .gk-btn-primary:hover { background: #27AE60; transform: translateY(-1px); box-shadow: 0 6px 20px rgba(46,204,113,0.4); }
        .gk-btn-primary:active { transform: translateY(0); }

        /* Hero */
        .gk-hero {
          padding: clamp(64px,10vw,100px) clamp(16px,5vw,40px) 0;
          text-align: center; max-width: 760px; margin: 0 auto;
        }
        .gk-badge {
          display: inline-flex; align-items: center; gap: 7px;
          background: #E8FAF0; border: 1px solid #A7F3D0;
          border-radius: 999px; padding: 6px 16px;
          font-size: 13px; font-weight: 600; color: #059669;
          margin-bottom: 28px;
        }
        .gk-badge-dot {
          width: 7px; height: 7px; border-radius: 50%;
          background: #10B981;
          box-shadow: 0 0 0 3px rgba(16,185,129,0.2);
          animation: pulse 2s ease-in-out infinite;
        }
        @keyframes pulse {
          0%, 100% { box-shadow: 0 0 0 3px rgba(16,185,129,0.2); }
          50% { box-shadow: 0 0 0 6px rgba(16,185,129,0.08); }
        }
        .gk-hero-title {
          font-size: clamp(2.4rem, 6.5vw, 4rem);
          font-weight: 800; line-height: 1.1;
          letter-spacing: -0.03em;
          color: #111827;
          margin-bottom: 20px;
        }
        .gk-hero-title span { color: #2ECC71; }
        .gk-hero-sub {
          font-size: clamp(1rem, 2.5vw, 1.15rem);
          color: #6B7280; line-height: 1.75;
          max-width: 520px; margin: 0 auto 40px;
        }
        .gk-hero-cta-wrap { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-bottom: 64px; }
        .gk-btn-hero {
          background: #2ECC71; color: #fff; border: none;
          border-radius: 999px; padding: 16px 44px;
          font-size: 17px; font-weight: 800; cursor: pointer;
          box-shadow: 0 4px 24px rgba(46,204,113,0.38);
          transition: transform 0.18s, box-shadow 0.18s, background 0.18s;
          font-family: inherit; letter-spacing: -0.01em;
        }
        .gk-btn-hero:hover { background: #27AE60; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(46,204,113,0.48); }
        .gk-btn-hero:active { transform: translateY(0); }
        .gk-hero-note { font-size: 13px; color: #9CA3AF; }
        .gk-hero-note span { color: #6B7280; font-weight: 500; }

        /* App preview card */
        .gk-preview-card {
          background: #F9FAFB; border: 1px solid #E5E7EB;
          border-radius: 24px; padding: 22px;
          box-shadow: 0 8px 48px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04);
          max-width: 340px; margin: 0 auto; text-align: left;
        }
        .gk-preview-header { display: flex; align-items: center; gap: 11px; margin-bottom: 18px; }
        .gk-preview-icon {
          width: 42px; height: 42px; border-radius: 12px;
          background: #D4F5E4; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .gk-preview-icon svg { width: 22px; height: 22px; color: #059669; }
        .gk-preview-food-name { font-weight: 700; font-size: 15px; color: #111827; }
        .gk-preview-food-sub { font-size: 12px; color: #9CA3AF; margin-top: 2px; }
        .gk-preview-kal {
          margin-left: auto; background: #D4F5E4; color: #059669;
          border-radius: 999px; padding: 4px 12px;
          font-size: 13px; font-weight: 700;
        }
        .gk-macro-row { margin-bottom: 10px; }
        .gk-macro-labels { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 5px; }
        .gk-macro-label { color: #9CA3AF; font-weight: 500; }
        .gk-macro-val { color: #111827; font-weight: 600; }
        .gk-macro-bar { height: 6px; border-radius: 999px; background: #E5E7EB; overflow: hidden; }
        .gk-macro-fill { height: 100%; border-radius: 999px; transition: width 0.6s ease; }
        .gk-ai-insight {
          margin-top: 16px; background: #E8FAF0;
          border: 1px solid #A7F3D0; border-radius: 14px;
          padding: 12px 14px; display: flex; gap: 10px; align-items: flex-start;
        }
        .gk-ai-icon {
          width: 32px; height: 32px; border-radius: 10px;
          background: #2ECC71; display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .gk-ai-tag { font-size: 11px; font-weight: 700; color: #059669; margin-bottom: 3px; letter-spacing: 0.04em; }
        .gk-ai-text { font-size: 12px; color: #374151; line-height: 1.5; }

        /* Wave divider */
        .gk-wave { line-height: 0; display: block; }
        .gk-wave svg { width: 100%; display: block; }

        /* How it works */
        .gk-section { padding: clamp(48px,8vw,80px) clamp(16px,5vw,40px); }
        .gk-section-inner { max-width: 1000px; margin: 0 auto; }
        .gk-section-header { text-align: center; margin-bottom: clamp(32px,5vw,52px); }
        .gk-section-tag {
          display: inline-block;
          font-size: 12px; font-weight: 700; color: #059669;
          letter-spacing: 0.08em; text-transform: uppercase;
          background: #E8FAF0; border-radius: 999px;
          padding: 5px 14px; margin-bottom: 14px;
        }
        .gk-section-title {
          font-size: clamp(1.6rem, 4vw, 2.4rem);
          font-weight: 800; color: #111827;
          letter-spacing: -0.025em; line-height: 1.2;
          margin-bottom: 12px;
        }
        .gk-section-sub { font-size: 16px; color: #6B7280; max-width: 480px; margin: 0 auto; line-height: 1.7; }

        .gk-steps-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 20px; }
        .gk-step-card {
          background: #fff; border-radius: 20px; padding: clamp(20px,3vw,28px);
          border: 1px solid #E5E7EB;
          box-shadow: 0 2px 12px rgba(0,0,0,0.04);
          position: relative; overflow: hidden;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .gk-step-card:hover { transform: translateY(-3px); box-shadow: 0 8px 32px rgba(0,0,0,0.08); }
        .gk-step-num {
          font-size: 11px; font-weight: 700; color: #2ECC71;
          letter-spacing: 0.08em; margin-bottom: 10px;
        }
        .gk-step-icon-wrap {
          width: 52px; height: 52px; border-radius: 14px;
          background: #E8FAF0; color: #059669;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .gk-step-title { font-size: 17px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .gk-step-sub { font-size: 14px; color: #6B7280; line-height: 1.65; }

        /* Features */
        .gk-features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 16px; }
        .gk-feature-card {
          border-radius: 18px; padding: clamp(18px,3vw,24px);
          border: 1px solid #E5E7EB; background: #F9FAFB;
          transition: transform 0.2s, box-shadow 0.2s;
        }
        .gk-feature-card:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.06); }
        .gk-feature-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          background: #E8FAF0; color: #059669;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 14px;
        }
        .gk-feature-title { font-size: 16px; font-weight: 700; color: #111827; margin-bottom: 8px; }
        .gk-feature-sub { font-size: 13px; color: #6B7280; line-height: 1.6; }

        /* Stats */
        .gk-stats-section {
          background: #2ECC71;
          padding: clamp(48px,8vw,72px) clamp(16px,5vw,40px);
        }
        .gk-stats-inner {
          max-width: 800px; margin: 0 auto;
          display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: 32px; text-align: center;
        }
        .gk-stat-icon-wrap {
          width: 44px; height: 44px; border-radius: 12px;
          background: rgba(255,255,255,0.2);
          display: flex; align-items: center; justify-content: center;
          margin: 0 auto 10px; color: #fff;
        }
        .gk-stat-num {
          font-size: clamp(2rem,5vw,2.8rem); font-weight: 800;
          color: #fff; letter-spacing: -0.03em; margin-bottom: 6px;
        }
        .gk-stat-label { font-size: 14px; color: rgba(255,255,255,0.85); font-weight: 500; }

        /* CTA bottom */
        .gk-cta-section {
          background: #F0FDF4; padding: clamp(64px,10vw,96px) clamp(16px,5vw,40px);
          text-align: center;
        }
        .gk-cta-inner { max-width: 580px; margin: 0 auto; }
        .gk-cta-title {
          font-size: clamp(1.8rem, 4.5vw, 2.8rem);
          font-weight: 800; color: #111827;
          letter-spacing: -0.025em; line-height: 1.15;
          margin-bottom: 16px;
        }
        .gk-cta-title span { color: #2ECC71; }
        .gk-cta-sub { font-size: 16px; color: #6B7280; margin-bottom: 16px; line-height: 1.7; }
        .gk-cta-perks { display: flex; gap: 20px; justify-content: center; flex-wrap: wrap; margin-bottom: 36px; }
        .gk-cta-perk { display: flex; align-items: center; gap: 7px; font-size: 14px; color: #374151; font-weight: 500; }
        .gk-cta-perk-icon { color: #2ECC71; flex-shrink: 0; }

        /* Footer */
        .gk-footer {
          background: #111827; color: rgba(255,255,255,0.55);
          padding: clamp(32px,5vw,48px) clamp(16px,5vw,40px);
          text-align: center; font-size: 13px;
        }
        .gk-footer-logo { display: flex; align-items: center; justify-content: center; gap: 9px; margin-bottom: 14px; }
        .gk-footer-brand { font-size: 17px; font-weight: 800; color: #fff; }
        .gk-footer-desc { margin-bottom: 6px; }
        .gk-footer-copy { color: rgba(255,255,255,0.35); }

        /* Mobile */
        @media (max-width: 600px) {
          .gk-nav-links .gk-btn-ghost { display: none; }
          .gk-hero-cta-wrap { flex-direction: column; }
          .gk-cta-perks { flex-direction: column; align-items: center; }
        }
      `}</style>

      <div className="gizku-root">

        {/* ── NAVBAR ── */}
        <nav className="gk-nav">
          <Link className="gk-logo" href="/" aria-label="Gizku home">
            <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <circle cx="18" cy="18" r="18" fill="#2ECC71"/>
              <path d="M9 18 Q9 26 18 26 Q27 26 27 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <line x1="9" y1="18" x2="27" y2="18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <polyline points="13.5,12.5 17,16.5 23,10.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span className="gk-logo-text">Gizku</span>
          </Link>
          <div className="gk-nav-links">
            {isLoggedIn ? (
              <button className="gk-btn-primary" onClick={() => router.push('/main/catat')}>
                Buka Aplikasi
              </button>
            ) : (
              <>
                <button className="gk-btn-ghost" onClick={() => router.push('/login')}>Masuk</button>
                <button className="gk-btn-primary" onClick={() => router.push('/login')}>Daftar Gratis</button>
              </>
            )}
          </div>
        </nav>

        {/* ── HERO ── */}
        <section className="gk-hero" aria-label="Hero">
          <div className="gk-badge">
            <span className="gk-badge-dot" aria-hidden="true" />
            Didukung teknologi AI
          </div>

          <h1 className="gk-hero-title">
            {hero?.title.includes('.') ? (
              hero.title.split('.').filter(Boolean).map((part, i, arr) => (
                <span key={i}>
                  {i === arr.length - 1
                    ? <><span>{part.trim()}</span>.</>
                    : <>{part.trim()}.<br /></>}
                </span>
              ))
            ) : (
              hero?.title.split(' ').map((w, i, arr) =>
                i >= arr.length - 2
                  ? <span key={i} style={{ color: '#2ECC71' }}>{w} </span>
                  : <span key={i}>{w} </span>
              )
            )}
          </h1>

          <p className="gk-hero-sub">
            {hero?.subtitle ?? 'AI Nutrition Companion yang membuat pelacakan kalori jadi mudah, informatif, dan personal.'}
          </p>

          <div className="gk-hero-cta-wrap">
            <button
              className="gk-btn-hero"
              onClick={() => router.push(ctaUrl(hero?.meta ?? null))}
              aria-label={isLoggedIn ? 'Catat Makan Sekarang' : ctaLabel(hero?.meta ?? null)}
            >
              {isLoggedIn ? '🥗 Catat Makan Sekarang' : ctaLabel(hero?.meta ?? null)}
            </button>
            <p className="gk-hero-note">
              <span>Gratis</span> · Tidak perlu kartu kredit · Langsung bisa dipakai
            </p>
          </div>

          {/* App Preview Card */}
          <div className="gk-preview-card" role="img" aria-label="Preview tampilan aplikasi Gizku">
            <div className="gk-preview-header">
              <div className="gk-preview-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M12 22a9 9 0 0 0 9-9H3a9 9 0 0 0 9 9z"/>
                  <path d="M12 13V3"/>
                  <path d="M8 7l4-4 4 4"/>
                </svg>
              </div>
              <div>
                <div className="gk-preview-food-name">Gado-gado</div>
                <div className="gk-preview-food-sub">Makan siang · Baru saja</div>
              </div>
              <div className="gk-preview-kal">340 kal</div>
            </div>

            <div style={{ fontSize: 11, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Anggaran Kalori — 1.650 / 2.100 kcal</div>

            {[
              { label: 'Protein', val: '82g', sub: '/ 120g', pct: 68, color: '#2563EB' },
              { label: 'Karbo',   val: '180g', sub: '/ 200g', pct: 90, color: '#D97706' },
              { label: 'Lemak',   val: '45g',  sub: '/ 70g',  pct: 64, color: '#DC2626' },
            ].map(m => (
              <div className="gk-macro-row" key={m.label}>
                <div className="gk-macro-labels">
                  <span className="gk-macro-label">{m.label}</span>
                  <span className="gk-macro-val">{m.val} <span style={{ color: '#D1D5DB', fontWeight: 400 }}>{m.sub}</span></span>
                </div>
                <div className="gk-macro-bar">
                  <div className="gk-macro-fill" style={{ width: `${m.pct}%`, background: m.color }} />
                </div>
              </div>
            ))}

            <div className="gk-ai-insight">
              <div className="gk-ai-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <div>
                <div className="gk-ai-tag">AI Insight</div>
                <div className="gk-ai-text">Pilihan bagus! Gado-gado kaya serat dan protein nabati. Kamu sudah di jalur yang benar.</div>
              </div>
            </div>
          </div>
        </section>

        {/* ── WAVE ── */}
        <div className="gk-wave" aria-hidden="true" style={{ marginTop: 64 }}>
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,45 C360,90 1080,0 1440,45 L1440,90 L0,90 Z" fill="#E8FAF0"/>
          </svg>
        </div>

        {/* ── HOW IT WORKS ── */}
        <section className="gk-section" style={{ background: '#E8FAF0' }} aria-labelledby="how-title">
          <div className="gk-section-inner">
            <div className="gk-section-header">
              <div className="gk-section-tag">Cara Kerja</div>
              <h2 className="gk-section-title" id="how-title">Tiga langkah, langsung jalan</h2>
              <p className="gk-section-sub">Tidak perlu setup panjang. Foto, analisa, pantau — semudah itu.</p>
            </div>
            <div className="gk-steps-grid">
              {steps.map((step, i) => (
                <div className="gk-step-card" key={step.id}>
                  <div className="gk-step-num">LANGKAH 0{(step.meta?.step as number) ?? i + 1}</div>
                  <div className="gk-step-icon-wrap" aria-hidden="true">
                    {STEP_ICONS[i] ?? STEP_ICONS[0]}
                  </div>
                  <h3 className="gk-step-title">{step.title}</h3>
                  <p className="gk-step-sub">{step.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── WAVE 2 ── */}
        <div className="gk-wave" aria-hidden="true">
          <svg viewBox="0 0 1440 90" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none">
            <path d="M0,45 C360,0 1080,90 1440,45 L1440,0 L0,0 Z" fill="#E8FAF0"/>
          </svg>
        </div>

        {/* ── FEATURES ── */}
        <section className="gk-section" style={{ background: '#fff' }} aria-labelledby="features-title">
          <div className="gk-section-inner">
            <div className="gk-section-header">
              <div className="gk-section-tag">Fitur Unggulan</div>
              <h2 className="gk-section-title" id="features-title">Dirancang untuk gaya hidupmu</h2>
              <p className="gk-section-sub">Mencatat nutrisi terasa natural, bukan beban. Karena konsistensi itu kuncinya.</p>
            </div>
            <div className="gk-features-grid">
              {features.map((f, i) => (
                <div className="gk-feature-card" key={f.id}>
                  <div className="gk-feature-icon-wrap" aria-hidden="true">
                    {FEATURE_ICONS[i] ?? FEATURE_ICONS[0]}
                  </div>
                  <h3 className="gk-feature-title">{f.title}</h3>
                  <p className="gk-feature-sub">{f.subtitle}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── STATS ── */}
        <section className="gk-stats-section" aria-label="Statistik pengguna">
          <div className="gk-stats-inner">
            {stats.map(s => (
              <div key={s.id}>
                <div className="gk-stat-icon-wrap" aria-hidden="true">
                  <IconUsers />
                </div>
                <div className="gk-stat-num">{s.title}</div>
                <div className="gk-stat-label">{s.subtitle}</div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA BOTTOM ── */}
        <section className="gk-cta-section" aria-labelledby="cta-title">
          <div className="gk-cta-inner">
            <h2 className="gk-cta-title" id="cta-title">
              {cta?.title.split(' ').map((w, i, arr) =>
                i >= arr.length - 2
                  ? <span key={i}>{w} </span>
                  : <span key={i}>{i === arr.length - 3 ? <><span style={{ color: '#2ECC71' }}>{w} </span></> : `${w} `}</span>
              )}
            </h2>
            <p className="gk-cta-sub">{cta?.subtitle ?? 'Bergabung sekarang dan mulai pahami apa yang kamu makan setiap hari.'}</p>
            <div className="gk-cta-perks" aria-label="Keunggulan Gizku">
              {[
                'Gratis selamanya',
                'Tanpa kartu kredit',
                'Langsung bisa dipakai',
              ].map(perk => (
                <div className="gk-cta-perk" key={perk}>
                  <span className="gk-cta-perk-icon" aria-hidden="true"><IconCheck /></span>
                  {perk}
                </div>
              ))}
            </div>
            <button
              className="gk-btn-hero"
              onClick={() => router.push(ctaUrl(cta?.meta ?? null))}
              aria-label={isLoggedIn ? 'Catat Makan Sekarang' : ctaLabel(cta?.meta ?? null)}
            >
              {isLoggedIn ? '🥗 Catat Makan Sekarang' : ctaLabel(cta?.meta ?? null)}
            </button>
          </div>
        </section>

        {/* ── FOOTER ── */}
        <footer className="gk-footer">
          <div className="gk-footer-logo">
            <svg width="28" height="28" viewBox="0 0 36 36" fill="none" aria-hidden="true">
              <circle cx="18" cy="18" r="18" fill="#2ECC71"/>
              <path d="M9 18 Q9 26 18 26 Q27 26 27 18" stroke="white" strokeWidth="2.2" strokeLinecap="round" fill="none"/>
              <line x1="9" y1="18" x2="27" y2="18" stroke="white" strokeWidth="2.2" strokeLinecap="round"/>
              <polyline points="13.5,12.5 17,16.5 23,10.5" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
            </svg>
            <span className="gk-footer-brand">Gizku</span>
          </div>
          <p className="gk-footer-desc">AI Nutrition Companion · Analisa nutrisi dari foto makananmu</p>
          <p className="gk-footer-copy">© {new Date().getFullYear()} Gizku. Dibuat dengan 💚 untuk hidup lebih sehat.</p>
        </footer>

      </div>
    </>
  )
}
