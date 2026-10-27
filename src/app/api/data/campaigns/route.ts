import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// CRUD de dash_campaigns para a tela de admin e o seletor de campanha.

const EDITABLE = [
  'nome', 'slug', 'meta_leads', 'data_inicio', 'data_fim', 'utm_campaign',
  'ac_tag_id', 'sendflow_campaign_id', 'prioridade', 'ativo',
] as const

function pickEditable(body: Record<string, unknown>) {
  const out: Record<string, unknown> = {}
  for (const k of EDITABLE) if (k in body) out[k] = body[k]
  return out
}

export async function GET() {
  const { data, error } = await supabase
    .from('dash_campaigns')
    .select('*')
    .order('prioridade', { ascending: true })
    .order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Corpo inválido' }, { status: 400 })
  const { error } = await supabase.from('dash_campaigns').insert(pickEditable(body))
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function PATCH(request: Request) {
  const body = await request.json().catch(() => null)
  if (!body?.id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('dash_campaigns').update(pickEditable(body)).eq('id', body.id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(request: Request) {
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id obrigatório' }, { status: 400 })
  const { error } = await supabase.from('dash_campaigns').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
