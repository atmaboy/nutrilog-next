'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import BrandAnnouncement from '@/components/BrandAnnouncement'

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

// ── SVG Icon set ──────────────────────────────────────────
const IconCamera = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconGallery = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2"/>
    <circle cx="8.5" cy="8.5" r="1.5"/>
    <polyline points="21 15 16 10 5 21"/>
  </svg>
)

const IconCameraLg = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
    <circle cx="12" cy="13" r="4"/>
  </svg>
)

const IconSearch = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/>
    <line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
)

const IconBrain = () => (
  <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#2ECC71" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2a4 4 0 0 0-4 4c0 .34.04.67.12.99A4 4 0 0 0 2 10.5a4 4 0 0 0 2.5 3.72V15a5 5 0 0 0 10 0v-.78A4 4 0 0 0 17 10.5a4 4 0 0 0-3.62-3.51C13.04 6.67 13 6.34 13 6a4 4 0 0 0-3.5-4z"/>
  </svg>
)

const IconEdit = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
)

const IconTrash = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
    <path d="M10 11v6M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
)

const IconCheck = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
)

const IconInfo = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/>
    <line x1="12" y1="8" x2="12" y2="12"/>
    <line x1="12" y1="16" x2="12.01" y2="16"/>
  </svg>
)
// ─────────────────────────────────────────────────────────

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

  const [savedMealId, setSavedMealId] = useState<string | null>(null)
  const [autoSaving, setAutoSaving] = useState(false)

  const [showKoreksi, setShowKoreksi] = useState(false)
  const [koreksiText, setKoreksiText] = useState('')
  const [reanalyzing, setReanalyzing] = useState(false)

  const [showFullEdit, setShowFullEdit] = useState(false)
  const [editResult, setEditResult] = useState<AnalysisResult | null>(null)
  const [patchingManual, setPatchingManual] = useState(false)

  function authHeaders(): Record<string, string> {
    return { Authorization: `Bearer ${localStorage.getItem('nl_token') ?? ''}` }
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
          const ctx = canvas.getContext('2d')
          if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
          const dataUrl = canvas.toDataURL('image/jpeg', 0.78)
          resolve({ base64: dataUrl.split(',')[1], mime: 'image/jpeg' })
        }
        img.src = e.target?.result as string
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
        const ctx = canvas.getContext('2d')
        if (ctx) ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.5))
      }
      img.src = dataUrl
    })
  }

  async function handleFile(file: File) {
    reset()
    const reader = new FileReader()
    reader.onload = e => {
      const preview = e.target?.result as string
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
    setShowKoreksi(false)
    setKoreksiText('')
    setReanalyzing(false)
    setShowFullEdit(false)
    setEditResult(null)
    setPatchingManual(false)
  }

  function recalc(dishes: Dish[]) {
    return {
      calories: dishes.reduce((s, d) => s + d.calories, 0),
      protein:  dishes.reduce((s, d) => s + d.protein, 0),
      carbs:    dishes.reduce((s, d) => s + d.carbs, 0),
      fat:      dishes.reduce((s, d) => s + d.fat, 0),
    }
  }

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
      const data = await res.json() as { meal?: { id: string } }
      setSavedMealId(data.meal?.id ?? null)
      toast.success('Tersimpan otomatis ke riwayat ✓')
    } catch {
      toast.error('Gagal menyimpan ke riwayat')
    } finally {
      setAutoSaving(false)
    }
  }

  async function patchMeal(analysis: AnalysisResult) {
    if (!savedMealId) return
    const res = await fetch(`/api/history?id=${savedMealId}`, {
      method: 'PATCH',
      headers: { ...authHeaders(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ analysis }),
    })
    if (res.status === 401) { handle401(); return }
    if (!res.ok) throw new Error('patch failed')
  }

  async function analyzeWithCorrection() {
    if (!imgBase64 || !koreksiText.trim()) return
    setReanalyzing(true)
    setError('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgBase64, mimeType: imgMime, correction: koreksiText }),
      })
      const data = await res.json() as { analysis?: AnalysisResult; error?: string }
      if (res.status === 401) { handle401(); return }
      if (res.status === 429) { toast.error(data.error ?? 'Batas analisa harian tercapai'); return }
      if (!res.ok) { toast.error(data.error ?? 'Analisa ulang gagal'); return }
      if (!data.analysis) { toast.error('Analisa ulang gagal'); return }

      const analysis: AnalysisResult = data.analysis
      setResult(analysis)
      setShowKoreksi(false)
      setKoreksiText('')
      await patchMeal(analysis)
      toast.success('Hasil koreksi diperbarui ✓')
    } catch {
      toast.error('Tidak dapat terhubung ke server')
    } finally {
      setReanalyzing(false)
    }
  }

  async function applyManualEdit() {
    if (!editResult) return
    setPatchingManual(true)
    try {
      const total = recalc(editResult.dishes)
      const updated: AnalysisResult = { ...editResult, total }
      setResult(updated)
      setShowFullEdit(false)
      setEditResult(null)
      await patchMeal(updated)
      toast.success('Menu & nutrisi diperbarui ✓')
    } catch {
      toast.error('Gagal memperbarui riwayat')
    } finally {
      setPatchingManual(false)
    }
  }

  async function analyze() {
    if (!imgBase64) return
    setLoading(true)
    setError('')
    setWarn('')
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { ...authHeaders(), 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: imgBase64, mimeType: imgMime }),
      })
      const data = await res.json() as { analysis?: AnalysisResult; error?: string }
      if (res.status === 401) { handle401(); return }
      if (res.status === 429) {
        setWarn(data.error ?? 'Batas analisa harian tercapai')
        setStep('preview')
        return
      }
      if (!res.ok) { setError(data.error ?? 'Analisa gagal'); setStep('preview'); return }
      if (!data.analysis) { setError('Analisa gagal'); setStep('preview'); return }

      const analysis: AnalysisResult = data.analysis
      setResult(analysis)
      setStep('result')
      await autoSaveNew(analysis, imageDataUrl)
    } catch {
      setError('Tidak dapat terhubung ke server')
      setStep('preview')
    } finally {
      setLoading(false)
    }
  }

  function openFullEdit() {
    if (!result) return
    setEditResult(JSON.parse(JSON.stringify(result)) as AnalysisResult)
    setShowFullEdit(true)
    setShowKoreksi(false)
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

      {/* Brand Announcement — hanya tampil di step upload */}
      {step === 'upload' && <BrandAnnouncement />}

      {/* ── STEP: UPLOAD ── */}
      {step === 'upload' && (
        <div style={{ animation: 'slideUp .38s cubic-bezier(.22,1,.36,1) both' }}>
          <div style={{ border: '2px dashed var(--border2)', borderRadius: 20, padding: '40px 24px', textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16, opacity: 0.55 }}>
              <IconCameraLg />
            </div>
            <div style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 6 }}>Foto Makananmu</div>
            <div style={{ color: 'var(--text-muted)', fontSize: 13, marginBottom: 24, lineHeight: 1.6 }}>
              AI akan menganalisis kandungan gizi makanan secara otomatis.
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => cameraRef.current?.click()} style={{
                padding: '12px 20px', background: ACCENT, borderRadius: 13,
                color: '#081520', fontWeight: 700, fontSize: 14, border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <IconCamera /> Kamera
              </button>
              <button onClick={() => galleryRef.current?.click()} style={{
                padding: '12px 20px', background: S2, border: `1px solid ${BORDER}`,
                borderRadius: 13, color: 'var(--text)', fontWeight: 700, fontSize: 14, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <IconGallery /> Galeri
              </button>
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
              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 10 }}>
                <IconBrain />
              </div>
              <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 4 }}>Menganalisis makanan…</div>
              <div style={{ color: 'var(--text-muted)', fontSize: 13 }}>AI sedang menghitung kandungan gizi</div>
            </div>
          ) : (
            <button onClick={analyze} style={{
              width: '100%', padding: 14, background: ACCENT, borderRadius: 13,
              color: '#081520', fontWeight: 700, fontSize: 15, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <IconSearch /> Analisis Kandungan Gizi
            </button>
          )}
        </div>
      )}

      {/* ── STEP: RESULT ── */}
      {step === 'result' && result && (
        <div style={{ animation: 'slideUp .38s cubic-bezier(.22,1,.36,1) both' }}>
          {imageDataUrl && (
            <div style={{ position: 'relative', borderRadius: 16, overflow: 'hidden', marginBottom: 14 }}>
              <img src={imageDataUrl} alt="Foto makanan" style={{ width: '100%', maxHeight: 220, objectFit: 'cover', display: 'block' }} />
              <div style={{
                position: 'absolute', bottom: 10, right: 10,
                background: autoSaving ? 'rgba(8,21,32,.75)' : 'rgba(61,255,149,.15)',
                border: `1px solid ${autoSaving ? 'transparent' : 'rgba(61,255,149,.35)'}`,
                borderRadius: 8, padding: '4px 10px',
                color: autoSaving ? 'var(--text-muted)' : ACCENT,
                fontSize: 11, fontWeight: 600,
              }}>
                {autoSaving ? '⏳ Menyimpan...' : '✓ Tersimpan'}
              </div>
            </div>
          )}

          {showFullEdit && editResult && (
            <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: 16, marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <IconEdit /> Edit Menu
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Nutrisi dihitung ulang otomatis setelah disimpan</div>
                </div>
                <button onClick={() => { setShowFullEdit(false); setEditResult(null) }} style={{
                  padding: '5px 12px', background: BORDER, borderRadius: 8,
                  color: 'var(--text-muted)', fontSize: 12, border: 'none', cursor: 'pointer',
                }}>✕ Batal</button>
              </div>

              {editResult.dishes.map((dish, i) => (
                <div key={i} style={{ background: 'var(--bg)', border: `1px solid ${BORDER}`, borderRadius: 12, padding: 12, marginBottom: 10 }}>
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
                      display: 'flex', alignItems: 'center', gap: 6,
                    }}>
                      <IconTrash /> Hapus menu ini
                    </button>
                  )}
                </div>
              ))}

              <button onClick={() => setEditResult({
                ...editResult,
                dishes: [...editResult.dishes, { name: '', portion: '', calories: 0, protein: 0, carbs: 0, fat: 0 }],
              })} style={{
                width: '100%', padding: '9px 0', marginBottom: 12,
                background: 'var(--accent-dim)', border: '1px solid rgba(61,255,149,.25)',
                borderRadius: 10, color: ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
              }}>+ Tambah Menu</button>

              <button onClick={applyManualEdit} disabled={patchingManual} style={{
                width: '100%', padding: 14, background: ACCENT, borderRadius: 13,
                color: '#081520', fontWeight: 700, fontSize: 15, border: 'none',
                cursor: patchingManual ? 'not-allowed' : 'pointer',
                opacity: patchingManual ? 0.7 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {patchingManual ? '⏳ Menyimpan...' : <><IconCheck /> Terapkan &amp; Simpan</>}
              </button>
            </div>
          )}

          {!showFullEdit && (
            <>
              <div style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 18, padding: '14px 16px', marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 10 }}>Total Kandungan Gizi</div>
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

              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)', letterSpacing: '.5px', textTransform: 'uppercase', marginBottom: 10 }}>
                Menu Terdeteksi ({result.dishes.length})
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
                {result.dishes.map((dish, i) => (
                  <div key={i} style={{ background: S2, border: `1px solid ${BORDER}`, borderRadius: 12, padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{dish.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{dish.portion}</div>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: 14, color: '#F87171' }}>{dish.calories} kkal</div>
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ background: 'rgba(61,255,149,.05)', border: '1px solid rgba(61,255,149,.15)', borderRadius: 12, padding: '10px 14px', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7, marginBottom: 16, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
            <span style={{ flexShrink: 0, marginTop: 1, color: 'var(--text-muted)' }}><IconInfo /></span>
            <span><strong>Disclaimer:</strong> Hasil analisa foto ini sepenuhnya dihasilkan oleh AI dan dapat mengandung ketidaktepatan.</span>
          </div>

          {!showFullEdit && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {!showKoreksi ? (
                <button onClick={() => setShowKoreksi(true)} style={{
                  width: '100%', padding: '15px 0',
                  background: 'rgba(61,255,149,.08)',
                  border: '1.5px solid rgba(61,255,149,.35)',
                  borderRadius: 14, color: ACCENT,
                  fontWeight: 700, fontSize: 15, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  <IconEdit /> Koreksi Hasil Analisa
                </button>
              ) : (
                <div style={{ background: S2, border: `1.5px solid rgba(61,255,149,.3)`, borderRadius: 18, padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}><IconEdit /> Koreksi Hasil Analisa</div>
                    <button onClick={() => { setShowKoreksi(false); setKoreksiText('') }} style={{
                      padding: '4px 10px', background: BORDER, borderRadius: 7,
                      color: 'var(--text-muted)', fontSize: 12, border: 'none', cursor: 'pointer',
                    }}>✕</button>
                  </div>

                  <div style={{ background: 'var(--bg)', border: `1px solid ${BORDER}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        background: ACCENT, color: '#081520', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>1</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Nama/deskripsi makanan salah</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>AI akan analisa ulang berdasarkan koreksimu</div>
                      </div>
                    </div>
                    <textarea
                      value={koreksiText} onChange={e => setKoreksiText(e.target.value)} rows={3}
                      placeholder="Contoh: Ini nasi goreng kampung dengan telur, bukan nasi putih biasa..."
                      style={{ ...inp, resize: 'none', marginBottom: 8 }}
                    />
                    {koreksiText.trim() && (
                      <button onClick={analyzeWithCorrection} disabled={reanalyzing} style={{
                        width: '100%', padding: '12px 0',
                        background: ACCENT, color: '#081520',
                        borderRadius: 11, fontWeight: 700, fontSize: 14,
                        border: 'none', cursor: reanalyzing ? 'not-allowed' : 'pointer',
                        opacity: reanalyzing ? 0.7 : 1,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}>
                        {reanalyzing ? '⏳ Menganalisis...' : <><IconSearch /> Analisis Ulang</>}
                      </button>
                    )}
                  </div>

                  <div style={{ background: 'var(--bg)', border: `1px solid ${BORDER}`, borderRadius: 13, padding: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                      <span style={{
                        background: ACCENT, color: '#081520', borderRadius: '50%',
                        width: 20, height: 20, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                      }}>2</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Edit menu &amp; angka nutrisi manual</div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Ubah nama, porsi, kalori, protein, karbo, lemak langsung</div>
                      </div>
                    </div>
                    <button onClick={openFullEdit} style={{
                      width: '100%', padding: '10px 0',
                      background: 'var(--accent-dim)', border: '1px solid rgba(61,255,149,.25)',
                      borderRadius: 10, color: ACCENT, fontWeight: 600, fontSize: 13, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                    }}>
                      <IconEdit /> Buka Editor Manual
                    </button>
                  </div>
                </div>
              )}

              <button onClick={reset} style={{
                width: '100%', padding: '13px 0',
                background: 'transparent', border: `1.5px solid ${BORDER}`,
                borderRadius: 14, color: 'var(--text-muted)',
                fontWeight: 600, fontSize: 14, cursor: 'pointer',
              }}>
                📷 Foto Makanan Lain
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
