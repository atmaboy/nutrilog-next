'use client'
import { useState } from 'react'
import { toast } from 'sonner'

export default function MigrateButton({ token }: { token: string }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<Record<string, number> | null>(null)

  async function run() {
    if (!confirm('Jalankan migrasi KV → PostgreSQL?\nAman untuk diulang.')) return
    setLoading(true)
    try {
      const r = await fetch('/api/admin/migrate', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const d = await r.json()
      if (r.ok) {
        setResult(d.migrated)
        toast.success('Migrasi berhasil!')
      } else {
        toast.error(d.error)
      }
    } catch {
      toast.error('Gagal koneksi')
    }
    setLoading(false)
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Pindahkan data lama dari <strong>Supabase KV Store</strong> ke PostgreSQL.
        Jalankan <strong>sekali</strong> setelah deploy pertama.
      </p>
      <button
        onClick={run}
        disabled={loading}
        className="bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition-colors"
      >
        {loading ? '⏳ Migrasi berjalan…' : '🚀 Jalankan Migrasi KV → PostgreSQL'}
      </button>
      {result && (
        <div className="border rounded-xl p-4 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 text-sm font-mono">
          <p className="font-semibold text-green-700 dark:text-green-400 mb-1">✅ Migrasi selesai:</p>
          <p>👥 Users: {result.users} · 🍽️ Meals: {result.meals} · 📣 Reports: {result.reports} · ⚙️ Config: {result.config}</p>
        </div>
      )}
    </div>
  )
}