import { db } from '@/lib/db'
import { users, meals, dailyUsage } from '@/drizzle/schema'
import { getGlobalLimit } from '@/lib/admin'
import { fmtDateTime, todayISO } from '@/lib/utils'
import { count, desc, eq, sql } from 'drizzle-orm'
import UserActions from '@/components/admin/UserActions'
export const dynamic = 'force-dynamic'

export default async function UsersPage() {
  const today = todayISO()
  const globalLimit = await getGlobalLimit()
  const allUsers = await db.select().from(users).orderBy(desc(users.createdAt))
  const usersWithStats = await Promise.all(allUsers.map(async u => {
    const [[mr],[td]] = await Promise.all([
      db.select({ cnt: count() }).from(meals).where(eq(meals.userId, u.id)),
      db.select({ cnt: count() }).from(dailyUsage).where(sql`user_id = ${u.id} AND date = ${today}`),
    ])
    return { ...u, totalMeals: Number(mr.cnt??0), todayUsage: Number(td.cnt??0) }
  }))

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold">Manajemen User</h1>
      <p className="text-sm text-muted-foreground -mt-4">Limit global: <strong>{globalLimit} foto/hari</strong></p>
      <div className="bg-card border rounded-xl overflow-x-auto shadow-sm">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-muted-foreground text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Limit/Hari</th>
              <th className="text-left px-4 py-3">Total Meal</th>
              <th className="text-left px-4 py-3">Hari Ini</th>
              <th className="text-left px-4 py-3">Bergabung</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {usersWithStats.map((u,i) => (
              <tr key={u.id} className={i%2===0?'bg-background':'bg-muted/20'}>
                <td className="px-4 py-3 font-medium">{u.username}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive?'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-400':'bg-muted text-muted-foreground'}`}>
                    {u.isActive?'Aktif':'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-muted-foreground">
                  {u.dailyLimit??<span className="italic text-xs">{globalLimit} (global)</span>}
                </td>
                <td className="px-4 py-3 tabular-nums">{u.totalMeals}</td>
                <td className="px-4 py-3 tabular-nums">{u.todayUsage}</td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(u.createdAt)}</td>
                <td className="px-4 py-3"><UserActions user={u} globalLimit={globalLimit} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}