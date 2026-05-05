// app/admin/loading.tsx — shimmer untuk halaman Dashboard
export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-44 bg-[#E5E7EB] rounded-lg" />
        <div className="h-4 w-60 bg-[#F3F4F6] rounded-md" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-4 space-y-3">
            <div className="h-6 w-6 bg-[#E5E7EB] rounded-md" />
            <div className="h-7 w-20 bg-[#E5E7EB] rounded-md" />
            <div className="h-3 w-24 bg-[#F3F4F6] rounded" />
          </div>
        ))}
      </div>
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
