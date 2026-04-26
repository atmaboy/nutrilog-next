'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
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

const ACCENT = 'var(--accent)'
const S2 = 'var(--surface2)'
const BORDER = 'var(--border)'

export default function CatatPage() {
  const router = useRouter()
  const cameraRef = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const [step, setStep] = useState<'upload' | 'preview' | 'result'>('upload')
  const [imgPreview, setImgPreview] = useState('')
  const [imgBase64, setImgBase64] = useState('')
  const [imgMime, setImgMime] = useState('image/jpeg')
  const [imageDataUrl, setImageDataUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [warn, setWarn] = useState('')
  const [result, setResult] = useState<AnalysisResult | null>(null)

  // ID entri riwayat yang tersimpan untuk sesi ini (dipakai saat koreksi → PATCH)
  const [savedMealId, setSavedMealId] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  const [showReanalyze, setShowReanalyze] = useState(false)
  const [reanalyzeText, setReanalyzeText] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  // Full-edit mode
  const [showFullEdit, setShowFullEdit] = useState(false)
  const [editResult, setEditResult] = useState<AnalysisResult | null>(null)

  const [openDishIdx, setOpenDishIdx] = useState<number | null>(null)

  const [showAddDish, setShowAddDish] = useState(false)
  const [newDish, setNewDish] = useState<Dish>({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 })

  function authHeaders() {
    return { Authorization: `Bearer ${localStorage.getItem('nl_token') || ''}` }
  }

  function handle401() {
    localStorage.removeItem('nl_token')
    localStorage.removeItem('nl_user')
    router.replace('/login')
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

  function makeThumbnail(dataUrl: string): Promise<string> {
    return new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const maxW = 300
        const scale = img.width > maxW ? maxW / img.width : 1
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      }
      img.src = dataUrl
    })
  }

  async function handleFile(file: File) {
    reset()
    const reader = new FileReader()
    reader.onload = e => {
      const preview = e.target!.result as string
      setImgPreview(preview)
      setImageDataUrl(preview)
    }
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
    setImgMime('image/jpeg')
    setImageDataUrl('')
    setResult(null)
    setError('')
    setWarn('')
    setSavedMealId(null)
    setAutoSaving(false)
    setShowReanalyze(false)
    setReanalyzeText('')
    setReanalyzing(false)
    setShowFullEdit(false)
    setEditResult(null)
    setShowAddDish(false)
    setOpenDishIdx(null)
  }

  // Auto-save entri baru (dipanggil setelah analisa pertama)
  async function autoSaveNew(analysis: AnalysisResult, imgDataUrl: string) {
    setAutoSaving(true)
    try {
      const thumbnail = imgDataUrl ? await makeThumbnail(imgDataUrl) : null
      const res = await fetch('/api/history', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis, imageDataUrl: thumbnail }),
      })
      if (res.status === 401) { handle401(); return }
      if (!res.ok) { toast.error('Gagal menyimpan ke riwayat'); return }
      const data = await res.json()
      setSavedMealId(data.meal?.id ?? null)
      toast.success('Tersimpan otomatis ke riwayat ✓')
    } catch {
      toast.error('Gagal menyimpan ke riwayat')
    } finally {
      setAutoSaving(false)
    }
  }

  // Update entri yang sudah ada (dipanggil setelah koreksi)
  async function updateSavedMeal(analysis: AnalysisResult) {
    if (!savedMealId) return
    try {
      const res = await fetch(`/api/history?id=${savedMealId}`, {
        method: 'PATCH',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ analysis }),
      })
      if (res.status === 401) { handle401(); return }
      if (!res.ok) { toast.error('Gagal memperbarui riwayat'); return }
      toast.success('Riwayat diperbarui ✓')
    } catch {
      toast.error('Gagal memperbarui riwayat')
    }
  }

  async function analyze(correction?: string) {
    if (!imgBase64) return

    const isCorrection = !!correction?.trim()
    if (isCorrection) {
      setReanalyzing(true)
    } else {
      setLoading(true)
    }

    setError('')
    setWarn('')

    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgBase64, mimeType: imgMime, correction }),
      })
      const data = await res.json()

      if (res.status === 401) { handle401(); return }

      if (res.status === 429) {
        setWarn(data.error || 'Batas analisa harian tercapai')
        setStep('preview')
        return
      }

      if (!res.ok) {
        setError(data.error || 'Analisa gagal')
        if (!isCorrection) setStep('preview')
        return
      }

      const analysis: AnalysisResult = data.analysis
      setResult(analysis)
      setStep('result')
      setShowReanalyze(false)
      setReanalyzeText('')
      setShowFullEdit(false)
      setEditResult(null)
      setShowAddDish(false)
      setOpenDishIdx(null)

      if (isCorrection) {
        // Koreksi → update entri yang sudah ada
        toast.success('Hasil koreksi diperbarui')
        await updateSavedMeal(analysis)
      } else {
        // Analisa pertama → buat entri baru otomatis
        toast.success('Analisa selesai')
        await autoSaveNew(analysis, imageDataUrl)
      }
    } catch {
      setError('Tidak dapat terhubung ke server')
      if (!isCorrection) setStep('preview')
    } finally {
      setLoading(false)
      setReanalyzing(false)
    }
  }

  function recalc(dishes: Dish[]) {
    return {
      calories: dishes.reduce((s, d) => s + d.calories, 0),
      protein:  dishes.reduce((s, d) => s + d.protein, 0),
      carbs:    dishes.reduce((s, d) => s + d.carbs, 0),
      fat:      dishes.reduce((s, d) => s + d.fat, 0),
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

  function addDish() {
    if (!result || !newDish.name.trim()) return
    const dishes = [...result.dishes, newDish]
    setResult({ ...result, dishes, total: recalc(dishes) })
    setNewDish({ name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 })
    setShowAddDish(false)
    toast.success('Menu ditambahkan')
  }

  // Buka full-edit mode — salin state result ke editResult
  function openFullEdit() {
    if (!result) return
    setEditResult(JSON.parse(JSON.stringify(result)))
    setShowFullEdit(true)
  }

  // Terapkan hasil full-edit ke result
  function applyFullEdit() {
    if (!editResult) return
    const total = recalc(editResult.dishes)
    const updated: AnalysisResult = { ...editResult, total }
    setResult(updated)
    setShowFullEdit(false)
    setEditResult(null)
    toast.success('Perubahan diterapkan')
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

          {/* Foto */}
          {imageDataUrl && (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              <img src={imageDataUrl} alt="Foto makanan" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              {/* Badge auto-save status */}
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                background: autoSaving ? 'rgba(8,21,32,.75)' : 'rgba(61,255,149,.15)',
                border: `1px solid ${autoSaving ? 'transparent' : 'rgba(61,255,149,.35)'}`,
                borderRadius: 8, padding: '4px 10px',
                color: autoSaving ? 'var(--text-muted)' : 'var(--accent)',
                fontSize: 11, fontWeight: 600,
              }}>
                {autoSaving ? '⏳ Menyimpan...' : '✓ Tersimpan'}
              </div>
            </div>
          )}

          {/* ── FULL EDIT MODE ── */}
          {showFullEdit && editResult && (
            <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '16px', marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>✏️ Mode Edit</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Edit semua menu, nutrisi & deskripsi</div>
                </div>
                <button onClick={() => { setShowFullEdit(false); setEditResult(null) }} style={{
                  padding: '5px 12px', background: BORDER, borderRadius: 8,
                  color: 'var(--text-muted)', fontSize: 12, border: 'none', cursor: 'pointer',
                }}>✕ Batal</button>
              </div>

              {/* Edit tiap dish */}
              {editResult.dishes.map((dish, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: '12px', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '.5px' }}>Menu {i + 1}</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Nama</div>
                      <input style={inp} value={dish.name}
                        onChange={e => {
                          const dishes = editResult.dishes.map((d, j) => j === i ? { ...d, name: e.target.value } : d)
                          setEditResult({ ...editResult, dishes })
                        }} />
                    </div>
                    <div style={{ gridColumn: '1/-1' }}>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Porsi</div>
                      <input style={inp} value={dish.portion}
                        onChange={e => {
                          const dishes = editResult.dishes.map((d, j) => j === i ? { ...d, portion: e.target.value } : d)
                          setEditResult({ ...editResult, dishes })
                        }} />
                    </div>
                    {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
                      <div key={key}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>
                          {key === 'calories' ? 'Kalori (kkal)' : key === 'protein' ? 'Protein (g)' : key === 'carbs' ? 'Karbo (g)' : 'Lemak (g)'}
                        </div>
                        <input type="number" style={inp} value={dish[key]}
                          onChange={e => {
                            const dishes = editResult.dishes.map((d, j) => j === i ? { ...d, [key]: parseFloat(e.target.value) || 0 } : d)
                            setEditResult({ ...editResult, dishes })
                          }} />
                      </div>
                    ))}
                  </div>
                  {editResult.dishes.length > 1 && (
                    <button onClick={() => {
                      const dishes = editResult.dishes.filter((_, j) => j !== i)
                      setEditResult({ ...editResult, dishes })
                    }} style={{
                      marginTop: 10, padding: '6px 12px',
                      background: 'rgba(248,113,113,.1)', border: '1px solid rgba(248,113,113,.2)',
                      borderRadius: 8, color: '#F87171', fontSize: 12, cursor: 'pointer',
                    }}>🗑 Hapus menu ini</button>
                  )}
                </div>
              ))}

              {/* Tambah menu baru dalam edit mode */}
              <button onClick={() => setEditResult({
                ...editResult,
                dishes: [...editResult.dishes, { name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 }],
              })} style={{
                width: '100%', padding: '9px 0', marginBottom: 12,
                background: 'var(--accent-dim)', border: '1px solid rgba(61,255,149,.25)',
                borderRadius: 10, color: ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>+ Tambah Menu</button>

              {/* Edit notes & assessment */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Catatan Gizi</div>
                <textarea rows={2} style={{ ...inp, resize: 'none' }} value={editResult.notes ?? ''}
                  onChange={e => setEditResult({ ...editResult, notes: e.target.value })} />
              </div>
              <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>Penilaian AI</div>
                <textarea rows={3} style={{ ...inp, resize: 'none' }} value={editResult.assessment ?? ''}
                  onChange={e => setEditResult({ ...editResult, assessment: e.target.value })} />
              </div>

              <button onClick={applyFullEdit} style={{ ...btnPrimary, marginBottom: 0 }}>✓ Terapkan Perubahan</button>
            </div>
          )}

          {/* ── CARD NUTRISI ── */}
          {!showFullEdit && (
            <>
              <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase' }}>Total Kandungan Gizi</div>
                  <button onClick={openFullEdit} style={{
                    padding: '5px 10px', background: 'var(--border2)', borderRadius: 8,
                    color: 'var(--text-sub)', fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  }}>✏️ Edit</button>
                </div>

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
              </div>

              {/* Daftar menu */}
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
                    {(['calories', 'protein', 'carbs', 'fat'] as const).map(key => (
                      <div key={key}>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 4 }}>
                          {key === 'calories' ? 'Kalori (kkal)' : key === 'protein' ? 'Protein (g)' : key === 'carbs' ? 'Karbo (g)' : 'Lemak (g)'}
                        </div>
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
            </>
          )}

          {/* Disclaimer */}
          <div style={{ background: 'rgba(61,255,149,.05)', border: '1px solid rgba(61,255,149,.15)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16 }}>
            ℹ️ <strong>Disclaimer:</strong> Hasil analisa foto ini sepenuhnya dihasilkan oleh AI dan dapat mengandung ketidaktepatan. Kami terus melakukan pengembangan untuk meningkatkan akurasi.
          </div>

          {/* ── CTA BUTTONS ── */}
          {!showFullEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

              {/* Koreksi — expand/collapse */}
              {showReanalyze ? (
                <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 16, padding: '14px 16px', marginBottom: 8 }}>
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
                    <button onClick={() => analyze(reanalyzeText)} disabled={reanalyzing || !reanalyzeText.trim()} style={{
                      flex: 1, padding: '10px 0', background: ACCENT, color: '#081520',
                      borderRadius: 11, fontWeight: 700, fontSize: 13, border: 'none',
                      cursor: reanalyzing || !reanalyzeText.trim() ? 'not-allowed' : 'pointer',
                      opacity: reanalyzing || !reanalyzeText.trim() ? 0.6 : 1,
                    }}>
                      {reanalyzing ? '⏳ Menganalisa...' : '🔄 Analisa Ulang'}
                    </button>
                    <button onClick={() => { setShowReanalyze(false); setReanalyzeText('') }} style={{
                      padding: '10px 16px', background: BORDER, borderRadius: 11,
                      color: 'var(--text-muted)', fontWeight: 600, fontSize: 13, border: 'none', cursor: 'pointer',
                    }}>Batal</button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setShowReanalyze(true)} style={btnGhost}>
                  🔄 Koreksi Hasil Analisa
                </button>
              )}

              <button onClick={reset} style={btnGhost}>📷 Foto Makanan Lain</button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

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
            {(['name', 'portion', 'calories', 'protein', 'carbs', 'fat'] as const).map(key => {
              const label = key === 'name' ? 'Nama' : key === 'portion' ? 'Porsi' : key === 'calories' ? 'Kalori' : key === 'protein' ? 'Protein (g)' : key === 'carbs' ? 'Karbo (g)' : 'Lemak (g)'
              const type = (key === 'name' || key === 'portion') ? 'text' : 'number'
              return (
                <div key={key} style={key === 'name' || key === 'portion' ? { gridColumn: '1/-1' } : {}}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 3 }}>{label}</div>
                  <input type={type} value={local[key]} style={inp}
                    onChange={e => setLocal(d => ({ ...d, [key]: type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value }))} />
                </div>
              )
            })}
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
