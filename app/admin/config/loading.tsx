// app/admin/config/loading.tsx — shimmer untuk halaman Pengaturan
export default function Loading() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="h-7 w-36 bg-[#E5E7EB] rounded-lg" />
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="bg-white ring-1 ring-[#E5E7EB] rounded-xl p-6 space-y-4">
          <div className="h-5 w-48 bg-[#E5E7EB] rounded" />
          <div className="h-4 w-72 bg-[#F3F4F6] rounded" />
          <div className="h-10 w-full bg-[#F3F4F6] rounded-lg" />
          <div className="h-9 w-24 bg-[#E5E7EB] rounded-lg" />
        </div>
      ))}
    </div>
  )
}
