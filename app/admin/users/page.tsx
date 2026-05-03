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
    const [[mr], [td]] = await Promise.all([
      db.select({ cnt: count() }).from(meals).where(eq(meals.userId, u.id)),
      db.select({ cnt: count() }).from(dailyUsage).where(sql`user_id = ${u.id} AND date = ${today}`),
    ])
    return { ...u, totalMeals: Number(mr.cnt ?? 0), todayUsage: Number(td.cnt ?? 0) }
  }))

  return (
    <div className="space-y-6 max-w-6xl">
      <h1 className="text-2xl font-bold text-[#111827]">Manajemen User</h1>
      <p className="text-sm text-[#6B7280] -mt-4">
        Limit global: <strong className="text-[#111827]">{globalLimit} foto/hari</strong>
      </p>
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-x-auto shadow-[0_1px_4px_rgba(16,24,40,0.04)]">
        <table className="w-full text-sm">
          <thead className="bg-[#F9FAFB] text-[#6B7280] text-xs uppercase tracking-wide">
            <tr>
              <th className="text-left px-4 py-3">Username</th>
              <th className="text-left px-4 py-3">Email</th>
              <th className="text-left px-4 py-3">Status</th>
              <th className="text-left px-4 py-3">Limit/Hari</th>
              <th className="text-left px-4 py-3">Total Meal</th>
              <th className="text-left px-4 py-3">Hari Ini</th>
              <th className="text-left px-4 py-3">Bergabung</th>
              <th className="text-left px-4 py-3">Last Login</th>
              <th className="text-left px-4 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {usersWithStats.map((u, i) => (
              <tr key={u.id} className={i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}>
                <td className="px-4 py-3 font-medium text-[#111827]">{u.username}</td>
                <td className="px-4 py-3 text-[#6B7280]">
                  {u.email
                    ? <span className="text-[#111827]">{u.email}</span>
                    : <span className="italic text-xs text-[#9CA3AF]">—</span>
                  }
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                    u.isActive
                      ? 'bg-[#D4F5E4] text-[#1F9D57]'
                      : 'bg-[#F3F4F6] text-[#6B7280]'
                  }`}>
                    {u.isActive ? 'Aktif' : 'Nonaktif'}
                  </span>
                </td>
                <td className="px-4 py-3 tabular-nums text-[#6B7280]">
                  {u.dailyLimit ?? <span className="italic text-xs text-[#9CA3AF]">{globalLimit} (global)</span>}
                </td>
                <td className="px-4 py-3 tabular-nums text-[#111827]">{u.totalMeals}</td>
                <td className="px-4 py-3 tabular-nums text-[#111827]">{u.todayUsage}</td>
                <td className="px-4 py-3 text-[#6B7280] whitespace-nowrap">{fmtDateTime(u.createdAt)}</td>
                <td className="px-4 py-3 whitespace-nowrap">
                  {u.lastLoginAt
                    ? (
                      <span
                        title={fmtDateTime(u.lastLoginAt)}
                        className="text-[#111827] tabular-nums"
                      >
                        {fmtDateTime(u.lastLoginAt)}
                      </span>
                    )
                    : <span className="italic text-xs text-[#9CA3AF]">Belum pernah</span>
                  }
                </td>
                <td className="px-4 py-3"><UserActions user={u} globalLimit={globalLimit} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
