// Sessão do painel: um cookie com a assinatura (HMAC) da senha. Trocar a
// DASHBOARD_PASSWORD na Vercel derruba todas as sessões abertas.
// Usa Web Crypto para rodar igual no proxy e nas rotas.

export const SESSION_COOKIE = 'dash_session'
export const SESSION_MAX_AGE = 60 * 60 * 24 * 30 // 30 dias

const encoder = new TextEncoder()

async function hmacHex(key: string, message: string) {
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, encoder.encode(message))
  return Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, '0')).join('')
}

// Sem senha configurada não há sessão válida: o painel fica fechado.
export async function expectedSessionToken() {
  const password = process.env.DASHBOARD_PASSWORD
  if (!password) return null
  return hmacHex(password, 'lead-dashboard-session-v1')
}

export async function isValidSession(token: string | undefined) {
  const expected = await expectedSessionToken()
  return !!expected && !!token && safeEqual(token, expected)
}

export function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
