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

export default function RiwayatPage() {
  const router = useRouter()
  const [history, setHistory] = useState<HistoryData | null>(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [modalMeal, setModalMeal] = useState<Meal | null>(null)
  const [modalLoading, setModalLoading] = useState(false)
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

  async function openMeal(meal: Meal) {
    setModalMeal(meal)
  }

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

  // Group meals by date
  const grouped = history?.meals.reduce((acc, meal) => {
    const date = new Date(meal.loggedAt).toISOString().split('T')[0]
    if (!acc[date]) acc[date] = []
    acc[date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>) ?? {}

  return (
    <div>
      {loading && !history && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 72, borderRadius: 16, background: 'var(--surface2)', animation: 'pulse 1.5s ease-in-out infinite' }} />
          ))}
        </div>
      )}

      {history && history.meals.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 0' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🥗</div>
          <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>Belum Ada Catatan Makan</div>
          <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 20 }}>
            Foto makananmu dan AI akan mencatat kandungan gizinya.
          </div>
          <button onClick={() => router.push('/catat')} style={{
            padding: '11px 24px', background: 'var(--accent)', borderRadius: 13,
            color: '#081520', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
          }}>
            Catat Makanan Pertama
          </button>
        </div>
      )}

      {history && history.meals.length > 0 && (
        <>
          <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 14 }}>
            {history.total} total catatan
          </div>

          {Object.entries(grouped).map(([date, meals]) => (
            <div key={date} style={{ marginBottom: 20 }}>
              {/* Date header */}
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 8 }}>
                {fmtDate(date + 'T00:00:00')}
              </div>

              {/* Day summary */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 10, padding: '8px 12px', background: 'var(--surface2)', borderRadius: 12 }}>
                {[
                  ['🔥', meals.reduce((s, m) => s + m.totalCalories, 0), 'kkal'],
                  ['💪', meals.reduce((s, m) => s + parseFloat(m.totalProtein), 0).toFixed(1), 'g P'],
                  ['🍚', meals.reduce((s, m) => s + parseFloat(m.totalCarbs), 0).toFixed(1), 'g K'],
                  ['🥑', meals.reduce((s, m) => s + parseFloat(m.totalFat), 0).toFixed(1), 'g L'],
                ].map(([icon, val, unit]) => (
                  <div key={String(unit)} style={{ flex: 1, textAlign: 'center' }}>
                    <div style={{ fontSize: 12 }}>{icon}</div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{val}</div>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{unit}</div>
                  </div>
                ))}
              </div>

              {/* Meal cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {meals.map(meal => (
                  <div key={meal.id} onClick={() => openMeal(meal)} style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 16, padding: '12px 14px', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    transition: 'background .2s',
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', marginBottom: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {meal.dishNames.length > 0 ? meal.dishNames.join(', ') : 'Makanan'}
                      </div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                        {fmtTime(meal.loggedAt)} · {meal.dishNames.length} menu
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 12 }}>
                      <div style={{ fontWeight: 700, fontSize: 16, color: '#F87171' }}>{meal.totalCalories}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>kkal</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Pagination */}
          {history.totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 10, paddingTop: 8 }}>
              <button disabled={page === 1} onClick={() => load(page - 1)} style={{
                padding: '9px 16px', borderRadius: 12, background: 'var(--surface2)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13,
                cursor: page === 1 ? 'not-allowed' : 'pointer', opacity: page === 1 ? 0.4 : 1,
              }}>← Prev</button>
              <span style={{ display: 'flex', alignItems: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                {page} / {history.totalPages}
              </span>
              <button disabled={page === history.totalPages} onClick={() => load(page + 1)} style={{
                padding: '9px 16px', borderRadius: 12, background: 'var(--surface2)',
                border: '1px solid var(--border)', color: 'var(--text)', fontSize: 13,
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
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,.78)', zIndex: 60,
          display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            background: 'var(--surface)', borderRadius: '22px 22px 0 0',
            width: '100%', maxWidth: 480, maxHeight: '90vh', overflowY: 'auto',
            animation: 'slideUp .3s cubic-bezier(.34,1.1,.64,1) both',
            WebkitOverflowScrolling: 'touch',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px 8px' }}>
              <div style={{ width: 36, height: 4, background: 'var(--border)', borderRadius: 4 }} />
              <button onClick={() => setModalMeal(null)} style={{
                background: 'var(--surface2)', border: '1px solid var(--border)',
                borderRadius: 9, padding: '6px 12px', color: 'var(--text-muted)', fontSize: 12, fontWeight: 600, cursor: 'pointer',
              }}>✕ Tutup</button>
            </div>

            <div style={{ padding: '0 16px calc(28px + env(safe-area-inset-bottom, 0px))' }}>
              <div style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 4 }}>
                {modalMeal.dishNames.join(', ') || 'Makanan'}
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: 12, marginBottom: 16 }}>
                {fmtDate(modalMeal.loggedAt)} · {fmtTime(modalMeal.loggedAt)}
              </div>

              {/* Total badges */}
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                {[
                  ['kkal', String(modalMeal.totalCalories), '#F87171'],
                  ['protein', `${parseFloat(modalMeal.totalProtein).toFixed(1)}g`, 'var(--protein)'],
                  ['karbo', `${parseFloat(modalMeal.totalCarbs).toFixed(1)}g`, 'var(--carbs)'],
                  ['lemak', `${parseFloat(modalMeal.totalFat).toFixed(1)}g`, 'var(--fat)'],
                ].map(([label, value, color]) => (
                  <div key={label} style={{ flex: 1, background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 6px', textAlign: 'center' }}>
                    <div style={{ color, fontWeight: 700, fontSize: 16 }}>{value}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: 10 }}>{label}</div>
                  </div>
                ))}
              </div>

              {/* Per-dish detail */}
              {modalMeal.rawAnalysis?.dishes && (
                <div style={{ marginBottom: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                    Menu Terdeteksi
                  </div>
                  {modalMeal.rawAnalysis.dishes.map((d, i) => (
                    <div key={i} style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, padding: '10px 14px', marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{d.name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{d.portion}</div>
                        </div>
                        <div style={{ fontWeight: 700, fontSize: 15, color: '#F87171' }}>{d.calories} kkal</div>
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 12, color: 'var(--text-muted)' }}>
                        <span>P: {d.protein}g</span>
                        <span>K: {d.carbs}g</span>
                        <span>L: {d.fat}g</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {modalMeal.rawAnalysis?.notes && (
                <div style={{ background: 'rgba(61,255,149,.05)', border: '1px solid rgba(61,255,149,.15)', borderRadius: 12, padding: '10px 14px', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
                  💡 {modalMeal.rawAnalysis.notes}
                </div>
              )}

              <button onClick={() => deleteMeal(modalMeal.id)} disabled={deleting} style={{
                width: '100%', padding: 13, borderRadius: 13,
                background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
                color: '#F87171', fontWeight: 700, fontSize: 14, cursor: 'pointer',
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