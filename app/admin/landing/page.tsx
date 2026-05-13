'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

type ContentRow = {
  id: number
  section: string
  slug: string
  title: string
  subtitle: string | null
  body: string | null
  meta: Record<string, unknown> | null
  isActive: boolean
  sortOrder: number
  createdAt: string
  updatedAt: string
}

const SECTION_LABELS: Record<string, string> = {
  hero:          '🏠 Hero',
  how_it_works:  '🔢 Cara Kerja',
  features:      '⚡ Fitur',
  stats:         '📊 Statistik',
  cta:           '🎯 CTA',
  blog_post:     '📝 Blog Post',
}

const SECTIONS = Object.keys(SECTION_LABELS)

const emptyForm = (): Partial<ContentRow> & { metaRaw: string } => ({
  section: 'hero',
  slug: '',
  title: '',
  subtitle: '',
  body: '',
  isActive: true,
  sortOrder: 0,
  metaRaw: '{}',
})

export default function LandingEditorPage() {
  const router = useRouter()
  const [rows, setRows]           = useState<ContentRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [filterSection, setFilterSection] = useState<string>('all')
  const [showForm, setShowForm]   = useState(false)
  const [editRow, setEditRow]     = useState<(Partial<ContentRow> & { metaRaw: string }) | null>(null)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [jsonErr, setJsonErr]     = useState('')

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3000)
  }

  const fetchRows = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/landing')
      const j   = await res.json()
      setRows(j.data ?? [])
    } catch {
      showToast('Gagal memuat data', 'err')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchRows() }, [fetchRows])

  function openNew() {
    setEditRow(emptyForm())
    setJsonErr('')
    setShowForm(true)
  }

  function openEdit(row: ContentRow) {
    setEditRow({
      ...row,
      metaRaw: row.meta ? JSON.stringify(row.meta, null, 2) : '{}',
    })
    setJsonErr('')
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditRow(null)
    setJsonErr('')
  }

  async function handleSave() {
    if (!editRow) return
    // Validate JSON
    let parsedMeta: Record<string, unknown> | null = null
    try {
      const raw = (editRow.metaRaw ?? '').trim()
      parsedMeta = raw === '' || raw === '{}' ? null : JSON.parse(raw)
      setJsonErr('')
    } catch {
      setJsonErr('Format JSON meta tidak valid')
      return
    }

    setSaving(true)
    try {
      const res = await fetch('/api/admin/landing?action=upsert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id:        editRow.id,
          section:   editRow.section,
          slug:      editRow.slug,
          title:     editRow.title,
          subtitle:  editRow.subtitle || null,
          body:      editRow.body     || null,
          meta:      parsedMeta,
          isActive:  editRow.isActive ?? true,
          sortOrder: editRow.sortOrder ?? 0,
        }),
      })
      const j = await res.json()
      if (!res.ok) { showToast(j.error ?? 'Gagal menyimpan', 'err'); return }
      showToast(j.message ?? 'Tersimpan')
      closeForm()
      fetchRows()
    } catch {
      showToast('Terjadi kesalahan', 'err')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggle(row: ContentRow) {
    try {
      await fetch('/api/admin/landing?action=toggle_active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: row.id, isActive: !row.isActive }),
      })
      fetchRows()
    } catch {
      showToast('Gagal mengubah status', 'err')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Hapus konten ini? Tindakan tidak bisa dibatalkan.')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/admin/landing', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      })
      const j = await res.json()
      if (!res.ok) { showToast(j.error ?? 'Gagal menghapus', 'err'); return }
      showToast('Konten dihapus')
      fetchRows()
    } catch {
      showToast('Terjadi kesalahan', 'err')
    } finally {
      setDeleting(null)
    }
  }

  const displayed = filterSection === 'all'
    ? rows
    : rows.filter(r => r.section === filterSection)

  const C = {
    green: '#2ECC71', greenDark: '#27AE60', greenLight: '#D4F5E4',
    text: '#111827', muted: '#6B7280', bg: '#F9FAFB',
    white: '#FFFFFF', border: '#E5E7EB',
  }

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 20, right: 20, zIndex: 9999,
          background: toast.type === 'ok' ? C.greenDark : '#DC2626',
          color: '#fff', padding: '12px 20px', borderRadius: 10,
          fontSize: 14, fontWeight: 600, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
          animation: 'fadeIn 0.2s ease',
        }}>
          {toast.type === 'ok' ? '✅' : '❌'} {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Konten Landing Page</h1>
          <p className="text-sm text-[#6B7280] mt-1">Kelola semua teks, section, dan konten yang tampil di halaman utama.</p>
        </div>
        <div className="flex gap-3">
          <a
            href="/" target="_blank"
            className="text-sm px-4 py-2 rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
          >
            🔗 Preview Landing
          </a>
          <button
            onClick={openNew}
            className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
            style={{ background: C.green }}
          >
            + Tambah Konten
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 flex-wrap">
        {['all', ...SECTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterSection(s)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-colors"
            style={{
              background: filterSection === s ? C.green : C.bg,
              color:      filterSection === s ? '#fff'   : C.muted,
              border:     `1px solid ${filterSection === s ? C.green : C.border}`,
            }}
          >
            {s === 'all' ? '📋 Semua' : SECTION_LABELS[s]}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        {loading ? (
          <div className="p-10 text-center text-[#6B7280] text-sm">Memuat data...</div>
        ) : displayed.length === 0 ? (
          <div className="p-10 text-center">
            <div className="text-3xl mb-3">📭</div>
            <p className="text-[#6B7280] text-sm">Belum ada konten. Klik "+ Tambah Konten" untuk mulai.</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs uppercase tracking-wide">
              <tr>
                <th className="text-left px-4 py-3">Section</th>
                <th className="text-left px-4 py-3">Slug</th>
                <th className="text-left px-4 py-3">Title</th>
                <th className="text-left px-4 py-3">Order</th>
                <th className="text-left px-4 py-3">Status</th>
                <th className="text-left px-4 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, i) => (
                <tr key={row.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                  <td className="px-4 py-3">
                    <span className="text-xs bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded font-medium">
                      {SECTION_LABELS[row.section] ?? row.section}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs text-[#6B7280]">{row.slug}</td>
                  <td className="px-4 py-3 font-medium text-[#111827] max-w-[200px] truncate">{row.title}</td>
                  <td className="px-4 py-3 tabular-nums text-[#6B7280]">{row.sortOrder}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleToggle(row)}
                      className="text-xs px-2 py-0.5 rounded-full font-medium transition-colors"
                      style={{
                        background: row.isActive ? C.greenLight : '#F3F4F6',
                        color:      row.isActive ? C.greenDark  : C.muted,
                      }}
                    >
                      {row.isActive ? '● Aktif' : '○ Nonaktif'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEdit(row)}
                        className="text-xs px-3 py-1 rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(row.id)}
                        disabled={deleting === row.id}
                        className="text-xs px-3 py-1 rounded-lg border border-red-200 text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                      >
                        {deleting === row.id ? '...' : 'Hapus'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal Form */}
      {showForm && editRow && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: 16,
          }}
          onClick={e => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div style={{
            background: C.white,
            borderRadius: 16,
            padding: 28,
            width: '100%',
            maxWidth: 600,
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
          }}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-bold text-[#111827]">
                {editRow.id ? 'Edit Konten' : 'Tambah Konten Baru'}
              </h2>
              <button onClick={closeForm} className="text-[#6B7280] hover:text-[#111827] text-xl leading-none">×</button>
            </div>

            <div className="space-y-4">
              {/* Section */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Section *</label>
                <select
                  value={editRow.section}
                  onChange={e => setEditRow({ ...editRow, section: e.target.value })}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2"
                  style={{ '--tw-ring-color': C.green } as React.CSSProperties}
                >
                  {SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]}</option>)}
                </select>
              </div>

              {/* Slug */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Slug * <span className="font-normal text-[#9CA3AF]">(unik, URL-friendly, contoh: hero-main)</span></label>
                <input
                  type="text"
                  value={editRow.slug ?? ''}
                  onChange={e => setEditRow({ ...editRow, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                  placeholder="contoh: fitur-analisa-ai"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] font-mono focus:outline-none"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Title *</label>
                <input
                  type="text"
                  value={editRow.title ?? ''}
                  onChange={e => setEditRow({ ...editRow, title: e.target.value })}
                  placeholder="Judul konten"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Subtitle</label>
                <input
                  type="text"
                  value={editRow.subtitle ?? ''}
                  onChange={e => setEditRow({ ...editRow, subtitle: e.target.value })}
                  placeholder="Deskripsi singkat (opsional)"
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">Body <span className="font-normal text-[#9CA3AF]">(untuk blog post / deskripsi panjang)</span></label>
                <textarea
                  rows={5}
                  value={editRow.body ?? ''}
                  onChange={e => setEditRow({ ...editRow, body: e.target.value })}
                  placeholder="Konten panjang, mendukung Markdown di masa depan..."
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none resize-y"
                />
              </div>

              {/* Meta JSON */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1">
                  Meta (JSON) <span className="font-normal text-[#9CA3AF]">— icon, cta_label, cta_url, step, image_url, dsb</span>
                </label>
                <textarea
                  rows={4}
                  value={editRow.metaRaw ?? '{}'}
                  onChange={e => { setEditRow({ ...editRow, metaRaw: e.target.value }); setJsonErr('') }}
                  className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-xs font-mono text-[#374151] focus:outline-none resize-y"
                  style={{ borderColor: jsonErr ? '#DC2626' : undefined }}
                />
                {jsonErr && <p className="text-xs text-red-500 mt-1">{jsonErr}</p>}
              </div>

              {/* Sort Order & Active */}
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#374151] mb-1">Sort Order</label>
                  <input
                    type="number"
                    value={editRow.sortOrder ?? 0}
                    onChange={e => setEditRow({ ...editRow, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#E5E7EB] rounded-lg px-3 py-2 text-sm text-[#111827] focus:outline-none"
                  />
                </div>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editRow.isActive ?? true}
                      onChange={e => setEditRow({ ...editRow, isActive: e.target.checked })}
                      className="w-4 h-4 rounded"
                    />
                    <span className="text-sm font-medium text-[#374151]">Aktifkan konten</span>
                  </label>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 justify-end">
              <button
                onClick={closeForm}
                className="px-4 py-2 text-sm rounded-lg border border-[#E5E7EB] text-[#6B7280] hover:bg-[#F9FAFB] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-5 py-2 text-sm rounded-lg font-semibold text-white transition-opacity disabled:opacity-60"
                style={{ background: C.green }}
              >
                {saving ? 'Menyimpan...' : (editRow.id ? 'Simpan Perubahan' : 'Tambah Konten')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
