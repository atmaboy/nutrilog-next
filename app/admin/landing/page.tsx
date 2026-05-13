'use client'

import { useEffect, useState, useCallback } from 'react'

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

const SECTION_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  hero:         { label: 'Hero',        color: '#6366F1', bg: '#EEF2FF' },
  how_it_works: { label: 'Cara Kerja',  color: '#0EA5E9', bg: '#E0F2FE' },
  features:     { label: 'Fitur',       color: '#10B981', bg: '#D1FAE5' },
  stats:        { label: 'Statistik',   color: '#F59E0B', bg: '#FEF3C7' },
  cta:          { label: 'CTA',         color: '#EF4444', bg: '#FEE2E2' },
  blog_post:    { label: 'Blog Post',   color: '#8B5CF6', bg: '#EDE9FE' },
}

const SECTION_ICONS: Record<string, React.ReactNode> = {
  hero: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    </svg>
  ),
  how_it_works: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  features: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  stats: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  ),
  cta: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  blog_post: (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  ),
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

function SectionBadge({ section }: { section: string }) {
  const s = SECTION_LABELS[section]
  if (!s) return <span className="text-xs bg-[#F3F4F6] text-[#374151] px-2 py-0.5 rounded-md font-medium">{section}</span>
  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md font-semibold"
      style={{ background: s.bg, color: s.color }}
    >
      <span style={{ color: s.color }}>{SECTION_ICONS[section]}</span>
      {s.label}
    </span>
  )
}

export default function LandingEditorPage() {
  const [rows, setRows]           = useState<ContentRow[]>([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [deleting, setDeleting]   = useState<number | null>(null)
  const [filterSection, setFilterSection] = useState<string>('all')
  const [showForm, setShowForm]   = useState(false)
  const [editRow, setEditRow]     = useState<(Partial<ContentRow> & { metaRaw: string }) | null>(null)
  const [toast, setToast]         = useState<{ msg: string; type: 'ok' | 'err' } | null>(null)
  const [jsonErr, setJsonErr]     = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null)

  const showToast = (msg: string, type: 'ok' | 'err' = 'ok') => {
    setToast({ msg, type })
    setTimeout(() => setToast(null), 3500)
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
    let parsedMeta: Record<string, unknown> | null = null
    try {
      const raw = (editRow.metaRaw ?? '').trim()
      parsedMeta = raw === '' || raw === '{}' ? null : JSON.parse(raw)
      setJsonErr('')
    } catch {
      setJsonErr('Format JSON meta tidak valid')
      return
    }

    if (!editRow.slug?.trim()) { setJsonErr('Slug wajib diisi'); return }
    if (!editRow.title?.trim()) { setJsonErr('Title wajib diisi'); return }

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
      showToast(editRow.id ? 'Konten berhasil diperbarui' : 'Konten berhasil ditambahkan')
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
      setRows(prev => prev.map(r => r.id === row.id ? { ...r, isActive: !r.isActive } : r))
    } catch {
      showToast('Gagal mengubah status', 'err')
    }
  }

  async function confirmDelete(id: number) {
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
      setRows(prev => prev.filter(r => r.id !== id))
    } catch {
      showToast('Terjadi kesalahan', 'err')
    } finally {
      setDeleting(null)
      setDeleteConfirm(null)
    }
  }

  const displayed = filterSection === 'all'
    ? rows
    : rows.filter(r => r.section === filterSection)

  const sectionCounts = rows.reduce<Record<string, number>>((acc, r) => {
    acc[r.section] = (acc[r.section] ?? 0) + 1
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Toast */}
      {toast && (
        <div
          role="alert"
          style={{
            position: 'fixed', top: 24, right: 24, zIndex: 9999,
            background: toast.type === 'ok' ? '#059669' : '#DC2626',
            color: '#fff',
            padding: '12px 18px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            minWidth: 240,
            animation: 'slideInRight 0.25s ease',
          }}
        >
          {toast.type === 'ok'
            ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          }
          {toast.msg}
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(16px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#D4F5E4' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1F9D57" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <h1 className="text-[22px] font-bold text-[#111827] tracking-tight">Landing Page Editor</h1>
          </div>
          <p className="text-sm text-[#6B7280] ml-10">Kelola konten yang tampil di halaman utama Gizku.</p>
        </div>
        <div className="flex gap-2.5">
          <a
            href="/" target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-lg border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F9FAFB] transition-colors font-medium shadow-[0_1px_2px_rgba(0,0,0,0.04)]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
              <polyline points="15 3 21 3 21 9"/>
              <line x1="10" y1="14" x2="21" y2="3"/>
            </svg>
            Preview
          </a>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-lg font-semibold text-white shadow-[0_1px_4px_rgba(46,204,113,0.35)] hover:opacity-90 transition-opacity"
            style={{ background: 'linear-gradient(135deg, #2ECC71, #1FA85E)' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Tambah Konten
          </button>
        </div>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {SECTIONS.map(s => {
          const info = SECTION_LABELS[s]
          const count = sectionCounts[s] ?? 0
          return (
            <button
              key={s}
              onClick={() => setFilterSection(filterSection === s ? 'all' : s)}
              className="rounded-xl p-3 text-left transition-all border"
              style={{
                background: filterSection === s ? info.bg : '#fff',
                borderColor: filterSection === s ? info.color + '40' : '#E5E7EB',
                boxShadow: filterSection === s ? `0 0 0 1px ${info.color}30` : '0 1px 2px rgba(0,0,0,0.04)',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span style={{ color: info.color }}>{SECTION_ICONS[s]}</span>
                <span className="text-lg font-bold tabular-nums" style={{ color: filterSection === s ? info.color : '#111827' }}>{count}</span>
              </div>
              <p className="text-[11px] font-medium text-[#6B7280] leading-tight">{info.label}</p>
            </button>
          )
        })}
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs text-[#9CA3AF] font-medium mr-1">Filter:</span>
        {['all', ...SECTIONS].map(s => (
          <button
            key={s}
            onClick={() => setFilterSection(s)}
            className="text-xs px-3 py-1.5 rounded-full font-medium transition-all"
            style={{
              background: filterSection === s
                ? (s === 'all' ? '#111827' : SECTION_LABELS[s]?.color)
                : '#F3F4F6',
              color: filterSection === s ? '#fff' : '#6B7280',
              boxShadow: filterSection === s ? '0 1px 4px rgba(0,0,0,0.15)' : 'none',
            }}
          >
            {s === 'all' ? `Semua (${rows.length})` : `${SECTION_LABELS[s]?.label} (${sectionCounts[s] ?? 0})`}
          </button>
        ))}
        {filterSection !== 'all' && (
          <button
            onClick={() => setFilterSection('all')}
            className="text-xs text-[#9CA3AF] hover:text-[#374151] ml-1 underline transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-2xl overflow-hidden shadow-[0_1px_6px_rgba(16,24,40,0.06)]">
        {loading ? (
          <div className="p-12">
            <div className="space-y-3 animate-pulse">
              {[1,2,3].map(i => (
                <div key={i} className="flex gap-4 items-center">
                  <div className="h-5 w-20 bg-[#F3F4F6] rounded-md"/>
                  <div className="h-5 w-24 bg-[#F3F4F6] rounded-md"/>
                  <div className="h-5 flex-1 bg-[#F3F4F6] rounded-md"/>
                  <div className="h-5 w-12 bg-[#F3F4F6] rounded-md"/>
                  <div className="h-5 w-16 bg-[#F3F4F6] rounded-md"/>
                </div>
              ))}
            </div>
          </div>
        ) : displayed.length === 0 ? (
          <div className="py-16 text-center" style={{ animation: 'fadeIn 0.3s ease' }}>
            <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center" style={{ background: '#F3F4F6' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <path d="M3 9h18"/>
                <path d="M9 21V9"/>
              </svg>
            </div>
            <p className="text-[#374151] font-semibold text-sm mb-1">
              {filterSection === 'all' ? 'Belum ada konten' : `Belum ada konten ${SECTION_LABELS[filterSection]?.label}`}
            </p>
            <p className="text-[#9CA3AF] text-xs mb-4">Klik tombol &quot;Tambah Konten&quot; untuk mulai menambahkan.</p>
            <button
              onClick={openNew}
              className="text-sm px-4 py-2 rounded-lg font-semibold text-white"
              style={{ background: '#2ECC71' }}
            >
              + Tambah Konten
            </button>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#E5E7EB]" style={{ background: '#F9FAFB' }}>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Section</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Slug</th>
                <th className="text-left px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Title / Subtitle</th>
                <th className="text-center px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Urutan</th>
                <th className="text-center px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Status</th>
                <th className="text-right px-5 py-3 text-[11px] font-semibold text-[#6B7280] uppercase tracking-wide">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {displayed.map((row, i) => (
                <tr
                  key={row.id}
                  className="border-b border-[#F3F4F6] hover:bg-[#FAFAFA] transition-colors group"
                  style={{ animation: `slideUp ${0.1 + i * 0.04}s ease both` }}
                >
                  <td className="px-5 py-3.5">
                    <SectionBadge section={row.section} />
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="font-mono text-xs text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{row.slug}</span>
                  </td>
                  <td className="px-5 py-3.5 max-w-[220px]">
                    <p className="font-medium text-[#111827] text-sm truncate">{row.title}</p>
                    {row.subtitle && (
                      <p className="text-xs text-[#9CA3AF] truncate mt-0.5">{row.subtitle}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <span className="text-xs font-semibold tabular-nums text-[#6B7280] bg-[#F3F4F6] px-2 py-0.5 rounded">{row.sortOrder}</span>
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    <button
                      onClick={() => handleToggle(row)}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-semibold transition-all"
                      style={{
                        background: row.isActive ? '#D1FAE5' : '#F3F4F6',
                        color:      row.isActive ? '#059669' : '#9CA3AF',
                      }}
                      title={row.isActive ? 'Klik untuk nonaktifkan' : 'Klik untuk aktifkan'}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: row.isActive ? '#10B981' : '#D1D5DB' }} />
                      {row.isActive ? 'Aktif' : 'Nonaktif'}
                    </button>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex gap-2 justify-end opacity-70 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openEdit(row)}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-[#E5E7EB] text-[#374151] bg-white hover:bg-[#F3F4F6] transition-colors font-medium"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                        </svg>
                        Edit
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(row.id)}
                        disabled={deleting === row.id}
                        className="inline-flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border border-red-100 text-red-400 bg-white hover:bg-red-50 hover:text-red-600 hover:border-red-200 transition-colors font-medium disabled:opacity-40"
                      >
                        {deleting === row.id
                          ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
                          : <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6"/><path d="M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
                        }
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirm Dialog */}
      {deleteConfirm !== null && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) setDeleteConfirm(null) }}
        >
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: '100%', maxWidth: 400, boxShadow: '0 20px 60px rgba(0,0,0,0.2)', animation: 'slideUp 0.2s ease' }}>
            <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: '#FEE2E2' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#DC2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="3 6 5 6 21 6"/>
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              </svg>
            </div>
            <h3 className="text-center font-bold text-[#111827] text-base mb-2">Hapus konten ini?</h3>
            <p className="text-center text-sm text-[#6B7280] mb-6">Tindakan ini tidak bisa dibatalkan. Konten akan dihapus permanen dari database.</p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-2.5 text-sm rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F9FAFB] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={() => confirmDelete(deleteConfirm)}
                disabled={deleting !== null}
                className="flex-1 py-2.5 text-sm rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors disabled:opacity-60"
              >
                {deleting !== null ? 'Menghapus...' : 'Ya, Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit/Add Modal */}
      {showForm && editRow && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, animation: 'fadeIn 0.2s ease' }}
          onClick={e => { if (e.target === e.currentTarget) closeForm() }}
        >
          <div style={{
            background: '#fff',
            borderRadius: 20,
            width: '100%',
            maxWidth: 620,
            maxHeight: '92vh',
            overflowY: 'auto',
            boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
            animation: 'slideUp 0.25s ease',
          }}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#F3F4F6] sticky top-0 bg-white z-10 rounded-t-[20px]">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: editRow.id ? '#EEF2FF' : '#D4F5E4' }}>
                  {editRow.id
                    ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#6366F1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                    : <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#1F9D57" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  }
                </div>
                <h2 className="text-base font-bold text-[#111827]">
                  {editRow.id ? 'Edit Konten' : 'Tambah Konten Baru'}
                </h2>
              </div>
              <button
                onClick={closeForm}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9CA3AF] hover:text-[#374151] hover:bg-[#F3F4F6] transition-colors"
                aria-label="Tutup"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="px-6 py-5 space-y-5">

              {/* Section + Slug row */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">Section <span className="text-red-400">*</span></label>
                  <select
                    value={editRow.section}
                    onChange={e => setEditRow({ ...editRow, section: e.target.value })}
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-shadow"
                  >
                    {SECTIONS.map(s => <option key={s} value={s}>{SECTION_LABELS[s]?.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                    Slug <span className="text-red-400">*</span>
                    <span className="font-normal text-[#9CA3AF] ml-1">— URL-friendly</span>
                  </label>
                  <input
                    type="text"
                    value={editRow.slug ?? ''}
                    onChange={e => setEditRow({ ...editRow, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                    placeholder="contoh: hero-main"
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] font-mono focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-shadow"
                  />
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">Title <span className="text-red-400">*</span></label>
                <input
                  type="text"
                  value={editRow.title ?? ''}
                  onChange={e => setEditRow({ ...editRow, title: e.target.value })}
                  placeholder="Judul konten yang tampil di halaman"
                  className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-shadow"
                />
              </div>

              {/* Subtitle */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Subtitle
                  <span className="font-normal text-[#9CA3AF] ml-1">— opsional</span>
                </label>
                <input
                  type="text"
                  value={editRow.subtitle ?? ''}
                  onChange={e => setEditRow({ ...editRow, subtitle: e.target.value })}
                  placeholder="Deskripsi pendek di bawah judul"
                  className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition-shadow"
                />
              </div>

              {/* Body */}
              <div>
                <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                  Body
                  <span className="font-normal text-[#9CA3AF] ml-1">— untuk deskripsi panjang / blog post</span>
                </label>
                <textarea
                  rows={5}
                  value={editRow.body ?? ''}
                  onChange={e => setEditRow({ ...editRow, body: e.target.value })}
                  placeholder="Konten panjang..."
                  className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent resize-y transition-shadow"
                />
              </div>

              {/* Meta JSON */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-[#374151]">
                    Meta (JSON)
                  </label>
                  <span className="text-[11px] text-[#9CA3AF] bg-[#F3F4F6] px-2 py-0.5 rounded font-mono">icon, cta_label, cta_url, step, image_url</span>
                </div>
                <textarea
                  rows={4}
                  value={editRow.metaRaw ?? '{}'}
                  onChange={e => { setEditRow({ ...editRow, metaRaw: e.target.value }); setJsonErr('') }}
                  className="w-full border rounded-xl px-3 py-2.5 text-xs font-mono text-[#374151] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent resize-y transition-shadow"
                  style={{ borderColor: jsonErr ? '#FCA5A5' : '#E5E7EB', background: jsonErr ? '#FFF5F5' : '#FAFAFA' }}
                />
                {jsonErr && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    {jsonErr}
                  </p>
                )}
              </div>

              {/* Sort Order + Active */}
              <div className="flex gap-4 items-end p-4 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <div className="flex-1">
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">Sort Order</label>
                  <input
                    type="number"
                    value={editRow.sortOrder ?? 0}
                    onChange={e => setEditRow({ ...editRow, sortOrder: parseInt(e.target.value) || 0 })}
                    className="w-full border border-[#E5E7EB] rounded-xl px-3 py-2.5 text-sm text-[#111827] bg-white focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent"
                  />
                  <p className="text-[11px] text-[#9CA3AF] mt-1">Angka kecil = tampil lebih awal</p>
                </div>
                <div className="pb-1">
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <div
                      onClick={() => setEditRow({ ...editRow, isActive: !editRow.isActive })}
                      className="relative w-11 h-6 rounded-full transition-colors cursor-pointer"
                      style={{ background: editRow.isActive ? '#2ECC71' : '#D1D5DB' }}
                      role="switch"
                      aria-checked={editRow.isActive}
                    >
                      <span
                        className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform"
                        style={{ transform: editRow.isActive ? 'translateX(20px)' : 'translateX(0)' }}
                      />
                    </div>
                    <span className="text-sm font-medium text-[#374151]">
                      {editRow.isActive ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </label>
                  <p className="text-[11px] text-[#9CA3AF] mt-1">Konten {editRow.isActive ? 'akan tampil' : 'disembunyikan'}</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 px-6 py-5 border-t border-[#F3F4F6] sticky bottom-0 bg-white rounded-b-[20px]">
              <button
                onClick={closeForm}
                className="flex-1 py-2.5 text-sm rounded-xl border border-[#E5E7EB] text-[#374151] font-medium hover:bg-[#F9FAFB] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-2 px-6 py-2.5 text-sm rounded-xl font-semibold text-white transition-opacity disabled:opacity-60 flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg, #2ECC71, #1FA85E)', flex: 2 }}
              >
                {saving
                  ? <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="animate-spin"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg> Menyimpan...</>
                  : <><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>{editRow.id ? 'Simpan Perubahan' : 'Tambah Konten'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
