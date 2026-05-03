'use client'
import { useState, useEffect } from 'react'

const STORAGE_KEY = 'gizku_brand_notice_dismissed'

export default function BrandAnnouncement() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY)
    if (!dismissed) setVisible(true)
  }, [])

  function dismiss() {
    localStorage.setItem(STORAGE_KEY, '1')
    setVisible(false)
  }

  if (!visible) return null

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

      {/* Icon */}
      <span style={{ fontSize: 18, lineHeight: 1.3, flexShrink: 0 }}>📢</span>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontWeight: 700,
          fontSize: 13,
          color: '#fff',
          marginBottom: 2,
          lineHeight: 1.4,
        }}>
          Nutrilog kini bernama <strong>Gizku</strong>! 🎉
        </div>
        <div style={{
          fontSize: 12,
          color: 'rgba(255,255,255,0.85)',
          lineHeight: 1.5,
        }}>
          Nama baru, semangat baru — semua fitur tetap sama seperti biasa.
        </div>
      </div>

      {/* Close */}
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
