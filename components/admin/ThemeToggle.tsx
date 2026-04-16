'use client'
import { useState, useEffect } from 'react'

export default function ThemeToggle() {
  const [dark, setDark] = useState(false)
  useEffect(()=>{
    const stored=localStorage.getItem('nl_admin_theme')
    const prefer=window.matchMedia('(prefers-color-scheme: dark)').matches
    const isDark=stored?stored==='dark':prefer
    setDark(isDark)
    document.documentElement.classList.toggle('dark',isDark)
  },[])
  function toggle(){
    const next=!dark; setDark(next)
    document.documentElement.classList.toggle('dark',next)
    localStorage.setItem('nl_admin_theme',next?'dark':'light')
  }
  return (
    <button onClick={toggle} title={dark?'Switch to light':'Switch to dark'}
      className="p-2 rounded-lg text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground transition-colors">
      {dark
        ?<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
        :<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
      }
    </button>
  )
}