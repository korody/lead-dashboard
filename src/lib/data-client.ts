// Acesso aos dados pelo navegador: tudo passa pelas rotas /api/data/*, que
// rodam no servidor com a chave secreta. O login do painel protege essas rotas.

export type LeadsQuery = {
  id?: string
  select?: '*' | 'quadrante, elemento_principal'
  cutoff?: string | null
  endCutoff?: string | null
  utm?: string | null
  search?: string
  elemento?: string
  prioridade?: string
  quadrante?: number
  vip?: boolean
  aluno?: 'SIM' | 'NAO'
  alunoBny?: 'SIM' | 'NAO'
  orderBy?: 'created_at' | 'id'
  ascending?: boolean
  from?: number
  to?: number
  limit?: number
  withCount?: boolean
  countOnly?: boolean
}

async function call<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = `/login?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
  }
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || `Erro ${res.status}`)
  return json as T
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function fetchLeads<T = any>(q: LeadsQuery) {
  return call<{ data: T[]; count: number | null }>('/api/data/leads', {
    method: 'POST',
    body: JSON.stringify(q),
  })
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const campaignsApi = {
  list: <T = any>() => call<{ data: T[] }>('/api/data/campaigns').then((r) => r.data),
  create: (values: Record<string, unknown>) =>
    call('/api/data/campaigns', { method: 'POST', body: JSON.stringify(values) }),
  update: (id: string, values: Record<string, unknown>) =>
    call('/api/data/campaigns', { method: 'PATCH', body: JSON.stringify({ ...values, id }) }),
  remove: (id: string) => call(`/api/data/campaigns?id=${encodeURIComponent(id)}`, { method: 'DELETE' }),
}
