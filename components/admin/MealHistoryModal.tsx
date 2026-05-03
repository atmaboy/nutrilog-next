'use client'
import { useEffect, useState, useCallback, useRef } from 'react'
import { toast } from 'sonner'
import { useRouter } from 'next/navigation'

type MenuItem = {
  name?: string
  description?: string
  calories?: number
  protein?: number
  carbs?: number
  fat?: number
  fiber?: number
  [key: string]: unknown
}

type Meal = {
  id: string
  dishNames: string[]
  totalCalories: number
  totalProtein: string
  totalCarbs: string
  totalFat: string
  imageUrl: string | null
  rawAnalysis: {
    menuItems?: MenuItem[]
    description?: string
    analysis?: { menuItems?: MenuItem[]; description?: string }
    [key: string]: unknown
  } | null
  loggedAt: string
}

type PageData = {
  meals: Meal[]
  total: number
  page: number
  totalPages: number
}

// ─── Inline SVG Icons ─────────────────────────────────────────────────────────

function FlameIcon({ size = 12, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="#f97316" className={className}>
      <path d="M12 2C9 7 6 9.5 6 14a6 6 0 0 0 12 0c0-3-1.5-5.5-3-7.5C14.5 8.5 13 11 13 13a1 1 0 0 1-2 0c0-3 1-5.5 1-11z" />
    </svg>
  )
}

function DumbbellIcon({ size = 12, color = '#22c55e' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <rect x="2" y="10" width="3" height="4" rx="1" />
      <rect x="19" y="10" width="3" height="4" rx="1" />
      <rect x="4" y="8" width="3" height="8" rx="1.5" />
      <rect x="17" y="8" width="3" height="8" rx="1.5" />
      <rect x="7" y="11" width="10" height="2" rx="1" />
    </svg>
  )
}

function GrainIcon({ size = 12, color = '#3b82f6' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <ellipse cx="12" cy="6" rx="3" ry="2.5" />
      <ellipse cx="8" cy="9" rx="2.5" ry="2" />
      <ellipse cx="16" cy="9" rx="2.5" ry="2" />
      <ellipse cx="8.5" cy="13" rx="2.5" ry="2" />
      <ellipse cx="15.5" cy="13" rx="2.5" ry="2" />
      <line x1="12" y1="21" x2="12" y2="9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  )
}

function DropletIcon({ size = 12, color = '#a855f7' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <path d="M12 3C12 3 6 10 6 15a6 6 0 0 0 12 0C18 10 12 3 12 3z" />
    </svg>
  )
}

function TrashIcon({ size = 12, color = '#f87171' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  )
}

function CalendarIcon({ size = 32, color = '#9CA3AF' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
      <line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function MealHistoryModal({
  userId, username, onClose,
}: {
  userId: string
  username: string
  onClose: () => void
}) {
  const [data, setData]           = useState<PageData | null>(null)
  const [loading, setLoading]     = useState(true)
  const [paging, setPaging]       = useState(false)
  const [page, setPage]           = useState(1)
  const [filterDate, setFilterDate] = useState('')
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const dateInputRef              = useRef<HTMLInputElement>(null)
  const router = useRouter()

  const tok = () =>
    document.cookie.split(';').find(c => c.includes('nl_admin_token'))?.split('=')[1] ?? ''

  const load = useCallback(async (p: number, isPaging: boolean, date: string) => {
    if (isPaging) { setPaging(true) } else { setLoading(true) }
    const dateQuery = date ? `&date=${date}` : ''
    try {
      const res = await fetch(
        `/api/admin?action=user_meals&user_id=${userId}&page=${p}&per_page=15${dateQuery}`,
        { headers: { Authorization: `Bearer ${tok()}` } }
      )
      const d = await res.json()
      setData({
        meals:      d.meals      ?? [],
        total:      d.total      ?? 0,
        page:       d.page       ?? p,
        totalPages: d.totalPages ?? 1,
      })
      setPage(p)
    } finally {
      setLoading(false)
      setPaging(false)
    }
  }, [userId])

  useEffect(() => { load(1, false, '') }, [load])

  function handleDateChange(e: React.ChangeEvent<HTMLInputElement>) {
    const val = e.target.value
    setFilterDate(val)
    load(1, true, val)
  }
  function handleResetFilter() {
    setFilterDate('')
    load(1, true, '')
  }

  /** Klik di mana saja pada wrapper filter → buka date picker */
  function handleFilterWrapperClick(e: React.MouseEvent<HTMLDivElement>) {
    // Jangan trigger ulang jika klik langsung di input itu sendiri
    if (e.target === dateInputRef.current) return
    try {
      dateInputRef.current?.showPicker()
    } catch {
      // showPicker() tidak tersedia di beberapa browser lama — fallback: focus saja
      dateInputRef.current?.focus()
    }
  }

  async function deleteMeal(mealId: string) {
    if (!confirm('Hapus riwayat analisa ini?')) return
    setDeleting(mealId)
    const r = await fetch(`/api/admin?action=delete_meal`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tok()}` },
      body: JSON.stringify({ id: mealId }),
    })
    const d = await r.json()
    if (r.ok) {
      toast.success('Riwayat dihapus')
      load(page, false, filterDate)
      router.refresh()
    } else {
      toast.error(d.error)
    }
    setDeleting(null)
  }

  function getMenuItems(meal: Meal): MenuItem[] {
    const raw = meal.rawAnalysis
    if (!raw) return []
    return raw.menuItems ?? raw.analysis?.menuItems ?? []
  }

  function getDescription(meal: Meal): string {
    const raw = meal.rawAnalysis
    if (!raw) return ''
    return raw.description ?? raw.analysis?.description ?? ''
  }

  function fmtDate(iso: string) {
    return new Date(iso).toLocaleString('id-ID', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    })
  }
  function fmtDateStr(dateStr: string) {
    return new Date(dateStr + 'T12:00:00').toLocaleDateString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  }

  const meals      = data?.meals ?? []
  const totalPages = data?.totalPages ?? 1
  const total      = data?.total ?? 0
  const isFiltering = filterDate !== ''

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-2xl shadow-xl w-full max-w-2xl max-h-[88vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E5E7EB]">
          <div>
            <h2 className="text-base font-semibold text-[#111827]">Riwayat Analisa Makanan</h2>
            <p className="text-xs text-[#6B7280] mt-0.5">
              @{username}
              {data && (
                isFiltering
                  ? <> &middot; <span className="text-[#111827] font-medium">{total} entri</span> pada {fmtDateStr(filterDate)}</>
                  : <> &middot; <span className="text-[#111827] font-medium">{total} entri</span> total</>
              )}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-[#6B7280] hover:text-[#111827] transition w-7 h-7 flex items-center justify-center rounded-lg hover:bg-[#F3F4F6]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Filter bar */}
        <div className="px-6 pt-3 pb-2 border-b border-[#E5E7EB] flex items-center gap-2">
          {/*
            Wrapper div bertindak sebagai hit-area penuh.
            onClick → showPicker() agar klik di mana saja membuka date picker,
            bukan hanya di icon kalender browser di ujung kanan.
          */}
          <div
            role="button"
            aria-label="Pilih tanggal filter"
            tabIndex={0}
            onClick={handleFilterWrapperClick}
            onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); dateInputRef.current?.showPicker() } }}
            className="relative flex-1 cursor-pointer"
          >
            {/* Icon kalender custom (kiri) */}
            <svg
              width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke={filterDate ? '#2ECC71' : '#9CA3AF'}
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
              className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none z-10"
            >
              <rect x="3" y="4" width="18" height="18" rx="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/>
              <line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            <input
              ref={dateInputRef}
              type="date"
              value={filterDate}
              max={new Date().toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border transition outline-none cursor-pointer"
              style={{
                borderColor: filterDate ? '#BBF7D0' : '#E5E7EB',
                background:  filterDate ? '#F0FDF4' : '#F9FAFB',
                color:       filterDate ? '#111827' : '#6B7280',
                // Sembunyikan icon kalender bawaan browser supaya tidak dobel dengan icon custom kiri
                colorScheme: 'light',
              }}
            />
          </div>
          {filterDate && (
            <button
              onClick={handleResetFilter}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition whitespace-nowrap"
            >
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
              Reset
            </button>
          )}
        </div>

        {/* Body scroll */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">

          {/* Loading states */}
          {(loading || paging) && (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="border border-[#E5E7EB] rounded-xl p-4 space-y-2 animate-pulse">
                  <div className="h-3.5 bg-[#F3F4F6] rounded w-3/4" />
                  <div className="h-3 bg-[#F3F4F6] rounded w-1/3" />
                  <div className="flex gap-3 mt-2">
                    <div className="h-3 bg-[#F3F4F6] rounded w-16" />
                    <div className="h-3 bg-[#F3F4F6] rounded w-16" />
                    <div className="h-3 bg-[#F3F4F6] rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Empty — filter active */}
          {!loading && !paging && meals.length === 0 && isFiltering && (
            <div className="py-10 text-center">
              <div className="flex justify-center mb-3">
                <CalendarIcon size={36} color="#D1D5DB" />
              </div>
              <p className="text-sm font-semibold text-[#111827] mb-1">Tidak ada riwayat makanan</p>
              <p className="text-xs text-[#6B7280] mb-4">
                Tidak ditemukan catatan pada <strong className="text-[#111827]">{fmtDateStr(filterDate)}</strong>
              </p>
              <button
                onClick={handleResetFilter}
                className="text-xs px-3 py-1.5 rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] text-[#166534] hover:bg-[#D4F5E4] transition"
              >
                Lihat Semua Riwayat
              </button>
            </div>
          )}

          {/* Empty — no filter */}
          {!loading && !paging && meals.length === 0 && !isFiltering && (
            <div className="py-10 text-center text-[#6B7280] text-sm">
              Belum ada riwayat analisa untuk user ini.
            </div>
          )}

          {/* Meal list */}
          {!loading && !paging && meals.map(meal => {
            const menuItems  = getMenuItems(meal)
            const desc       = getDescription(meal)
            const isExpanded = expanded === meal.id

            return (
              <div key={meal.id} className="border border-[#E5E7EB] rounded-xl overflow-hidden bg-white">
                <div className="flex items-start gap-3 px-4 py-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-[#111827] truncate">
                      {meal.dishNames.length > 0
                        ? meal.dishNames.join(', ')
                        : <span className="italic text-[#9CA3AF]">Tidak terdeteksi</span>
                      }
                    </p>
                    <p className="text-xs text-[#6B7280] mt-0.5">{fmtDate(meal.loggedAt)}</p>
                    {desc && <p className="text-xs text-[#6B7280] mt-1 line-clamp-2">{desc}</p>}

                    {/* ── Macro summary row ── */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500">
                        <FlameIcon size={11} />
                        {meal.totalCalories} kkal
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                        <DumbbellIcon size={11} color="#22c55e" />
                        <strong className="text-[#111827]">{Number(meal.totalProtein).toFixed(1)}g</strong>
                        <span>protein</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                        <GrainIcon size={11} color="#3b82f6" />
                        <strong className="text-[#111827]">{Number(meal.totalCarbs).toFixed(1)}g</strong>
                        <span>karbo</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                        <DropletIcon size={11} color="#a855f7" />
                        <strong className="text-[#111827]">{Number(meal.totalFat).toFixed(1)}g</strong>
                        <span>lemak</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {menuItems.length > 0 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : meal.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition"
                      >
                        {isExpanded ? '▲ Tutup' : `▼ ${menuItems.length} menu`}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      disabled={deleting === meal.id}
                      className="flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg border border-red-200 text-red-400 hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deleting === meal.id
                        ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="2.5" strokeLinecap="round" style={{ animation: 'spin .7s linear infinite' }}><path d="M12 2 a10 10 0 0 1 10 10" /></svg>
                        : <TrashIcon size={12} />
                      }
                    </button>
                  </div>
                </div>

                {/* ── Expanded: per-menu detail ── */}
                {isExpanded && menuItems.length > 0 && (
                  <div className="border-t border-[#E5E7EB] px-4 py-3 space-y-3 bg-[#F9FAFB]">
                    <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide">
                      Detail Menu Terdeteksi
                    </p>
                    {menuItems.map((item, idx) => (
                      <div key={idx} className="border border-[#E5E7EB] rounded-lg p-3 bg-white space-y-1">
                        <p className="text-sm font-medium text-[#111827]">{item.name ?? `Menu ${idx + 1}`}</p>
                        {item.description && <p className="text-xs text-[#6B7280]">{item.description}</p>}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {item.calories !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-500">
                              <FlameIcon size={10} /> {item.calories} kkal
                            </span>
                          )}
                          {item.protein !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                              <DumbbellIcon size={10} color="#22c55e" /> {item.protein}g protein
                            </span>
                          )}
                          {item.carbs !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                              <GrainIcon size={10} color="#3b82f6" /> {item.carbs}g karbo
                            </span>
                          )}
                          {item.fat !== undefined && (
                            <span className="inline-flex items-center gap-1 text-xs text-[#6B7280]">
                              <DropletIcon size={10} color="#a855f7" /> {item.fat}g lemak
                            </span>
                          )}
                          {item.fiber !== undefined && (
                            <span className="text-xs text-[#6B7280]">Serat: {item.fiber}g</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Pagination footer */}
        <div className="px-6 py-3 border-t border-[#E5E7EB] flex items-center justify-between gap-3">
          <span className="text-xs text-[#6B7280] tabular-nums">
            {paging ? (
              <span className="inline-flex items-center gap-1.5">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="2.5" strokeLinecap="round"
                  style={{ animation: 'spin .7s linear infinite' }}>
                  <path d="M12 2 a10 10 0 0 1 10 10" />
                </svg>
                Memuat…
              </span>
            ) : data ? `Hal. ${page} / ${totalPages}` : ''}
          </span>

          <div className="flex items-center gap-2">
            {page > 1 && (
              <button
                disabled={paging}
                onClick={() => load(1, true, filterDate)}
                title="Halaman pertama"
                className="flex items-center gap-1 px-2.5 py-1.5 text-xs rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="11 17 6 12 11 7"/>
                  <polyline points="18 17 13 12 18 7"/>
                </svg>
                First
              </button>
            )}
            <button
              disabled={page <= 1 || paging}
              onClick={() => load(page - 1, true, filterDate)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              ← Prev
            </button>
            <button
              disabled={page >= totalPages || paging}
              onClick={() => load(page + 1, true, filterDate)}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F3F4F6] transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Next →
            </button>
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:text-[#111827] hover:bg-[#F3F4F6] transition"
            >
              Tutup
            </button>
          </div>
        </div>

        <style>{`@keyframes spin { to { transform: rotate(360deg) } }`}</style>
      </div>
    </div>
  )
}
