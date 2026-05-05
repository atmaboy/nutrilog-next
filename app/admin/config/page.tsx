'use client'
import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'

// --- Icons ---
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

// --- Static sub-components (OUTSIDE page fn — prevents focus loss on re-render) ---
function Section({
  title, children, disabled = false,
}: { title: string; children: React.ReactNode; disabled?: boolean }) {
  return (
    <div className={`bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 shadow-[0_1px_4px_rgba(16,24,40,0.04)] transition-opacity ${
      disabled ? 'opacity-50 pointer-events-none select-none' : ''
    }`}>
      <h2 className="font-semibold text-xs uppercase tracking-wide text-[#6B7280] mb-4">{title}</h2>
      {children}
    </div>
  )
}

function BtnPrimary({
  onClick, type = 'button', disabled, children,
}: { onClick?: () => void; type?: 'button' | 'submit'; disabled: boolean; children: React.ReactNode }) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="bg-[#2ECC71] text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#28B765] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
    >
      {children}
    </button>
  )
}

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

const inputCls = "w-full border border-[#E5E7EB] rounded-xl px-3 py-2 text-sm bg-white text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#2ECC71] focus:border-transparent transition"

export default function ConfigPage() {
  const [token, setToken]               = useState('')
  const [limit, setLimit]               = useState('')
  const [apiKey, setApiKey]             = useState('')
  const [apiKeyMasked, setApiKeyMasked] = useState(false)
  const [showApiKey, setShowApiKey]     = useState(false)
  const [aiModel, setAiModel]           = useState('claude-sonnet-4-5')
  const [newPwd, setNewPwd]             = useState('')
  const [mEnabled, setMEnabled]         = useState(false)
  const [mTitle, setMTitle]             = useState('')
  const [mDesc, setMDesc]               = useState('')
  // Announcement states
  const [annEnabled, setAnnEnabled]     = useState(false)
  const [annIcon, setAnnIcon]           = useState('📢')
  const [annTitle, setAnnTitle]         = useState('')
  const [annBody, setAnnBody]           = useState('')
  const [annVersion, setAnnVersion]     = useState('1')

  const [saving, setSaving]             = useState<string | null>(null)
  const [initialLoading, setInitialLoading] = useState(true)

  useEffect(() => {
    const t = document.cookie
      .split(';')
      .find(c => c.trim().startsWith('nl_admin_token='))
      ?.split('=').slice(1).join('=').trim() ?? ''
    setToken(t)

    Promise.all([
      fetch('/api/admin?action=config', { headers: { Authorization: `Bearer ${t}` } }).then(r => r.json()),
      fetch('/api/announcement').then(r => r.json()),
    ])
      .then(([cfg, ann]) => {
        if (cfg.globalLimit !== undefined) setLimit(String(cfg.globalLimit))
        if (cfg.apiKey) setApiKeyMasked(true)
        if (cfg.anthropicModel) setAiModel(cfg.anthropicModel)
        if (cfg.maintenance) {
          setMEnabled(cfg.maintenance.enabled ?? false)
          setMTitle(cfg.maintenance.title ?? '')
          setMDesc(cfg.maintenance.description ?? '')
        }
        // Announcement
        setAnnEnabled(ann.enabled ?? false)
        setAnnTitle(ann.title   ?? '')
        setAnnBody(ann.body    ?? '')
        setAnnIcon(ann.icon    ?? '📢')
        setAnnVersion(ann.version ?? '1')
      })
      .catch(() => {})
      .finally(() => setInitialLoading(false))
  }, [])

  const save = useCallback(async (
    action: string,
    body: Record<string, unknown>,
    label: string,
    customFetch?: () => Promise<Response>,
  ) => {
    setSaving(action)
    try {
      const r = customFetch
        ? await customFetch()
        : await fetch(`/api/admin?action=${action}`, {
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
  }, [token])

  async function saveAnnouncement(resetDismiss = false) {
    await save(
      'announcement',
      {},
      resetDismiss ? 'Notifikasi (+ reset dismiss)' : 'Notifikasi',
      () => fetch('/api/announcement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          enabled: annEnabled,
          title:   annTitle,
          body:    annBody,
          icon:    annIcon,
          resetDismiss,
        }),
      }),
    )
    if (resetDismiss) {
      setAnnVersion(v => String(parseInt(v, 10) + 1))
    }
  }

  if (initialLoading) {
    return (
      <div className="max-w-xl space-y-6">
        <div className="h-8 w-40 bg-[#E5E7EB] rounded-lg animate-pulse" />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <SectionSkeleton />
        <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 animate-pulse space-y-3">
          <div className="h-3 w-36 bg-[#E5E7EB] rounded" />
          <div className="flex items-center gap-3"><div className="h-6 w-10 bg-[#E5E7EB] rounded-full" /><div className="h-4 w-24 bg-[#F3F4F6] rounded" /></div>
          <div className="h-10 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="h-16 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="h-10 w-36 bg-[#E5E7EB] rounded-xl" />
        </div>
        <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-5 animate-pulse space-y-3">
          <div className="h-3 w-36 bg-[#E5E7EB] rounded" />
          <div className="flex items-center gap-3"><div className="h-6 w-10 bg-[#E5E7EB] rounded-full" /><div className="h-4 w-24 bg-[#F3F4F6] rounded" /></div>
          <div className="h-10 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="h-16 w-full bg-[#F3F4F6] rounded-xl" />
          <div className="flex gap-2"><div className="h-10 w-28 bg-[#E5E7EB] rounded-xl" /><div className="h-10 w-40 bg-[#E5E7EB] rounded-xl" /></div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-6">
      <h1 className="text-2xl font-bold text-[#111827]">Pengaturan</h1>

      {/* Batas Analisa Harian */}
      <Section title="Batas Analisa Harian">
        <div className="flex gap-2">
          <input
            type="number" value={limit}
            onChange={e => setLimit(e.target.value)}
            min={1} max={9999}
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
          <div className="relative flex-1">
            <input
              type={showApiKey ? 'text' : 'password'}
              value={apiKey}
              onChange={e => { setApiKey(e.target.value); setApiKeyMasked(false) }}
              placeholder={apiKeyMasked ? 'sk-ant-••••• (key sudah tersimpan, isi untuk mengganti)' : 'sk-ant-...'}
              className={`${inputCls} pr-10`}
            />
            <button
              type="button"
              onClick={() => setShowApiKey(v => !v)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#6B7280] transition"
              aria-label={showApiKey ? 'Sembunyikan' : 'Tampilkan'}
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
        <p className="text-xs text-[#9CA3AF] mt-2">Key aktif tersimpan aman di server. Isi kolom hanya jika ingin menggantinya.</p>
      </Section>

      {/* Model AI */}
      <Section title="Model AI (Claude)">
        <div className="flex gap-2">
          <select value={aiModel} onChange={e => setAiModel(e.target.value)} className={inputCls}>
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
        <p className="text-xs text-[#6B7280] mt-2">Ganti ke model lebih ringan jika muncul error &quot;Server AI sedang sibuk&quot;.</p>
      </Section>

      {/* Password Admin */}
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
            type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)}
            placeholder="Min. 8 karakter" autoComplete="new-password"
            className={inputCls}
          />
          <BtnPrimary type="submit" disabled={saving !== null || newPwd.length < 8}>
            {saving === 'update_password' ? '…' : 'Ubah'}
          </BtnPrimary>
        </form>
        {newPwd.length > 0 && newPwd.length < 8 && (
          <p className="text-xs text-red-400 mt-1.5">Password minimal 8 karakter ({newPwd.length}/8)</p>
        )}
      </Section>

      {/* Mode Maintenance */}
      <Section title="Mode Maintenance">
        <div className="space-y-3">
          <button
            type="button" onClick={() => setMEnabled(v => !v)}
            role="switch" aria-checked={mEnabled}
            className="flex items-center gap-3"
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative ${mEnabled ? 'bg-[#2ECC71]' : 'bg-[#E5E7EB]'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${mEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-[#111827]">{mEnabled ? 'Aktif — aplikasi offline' : 'Nonaktif'}</span>
          </button>
          <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Judul maintenance" className={inputCls} />
          <textarea value={mDesc} onChange={e => setMDesc(e.target.value)} placeholder="Deskripsi" rows={2} className={`${inputCls} resize-none`} />
          <BtnPrimary
            onClick={() => save('update_maintenance', { enabled: mEnabled, title: mTitle, description: mDesc }, 'Maintenance')}
            disabled={saving !== null}
          >
            {saving === 'update_maintenance' ? '…' : 'Simpan Maintenance'}
          </BtnPrimary>
        </div>
      </Section>

      {/* Notifikasi / Announcement */}
      <Section title="Notifikasi Pengguna">
        <div className="space-y-4">
          {/* Toggle aktif/nonaktif */}
          <button
            type="button" onClick={() => setAnnEnabled(v => !v)}
            role="switch" aria-checked={annEnabled}
            className="flex items-center gap-3"
          >
            <div className={`w-10 h-6 rounded-full transition-colors relative ${annEnabled ? 'bg-[#2ECC71]' : 'bg-[#E5E7EB]'}`}>
              <span className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${annEnabled ? 'translate-x-5' : 'translate-x-1'}`} />
            </div>
            <span className="text-sm font-medium text-[#111827]">
              {annEnabled ? 'Notifikasi aktif — tampil di halaman login' : 'Nonaktif'}
            </span>
          </button>

          {/* Icon emoji */}
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1">Icon (emoji)</label>
            <input
              value={annIcon} onChange={e => setAnnIcon(e.target.value)}
              placeholder="📢"
              className={`${inputCls} w-20 text-center text-lg`}
              maxLength={4}
            />
          </div>

          {/* Judul */}
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1">Judul</label>
            <input
              value={annTitle} onChange={e => setAnnTitle(e.target.value)}
              placeholder="Contoh: Fitur baru tersedia! 🎉"
              className={inputCls}
            />
            <p className="text-xs text-[#9CA3AF] mt-1">Boleh pakai HTML sederhana: <code className="bg-[#F3F4F6] px-1 rounded">&lt;strong&gt;tebal&lt;/strong&gt;</code></p>
          </div>

          {/* Isi pesan */}
          <div>
            <label className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide block mb-1">Pesan</label>
            <textarea
              value={annBody} onChange={e => setAnnBody(e.target.value)}
              placeholder="Deskripsi singkat notifikasi..."
              rows={2}
              className={`${inputCls} resize-none`}
            />
          </div>

          {/* Preview */}
          {annTitle && (
            <div>
              <p className="text-xs font-semibold text-[#6B7280] uppercase tracking-wide mb-2">Preview</p>
              <div style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                background: 'linear-gradient(135deg, #FF8C00 0%, #FFA733 100%)',
                borderRadius: 14,
                padding: '11px 14px',
                boxShadow: '0 2px 8px rgba(255,140,0,0.2)',
              }}>
                <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>{annIcon || '📢'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#fff', marginBottom: 2, lineHeight: 1.4 }}
                    dangerouslySetInnerHTML={{ __html: annTitle }}
                  />
                  {annBody && (
                    <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', lineHeight: 1.5 }}
                      dangerouslySetInnerHTML={{ __html: annBody }}
                    />
                  )}
                </div>
                <div style={{
                  background: 'rgba(255,255,255,0.2)', borderRadius: 8,
                  width: 24, height: 24, display: 'flex', alignItems: 'center',
                  justifyContent: 'center', color: '#fff', fontSize: 14, flexShrink: 0,
                }}>✕</div>
              </div>
            </div>
          )}

          {/* Info versi dismiss */}
          <p className="text-xs text-[#9CA3AF]">
            Versi notifikasi saat ini: <strong className="text-[#6B7280]">v{annVersion}</strong>.
            Setiap kali &quot;Reset Dismiss&quot;, versi naik dan semua user akan melihat notifikasi lagi meskipun sudah pernah menutupnya.
          </p>

          {/* Tombol aksi */}
          <div className="flex gap-2 flex-wrap">
            <BtnPrimary onClick={() => saveAnnouncement(false)} disabled={saving !== null}>
              {saving === 'announcement' ? '…' : 'Simpan'}
            </BtnPrimary>
            <button
              type="button"
              onClick={() => saveAnnouncement(true)}
              disabled={saving !== null}
              className="border border-[#E5E7EB] text-[#6B7280] px-4 py-2 rounded-xl text-sm font-medium hover:bg-[#F9FAFB] transition disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              {saving === 'announcement' ? '…' : '🔄 Simpan + Reset Dismiss'}
            </button>
          </div>
        </div>
      </Section>
    </div>
  )
}
