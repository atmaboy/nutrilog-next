import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  // Auth check dilakukan HANYA oleh middleware.ts
  // Jangan tambahkan redirect di sini — menyebabkan redirect loop
  return (
    <div className="flex min-h-screen bg-background">
      <AdminSidebar />
      <main className="flex-1 min-w-0 p-6 overflow-auto">{children}</main>
    </div>
  )
}