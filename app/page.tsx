'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LandingPage() {
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const token = localStorage.getItem('nl_token')
    if (token) setIsLoggedIn(true)
  }, [])

  function handleCTA() {
    if (isLoggedIn) {
      router.push('/main/catat')
    } else {
      router.push('/login')
    }
  }

  const C = {
    green: '#2ECC71',
    greenDark: '#27AE60',
    greenLight: '#D4F5E4',
    greenMid: '#E8FAF0',
    text: '#111827',
    muted: '#6B7280',
    bg: '#F9FAFB',
    white: '#FFFFFF',
    border: '#E5E7EB',
  }

  return (
    <div style={{ fontFamily: "'Inter', sans-serif", background: C.white, minHeight: '100dvh', color: C.text }}>

      {/* ─── NAVBAR ─── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: `1px solid ${C.border}`,
        padding: '0 24px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        {/* Logo */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill={C.green}/>
            <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 20, color: C.text }}>Gizku</span>
        </div>

        {/* Nav right */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {isLoggedIn ? (
            <button
              onClick={() => router.push('/main/catat')}
              style={{
                background: C.green, color: C.white,
                border: 'none', borderRadius: 999,
                padding: '8px 20px', fontSize: 14, fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Buka Aplikasi
            </button>
          ) : (
            <>
              <button
                onClick={() => router.push('/login')}
                style={{
                  background: 'transparent', color: C.muted,
                  border: 'none', fontSize: 14, fontWeight: 500,
                  cursor: 'pointer', padding: '8px 12px',
                }}
              >
                Masuk
              </button>
              <button
                onClick={() => router.push('/login')}
                style={{
                  background: C.green, color: C.white,
                  border: 'none', borderRadius: 999,
                  padding: '8px 20px', fontSize: 14, fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Daftar Gratis
              </button>
            </>
          )}
        </div>
      </nav>

      {/* ─── HERO ─── */}
      <section style={{
        padding: '72px 24px 0',
        textAlign: 'center',
        maxWidth: 720,
        margin: '0 auto',
      }}>
        {/* Badge */}
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 7,
          background: C.greenMid,
          border: `1px solid ${C.greenLight}`,
          borderRadius: 999, padding: '6px 16px',
          fontSize: 13, fontWeight: 600, color: C.greenDark,
          marginBottom: 28,
        }}>
          <span style={{ fontSize: 15 }}>✨</span>
          Didukung teknologi AI
        </div>

        <h1 style={{
          fontFamily: "'Montserrat', sans-serif",
          fontWeight: 700,
          fontSize: 'clamp(2.2rem, 6vw, 3.5rem)',
          lineHeight: 1.15,
          color: C.text,
          marginBottom: 24,
          letterSpacing: '-0.02em',
        }}>
          Makan lebih cerdas,{' '}
          <span style={{ color: C.green }}>hidup lebih sehat.</span>
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.2rem)',
          color: C.muted,
          lineHeight: 1.7,
          maxWidth: 560,
          margin: '0 auto 40px',
        }}>
          Foto makananmu, dan Gizku langsung analisa kandungan nutrisinya — kalori, protein, karbo, dan lemak — dalam hitungan detik.
        </p>

        {/* CTA Button */}
        <button
          onClick={handleCTA}
          style={{
            background: C.green,
            color: C.white,
            border: 'none',
            borderRadius: 999,
            padding: '16px 40px',
            fontSize: 17,
            fontWeight: 700,
            cursor: 'pointer',
            boxShadow: `0 4px 20px rgba(46,204,113,0.35)`,
            transition: 'transform 0.15s, box-shadow 0.15s',
            marginBottom: 16,
          }}
          onMouseEnter={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(46,204,113,0.45)'
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
            ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(46,204,113,0.35)'
          }}
        >
          {isLoggedIn ? '🥗 Catat Makan Sekarang' : 'Mulai Sekarang — Gratis'}
        </button>

        <div style={{ fontSize: 13, color: C.muted, marginBottom: 64 }}>
          Tidak perlu kartu kredit · Langsung bisa dipakai
        </div>

        {/* App Preview Card */}
        <div style={{
          background: C.bg,
          border: `1px solid ${C.border}`,
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
          maxWidth: 360,
          margin: '0 auto',
          textAlign: 'left',
        }}>
          {/* Header card */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: C.greenLight,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 20,
            }}>🥗</div>
            <div>
              <div style={{ fontWeight: 600, fontSize: 15 }}>Gado-gado</div>
              <div style={{ fontSize: 12, color: C.muted }}>Makan siang · barusan</div>
            </div>
            <div style={{
              marginLeft: 'auto',
              background: C.greenLight, color: C.greenDark,
              borderRadius: 999, padding: '4px 12px',
              fontSize: 12, fontWeight: 700,
            }}>340 kal</div>
          </div>

          {/* Macro bars */}
          {[
            { label: 'Protein', val: 18, max: 60, color: '#2563EB', pct: 30 },
            { label: 'Karbo', val: 42, max: 200, color: '#D97706', pct: 21 },
            { label: 'Lemak', val: 14, max: 70, color: '#DC2626', pct: 20 },
          ].map(m => (
            <div key={m.label} style={{ marginBottom: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: C.muted, fontWeight: 500 }}>{m.label}</span>
                <span style={{ color: C.text, fontWeight: 600 }}>{m.val}g</span>
              </div>
              <div style={{ height: 6, borderRadius: 999, background: C.border }}>
                <div style={{ height: '100%', width: `${m.pct}%`, borderRadius: 999, background: m.color, transition: 'width 0.6s' }} />
              </div>
            </div>
          ))}

          {/* AI insight */}
          <div style={{
            marginTop: 16,
            background: C.greenMid,
            border: `1px solid ${C.greenLight}`,
            borderRadius: 12,
            padding: '10px 14px',
            display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <span style={{ fontSize: 20 }}>🤖</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.greenDark, marginBottom: 2 }}>AI Insight</div>
              <div style={{ fontSize: 12, color: C.text, lineHeight: 1.5 }}>Pilihan bagus! Gado-gado kaya serat dan protein nabati. Protein masih bisa ditingkatkan untuk capai target harianmu.</div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── WAVE DIVIDER ─── */}
      <div style={{ marginTop: 64, lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
          <path d="M0,40 C360,80 1080,0 1440,40 L1440,80 L0,80 Z" fill={C.greenMid}/>
        </svg>
      </div>

      {/* ─── HOW IT WORKS ─── */}
      <section style={{ background: C.greenMid, padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              color: C.text,
              marginBottom: 12,
            }}>Cara kerja Gizku</h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>Tiga langkah mudah untuk mulai memahami nutrisi makananmu setiap hari.</p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: 24,
          }}>
            {[
              { step: '01', emoji: '📸', title: 'Foto makananmu', desc: 'Ambil foto dari kamera atau pilih dari galeri. Gizku mengenali hampir semua jenis makanan Indonesia dan internasional.' },
              { step: '02', emoji: '🧠', title: 'AI analisa nutrisi', desc: 'Model AI kami langsung menghitung kalori, protein, karbohidrat, dan lemak berdasarkan gambar yang kamu kirim.' },
              { step: '03', emoji: '📊', title: 'Pantau progresmu', desc: 'Lihat total nutrisi harian, tren mingguan, dan dapatkan insight personal untuk mencapai target kesehatanmu.' },
            ].map(item => (
              <div key={item.step} style={{
                background: C.white,
                borderRadius: 20,
                padding: 28,
                border: `1px solid ${C.border}`,
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}>
                <div style={{
                  width: 48, height: 48,
                  borderRadius: 14,
                  background: C.greenLight,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 24,
                  marginBottom: 16,
                }}>{item.emoji}</div>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.green, letterSpacing: 1, marginBottom: 8 }}>LANGKAH {item.step}</div>
                <h3 style={{
                  fontFamily: "'Montserrat', sans-serif",
                  fontWeight: 700, fontSize: 17,
                  color: C.text, marginBottom: 10,
                }}>{item.title}</h3>
                <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.65 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WAVE DIVIDER 2 ─── */}
      <div style={{ lineHeight: 0 }}>
        <svg viewBox="0 0 1440 80" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="none" style={{ width: '100%', display: 'block' }}>
          <path d="M0,40 C360,0 1080,80 1440,40 L1440,0 L0,0 Z" fill={C.greenMid}/>
        </svg>
      </div>

      {/* ─── FEATURES ─── */}
      <section style={{ background: C.white, padding: '56px 24px' }}>
        <div style={{ maxWidth: 960, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{
              fontFamily: "'Montserrat', sans-serif",
              fontWeight: 700,
              fontSize: 'clamp(1.5rem, 4vw, 2.2rem)',
              color: C.text,
              marginBottom: 12,
            }}>Fitur unggulan</h2>
            <p style={{ color: C.muted, fontSize: 16, maxWidth: 480, margin: '0 auto' }}>Dirancang agar mencatat nutrisi terasa natural, bukan beban.</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
            {[
              { emoji: '⚡', title: 'Analisa cepat', desc: 'Hasil nutrisi dalam 3 detik setelah foto dikirim.' },
              { emoji: '🇮🇩', title: 'Makanan lokal', desc: 'Mengenali nasi padang, soto, gado-gado, dan ratusan menu Indonesia lainnya.' },
              { emoji: '🎯', title: 'Target personal', desc: 'Sesuaikan target kalori dan makro berdasarkan tujuan kesehatanmu.' },
              { emoji: '📅', title: 'Riwayat lengkap', desc: 'Lihat semua catatan makanmu kapan saja dan pantau konsistensinya.' },
              { emoji: '💡', title: 'AI Insight', desc: 'Rekomendasi personal berbasis pola makan kamu sehari-hari.' },
              { emoji: '🔒', title: 'Data aman', desc: 'Data nutrisimu terenkripsi dan tidak dibagikan ke pihak ketiga.' },
            ].map(f => (
              <div key={f.title} style={{
                borderRadius: 16,
                padding: '20px 22px',
                border: `1px solid ${C.border}`,
                background: C.bg,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{f.emoji}</div>
                <h4 style={{ fontWeight: 700, fontSize: 15, color: C.text, marginBottom: 6 }}>{f.title}</h4>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.6 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── STATS ─── */}
      <section style={{ background: C.green, padding: '56px 24px' }}>
        <div style={{
          maxWidth: 720, margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 32, textAlign: 'center',
        }}>
          {[
            { num: '10.000+', label: 'Makanan dikenali' },
            { num: '< 3 detik', label: 'Waktu analisa' },
            { num: '4 makro', label: 'Nutrisi dilacak' },
            { num: '100%', label: 'Gratis dipakai' },
          ].map(s => (
            <div key={s.label}>
              <div style={{
                fontFamily: "'Montserrat', sans-serif",
                fontWeight: 700,
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                color: C.white,
                marginBottom: 6,
              }}>{s.num}</div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.8)', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── CTA BOTTOM ─── */}
      <section style={{
        background: C.bg,
        padding: '80px 24px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: 560, margin: '0 auto' }}>
          <h2 style={{
            fontFamily: "'Montserrat', sans-serif",
            fontWeight: 700,
            fontSize: 'clamp(1.6rem, 4vw, 2.5rem)',
            color: C.text,
            marginBottom: 16,
          }}>
            Siap makan lebih{' '}
            <span style={{ color: C.green }}>cerdas?</span>
          </h2>
          <p style={{ color: C.muted, fontSize: 16, marginBottom: 36, lineHeight: 1.7 }}>
            Bergabung sekarang dan mulai pahami apa yang kamu makan setiap hari — cukup dengan satu foto.
          </p>
          <button
            onClick={handleCTA}
            style={{
              background: C.green,
              color: C.white,
              border: 'none',
              borderRadius: 999,
              padding: '16px 44px',
              fontSize: 17,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: `0 4px 20px rgba(46,204,113,0.35)`,
              transition: 'transform 0.15s, box-shadow 0.15s',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 8px 28px rgba(46,204,113,0.45)'
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)'
              ;(e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 20px rgba(46,204,113,0.35)'
            }}
          >
            {isLoggedIn ? '🥗 Catat Makan Sekarang' : 'Mulai Sekarang — Gratis'}
          </button>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{
        background: C.text,
        color: 'rgba(255,255,255,0.6)',
        padding: '32px 24px',
        textAlign: 'center',
        fontSize: 13,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
          <svg width="24" height="24" viewBox="0 0 32 32" fill="none">
            <circle cx="16" cy="16" r="16" fill={C.green}/>
            <path d="M8 16 Q8 23 16 23 Q24 23 24 16" stroke="white" strokeWidth="2" strokeLinecap="round" fill="none"/>
            <line x1="8" y1="16" x2="24" y2="16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <polyline points="12,11 15,14.5 20.5,9" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
          </svg>
          <span style={{ fontFamily: "'Montserrat', sans-serif", fontWeight: 700, fontSize: 16, color: C.white }}>Gizku</span>
        </div>
        <div style={{ marginBottom: 8 }}>AI Nutrition Companion · Analisa nutrisi dari foto makananmu</div>
        <div>© {new Date().getFullYear()} Gizku. Dibuat dengan 💚 untuk hidup lebih sehat.</div>
      </footer>
    </div>
  )
}
