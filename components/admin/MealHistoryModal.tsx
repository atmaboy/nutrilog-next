'use client'
import { useEffect, useState } from 'react'
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

export default function MealHistoryModal({
  userId, username, onClose,
}: {
  userId: string
  username: string
  onClose: () => void
}) {
  const [meals, setMeals]         = useState<Meal[]>([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState<string | null>(null)
  const [deleting, setDeleting]   = useState<string | null>(null)
  const router = useRouter()

  const tok = () =>
    document.cookie.split(';').find(c => c.includes('nl_admin_token'))?.split('=')[1] ?? ''

  useEffect(() => {
    fetch(`/api/admin?action=user_meals&user_id=${userId}`, {
      headers: { Authorization: `Bearer ${tok()}` },
    })
      .then(r => r.json())
      .then(d => { setMeals(d.meals ?? []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [userId])

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
      setMeals(prev => prev.filter(m => m.id !== mealId))
      router.refresh()
    } else {
      toast.error(d.error)
    }
    setDeleting(null)
  }

  // Ambil menuItems dari rawAnalysis (beberapa format berbeda)
  function getMenuItems(meal: Meal): MenuItem[] {
    const raw = meal.rawAnalysis
    if (!raw) return []
    return raw.menuItems
      ?? raw.analysis?.menuItems
      ?? []
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

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="bg-card border rounded-2xl shadow-xl w-full max-w-2xl max-h-[85vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <div>
            <h2 className="text-base font-semibold">Riwayat Analisa Makanan</h2>
            <p className="text-xs text-muted-foreground mt-0.5">@{username} · {meals.length} entri</p>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-lg leading-none"
          >✕</button>
        </div>

        {/* Body scroll */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {loading && (
            <div className="py-12 text-center text-muted-foreground text-sm animate-pulse">
              Memuat riwayat…
            </div>
          )}

          {!loading && meals.length === 0 && (
            <div className="py-12 text-center text-muted-foreground text-sm">
              Belum ada riwayat analisa untuk user ini.
            </div>
          )}

          {!loading && meals.map(meal => {
            const menuItems  = getMenuItems(meal)
            const desc       = getDescription(meal)
            const isExpanded = expanded === meal.id

            return (
              <div key={meal.id} className="border rounded-xl overflow-hidden bg-background">

                {/* Row utama */}
                <div className="flex items-start gap-3 px-4 py-3">
                  {/* Info kiri */}
                  <div className="flex-1 min-w-0">
                    {/* Nama makanan */}
                    <p className="font-medium text-sm truncate">
                      {meal.dishNames.length > 0
                        ? meal.dishNames.join(', ')
                        : <span className="italic text-muted-foreground">Tidak terdeteksi</span>
                      }
                    </p>

                    {/* Tanggal */}
                    <p className="text-xs text-muted-foreground mt-0.5">{fmtDate(meal.loggedAt)}</p>

                    {/* Deskripsi singkat */}
                    {desc && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{desc}</p>
                    )}

                    {/* Nutrisi ringkasan */}
                    <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2">
                      <span className="text-xs font-semibold text-orange-500">
                        🔥 {meal.totalCalories} kkal
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Protein: <strong>{Number(meal.totalProtein).toFixed(1)}g</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Karbo: <strong>{Number(meal.totalCarbs).toFixed(1)}g</strong>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Lemak: <strong>{Number(meal.totalFat).toFixed(1)}g</strong>
                      </span>
                    </div>
                  </div>

                  {/* Tombol kanan */}
                  <div className="flex flex-col gap-1.5 items-end shrink-0">
                    {menuItems.length > 0 && (
                      <button
                        onClick={() => setExpanded(isExpanded ? null : meal.id)}
                        className="text-xs px-2.5 py-1 rounded-lg border border-border hover:bg-muted transition"
                      >
                        {isExpanded ? '▲ Tutup' : `▼ ${menuItems.length} menu`}
                      </button>
                    )}
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      disabled={deleting === meal.id}
                      className="text-xs px-2.5 py-1 rounded-lg border border-destructive/30 text-destructive hover:bg-destructive/5 transition disabled:opacity-50"
                    >
                      {deleting === meal.id ? '…' : '🗑'}
                    </button>
                  </div>
                </div>

                {/* Detail menu (expandable) */}
                {isExpanded && menuItems.length > 0 && (
                  <div className="border-t px-4 py-3 space-y-3 bg-muted/20">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Detail Menu Terdeteksi
                    </p>
                    {menuItems.map((item, idx) => (
                      <div key={idx} className="border rounded-lg p-3 bg-card space-y-1">
                        <p className="text-sm font-medium">{item.name ?? `Menu ${idx + 1}`}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1">
                          {item.calories !== undefined && (
                            <span className="text-xs text-orange-500 font-medium">🔥 {item.calories} kkal</span>
                          )}
                          {item.protein !== undefined && (
                            <span className="text-xs text-muted-foreground">Protein: {item.protein}g</span>
                          )}
                          {item.carbs !== undefined && (
                            <span className="text-xs text-muted-foreground">Karbo: {item.carbs}g</span>
                          )}
                          {item.fat !== undefined && (
                            <span className="text-xs text-muted-foreground">Lemak: {item.fat}g</span>
                          )}
                          {item.fiber !== undefined && (
                            <span className="text-xs text-muted-foreground">Serat: {item.fiber}g</span>
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

        {/* Footer */}
        <div className="px-6 py-3 border-t">
          <button
            onClick={onClose}
            className="w-full text-sm text-muted-foreground hover:text-foreground transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  )
}