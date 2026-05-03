'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

type Dish = { name: string; portion: string; calories: number; protein: number; carbs: number; fat: number }
type Meal = {
  id: string
  dishNames: string[]
  totalCalories: number
  totalProtein: string
  totalCarbs: string
  totalFat: string
  imageUrl?: string | null
  loggedAt: string
  rawAnalysis?: { dishes: Dish[]; total: any; notes?: string; healthScore?: number; assessment?: string }
}
type HistoryData = { meals: Meal[]; total: number; page: number; totalPages: number }

function authHeaders() {
  return { Authorization: `Bearer ${localStorage.getItem('nl_token') || ''}` }
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
}

// ── Gizku color tokens
const C = {
  bg: '#F9FAFB',
  white: '#FFFFFF',
  border: '#E5E7EB',
  text: '#111827',
  muted: '#6B7280',
  green: '#2ECC71',
  greenDim: '#D4F5E4',
  red: '#EF4444',
  coral: '#FF6B6B',
  blue: '#6B9FD4',
  purple: '#9B8EC4',
}

// ── Tiny SVG icons for nutrition summary
const IconFire = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 2C12 2 7 8 7 13a5 5 0 0 0 10 0c0-3-2-6-2-6s-1 3-3 3c-1 0-2-1-2-2 0-2 2-6 2-8z" fill="#FF8A65"/>
  </svg>
)
const IconDumbbell = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.2" strokeLinecap="round">
    <rect x="2" y="10" width="4" height="4" rx="1"/>
    <rect x="18" y="10" width="4" height="4" rx="1"/>
    <line x1="6" y1="12" x2="18" y2="12"/>
    <rect x="7" y="9" width="3" height="6" rx="1"/>
    <rect x="14" y="9" width="3" height="6" rx="1"/>
  </svg>
)
const IconGrain = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6B9FD4" strokeWidth="2" strokeLinecap="round">
    <ellipse cx="12" cy="12" rx="4" ry="7"/>
    <path d="M12 5 Q16 8 12 12 Q8 16 12 19"/>
  </svg>
)
const IconDrop = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
    <path d="M12 3 C12 3 5 12 5 16a7 7 0 0 0 14 0c0-4-7-13-7-13z" fill="#81C784"/>
  </svg>
)

export default function RiwayatPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalMeal, setModalMeal] = useState<Meal | null>(null)
  const [deleting, setDeleting] = useState(false)

  const load = useCallback(async (p: number) => {
    setLoading(true)
    try {
      const res = await fetch(`/api/history?action=list&page=${p}&per_page=10`, { headers: authHeaders() })
      if (res.status === 401) { router.replace('/login'); return }
      const data = await res.json()
      setHistory(data)
      setPage(p)
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => { load(1) }, [load])

  async function deleteMeal(id: string) {
    if (!confirm('Hapus data makan ini?')) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/history?id=${id}`, { method: 'DELETE', headers: authHeaders() })
      if (!res.ok) { toast.error('Gagal menghapus'); return }
      toast.success('Data berhasil dihapus')
      setModalMeal(null)
      load(page)
    } finally {
      setDeleting(false)
    }
  }

  const grouped = history?.meals.reduce((acc, meal) => {
    const date = new Date(meal.loggedAt).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>) ?? {}

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }}>

      {/* Skeleton loader */}
      {loading && !history && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{
              height: 76,
              borderRadius: 20,
              background: '#F3F4F6',
              animation: 'pulse 1.5s ease-in-out infinite',
            }} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {history && history.meals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 6 }}>Belum Ada Catatan Makan</div>
          <div style={{ color: C.muted, fontSize: 13, marginBottom: 20 }}>
            Foto makananmu dan AI akan mencatat kandungan gizinya.
          </div>
          <button onClick={() => router.push('/main/catat')} style={{
            padding: '11px 24px', background: C.green, borderRadius: 13,
            color: '#FFFFFF', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            Catat Makanan Pertama
          </button>
        </div>
      )}

      {history && history.meals.length > 0 && (
        <>
          <div style={{ color: C.muted, fontSize: 12, marginBottom: 14 }}>
            {history.total} total catatan
          </div>

          {Object.entries(grouped).map(([date, meals]) => {
            const totalKcal = meals.reduce((s, m) => s + m.totalCalories, 0)
            const totalP = meals.reduce((s, m) => s + parseFloat(m.totalProtein), 0)
            const totalK = meals.reduce((s, m) => s + parseFloat(m.totalCarbs), 0)
            const totalL = meals.reduce((s, m) => s + parseFloat(m.totalFat), 0)

            return (
              <div key={date} style={{ marginBottom: 24 }}>

                {/* Date header */}
                <div style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: C.muted,
                  letterSpacing: '.6px',
                  textTransform: 'uppercase',
                  marginBottom: 10,
                }}>
                  {fmtDate(date + 'T00:00:00')}
                </div>

                {/* Daily summary card — 4 columns */}
                <div style={{
                  background: C.white,
                  border: `1px solid ${C.border}`,
                  borderRadius: 24,
                  padding: '14px 16px',
                  marginBottom: 10,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 1fr)',
                  gap: 4,
                }}>
                  {[
                    { icon: <IconFire />, val: totalKcal, label: 'Kalori' },
                    { icon: <IconDumbbell />, val: totalP.toFixed(1) + 'g', label: 'Protein' },
                    { icon: <IconGrain />, val: totalK.toFixed(1) + 'g', label: 'Karbo' },
                    { icon: <IconDrop />, val: totalL.toFixed(1) + 'g', label: 'Lemak' },
                  ].map(({ icon, val, label }) => (
                    <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 22 }}>{icon}</div>
                      <div style={{ fontWeight: 600, fontSize: 16, color: C.text, lineHeight: 1.1 }}>{val}</div>
                      <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.1 }}>{label}</div>
                    </div>
                  ))}
                </div>

                {/* Meal cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {meals.map(meal => (
                    <div
                      key={meal.id}
                      onClick={() => setModalMeal(meal)}
                      style={{
                        background: C.white,
                        border: `1px solid ${C.border}`,
                        borderRadius: 20,
                        padding: '13px 16px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'box-shadow .18s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,.06)')}
                      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        {/* Nama makanan */}
                        <div style={{
                          fontWeight: 600,
                          fontSize: 14,
                          color: C.text,
                          marginBottom: 3,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}>
                          {meal.dishNames.length > 0 ? meal.dishNames.join(', ') : 'Makanan'}
                        </div>
                        {/* Sub-info */}
                        <div style={{ fontSize: 12, color: C.muted }}>
                          {fmtTime(meal.loggedAt)} · {meal.dishNames.length} menu
                        </div>
                      </div>
                      {/* Kalori */}
                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>
                          {meal.totalCalories}
                        </div>
                        <div style={{ fontSize: 10, color: C.muted }}>kkal</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}

          {/* Pagination */}
          {history.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, paddingTop: 8 }}>
              <button disabled={page === 1} onClick={() => load(page - 1)} style={{
                padding: '9px 16px', borderRadius: 12, background: C.white,
                border: `1px solid ${C.border}`, color: C.text, fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1,
              }}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', color: C.muted, fontSize: 13 }}>
                {page} / {history.totalPages}
              </span>
              <button disabled={page === history.totalPages} onClick={() => load(page + 1)} style={{
                padding: '9px 16px', borderRadius: 12, background: C.white,
                border: `1px solid ${C.border}`, color: C.text, fontSize: 13,
                cursor: page === history.totalPages ? 'not-allowed' : 'pointer',
                opacity: page === history.totalPages ? 0.4 : 1,
              }}>Next →</button>
            </div>
          )}
        </>
      )}

      {/* ── MODAL DETAIL ── */}
      {modalMeal && (
        <div onClick={() => setModalMeal(null)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.35)', zIndex: 60,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: C.white,
            borderRadius: '24px 24px 0 0',
            width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUp .3s cubic-bezier(.34,1.1,.64,1) both',
            WebkitOverflowScrolling: 'touch',
            boxShadow: '0 -8px 32px rgba(0,0,0,.1)',
          }}>
            {/* Drag handle + close */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
              <div style={{ width: 36, height: 4, background: C.border, borderRadius: 4 }} />
              <button onClick={() => setModalMeal(null)} style={{
                background: C.bg, border: `1px solid ${C.border}`,
                borderRadius: 9, padding: '6px 12px', color: C.muted, fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>✕ Tutup</button>
            </div>

            <div style={{ padding: '0 16px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: C.text, marginBottom: 4 }}>
                {modalMeal.dishNames.join(', ') || 'Makanan'}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginBottom: 16 }}>
                {fmtDate(modalMeal.loggedAt)} · {fmtTime(modalMeal.loggedAt)}
              </div>

              {/* Foto makanan */}
              {modalMeal.imageUrl && (
                <div style={{ borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
                  <img
                    src={modalMeal.imageUrl}
                    alt="Foto makanan"
                    style={{ width: '100%', maxHeight: 200, objectFit: 'cover', display: 'block' }}
                  />
                </div>
              )}

              {/* Total nutrisi 4 kolom */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 8,
                marginBottom: 16,
                background: C.bg,
                border: `1px solid ${C.border}`,
                borderRadius: 20,
                padding: '12px 8px',
              }}>
                {[
                  { icon: <IconFire />, val: String(modalMeal.totalCalories), label: 'kkal' },
                  { icon: <IconDumbbell />, val: `${parseFloat(modalMeal.totalProtein).toFixed(1)}g`, label: 'protein' },
                  { icon: <IconGrain />, val: `${parseFloat(modalMeal.totalCarbs).toFixed(1)}g`, label: 'karbo' },
                  { icon: <IconDrop />, val: `${parseFloat(modalMeal.totalFat).toFixed(1)}g`, label: 'lemak' },
                ].map(({ icon, val, label }) => (
                  <div key={label} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
                    {icon}
                    <div style={{ fontWeight: 600, fontSize: 15, color: C.text }}>{val}</div>
                    <div style={{ fontSize: 10, color: C.muted }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Per-dish detail */}
              {modalMeal.rawAnalysis?.dishes && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: C.muted, letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                    Menu Terdeteksi
                  </div>
                  {modalMeal.rawAnalysis.dishes.map((d, i) => (
                    <div key={i} style={{
                      background: C.bg,
                      border: `1px solid ${C.border}`,
                      borderRadius: 14,
                      padding: '10px 14px',
                      marginBottom: 8,
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: C.muted }}>{d.portion}</div>
                        </div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.text }}>{d.calories} kkal</div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: C.muted }}>
                        <span>P: {d.protein}g</span>
                        <span>K: {d.carbs}g</span>
                        <span>L: {d.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalMeal.rawAnalysis?.notes && (
                <div style={{
                  background: '#F0FDF4',
                  border: '1px solid #BBF7D0',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 13,
                  color: C.muted,
                  lineHeight: 1.7,
                  marginBottom: 16,
                }}>
                  💡 {modalMeal.rawAnalysis.notes}
                </div>
              )}

              <button onClick={() => deleteMeal(modalMeal.id)} disabled={deleting} style={{
                width: '100%', padding: 13, borderRadius: 13,
                background: 'rgba(239,68,68,.08)', border: '1px solid rgba(239,68,68,.2)',
                color: C.red, fontWeight: 700, fontSize: 14, cursor: 'pointer',
                opacity: deleting ? 0.6 : 1,
              }}>
                {deleting ? '⏳ Menghapus...' : '🗑️ Hapus Data Ini'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
