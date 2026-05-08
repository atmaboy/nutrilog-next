// app/admin/layout.tsx
'use client'
import { usePathname } from 'next/navigation'
import AdminSidebar from '@/components/admin/AdminSidebar'
import NavProgress from '@/components/admin/NavProgress'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {!isLoginPage && <NavProgress />}
      {!isLoginPage && <AdminSidebar />}
      <main className={`${isLoginPage ? 'w-full' : 'flex-1 min-w-0 p-6 overflow-auto'}`}>
        {children}
      </main>
    </div>
  )
}
