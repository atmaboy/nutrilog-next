'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'

type Dish = {
  name: string
  portion: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

type AnalysisResult = {
  dishes: Dish[]
  total: { calories: number; protein: number; carbs: number; fat: number }
  notes: string
  healthScore?: number
  assessment?: string
}

type SavedMeal = {
  meal: { id: string }
  usage: { used: number; limit: number; remaining: number }
}

const ACCENT = 'var(--accent)'
const S2 = 'var(--surface2)'
const BORDER = 'var(--border)'

export default function CatatPage() {
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [imgPreview, setImgPreview] = useState('')
  const [imgBase64, setImgBase64] = useState('')
  const [imgMime, setImgMime] = useState('image/jpeg')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  // Re-analyze
  const [showReanalyze, setShowReanalyze] = useState(false)
  const [reanalyzeText, setReanalyzeText] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  // Edit total
  const [showEditTotal, setShowEditTotal] = useState(false)
  const [editKcal, setEditKcal] = useState(0)
  const [editProt, setEditProt] = useState(0)
  const [editCarb, setEditCarb] = useState(0)
  const [editFat, setEditFat] = useState(0)

  // Edit per-dish
  const [openDishIdx, setOpenDishIdx] = useState<number | null>(null)

  // Add dish
  const [showAddDish, setShowAddDish] = useState(false)
  const [newDish, setNewDish] = useState({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 })

  // State imageDataUrl

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('nl_token') || ''}` }
  }

  async function compressImage(file: File): Promise<{ base64: string; mime: string }> {
    return new Promise(resolve => {
      const reader = new FileReader()
      reader.onload = e => {
        const img = new Image()
        img.onload = () => {
          const maxW = 1024
          const scale = img.width > maxW ? maxW / img.width : 1
          const canvas = document.createElement('canvas')
          canvas.width = img.width * scale
          canvas.height = img.height * scale
          canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
          resolve({ base64: dataUrl.split(',')[1], mime: 'image/jpeg' })
        }
        img.src = e.target!.result as string
      }
      reader.readAsDataURL(file)
    })
  }

  async function handleFile(file: File) {
    reset()
    const reader = new FileReader()
    reader.onload = e => setImgPreview(e.target!.result as string)
    reader.readAsDataURL(file)
    const { base64, mime } = await compressImage(file)
    setImgBase64(base64)
    setImgMime(mime)
    setStep('preview')
  }

  function reset() {
    setStep('upload')
    setImgPreview('')
    setImgBase64('')
    setResult(null)
    setError('')
    setWarn('')
    setSaved(false)
    setShowReanalyze(false)
    setReanalyzeText('')
    setShowEditTotal(false)
    setShowAddDish(false)
    setOpenDishIdx(null)
  }

  // Tambah state imageDataUrl
const [imageDataUrl, setImageDataUrl] = useState('')

// Di dalam fungsi analyze(), update bagian setResult:
async function analyze(correction?: string) {
  if (!imgBase64) return
  correction ? setReanalyzing(true) : setLoading(true)
  setError('')
  setWarn('')
  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: imgBase64, mimeType: imgMime, correction }),
    })
    const data = await res.json()
    if (res.status === 429) { setWarn(data.error || 'Batas analisa harian tercapai'); setStep('preview'); return }
    if (!res.ok) { setError(data.error || 'Analisa gagal'); return }
    setResult(data.analysis)
    setImageDataUrl(data.imageDataUrl || '')  // ✅ simpan data URL dari server
    setStep('result')
    setShowReanalyze(false)
    setReanalyzeText('')
  } catch {
    setError('Tidak dapat terhubung ke server')
  } finally {
    setLoading(false)
    setReanalyzing(false)
  }
}

// Perbaiki saveMeal() — POST ke /api/history, kirim analysis + imageDataUrl
async function saveMeal() {
  if (!result || saving) return
  setSaving(true)
  try {
    const res = await fetch('/api/history', {
      method: 'POST',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        analysis: result,
        imageDataUrl,   // ✅ kirim foto untuk disimpan ke DB
      }),
    })
    if (!res.ok) {
      const data = await res.json()
      toast.error(data.error || 'Gagal menyimpan')
      return
    }
    setSaved(true)
    toast.success('Berhasil disimpan ke riwayat!')
  } catch {
    toast.error('Gagal menyimpan')
  } finally {
    setSaving(false)
  }
}

  function recalc(dishes: Dish[]) {
    return {
      calories: dishes.reduce((s, d) => s + d.calories, 0),
      protein: dishes.reduce((s, d) => s + d.protein, 0),
      carbs: dishes.reduce((s, d) => s + d.carbs, 0),
      fat: dishes.reduce((s, d) => s + d.fat, 0),
    }
  }

  function updateDish(idx: number, updated: Dish) {
    if (!result) return
    const dishes = result.dishes.map((d, i) => i === idx ? updated : d)
    setResult({ ...result, dishes, total: recalc(dishes) })
    setOpenDishIdx(null)
    toast.success('Menu diperbarui')
  }

  function removeDish(idx: number) {
    if (!result) return
    const dishes = result.dishes.filter((_, i) => i !== idx)
    setResult({ ...result, dishes, total: recalc(dishes) })
    toast.success('Menu dihapus')
  }

  function applyTotalEdit() {
    if (!result) return
    setResult({ ...result, total: { calories: editKcal, protein: editProt, carbs: editCarb, fat: editFat } })
    setShowEditTotal(false)
    toast.success('Total diperbarui')
  }

  function addDish() {
    if (!result || !newDish.name.trim()) return
    const dishes = [...result.dishes, newDish]
    setResult({ ...result, dishes, total: recalc(dishes) })
    setNewDish({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    setShowAddDish(false)
    toast.success('Menu ditambahkan')
  }

  function healthScore(score?: number) {
    if (!score) return null
    const color = score >= 8 ? '#3DFF95' : score >= 6 ? '#FBB040' : '#F87171'
    const label = score >= 8 ? 'Sangat Baik' : score >= 6 ? 'Cukup Baik' : 'Kurang Baik'
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '10px 0', padding: '8px 12px', background: `${color}15`, borderRadius: 10, border: `1px solid ${color}30` }}>
        <span style={{ fontSize: 18 }}>{'⭐'.repeat(Math.round(score / 2))}</span>
        <span style={{ color, fontWeight: 700, fontSize: 13 }}>Health Score {score}/10</span>
        <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>· {label}</span>
      </div>
    )
  }

  const btnPrimary: React.CSSProperties = {
    width: '100%', padding: 14, background: ACCENT, borderRadius: 13,
    color: '#081520', fontWeight: 700, fontSize: 15, border: 'none',
    cursor: 'pointer', marginBottom: 8, transition: 'opacity .2s',
  }
  const btnGhost: React.CSSProperties = {
    width: '100%', padding: '12px 0', background: 'transparent',
    border: '1px solid var(--border)', borderRadius: 13,
    color: 'var(--text-muted)', fontWeight: 600, fontSize: 14, cursor: 'pointer', marginBottom: 8,
  }
  const inp: React.CSSProperties = {
    width: '100%', background: S2, border: `1px solid ${BORDER}`,
    borderRadius: 10, padding: '10px 12px', color: 'var(--text)',
    fontSize: 14, outline: 'none', boxSizing: 'border-box',
  }
  const badge = (label: string, value: string, color: string) => (
    <div style={{ background: `${color}15`, border: `1px solid ${color}30`, borderRadius: 12, padding: '10px 14px', textAlign: 'center', flex: 1 }}>
      <div style={{ color, fontWeight: 700, fontSize: 18 }}>{value}</div>
      <div style={{ color: 'var(--text-muted)', fontSize: 11 }}>{label}</div>
    </div>
  )

  return (
    <div>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />
      <input ref={galleryRef} type="file" accept="image/*" style={{ display: 'none' }}
        onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])} />

      {/* ── STEP: UPLOAD ── */}
      {step === 'upload' && (
        <div style={{ animation: 'slideUp .38s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{
            border: '2px dashed var(--border2)', borderRadius: 20, padding: '40px 24px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📸</div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>Foto Makananmu</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              AI akan menganalisis kandungan gizi makanan secara otomatis.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => cameraRef.current?.click()} style={{
                padding: '12px 20px', background: ACCENT, borderRadius: 13,
                color: '#081520', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
              }}>📷 Kamera</button>
              <button onClick={() => galleryRef.current?.click()} style={{
                padding: '12px 20px', background: S2, border: `1px solid ${BORDER}`,
                borderRadius: 13, color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
              }}>🖼️ Galeri</button>
            </div>
          </div>
        </div>
      )}

      {/* ── STEP: PREVIEW ── */}
      {step === 'preview' && (
        <div>
          {imgPreview && (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 12 }}>
              <img src={imgPreview} alt="Preview" style={{ width: '100%', maxHeight: 280, objectFit: 'cover', display: 'block' }} />
              <button onClick={reset} style={{
                position: 'absolute', top: 10, right: 10, background: 'rgba(8,21,32,.7)',
                border: 'none', borderRadius: 8, padding: '6px 10px',
                color: 'var(--text)', fontSize: 12, cursor: 'pointer',
              }}>Ganti Foto</button>
            </div>
          )}
          {warn && (
            <div style={{ background: 'var(--warn-bg)', border: '1px solid var(--warn-border)', borderRadius: 12, padding: '10px 14px', color: 'var(--warn-text)', fontSize: 13, marginBottom: 10 }}>
              ⚠️ {warn}
            </div>
          )}
          {error && (
            <div style={{ background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.25)', borderRadius: 12, padding: '10px 14px', color: '#F87171', fontSize: 13, marginBottom: 10 }}>
              {error}
            </div>
          )}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0', background: S2, borderRadius: 16 }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>🧠</div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Menganalisis makanan…</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI sedang menghitung kandungan gizi</div>
            </div>
          ) : (
            <button onClick={() => analyze()} style={btnPrimary}>🔍 Analisis Kandungan Gizi</button>
          )}
        </div>
      )}

      {/* ── STEP: RESULT ── */}
      {step === 'result' && result && (
        <div style={{ animation: 'slideUp .38s cubic-bezier(.22,1,.36,1) both' }}>
        {/* ── STEP: RESULT ── */}

    {/* ✅ Tampilkan foto makanan */}
    {imageDataUrl && (
      <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
        <img
          src={imageDataUrl}
          alt="Foto makanan"
          style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }}
        />
      </div>
    )}

          {/* Re-analyze panel */}
          {showReanalyze && (
            <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span style={{ fontSize: 18 }}>🔄</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Koreksi & Analisa Ulang</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Tidak perlu foto ulang — AI akan analisa ulang dengan koreksimu</div>
                </div>
              </div>
              <textarea value={reanalyzeText} onChange={e => setReanalyzeText(e.target.value)} rows={3}
                placeholder="Contoh: Ini nasi goreng kampung dengan telur, bukan nasi putih biasa..."
                style={{ ...inp, resize: 'none', marginBottom: 10 }} />
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>
                💡 Jelaskan nama menu yang benar, bahan-bahan, atau apapun yang kurang tepat dari hasil analisa sebelumnya.
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => analyze(reanalyzeText)} disabled={reanalyzing} style={{
                  flex: 1, padding: '10px 0', background: ACCENT, color: '#081520',
                  borderRadius: 11, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer',
                }}>
                  {reanalyzing ? '⏳ Menganalisa...' : '🔄 Analisa Ulang'}
                </button>
                <button onClick={() => setShowReanalyze(false)} style={{
                  padding: '10px 16px', background: BORDER, borderRadius: 11,
                  color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                }}>Batal</button>
              </div>
            </div>
          )}

          {/* Total nutrition card */}
          <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase' }}>Total Kandungan Gizi</div>
              <div style={{ display: 'flex', gap: 6 }}>
                {!showReanalyze && (
                  <button onClick={() => setShowReanalyze(true)} style={{
                    padding: '5px 10px', background: 'var(--accent-dim)',
                    border: '1px solid rgba(61,255,149,.25)', borderRadius: 8,
                    color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                  }}>🔄 Koreksi</button>
                )}
                <button onClick={() => {
                  setEditKcal(result.total.calories); setEditProt(result.total.protein)
                  setEditCarb(result.total.carbs); setEditFat(result.total.fat)
                  setShowEditTotal(s => !s)
                }} style={{
                  padding: '5px 10px', background: 'var(--border2)', borderRadius: 8,
                  color: 'var(--text-sub)', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                }}>✏️ Edit</button>
              </div>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
              {badge('kkal', String(result.total.calories), '#F87171')}
              {badge('protein', `${result.total.protein.toFixed(1)}g`, 'var(--protein)')}
              {badge('karbo', `${result.total.carbs.toFixed(1)}g`, 'var(--carbs)')}
              {badge('lemak', `${result.total.fat.toFixed(1)}g`, 'var(--fat)')}
            </div>

            {result.healthScore && healthScore(result.healthScore)}
            {result.assessment && (
              <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6, marginTop: 6 }}>
                {result.assessment}
              </div>
            )}

            {/* Edit total panel */}
            {showEditTotal && (
              <div style={{ marginTop: 12, padding: '12px 0 0', borderTop: `1px solid ${BORDER}` }}>
                {([['Kalori', editKcal, setEditKcal, 'kkal'], ['Protein', editProt, setEditProt, 'g'], ['Karbo', editCarb, setEditCarb, 'g'], ['Lemak', editFat, setEditFat, 'g']] as any[]).map(([label, val, setter, unit]) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                    <span style={{ width: 60, fontSize: 13, color: 'var(--text-muted)' }}>{label}</span>
                    <input type="number" value={val} onChange={e => setter(parseFloat(e.target.value) || 0)}
                      style={{ ...inp, flex: 1 }} />
                    <span style={{ width: 30, fontSize: 12, color: 'var(--text-muted)' }}>{unit}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
                  <button onClick={applyTotalEdit} style={{ flex: 1, padding: '9px 0', background: ACCENT, color: '#081520', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>✓ Terapkan</button>
                  <button onClick={() => setShowEditTotal(false)} style={{ padding: '9px 14px', background: BORDER, borderRadius: 10, color: 'var(--text-muted)', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer' }}>Batal</button>
                </div>
              </div>
            )}
          </div>

          {/* Per-dish list */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase' }}>
              Menu Terdeteksi ({result.dishes.length})
            </div>
            <button onClick={() => setShowAddDish(s => !s)} style={{
              padding: '5px 12px', background: 'var(--accent-dim)',
              border: '1px solid rgba(61,255,149,.25)', borderRadius: 8,
              color: ACCENT, fontSize: 11, fontWeight: 600, cursor: 'pointer',
            }}>+ Tambah</button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 14 }}>
            {result.dishes.map((dish, i) => (
              <DishCard key={i} dish={dish} index={i}
                isOpen={openDishIdx === i}
                onToggle={() => setOpenDishIdx(openDishIdx === i ? null : i)}
                onUpdate={updated => updateDish(i, updated)}
                onRemove={() => removeDish(i)}
              />
            ))}
          </div>

          {/* Add dish panel */}
          {showAddDish && (
            <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 16px', marginBottom: 14 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Tambah Menu Manual</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Nama Makanan</div>
                  <input style={inp} value={newDish.name} onChange={e => setNewDish(d => ({ ...d, name: e.target.value }))} placeholder="mis: Nasi Goreng" />
                </div>
                <div style={{ gridColumn: '1/-1' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>Porsi</div>
                  <input style={inp} value={newDish.portion} onChange={e => setNewDish(d => ({ ...d, portion: e.target.value }))} placeholder="1 piring" />
                </div>
                {([['Kalori', 'calories', 'kkal'], ['Protein (g)', 'protein', ''], ['Karbo (g)', 'carbs', ''], ['Lemak (g)', 'fat', '']] as const).map(([label, key]) => (
                  <div key={key}>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
                    <input type="number" style={inp} value={newDish[key]}
                      onChange={e => setNewDish(d => ({ ...d, [key]: parseFloat(e.target.value) || 0 }))} />
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
                <button onClick={addDish} style={{ flex: 1, padding: '10px 0', background: ACCENT, color: '#081520', borderRadius: 10, fontWeight: 700, fontSize: 13, border: 'none', cursor: 'pointer' }}>+ Tambahkan</button>
                <button onClick={() => setShowAddDish(false)} style={{ padding: '10px 14px', background: BORDER, borderRadius: 10, color: 'var(--text-muted)', fontSize: 13, border: 'none', cursor: 'pointer' }}>Batal</button>
              </div>
            </div>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(61,255,149,.05)', border: '1px solid rgba(61,255,149,.15)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            ℹ️ <strong>Disclaimer:</strong> Hasil analisa foto ini sepenuhnya dihasilkan oleh AI dan dapat mengandung ketidaktepatan. Kami terus melakukan pengembangan untuk meningkatkan akurasi.
          </div>

          {/* Actions */}
          {!saved ? (
            <>
              <button onClick={saveMeal} disabled={saving} style={{ ...btnPrimary, opacity: saving ? 0.6 : 1 }}>
                {saving ? '⏳ Menyimpan...' : '💾 Simpan ke Riwayat'}
              </button>
              <button onClick={reset} style={btnGhost}>📷 Foto Makanan Lain</button>
            </>
          ) : (
            <div style={{ textAlign: 'center', padding: '12px 0 8px' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>✅</div>
              <div style={{ fontWeight: 700, color: 'var(--accent)', marginBottom: 12 }}>Tersimpan!</div>
              <button onClick={reset} style={btnGhost}>📷 Catat Makanan Lain</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── DishCard ─────────────────────────────────────────────────────────────────
function DishCard({ dish, index, isOpen, onToggle, onUpdate, onRemove }: {
  dish: Dish; index: number
  isOpen: boolean
  onToggle: () => void
  onUpdate: (d: Dish) => void
  onRemove: () => void
}) {
  const [local, setLocal] = useState<Dish>(dish)
  const inp: React.CSSProperties = {
    background: 'var(--bg)', border: '1px solid var(--border)',
    borderRadius: 8, padding: '7px 10px', color: 'var(--text)',
    fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box',
  }

  return (
    <div style={{ background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 14 }}>
      <div onClick={onToggle} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 14px', cursor: 'pointer' }}>
        <div>
          <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{dish.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dish.portion}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: '#F87171' }}>{dish.calories} kkal</span>
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{isOpen ? '▲' : '▼'}</span>
        </div>
      </div>

      {isOpen && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '12px 14px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 10 }}>
            {([['Nama', 'name', 'text'], ['Porsi', 'portion', 'text'], ['Kalori', 'calories', 'number'], ['Protein (g)', 'protein', 'number'], ['Karbo (g)', 'carbs', 'number'], ['Lemak (g)', 'fat', 'number']] as const).map(([label, key, type]) => (
              <div key={key} style={key === 'name' || key === 'portion' ? { gridColumn: '1/-1' } : {}}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                <input type={type} value={local[key]} style={inp}
                  onChange={e => setLocal(d => ({ ...d, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onUpdate(local)} style={{ flex: 1, padding: '8px 0', background: 'var(--accent)', color: '#081520', borderRadius: 9, fontWeight: 700, fontSize: 12, border: 'none', cursor: 'pointer' }}>✓ Simpan</button>
            <button onClick={onRemove} style={{ padding: '8px 12px', background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)', borderRadius: 9, color: '#F87171', fontSize: 12, cursor: 'pointer' }}>Hapus</button>
            <button onClick={onToggle} style={{ padding: '8px 12px', background: 'var(--border)', borderRadius: 9, color: 'var(--text-muted)', fontSize: 12, border: 'none', cursor: 'pointer' }}>Batal</button>
          </div>
        </div>
      )}
    </div>
  )
}