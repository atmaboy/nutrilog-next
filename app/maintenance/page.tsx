import { getMaintenance } from '@/lib/admin'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export default async function MaintenancePage() {
  const { title, description } = await getMaintenance()

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#f7f6f2] px-4">
      <div className="max-w-md w-full text-center py-16">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <svg
            width="64" height="64" viewBox="0 0 64 64" fill="none"
            xmlns="http://www.w3.org/2000/svg" aria-hidden="true"
          >
            <circle cx="32" cy="32" r="32" fill="#01696f" fillOpacity="0.1" />
            <path
              d="M32 20v14M32 40v2"
              stroke="#01696f" strokeWidth="3" strokeLinecap="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-[#28251d] mb-3">
          {title}
        </h1>
        <p className="text-[#7a7974] text-base leading-relaxed mb-8">
          {description}
        </p>

        <Link
          href="/login"
          className="inline-block text-sm text-[#01696f] underline underline-offset-4 hover:text-[#0c4e54] transition-colors"
        >
          Coba lagi
        </Link>
      </div>
    </main>
  )
}
