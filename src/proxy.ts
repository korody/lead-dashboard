import { NextResponse, type NextRequest } from 'next/server'
import { SESSION_COOKIE, isValidSession } from './lib/session'

// Tudo exige login, menos a tela de login e os webhooks de sistemas externos
// (ActiveCampaign chama /api/webhook/*).
const PUBLIC_PATHS = ['/login', '/api/auth/login', '/api/webhook/']

export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl
  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p))) {
    return NextResponse.next()
  }

  if (await isValidSession(request.cookies.get(SESSION_COOKIE)?.value)) {
    return NextResponse.next()
  }

  if (pathname.startsWith('/api/')) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const url = request.nextUrl.clone()
  url.pathname = '/login'
  url.search = `?next=${encodeURIComponent(pathname + search)}`
  return NextResponse.redirect(url)
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico)$).*)'],
}
