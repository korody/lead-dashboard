import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { QUADRANTES } from '@/lib/constants'
import { activeCampaignClient } from '@/lib/activecampaign'
import { sendFlowClient } from '@/lib/sendflow'

// Helper to fetch with timeout
async function fetchWithTimeout(url: string, opts: RequestInit & { timeoutMs?: number } = {}) {
  const { timeoutMs = 4000, ...init } = opts
  const controller = new AbortController()
  const id = setTimeout(() => controller.abort(), timeoutMs)
  try {
    const res = await fetch(url, { ...init, signal: controller.signal })
    return res
  } finally {
    clearTimeout(id)
  }
}

function normalizeToUiShape(payload: any) {
  // Accept either { success, metricas } or already-normalized
  const m = payload?.metricas || payload
  if (!m) return null

  const totalLeads = m.totais_leads?.total ?? 0
  const hotVips = m.lead_score?.vips ?? 0
  const avgScore = m.lead_score?.media ?? 0
  const whatsappSuccess = m.sucesso_envios?.taxa_sucesso ?? 0
  const withWhatsapp = m.funil?.diagnostico_enviado ?? 0

  const prioridades = m.distribuicao_prioridade || {}
  const priorities = [
    { priority: 'ALTA', count: prioridades.alta ?? 0 },
    { priority: 'MEDIA', count: prioridades.media ?? 0 },
    { priority: 'BAIXA', count: prioridades.baixa ?? 0 },
    { priority: 'SEM', count: prioridades.sem_prioridade ?? 0 },
  ]

  const elementosObj = m.distribuicao_elemento_mtc || {}
  const elementos = Object.entries(elementosObj).map(([elemento, v]: any) => ({
    elemento,
    count: typeof v === 'object' && v ? (v.count ?? 0) : (v ?? 0)
  }))

  return {
    totalLeads,
    hotVips,
    avgScore,
    whatsappSuccess,
    withWhatsapp,
    priorities,
    elementos,
  }
}

function mockMetrics() {
  return {
    totalLeads: 0,
    hotVips: 0,
    avgScore: 0,
    whatsappSuccess: 0,
    withWhatsapp: 0,
    priorities: [
      { priority: 'ALTA', count: 0 },
      { priority: 'MEDIA', count: 0 },
      { priority: 'BAIXA', count: 0 },
      { priority: 'SEM', count: 0 },
    ],
    elementos: [
      { elemento: 'RIM', count: 0 },
      { elemento: 'FÍGADO', count: 0 },
      { elemento: 'BAÇO', count: 0 },
      { elemento: 'CORAÇÃO', count: 0 },
      { elemento: 'PULMÃO', count: 0 },
    ],
  }
}

export async function GET() {
  try {
    console.log('Starting metrics fetch...')
    
    // Test basic connection first
    const { count: totalLeads, error: countError } = await supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Count error:', countError)
      return NextResponse.json({
        success: false,
        error: `Database error: ${countError.message}`,
        metrics: mockMetrics()
      })
    }
    
    console.log('Total leads found:', totalLeads)
    
    // Buscar dados do ActiveCampaign e SendFlow em paralelo
    const acTagId = parseInt(process.env.ACTIVECAMPAIGN_TAG_ID || '583', 10)
    const sendFlowCampaignId = process.env.SENDFLOW_CAMPAIGN_ID || 'wg2d0SAmMwoRt0kBOVG'
    
    const acPromise = activeCampaignClient.getTotalContactsByTag(acTagId).catch(error => {
      console.error('ActiveCampaign fetch error:', error)
      return 0 // Fallback to 0 if error
    })
    
    const sendFlowPromise = sendFlowClient.getTotalParticipants(sendFlowCampaignId).catch(error => {
      console.error('SendFlow fetch error:', error)
      return 0 // Fallback to 0 if error
    })
    
    // If we have no leads, return mock data with a note
    if (!totalLeads || totalLeads === 0) {
      console.log('No leads found, returning mock data')
      return NextResponse.json({
        success: true,
        metrics: mockMetrics(),
        note: 'No data found in database, showing mock data'
      })
    }
    
    // Batch loading para pegar TODOS os leads sem limite de paginação
    console.log('Starting batch loading for all leads...')
    let allLeads: any[] = []
    let start = 0
    const batchSize = 1000
    
    while (true) {
      const { data: batch, error: batchError } = await supabase
        .from('quiz_leads')
        // include diagnostic fields if present in the table
        .select('lead_score, whatsapp_status, status_tags, created_at, prioridade, elemento_principal, is_hot_lead_vip, id, nome, email, celular, intensidade_calculada, urgencia_calculada, quadrante')
        .range(start, start + batchSize - 1)
      
      if (batchError) {
        console.error('Batch loading error:', batchError)
        break
      }
      
      if (!batch || batch.length === 0) break
      
      allLeads = allLeads.concat(batch)
      console.log(`Loaded batch: ${batch.length} leads (total so far: ${allLeads.length})`)
      
      if (batch.length < batchSize) break
      
      start += batchSize
    }
    
    console.log(`✅ Batch loading complete: ${allLeads.length} total leads`)

    // If batch loading returned no rows but the initial HEAD count indicated rows,
    // it's often due to column-level restrictions or schema mismatch. In that case
    // re-run a minimal select to recover essential fields for distributions.
    if ((allLeads.length === 0) && (typeof totalLeads === 'number' && totalLeads > 0)) {
      try {
        console.log('Batch returned 0 rows but HEAD count > 0 — retrying minimal select...')
        const { data: minimalData, error: minimalError } = await supabase
          .from('quiz_leads')
          .select('id, created_at, lead_score, is_hot_lead_vip, prioridade, elemento_principal, status_tags, whatsapp_status')
          .range(0, 9999)

        if (!minimalError && minimalData && minimalData.length > 0) {
          allLeads = minimalData
          console.log(`Recovered ${allLeads.length} leads from minimal select`)
        } else {
          console.warn('Minimal select failed or returned no rows', minimalError)
        }
      } catch (e) {
        console.error('Error during minimal select fallback:', e)
      }
    }
    
    // Fetch dados adicionais para dashboard completo
    const [
      { data: logsData, error: logsError }
    ] = await Promise.all([
      supabase
        .from('whatsapp_logs')
        .select('status, created_at')
        .range(0, 9999)
    ])

    // Calcular métricas principais usando allLeads
    const vipLeads = allLeads.filter(l => l.is_hot_lead_vip === true)
    const hotVips = vipLeads.length
    const scores = allLeads.filter(l => l.lead_score != null).map(l => l.lead_score) || []
    const avgScore = scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

    // Distribuição detalhada de status a partir do campo `status_tags`
    // Cada lead conta no máximo uma vez por tag (se tiver múltiplas tags, conta em cada uma)
    const statusTagCount: Record<string, number> = {}
    allLeads.forEach(l => {
      // suportar diferentes nomes e formatos
      const raw = l.status_tags ?? l.status_Tags ?? l.statusTags ?? l.whatsapp_status ?? ''

      let tags: string[] = []
      if (Array.isArray(raw)) {
        tags = raw.map(String)
      } else if (typeof raw === 'string') {
        // split por vírgula, ponto-e-vírgula, barra, pipe ou barra vertical
        tags = raw.split(/[,;|\/]+/).map(s => s.trim()).filter(Boolean)
      }

      // normalizar e deduplicar por lead
      const seen = new Set<string>()
      tags.forEach(t => {
        // normalize remove diacritics, trim and uppercase
        let norm = String(t || '').trim().toUpperCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
        norm = norm.replace(/[^\u0000-\u007F]/g, s => s) // keep safe (no-op) if unsupported
        if (!norm) return
        if (!seen.has(norm)) {
          seen.add(norm)
          statusTagCount[norm] = (statusTagCount[norm] || 0) + 1
        }
      })
    })

    const whatsappDistribution = Object.entries(statusTagCount).map(([status, count]) => {
      const percentage = allLeads.length > 0 ? (count / allLeads.length * 100) : 0
      return { status, count, percentage }
    }).sort((a, b) => b.count - a.count)

    // manter métrica de sucesso baseada em whatsapp_status original (se aplicável)
    const whatsappSent = allLeads.filter(l => 
      l.whatsapp_status === 'sent' || 
      l.whatsapp_status === 'resultados_enviados' ||
      l.whatsapp_status === 'desafio_enviado'
    ).length || 0
    const whatsappSuccess = allLeads.length > 0 
      ? (whatsappSent / allLeads.length * 100) 
      : 0

    // Prioridades
    // Normalizamos: trim, uppercase e removemos diacríticos (ex: "MÉDIA" -> "MEDIA").
    const prioCount: Record<string, number> = { ALTA: 0, MEDIA: 0, BAIXA: 0, SEM: 0 }
    allLeads.forEach(l => {
      const raw = String(l.prioridade ?? '')
      // Trim, uppercase and strip accents (NFD normalization)
      let p = raw.trim().toUpperCase().normalize('NFD').replace(/\u0300-\u036f/g, '').replace(/[ -]/g, '')
      // The above regex \u0300-\u036f sometimes loses escape in string literal contexts; use a safer replace for combining marks
      p = raw.trim().toUpperCase().normalize('NFD').replace(/[^\p{L}\p{N} ]/gu, '')
      p = p.normalize('NFC')
      if (!p) p = 'SEM'
      prioCount[p] = (prioCount[p] || 0) + 1
    })
    const priorities = Object.entries(prioCount).map(([priority, count]) => ({ priority, count }))

    // Elementos
    const elemCount: Record<string, number> = {}
    allLeads.forEach(l => {
      if (l.elemento_principal) {
        const e = l.elemento_principal
        elemCount[e] = (elemCount[e] || 0) + 1
      }
    })
    const elementos = Object.entries(elemCount).map(([elemento, count]) => ({ elemento, count }))
    
    // VIPs recentes (últimas 24h)
    const vipsRecentes = allLeads
      .filter(l => l.is_hot_lead_vip === true && new Date(l.created_at) >= new Date(Date.now()-24*60*60*1000))
      .slice(0, 10)

    // Calcular evolução temporal dos leads (últimos 30 dias)
    async function calcularEvolucaoTemporal() {
      console.log('Calculando evolução temporal...')
      
      const numDays = 30
      
      let allData: any[] = []
      let start = 0
      const batchSize = 1000
      
      // Fazer requisições em batch até pegar todos os dados
      while (true) {
        const { data, error } = await supabase
          .from('quiz_leads')
          .select('created_at')
          .range(start, start + batchSize - 1)
        
        if (error) {
          console.error('Erro ao buscar dados para evolução temporal:', error)
          break
        }
        
        if (!data || data.length === 0) break
        
        allData = allData.concat(data)
        
        // Se retornou menos que o batch size, chegamos ao fim
        if (data.length < batchSize) break
        
        start += batchSize
      }
      
      const porDia: Record<string, number> = {};
      allData.forEach(l => { 
        const dia = new Date(l.created_at).toISOString().split('T')[0]; 
        porDia[dia] = (porDia[dia]||0)+1; 
      });
      
      const resultado = [];
      for(let i=numDays-1;i>=0;i--){ 
        const d = new Date(Date.now()-i*24*60*60*1000); 
        const dia = d.toISOString().split('T')[0]; 
        resultado.push({ data: dia, leads: porDia[dia]||0 }); 
      }
      
      console.log(`Evolução temporal gerada para 30 dias:`, resultado.slice(0, 5));
      console.log(`Total de registros do período:`, allData.length);
      console.log('Dias com dados:', Object.keys(porDia).length);
      
      return resultado;
    }
    
    const evolucaoTemporal = await calcularEvolucaoTemporal()

    

    // === Quadrantes (Matriz Urgência x Intensidade)
    // Prefer DB-stored `quadrante`, otherwise derive from intensidade_calculada/urgencia_calculada, otherwise fallback to priority+lead_score
    const intensityThreshold = parseFloat(process.env.QUADRANT_INTENSITY_THRESHOLD || '70')
    const quadranteCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

    allLeads.forEach(l => {
      let q: number | null = null

      // Priority 1: explicit stored quadrant
      if (l.quadrante != null) {
        const qv = typeof l.quadrante === 'number' ? l.quadrante : (typeof l.quadrante === 'string' && l.quadrante !== '' ? Number(l.quadrante) : NaN)
        if (!isNaN(qv) && [1,2,3,4].includes(qv)) q = qv
      }

      // Priority 2: intensity/urgency stored explicitly (scale 1-5)
      if (q === null && (l.intensidade_calculada != null || l.urgencia_calculada != null)) {
        const intensidade = typeof l.intensidade_calculada === 'number' ? l.intensidade_calculada : (typeof l.intensidade_calculada === 'string' && l.intensidade_calculada !== '' ? Number(l.intensidade_calculada) : NaN)
        const urgencia = typeof l.urgencia_calculada === 'number' ? l.urgencia_calculada : (typeof l.urgencia_calculada === 'string' && l.urgencia_calculada !== '' ? Number(l.urgencia_calculada) : NaN)
        const validInt = !isNaN(intensidade)
        const validUrg = !isNaN(urgencia)
        if (validInt && validUrg) {
          if (intensidade >= 4 && urgencia >= 4) q = 1
          else if (intensidade >= 4 && urgencia <= 3) q = 2
          else if (intensidade <= 3 && urgencia >= 4) q = 3
          else q = 4
        }
      }

      // Fallback: derive from prioridade + lead_score
      if (q === null) {
        const rawPrio = String(l.prioridade ?? '').trim().toUpperCase()
        const isHighUrgency = rawPrio === 'ALTA'
        const score = typeof l.lead_score === 'number' ? l.lead_score : (typeof l.lead_score === 'string' && l.lead_score !== '' ? Number(l.lead_score) : NaN)
        const isHighIntensity = !isNaN(score) && score >= intensityThreshold

        if (isHighUrgency && isHighIntensity) q = 1
        else if (isHighUrgency && !isHighIntensity) q = 2
        else if (!isHighUrgency && isHighIntensity) q = 3
        else q = 4
      }

      quadranteCounts[q] = (quadranteCounts[q] || 0) + 1
    })

    const totalForQuadrantBase = allLeads.length || 1
    const quadrants = Object.entries(QUADRANTES).map(([k, v]) => {
      const id = Number(k)
      const count = quadranteCounts[id] || 0
      const percentage = totalForQuadrantBase > 0 ? (count / totalForQuadrantBase * 100) : 0
      return {
        id,
        title: v.title,
        desc: v.desc,
        color: v.color,
        count,
        percentage: parseFloat(percentage.toFixed(1))
      }
    }).sort((a, b) => a.id - b.id)

  const storedDiagnosticsCount = allLeads.filter(l => l.intensidade_calculada != null && l.urgencia_calculada != null).length || 0

    // Buscar dados externos em paralelo
    const [totalInscritosPDV, totalGruposWhatsApp] = await Promise.all([
      acPromise,
      sendFlowPromise
    ])
    
    console.log('External integrations:', {
      activeCampaign: totalInscritosPDV,
      sendFlow: totalGruposWhatsApp
    })
    
    // Funil de conversão completo e detalhado (3 etapas)
  const total_quiz_completado = allLeads?.length || 0

  // If batch loading returned empty but the initial HEAD count query found rows,
  // fall back to that `totalLeads` value so dashboard denominators aren't zero.
  const effectiveDiagnostico = total_quiz_completado || (typeof totalLeads === 'number' ? totalLeads : 0)

  // Etapa 1: Cadastro → Diagnóstico Completo (use effectiveDiagnostico as the canonical value)
  const diagnostico_completo = effectiveDiagnostico
    
    // Etapa 2: Diagnóstico → Grupos WhatsApp (dados do SendFlow)
    const grupos_whatsapp = totalGruposWhatsApp
    
  // TODAS as conversões devem usar o total de diagnósticos/quiz completados
  // (ou o contar HEAD inicial, se o batch falhar) como denominador estável.
  const base_total = diagnostico_completo || (typeof totalLeads === 'number' ? totalLeads : 0)
    
    const conv_pdv_diagnostico = base_total > 0
      ? Math.min(100, (diagnostico_completo / base_total) * 100).toFixed(1)
      : '0'

    // Groups/SendFlow may return a participant count that exceeds the number of
    // distinct diagnostics (duplicates across groups, or different counting logic).
    // Clamp displayed conversion to 100% to avoid confusing >100% rates in the UI.
    const conv_diagnostico_grupos = base_total > 0
      ? Math.min(100, (grupos_whatsapp / base_total) * 100).toFixed(1)
      : '0'

    const conv_geral = base_total > 0
      ? Math.min(100, (grupos_whatsapp / base_total) * 100).toFixed(1)
      : '0'
    
    const funil = {
      // Números absolutos de cada etapa
      etapas: {
        quiz_completado: total_quiz_completado,
        diagnostico_completo: diagnostico_completo,
        grupos_whatsapp: grupos_whatsapp,
        // Use DB-based completions as the canonical "cadastros" baseline so
        // absolute numbers remain consistent across the dashboard.
        cadastros_pdc: diagnostico_completo,
      },
      
      // Taxas de conversão entre etapas
      conversoes: {
        pdv_para_diagnostico: conv_pdv_diagnostico, // cadastros_pdc → quiz_completado
        diagnostico_para_grupos: conv_diagnostico_grupos, // diagnostico → grupos
        conversao_geral: conv_geral, // cadastros_pdc → grupos_whatsapp (conversão final)
      },
      
      // Métricas de perda (drop-off) - todas em relação ao total de cadastros
      perdas: {
        pdv_diagnostico: Math.max(0, base_total - diagnostico_completo),
        diagnostico_grupos: Math.max(0, diagnostico_completo - grupos_whatsapp),
        taxa_perda_pdv_diagnostico: base_total > 0
          ? Math.max(0, (((base_total - diagnostico_completo) / base_total) * 100)).toFixed(1)
          : '0',
        taxa_perda_diagnostico_grupos: base_total > 0
          ? Math.max(0, (((diagnostico_completo - grupos_whatsapp) / base_total) * 100)).toFixed(1)
          : '0',
      }
    }

    // WhatsApp logs (sucesso/falha por período)
    const total_envios = logsData?.length || 0
    const sucessos = logsData?.filter(l => l.status === 'sent' || l.status === 'success').length || 0
    const falhas = logsData?.filter(l => l.status === 'error' || l.status === 'failed').length || 0
    const taxa_sucesso = total_envios>0 ? ((sucessos/total_envios)*100).toFixed(1) : 0
    const taxa_falha = total_envios>0 ? ((falhas/total_envios)*100).toFixed(1) : 0
    const whatsappLogs = {
      total_envios,
      sucessos,
      falhas,
      taxa_sucesso: parseFloat(taxa_sucesso.toString()),
      taxa_falha: parseFloat(taxa_falha.toString())
    }

    // VIPs recentes (últimas 24h)
    const vips24h = vipsRecentes || []

    // Resumo diário
    const hoje = new Date(); hoje.setHours(0,0,0,0); const hoje_iso = hoje.toISOString()
    const leads_hoje = allLeads?.filter(l => new Date(l.created_at) >= hoje) || []
    const vips_hoje = vipsRecentes?.length || 0
    const envios_hoje = logsData?.filter(l => new Date(l.created_at) >= hoje) || []
    const envios_sucesso = envios_hoje?.filter(l=>l.status==='sent' || l.status==='success').length || 0
    const taxa_sucesso_envios = envios_hoje.length>0 ? ((envios_sucesso/envios_hoje.length)*100).toFixed(1) : 0
    const resumo_diario = {
      data: hoje.toISOString().split('T')[0],
      total_leads: leads_hoje.length,
      leads_vip: vips_hoje,
      total_envios: envios_hoje.length,
      envios_sucesso,
      taxa_sucesso_envios: parseFloat(taxa_sucesso_envios.toString())
    }

    const metrics = {
      // Use effectiveDiagnostico (batch length or head count) as totalLeads so dashboard numbers reflect DB data
      totalLeads: effectiveDiagnostico || 0,
      hotVips,
      avgScore: parseFloat(avgScore.toFixed(1)),
      whatsappSuccess: parseFloat(whatsappSuccess.toFixed(1)),
      withWhatsapp: whatsappSent,
      whatsappDistribution, // Distribuição detalhada de status
      priorities,
      elementos,
      evolucaoTemporal,
      funil,
  quadrants,
  storedDiagnosticsCount,
      whatsappLogs,
      vips24h,
      resumo_diario
    }

    return NextResponse.json({ success: true, metrics })
  } catch (err: any) {
    console.error('Erro ao buscar métricas:', err)
    // Fallback to mock
    const fallback = mockMetrics()
    return NextResponse.json(
      { success: true, metrics: fallback, note: 'fallback:error', error: err?.message },
      { status: 200 }
    )
  }
}
