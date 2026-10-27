import { NextResponse } from 'next/server'
import { SESSION_COOKIE, SESSION_MAX_AGE, expectedSessionToken, safeEqual } from '@/lib/session'

export async function POST(request: Request) {
  const password = process.env.DASHBOARD_PASSWORD
  const token = await expectedSessionToken()
  if (!password || !token) {
    return NextResponse.json({ error: 'DASHBOARD_PASSWORD não configurada na Vercel' }, { status: 500 })
  }

  let body: { password?: unknown }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  if (typeof body.password !== 'string' || !safeEqual(body.password, password)) {
    return NextResponse.json({ error: 'Senha incorreta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: SESSION_MAX_AGE,
  })
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(SESSION_COOKIE)
  return res
}
