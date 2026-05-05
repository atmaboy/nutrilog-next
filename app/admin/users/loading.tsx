// app/admin/users/loading.tsx — shimmer untuk halaman User
export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="space-y-1">
        <div className="h-7 w-44 bg-[#E5E7EB] rounded-lg" />
        <div className="h-4 w-48 bg-[#F3F4F6] rounded-md" />
      </div>
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="px-4 py-3 bg-[#F9FAFB] border-b border-[#E5E7EB] flex gap-6">
          {[80, 140, 60, 80, 72, 60, 100, 120, 60].map((w, i) => (
            <div key={i} className={`h-3 bg-[#E5E7EB] rounded`} style={{ width: w }} />
          ))}
        </div>
        {/* Table rows */}
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className={`px-4 py-3 flex gap-6 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F9FAFB]'}`}>
            {[80, 140, 60, 80, 72, 60, 100, 120, 60].map((w, j) => (
              <div key={j} className="h-4 bg-[#F3F4F6] rounded" style={{ width: w }} />
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}
