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
              body: JSON.stringify({ id, status: 'closed' }),
            })
            if (r.ok) {
              toast.success('Laporan ditandai selesai')
              router.refresh()
            } else {
              toast.error('Gagal memperbarui laporan')
            }
          }}
          className="text-xs bg-[#2ECC71] text-white px-3 py-1.5 rounded-lg font-medium hover:bg-[#28B765] transition"
        >
          ✅ Selesai
        </button>
      )}
      <button
        onClick={async () => {
          if (!confirm('Hapus laporan ini?')) return
          const r = await fetch('/api/admin?action=delete_report', {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${tok()}`,
            },
            body: JSON.stringify({ id }),
          })
          if (r.ok) {
            toast.success('Laporan dihapus')
            router.refresh()
          } else {
            toast.error('Gagal menghapus laporan')
          }
        }}
        className="text-xs text-red-500 border border-red-200 px-3 py-1.5 rounded-lg hover:bg-red-50 transition"
      >
        🗑
      </button>
    </div>
  )
}
