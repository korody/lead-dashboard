import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import type { LeadsQuery } from '@/lib/data-client'

// Consulta de quiz_leads para as telas (que não falam mais direto com o Supabase).
// Aceita só os filtros que as telas usam; nada de SQL ou filtro livre vindo do navegador.

const MAX_ROWS = 2000
const SELECTS = new Set(['*', 'quadrante, elemento_principal'])

// Tira os caracteres que mudariam a sintaxe do filtro .or() do PostgREST.
const cleanSearch = (s: string) => s.replace(/[,()*%\\]/g, ' ').trim()

export async function POST(request: Request) {
  let q: LeadsQuery
  try {
    q = await request.json()
  } catch {
    return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  }

  const select = q.select && SELECTS.has(q.select) ? q.select : '*'
  const head = q.countOnly === true
  let query = supabase
    .from('quiz_leads')
    .select(select, head || q.withCount ? { count: 'exact', head } : undefined)

  if (q.id) query = query.eq('id', q.id)
  if (q.cutoff) query = query.gte('created_at', q.cutoff)
  if (q.endCutoff) query = query.lte('created_at', q.endCutoff)
  if (q.utm) query = query.ilike('utm_campaign', q.utm)
  if (q.search) {
    const term = cleanSearch(q.search)
    if (term) {
      const like = `%${term}%`
      query = query.or(`nome.ilike.${like},email.ilike.${like},celular.ilike.${like}`)
    }
  }
  if (q.elemento) query = query.eq('elemento_principal', q.elemento)
  if (q.prioridade) query = query.eq('prioridade', q.prioridade)
  if (q.quadrante != null) query = query.eq('quadrante', Number(q.quadrante))
  if (q.vip) query = query.eq('is_hot_lead_vip', true)
  if (q.aluno === 'SIM') query = query.eq('is_aluno', true)
  if (q.aluno === 'NAO') query = query.or('is_aluno.is.null,is_aluno.eq.false')
  if (q.alunoBny === 'SIM') query = query.eq('is_aluno_bny2', true)
  if (q.alunoBny === 'NAO') query = query.or('is_aluno_bny2.is.null,is_aluno_bny2.eq.false')

  if (!head) {
    query = query.order(q.orderBy === 'id' ? 'id' : 'created_at', { ascending: q.ascending === true })
    const from = Math.max(0, Number(q.from ?? 0))
    const to = q.to != null ? Number(q.to) : from + (q.limit ?? MAX_ROWS) - 1
    query = query.range(from, Math.min(to, from + MAX_ROWS - 1))
  }

  const { data, count, error } = await query
  if (error) {
    console.error('Erro em /api/data/leads:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data: head ? [] : data, count: count ?? null })
}
