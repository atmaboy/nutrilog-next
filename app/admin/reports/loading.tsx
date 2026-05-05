// app/admin/reports/loading.tsx — shimmer untuk halaman Laporan
export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="h-7 w-32 bg-[#E5E7EB] rounded-lg" />
      <div className="bg-white ring-1 ring-[#E5E7EB] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E7EB]">
          <div className="h-5 w-40 bg-[#E5E7EB] rounded" />
        </div>
        <div className="divide-y divide-[#F3F4F6]">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="flex justify-between">
                <div className="h-4 w-24 bg-[#E5E7EB] rounded" />
                <div className="h-4 w-20 bg-[#F3F4F6] rounded" />
              </div>
              <div className="h-3 w-3/4 bg-[#F3F4F6] rounded" />
              <div className="h-3 w-1/2 bg-[#F3F4F6] rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
