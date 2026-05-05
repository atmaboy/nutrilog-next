'use client'
import { useState, useEffect } from 'react'

type AnnouncementData = {
  enabled: boolean
  title: string
  body: string
  icon: string
  version: string
}

export default function BrandAnnouncement() {
  const [data, setData]       = useState<AnnouncementData | null>(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    fetch('/api/announcement')
      .then(r => r.json())
      .then((d: AnnouncementData) => {
        if (!d.enabled || !d.title) return
        // Dismiss key menyertakan version — kalau admin reset, notif muncul lagi
        const key = `gizku_announcement_dismissed_v${d.version}`
        if (!localStorage.getItem(key)) {
          setData(d)
          setVisible(true)
        }
      })
      .catch(() => {})
  }, [])

  function dismiss() {
    if (!data) return
    const key = `gizku_announcement_dismissed_v${data.version}`
    localStorage.setItem(key, '1')
    setVisible(false)
  }

  if (!visible || !data) return null

  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: 10,
      background: 'linear-gradient(135deg, #FF8C00 0%, #FFA733 100%)',
      borderRadius: 14,
      padding: '11px 14px',
      marginBottom: 14,
      boxShadow: '0 2px 8px rgba(255,140,0,0.25)',
      animation: 'slideDown .3s cubic-bezier(.22,1,.36,1) both',
    }}>
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>{data.icon}</span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          marginBottom: 2,
          lineHeight: 1.4,
        }}
          dangerouslySetInnerHTML={{ __html: data.title }}
        />
        {data.body && (
          <div style={{
            fontSize: 12,
            color: 'rgba(255,255,255,0.85)',
            lineHeight: 1.5,
          }}
            dangerouslySetInnerHTML={{ __html: data.body }}
          />
        )}
      </div>

      <button
        onClick={dismiss}
        aria-label="Tutup notifikasi"
        style={{
          background: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: 8,
          width: 24,
          height: 24,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          color: '#fff',
          fontSize: 14,
          lineHeight: 1,
        }}
      >
        ✕
      </button>
    </div>
  )
}
