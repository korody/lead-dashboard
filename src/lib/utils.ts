import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatPhone(phone: string) {
  const clean = phone.replace(/\D/g, '')
  if (clean.length === 11) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 7)}-${clean.substring(7)}`
  }
  if (clean.length === 10) {
    return `(${clean.substring(0, 2)}) ${clean.substring(2, 6)}-${clean.substring(6)}`
  }
  return phone
}

export function formatDate(date: string | Date) {
  return new Date(date).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ==== Timezone helpers (America/Sao_Paulo) ====
// Centralize BRT handling to avoid off-by-one day issues when the server runs in UTC.

export const BRT_TIMEZONE = 'America/Sao_Paulo'

// Returns a Date object representing the current time in Brasília (America/Sao_Paulo)
export function nowInBRT(): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BRT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(new Date())
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value)
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value)
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value)
  const second = parseInt(parts.find(p => p.type === 'second')!.value)
  
  // Criar data no timezone local com os valores BRT
  return new Date(year, month - 1, day, hour, minute, second)
}

// Convert arbitrary date (string/Date) to a Date adjusted to BRT clock time
export function toBRT(date: string | Date): Date {
  const d = typeof date === 'string' ? new Date(date) : date
  
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: BRT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  })
  
  const parts = formatter.formatToParts(d)
  const year = parseInt(parts.find(p => p.type === 'year')!.value)
  const month = parseInt(parts.find(p => p.type === 'month')!.value)
  const day = parseInt(parts.find(p => p.type === 'day')!.value)
  const hour = parseInt(parts.find(p => p.type === 'hour')!.value)
  const minute = parseInt(parts.find(p => p.type === 'minute')!.value)
  const second = parseInt(parts.find(p => p.type === 'second')!.value)
  
  // Criar data no timezone local com os valores BRT
  return new Date(year, month - 1, day, hour, minute, second)
}

// Start of day (00:00:00.000) in BRT for a given date (default: now)
export function startOfDayBRT(date?: string | Date): Date {
  const base = date ? toBRT(date) : nowInBRT()
  base.setHours(0, 0, 0, 0)
  return base
}

// Format YYYY-MM-DD for a given date in BRT
export function ymdBRT(date?: string | Date): string {
  const d = date ? (typeof date === 'string' ? new Date(date) : date) : new Date()
  
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: BRT_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  
  return formatter.format(d) // Formato YYYY-MM-DD direto
}

// Compare two dates by calendar day in BRT
export function isSameDayBRT(a: string | Date, b: string | Date): boolean {
  return ymdBRT(a) === ymdBRT(b)
}
