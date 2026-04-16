import { db } from '@/lib/db'
import { reports } from '@/drizzle/schema'
import { fmtDateTime } from '@/lib/utils'
import { desc } from 'drizzle-orm'
import ReportActions from '@/components/admin/ReportActions'
export const dynamic = 'force-dynamic'

export default async function ReportsPage() {
  const rows = await db.select().from(reports).orderBy(desc(reports.createdAt))
  const open = rows.filter(r => r.status === 'open')
  const closed = rows.filter(r => r.status !== 'open')

  const Table = ({ items }: { items: typeof rows }) => (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
      <table className="w-full text-sm">
        <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
          <tr>
            <th className="text-left px-4 py-3">User</th>
            <th className="text-left px-4 py-3">Pesan</th>
            <th className="text-left px-4 py-3">Waktu</th>
            <th className="text-left px-4 py-3">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {items.map((r,i) => (
            <tr key={r.id} className={i%2===0?'bg-background':'bg-muted/20'}>
              <td className="px-4 py-3 text-muted-foreground">{r.username??'—'}</td>
              <td className="px-4 py-3 max-w-sm">{r.message}</td>
              <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">{fmtDateTime(r.createdAt)}</td>
              <td className="px-4 py-3"><ReportActions id={r.id} status={r.status} /></td>
            </tr>
          ))}
          {items.length===0&&<tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Tidak ada laporan</td></tr>}
        </tbody>
      </table>
    </div>
  )

  return (
    <div className="space-y-8 max-w-5xl">
      <h1 className="text-2xl font-bold">Laporan User</h1>
      <div><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Open ({open.length})</h2><Table items={open}/></div>
      <div><h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Selesai ({closed.length})</h2><Table items={closed}/></div>
    </div>
  )
}