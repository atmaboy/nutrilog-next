import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)) }

export function todayISO() { return new Date().toISOString().split('T')[0] }

export function fmtDate(d: Date | string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    .format(new Date(d))
}

export function fmtDateTime(d: Date | string | null) {
  if (!d) return '-'
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(d))
}

export function fmtNum(n: number | null | undefined) {
  return (n ?? 0).toLocaleString('id-ID')
}

export function setCors(h: Headers) {
  h.set('Access-Control-Allow-Origin', '*')
  h.set('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS')
  h.set('Access-Control-Allow-Headers', 'Content-Type,Authorization')
}

export const ok  = (data: unknown) => Response.json(data)
export const err = (msg: string, status = 400) => Response.json({ error: msg }, { status })
