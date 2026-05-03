import { db } from '@/lib/db'
import { users, meals, reports } from '@/drizzle/schema'
import { count, sum, desc, eq, sql } from 'drizzle-orm'
import { getGlobalLimit, getCfg, getMaintenance } from '@/lib/admin'
import { fmtNum, fmtDateTime, todayISO } from '@/lib/utils'
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
    { label: 'Total User',         val: fmtNum(Number(totUsers.c)),               icon: '👥' },
    { label: 'Total Meal Logs',    val: fmtNum(Number(totMeals.c)),               icon: '🍽️' },
    { label: 'Meal Logs Hari Ini', val: fmtNum(Number(todayMeals.c)),             icon: '📅' },
    { label: 'Total Kalori',       val: fmtNum(Number(totMeals.cal ?? 0))+' kcal',icon: '🔥' },
    { label: 'Laporan Open',       val: fmtNum(Number(openReports.c)),            icon: '📣' },
    { label: 'Limit Harian',       val: `${globalLimit} foto/hari`,               icon: '⚡' },
  ]

  const recentUsers = await db.select().from(users).orderBy(desc(users.createdAt)).limit(5)

  return (
    <div className="space-y-8 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#111827]">Dashboard</h1>
          <p className="text-sm text-[#6B7280] mt-1">{fmtDateTime(new Date())}</p>
        </div>
        <div className="flex items-center gap-3">
          {maintenance.enabled && (
            <span className="text-xs bg-orange-100 text-orange-700 px-3 py-1 rounded-full font-medium border border-orange-200">
              ⚠️ Maintenance Aktif
            </span>
          )}
          {!hasKey && (
            <span className="text-xs bg-red-50 text-red-600 px-3 py-1 rounded-full font-medium border border-red-200">
              ⚠️ API Key belum diset
            </span>
          )}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {kpis.map(k => (
          <div key={k.label} className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-4 shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
            <div className="text-2xl mb-2">{k.icon}</div>
            <div className="text-2xl font-bold tabular-nums text-[#111827]">{k.val}</div>
            <div className="text-xs text-[#6B7280] mt-1">{k.label}</div>
          </div>
        ))}
      </div>

      {/* Recent Users Table */}
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-hidden shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <h2 className="font-semibold text-[#111827]">User Terbaru</h2>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-5 py-3">Username</th>
              <th className="text-left px-5 py-3">Status</th>
              <th className="text-left px-5 py-3">Bergabung</th>
            </tr>
          </thead>
          <tbody>
            {recentUsers.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                <td className="px-5 py-3 font-medium text-[#111827]">{u.username}</td>
                <td className="px-5 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.isActive
                      ? 'bg-[#D4F5E4] text-[#1F9D57]'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>
                    {u.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-5 py-3 text-[#6B7280]">{fmtDateTime(u.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
