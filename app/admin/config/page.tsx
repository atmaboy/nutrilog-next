'use client'
import { useState, useEffect } from 'react'
import { toast } from 'sonner'

// --- Icon SVG ---
function EyeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20C5 20 1 12 1 12a18.1 18.1 0 0 1 5.06-5.94"/>
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
      <line x1="1" y1="1" x2="23" y2="23"/>
    </svg>
  )
}

// --- Section skeleton ---
function SectionSkeleton({ rows = 1 }: { rows?: number }) {
  return (
    <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_4px_rgba(16,24,40,0.04)] animate-pulse">
      <div className="h-3 w-36 bg-[#E5E7EB] rounded mb-4" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-2 mb-2">
          <div className="h-10 flex-1 bg-[#F3F4F6] rounded-xl" />
          <div className="h-10 w-20 bg-[#E5E7EB] rounded-xl" />
        </div>
      ))}
    </div>
  )
}

export default function ConfigPage() {
  const [token, setToken]         = useState('')
  const [limit, setLimit]         = useState('')
  const [apiKey, setApiKey]       = useState('')
  const [showApiKey, setShowApiKey] = useState(false)
  const [aiModel, setAiModel]     = useState('claude-sonnet-4-5')
  const [newPwd, setNewPwd]       = useState('')
  const [mEnabled, setMEnabled]   = useState(false)
  const [mTitle, setMTitle]       = useState('')
  const [mDesc, setMDesc]         = useState('')
  const [saving, setSaving]       = useState<string | null>(null)
  // true sampai fetch config selesai — semua section non-interaktif
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const t = document.cookie.split(';').find(c => c.includes('nl_admin_token'))?.split('=')[1]?.trim() ?? ''
    setToken(t)
    Promise.all([
      fetch('/api/admin?action=dashboard', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
      fetch('/api/admin?action=config',    { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
    ])
      .then(([dash, cfg]) => {
        if (dash.stats?.dailyLimit !== undefined) setLimit(String(dash.stats.dailyLimit))
        if (cfg.maintenance) {
          setMEnabled(cfg.maintenance.enabled ?? false)
          setMTitle(cfg.maintenance.title ?? '')
          setMDesc(cfg.maintenance.description ?? '')
        }
        if (cfg.dailyLimit !== undefined) setLimit(String(cfg.dailyLimit))
        if (cfg.anthropicModel) setAiModel(cfg.anthropicModel)
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [])

  async function save(action: string, body: Record<string, unknown>, label: string) {
    setSaving(action)
    try {
      const r = await fetch(`/api/admin?action=${action}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      })
      const d = await r.json()
      r.ok ? toast.success(`${label} berhasil disimpan`) : toast.error(d.error ?? 'Terjadi kesalahan')
    } catch {
      toast.error('Gagal menghubungi server')
    } finally {
      setSaving(null)
    }
  }

  const inputCls = "w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition"

  const Section = ({
    title, children, disabled = false,
  }: { title: string; children: React.ReactNode; disabled?: boolean }) => (
    <div className={`bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_4px_rgba(16,24,40,0.04)] transition-opacity ${
      disabled ? 'opacity-50 pointer-events-none select-none' : ''
    }`}>
      <h2 className="font-semibold text-xs uppercase tracking-wide text-[#6B7280] mb-4">{title}</h2>
      {children}
    </div>
  )

  const BtnPrimary = ({
    onClick, type = 'button', disabled, children,
  }: { onClick?: () => void; type?: 'button' | 'submit'; disabled: boolean; children: React.ReactNode }) => (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-[#2ECC71] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#28B765] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {children}
    </button>
  )

  // Saat fetch awal belum selesai — tampilkan skeleton
  if (initialLoading) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="h-8 w-40 bg-[#E5E7EB] rounded-lg animate-pulse" />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        {/* Maintenance skeleton lebih tinggi */}
        <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_4px_rgba(16,24,40,0.04)] animate-pulse space-y-3">
          <div className="h-3 w-36 bg-[#E5E7EB] rounded" />
          <div className="flex items-center gap-3">
            <div className="h-6 w-10 bg-[#E5E7EB] rounded-full" />
            <div className="h-4 w-24 bg-[#F3F4F6] rounded" />
          </div>
          <div className="h-10 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="h-16 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="h-10 w-36 bg-[#E5E7EB] rounded-xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Pengaturan</h1>

      {/* Batas Analisa Harian */}
      <Section title="Batas Analisa Harian" disabled={saving === 'update_config_limit'}>
        <div className="flex gap-2">
          <input
            type="number" value={limit} onChange={e => setLimit(e.target.value)} min={1} max={9999}
            className={inputCls}
          />
          <BtnPrimary
            onClick={() => save('update_config', { dailyLimit: parseInt(limit) }, 'Limit')}
            disabled={saving !== null}
          >
            {saving === 'update_config' ? '…' : 'Simpan'}
          </BtnPrimary>
        </div>
      </Section>

      {/* Anthropic API Key */}
      <Section title="Anthropic API Key">
        <div className="flex gap-2">
          {/* Input + toggle show/hide dalam satu container */}
          <div className="relative flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              placeholder="sk-ant-... (kosongkan jika tidak ingin mengubah)"
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition"
              aria-label={showApiKey ? 'Sembunyikan API key' : 'Tampilkan API key'}
            >
              {showApiKey ? <EyeOffIcon /> : <EyeIcon />}
            </button>
          </div>
          <BtnPrimary
            onClick={() => save('update_config', { anthropicApiKey: apiKey }, 'API Key')}
            disabled={saving !== null || apiKey.trim() === ''}
          >
            {saving === 'update_config' ? '…' : 'Simpan'}
          </BtnPrimary>
        </div>
        <p className="text-xs text-[#9CA3AF] mt-2">Key saat ini tersimpan aman di server. Isi kolom di atas hanya jika ingin menggantinya.</p>
      </Section>

      {/* Model AI */}
      <Section title="Model AI (Claude)">
        <div className="flex gap-2">
          <select
            value={aiModel}
            onChange={e => setAiModel(e.target.value)}
            className={inputCls}
          >
            <option value="claude-haiku-3-5">claude-haiku-3-5 — Cepat &amp; Hemat</option>
            <option value="claude-sonnet-4-5">claude-sonnet-4-5 — Recommended ✓</option>
            <option value="claude-opus-4-5">claude-opus-4-5 — Paling Canggih</option>
          </select>
          <BtnPrimary
            onClick={() => save('update_config', { anthropicModel: aiModel }, 'Model AI')}
            disabled={saving !== null}
          >
            {saving === 'update_config' ? '…' : 'Simpan'}
          </BtnPrimary>
        </div>
        <p className="text-xs text-[#6B7280] mt-2">
          Ganti ke model lebih ringan jika muncul error &quot;Server AI sedang sibuk&quot;.
        </p>
      </Section>

      {/* Password Admin — pakai form supaya Enter bisa submit & tidak ada bug re-render */}
      <Section title="Password Admin">
        <form
          onSubmit={e => {
            e.preventDefault()
            if (newPwd.length < 8) return
            save('update_password', { newPassword: newPwd }, 'Password').then(() => setNewPwd(''))
          }}
          className="flex gap-2"
        >
          <input
            type="password"
            value={newPwd}
            onChange={e => setNewPwd(e.target.value)}
            placeholder="Min. 8 karakter"
            autoComplete="new-password"
            className={inputCls}
          />
          <BtnPrimary
            type="submit"
            disabled={saving !== null || newPwd.length < 8}
          >
            {saving === 'update_password' ? '…' : 'Ubah'}
          </BtnPrimary>
        </form>
        {newPwd.length > 0 && newPwd.length < 8 && (
          <p className="text-xs text-red-400 mt-1.5">Password minimal 8 karakter ({newPwd.length}/8)</p>
        )}
      </Section>

      {/* Maintenance */}
      <Section title="Mode Maintenance">
        <div className="space-y-3">
          <button
            type="button" onClick={() => setMEnabled(!mEnabled)}
            role="switch" aria-checked={mEnabled}
            className="flex items-center gap-3"
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative ${mEnabled ? 'bg-[#2ECC71]' : 'bg-[#E5E7EB]'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${mEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-[#111827]">{mEnabled ? 'Aktif — aplikasi offline' : 'Nonaktif'}</span>
          </button>
          <input
            value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Judul maintenance"
            className={inputCls}
          />
          <textarea
            value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Deskripsi" rows={2}
            className={`${inputCls} resize-none`}
          />
          <BtnPrimary
            onClick={() => save('update_maintenance', { enabled: mEnabled, title: mTitle, description: mDesc }, 'Maintenance')}
            disabled={saving !== null}
          >
            {saving === 'update_maintenance' ? '…' : 'Simpan Maintenance'}
          </BtnPrimary>
        </div>
      </Section>
    </div>
  )
}
