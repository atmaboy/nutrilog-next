// app/admin/layout.tsx
'use client'
import { usePathname } from 'next/navigation'
import { Suspense } from 'react'
import AdminSidebar from '@/components/admin/AdminSidebar'

function PageSkeleton() {
  return (
    <div className="space-y-6 max-w-5xl animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-7 w-40 bg-[#E5E7EB] rounded-lg" />
          <div className="h-4 w-56 bg-[#F3F4F6] rounded-md" />
        </div>
      </div>
      {/* Card grid skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-4 space-y-3">
            <div className="h-6 w-6 bg-[#E5E7EB] rounded-md" />
            <div className="h-7 w-20 bg-[#E5E7EB] rounded-md" />
            <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
          </div>
        ))}
      </div>
      {/* Table skeleton */}
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="h-5 w-32 bg-[#E5E7EB] rounded" />
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="px-5 py-3 flex gap-4">
              <div className="h-4 w-28 bg-[#F3F4F6] rounded" />
              <div className="h-4 w-16 bg-[#F3F4F6] rounded" />
              <div className="h-4 w-36 bg-[#F3F4F6] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isLoginPage = pathname === '/admin/login'

  return (
    <div className="flex min-h-screen bg-[#F9FAFB]">
      {!isLoginPage && <AdminSidebar />}
      <main className={`${isLoginPage ? 'w-full' : 'flex-1 min-w-0 p-6 overflow-auto'}`}>
        <Suspense fallback={<PageSkeleton />}>
          {children}
        </Suspense>
      </main>
    </div>
  )
}
