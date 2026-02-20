import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { activeCampaignClient } from '@/lib/activecampaign'

export interface UtmRow {
  utmValue: string
  count: number
  avgScore: number
  vipRate: number
  q1Rate: number
  altaRate: number
}

function getUtmFieldIds() {
  return {
    campaign: process.env.AC_UTM_CAMPAIGN_FIELD_ID ? parseInt(process.env.AC_UTM_CAMPAIGN_FIELD_ID) : undefined,
    source:   process.env.AC_UTM_SOURCE_FIELD_ID   ? parseInt(process.env.AC_UTM_SOURCE_FIELD_ID)   : undefined,
    medium:   process.env.AC_UTM_MEDIUM_FIELD_ID   ? parseInt(process.env.AC_UTM_MEDIUM_FIELD_ID)   : undefined,
    content:  process.env.AC_UTM_CONTENT_FIELD_ID  ? parseInt(process.env.AC_UTM_CONTENT_FIELD_ID)  : undefined,
    term:     process.env.AC_UTM_TERM_FIELD_ID     ? parseInt(process.env.AC_UTM_TERM_FIELD_ID)     : undefined,
  }
}

function scoreColor(score: number) {
  if (score >= 65) return '#22c55e'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

function aggregateByDimension(
  leads: Array<{ email: string; lead_score: number | null; is_hot_lead_vip: boolean; quadrante: number | null; prioridade: string | null }>,
  emailToUtm: Map<string, string>,
  dimension: string
): UtmRow[] {
  const groups: Record<string, { count: number; scoreSum: number; scoreCount: number; vips: number; q1: number; alta: number }> = {}

  leads.forEach(l => {
    const rawUtm = emailToUtm.get(l.email?.toLowerCase() ?? '')
    const key = rawUtm && rawUtm.trim() ? rawUtm.trim() : `(sem ${dimension})`

    if (!groups[key]) groups[key] = { count: 0, scoreSum: 0, scoreCount: 0, vips: 0, q1: 0, alta: 0 }
    groups[key].count++

    if (l.lead_score != null) {
      const s = typeof l.lead_score === 'number' ? l.lead_score : Number(l.lead_score)
      if (!isNaN(s)) { groups[key].scoreSum += s; groups[key].scoreCount++ }
    }
    if (l.is_hot_lead_vip === true) groups[key].vips++
    if (l.quadrante === 1) groups[key].q1++

    const prio = String(l.prioridade ?? '').trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
    if (prio === 'ALTA') groups[key].alta++
  })

  return Object.entries(groups)
    .map(([utmValue, g]) => ({
      utmValue,
      count: g.count,
      avgScore: g.scoreCount > 0 ? parseFloat((g.scoreSum / g.scoreCount).toFixed(1)) : 0,
      vipRate:  g.count > 0 ? parseFloat((g.vips / g.count * 100).toFixed(1)) : 0,
      q1Rate:   g.count > 0 ? parseFloat((g.q1   / g.count * 100).toFixed(1)) : 0,
      altaRate: g.count > 0 ? parseFloat((g.alta / g.count * 100).toFixed(1)) : 0,
    }))
    .sort((a, b) => b.avgScore - a.avgScore)
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const startDateParam = searchParams.get('startDate')
  const endDateParam   = searchParams.get('endDate')
  const utmCampaignFilter = searchParams.get('utmCampaignFilter')
  // dimension: qual campo UTM analisar (campaign, source, medium, content, term)
  const dimension = searchParams.get('dimension') || 'campaign'

  const utmFieldIds = getUtmFieldIds()
  const acTagId = parseInt(process.env.ACTIVECAMPAIGN_TAG_ID || '583', 10)

  try {
    const cutoffIso    = startDateParam ? new Date(`${startDateParam}T00:00:00-03:00`).toISOString() : null
    const endCutoffIso = endDateParam   ? new Date(`${endDateParam}T23:59:59-03:00`).toISOString()   : null

    // Busca leads do Supabase com email + campos de qualidade
    let allLeads: Array<{ email: string; lead_score: number | null; is_hot_lead_vip: boolean; quadrante: number | null; prioridade: string | null }> = []
    let start = 0
    const batchSize = 1000

    while (true) {
      let query = supabase
        .from('quiz_leads')
        .select('email, lead_score, is_hot_lead_vip, quadrante, prioridade')
        .order('id', { ascending: true })
        .range(start, start + batchSize - 1)

      if (cutoffIso)    query = query.gte('created_at', cutoffIso)
      if (endCutoffIso) query = query.lte('created_at', endCutoffIso)
      if (utmCampaignFilter) query = query.ilike('utm_campaign', utmCampaignFilter)

      const { data, error } = await query
      if (error) throw new Error(error.message)
      if (!data || data.length === 0) break

      allLeads = allLeads.concat(data as typeof allLeads)
      if (data.length < batchSize) break
      start += batchSize
    }

    // Se os field IDs de UTM não estão configurados no AC, fallback para utm_campaign do Supabase
    const hasAcUtmFields = Object.values(utmFieldIds).some(id => id !== undefined)

    if (!hasAcUtmFields || !activeCampaignClient.isConfigured()) {
      // Fallback: usa utm_campaign do Supabase
      let allLeadsWithUtm: Array<{ email: string; utm_campaign: string | null; lead_score: number | null; is_hot_lead_vip: boolean; quadrante: number | null; prioridade: string | null }> = []
      let s = 0
      while (true) {
        let query = supabase
          .from('quiz_leads')
          .select('email, utm_campaign, lead_score, is_hot_lead_vip, quadrante, prioridade')
          .order('id', { ascending: true })
          .range(s, s + batchSize - 1)
        if (cutoffIso)    query = query.gte('created_at', cutoffIso)
        if (endCutoffIso) query = query.lte('created_at', endCutoffIso)
        if (utmCampaignFilter) query = query.ilike('utm_campaign', utmCampaignFilter)
        const { data, error } = await query
        if (error || !data || data.length === 0) break
        allLeadsWithUtm = allLeadsWithUtm.concat(data as typeof allLeadsWithUtm)
        if (data.length < batchSize) break
        s += batchSize
      }

      const emailToUtm = new Map(allLeadsWithUtm.map(l => [
        (l.email ?? '').toLowerCase(),
        l.utm_campaign ?? ''
      ]))

      const rows = aggregateByDimension(allLeads, emailToUtm, 'utm_campaign')
      return NextResponse.json({ success: true, source: 'supabase', dimension: 'utm_campaign', data: rows })
    }

    // Busca contatos do AC com UTMs via custom fields
    const acContacts = await activeCampaignClient.getContactsWithUtms(acTagId, utmFieldIds)

    // Monta mapa email → UTM pelo dimension escolhido
    const emailToUtm = new Map<string, string>()
    acContacts.forEach(c => {
      const email = c.email.toLowerCase()
      const utmValue = dimension === 'source'  ? c.utm_source  :
                       dimension === 'medium'  ? c.utm_medium  :
                       dimension === 'content' ? c.utm_content :
                       dimension === 'term'    ? c.utm_term    :
                       c.utm_campaign
      emailToUtm.set(email, utmValue ?? '')
    })

    const rows = aggregateByDimension(allLeads, emailToUtm, `utm_${dimension}`)

    return NextResponse.json({
      success: true,
      source: 'activecampaign',
      dimension: `utm_${dimension}`,
      totalContacts: acContacts.length,
      data: rows,
    })

  } catch (err: unknown) {
    const error = err as Error
    console.error('ERRO utm-analysis:', error.message)
    return NextResponse.json({ success: false, data: [], error: error.message }, { status: 500 })
  }
}

export { scoreColor }
