import { db } from '@/lib/db'
import { users, meals, reports } from '@/drizzle/schema'
import { count, sum, desc, eq, sql } from 'drizzle-orm'
import { getGlobalLimit, getCfg, getMaintenance } from '@/lib/admin'
import { fmtNum, fmtDateTime, todayISO } from '@/lib/utils'
import ThemeToggle from '@/components/admin/ThemeToggle'
export const dynamic = 'force-dynamic'

export default async function AdminDashboard() {
  const today = todayISO()
  const [[totUsers],[totMeals],[todayMeals],[openReports],globalLimit,hasKey,maintenance] = await Promise.all([
    db.select({ c: count() }).from(users),
    db.select({ c: count(), cal: sum(meals.totalCalories) }).from(meals),
    db.select({ c: count() }).from(meals).where(sql`DATE(logged_at) = ${today}`),
    db.select({ c: count() }).from(reports).where(eq(reports.status,'open')),
    getGlobalLimit(),
    getCfg('anthropic_api_key').then(k => !!(process.env.ANTHROPIC_API_KEY || k)),
    getMaintenance(),
  ])
  const kpis = [
    { label:'Total User',         val: fmtNum(Number(totUsers.c)),              icon:'👥' },
    { label:'Total Meal Logs',    val: fmtNum(Number(totMeals.c)),              icon:'🍽️' },
    { label:'Meal Logs Hari Ini', val: fmtNum(Number(todayMeals.c)),            icon:'📅' },
    { label:'Total Kalori',       val: fmtNum(Number(totMeals.cal??0))+' kcal', icon:'🔥' },
    { label:'Laporan Open',       val: fmtNum(Number(openReports.c)),           icon:'📣' },
    { label:'Limit Harian',       val: `${globalLimit} foto/hari`,              icon:'⚡' },
  ]
  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5)

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">{fmtDateTime(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          {maintenance.enabled && (
            <span className="text-xs bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-400 px-3 py-1 rounded-full font-medium border border-orange-200 dark:border-orange-800">
              ⚠️ Maintenance Aktif
            </span>
          )}
          {!hasKey && (
            <span className="text-xs bg-destructive/10 text-destructive px-3 py-1 rounded-full font-medium border border-destructive/20">
              ⚠️ API Key belum diset
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-card border rounded-xl p-4 shadow-sm">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-2xl font-bold tabular-nums">{k.val}</div>
            <div className="text-xs text-muted-foreground mt-1">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b"><h2 className="font-semibold">User Terbaru</h2></div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Username</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u,i) => (
              <tr key={u.id} className={i%2===0?'bg-background':'bg-muted/20'}>
                <td className="px-5 py-3 font-medium">{u.username}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive?'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400':'bg-muted text-muted-foreground'}`}>
                    {u.isActive?'Aktif':'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3 text-muted-foreground">{fmtDateTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}