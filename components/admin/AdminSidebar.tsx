'use client'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import ThemeToggle from './ThemeToggle'

const nav = [
  { href:'/admin',         label:'Dashboard',  icon:'📊' },
  { href:'/admin/users',   label:'User',       icon:'👥' },
  { href:'/admin/reports', label:'Laporan',    icon:'📣' },
  { href:'/admin/config',  label:'Pengaturan', icon:'⚙️' },
]

export default function AdminSidebar() {
  const pathname=usePathname(); const router=useRouter()
  function logout(){ document.cookie='nl_admin_token=; path=/; max-age=0'; router.push('/admin/login') }
  return (
    <aside className="w-60 shrink-0 border-r bg-sidebar text-sidebar-foreground flex flex-col">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b border-sidebar-border">
        <span className="text-2xl">🥗</span>
        <span className="font-bold text-base">NutriLog</span>
        <span className="ml-auto text-xs bg-sidebar-accent text-sidebar-accent-foreground px-2 py-0.5 rounded-full">Admin</span>
      </div>
      <nav className="flex-1 py-4 space-y-1 px-3">
        {nav.map(n=>{
          const active=pathname===n.href||(n.href!=='/admin'&&pathname.startsWith(n.href))
          return (
            <Link key={n.href} href={n.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${active?'bg-sidebar-primary text-sidebar-primary-foreground':'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'}`}>
              <span>{n.icon}</span>{n.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-4 border-t border-sidebar-border flex items-center gap-2">
        <button onClick={logout} className="flex-1 text-xs text-left text-sidebar-foreground/60 hover:text-destructive px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors">
          🚪 Logout
        </button>
        <ThemeToggle />
      </div>
    </aside>
  )
}