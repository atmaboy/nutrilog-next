'use client'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export default function ReportActions({ id, status }: { id: string; status: string }) {
  const router = useRouter()
  const tok = () =>
    document.cookie
      .split(';')
      .find(c => c.includes('nl_admin_token'))
      ?.split('=')[1] ?? ''

  return (
    <div className="flex gap-2">
      {status === 'open' && (
        <button
          onClick={async () => {
            const r = await fetch('/api/admin?action=update_report', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${tok()}`,
              },
              body: JSON.stringify({ id, status: 'resolved' }),
            })
            r.ok
              ? (toast.success('Selesai'), router.refresh())
              : toast.error('Gagal')
          }}
          className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg font-medium hover:bg-green-700"
        >
          ✅ Selesai
        </button>
      )}
      <button
        onClick={async () => {
          if (!confirm('Hapus laporan ini?')) return
          const r = await fetch(`/api/admin?action=delete_report&id=${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${tok()}` },
          })
          r.ok
            ? (toast.success('Dihapus'), router.refresh())
            : toast.error('Gagal')
        }}
        className="text-xs text-destructive border border-destructive/30 px-3 py-1.5 rounded-lg hover:bg-destructive/5"
      >
        🗑
      </button>
    </div>
  )
}
