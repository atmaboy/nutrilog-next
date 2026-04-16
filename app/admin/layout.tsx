import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = cookies()
  const token = (await cookieStore).get('nl_admin_token')?.value
  if (!token) redirect('/admin/login')

  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">{children}</main>
    </div>
  )
}