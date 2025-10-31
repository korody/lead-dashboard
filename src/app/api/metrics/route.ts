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

  // REMOVIDO: totalLeads do mock, não usado
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
    totalLeads: 0, // Not used in this function
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

export async function GET(request: Request) {
  // Parse query parameters
  const { searchParams } = new URL(request.url)
  const requestedDays = parseInt(searchParams.get('days') || '30', 10)
  const days = isNaN(requestedDays) ? 30 : requestedDays
  
  const acTagId = parseInt(process.env.ACTIVECAMPAIGN_TAG_ID || '583', 10)
  // Log para depuração do ActiveCampaign
  console.log('ActiveCampaign Tag ID:', acTagId)
  console.log('Requested days:', days)
  const acTest = await activeCampaignClient.getTotalContactsByTag(acTagId)
  console.log('ActiveCampaign getTotalContactsByTag(acTagId) retornou:', acTest)
  try {
    console.log('Starting metrics fetch...')
    

    // Buscar dados do ActiveCampaign e SendFlow em paralelo
    const acTagId = parseInt(process.env.ACTIVECAMPAIGN_TAG_ID || '583', 10)
    console.log('ActiveCampaign Tag ID:', acTagId)
    const acTest = await activeCampaignClient.getTotalContactsByTag(acTagId)
    console.log('ActiveCampaign getTotalContactsByTag(acTagId) retornou:', acTest)
    const sendFlowCampaignId = process.env.SENDFLOW_CAMPAIGN_ID || 'wg2d0SAmMwoRt0kBOVG'

    // Pega o total de leads do ActiveCampaign
    const acPromise = activeCampaignClient.getTotalContactsByTag(acTagId).catch(error => {
      console.error('ActiveCampaign fetch error:', error)
      return 0 // Fallback to 0 if error
    })

    const sendFlowPromise = sendFlowClient.getTotalParticipants(sendFlowCampaignId).catch(error => {
      console.error('SendFlow fetch error:', error)
      return 0 // Fallback to 0 if error
    })
    
    // If we have no leads, return mock data with a note
    // ...existing code...
    // Mover verificação para depois da atribuição
    
    let totalLeadsAC = 0;
    let totalGruposWhatsApp = 0;
    
    // Buscar dados externos em paralelo
    console.log('🔄 Fetching external APIs...')
    const [ac, grupos] = await Promise.all([
      acPromise,
      sendFlowPromise
    ])
    totalLeadsAC = ac;
    totalGruposWhatsApp = grupos;
    console.log(`✅ ActiveCampaign total: ${totalLeadsAC}`)
    console.log(`✅ SendFlow total: ${totalGruposWhatsApp}`)
    
    // Após verificação, atribuir valor de acTest se for válido (fallback)
    if (acTest && typeof acTest === 'number' && acTest > 0 && totalLeadsAC === 0) {
      totalLeadsAC = acTest;
    }
    
    // Calcular data de corte baseada no período selecionado
    const isTodoTempo = days >= 9999
    const cutoffDate = new Date()
    if (!isTodoTempo) {
      cutoffDate.setDate(cutoffDate.getDate() - days)
    } else {
      cutoffDate.setFullYear(2000) // Data bem antiga para pegar tudo
    }
    const cutoffIso = cutoffDate.toISOString()
    
    console.log(`🔍 Filtrando leads desde ${cutoffIso} (${isTodoTempo ? 'TODO O TEMPO' : `últimos ${days} dias`})`)
    
    // Buscar count total primeiro (filtrado por período ou tudo)
    let countQuery = supabase
      .from('quiz_leads')
      .select('*', { count: 'exact', head: true })
    
    if (!isTodoTempo) {
      countQuery = countQuery.gte('created_at', cutoffIso)
    }
    
    const { count: totalCount, error: countError } = await countQuery
    
    console.log(`📊 Total de leads no Supabase: ${totalCount}`)
    
    // Buscar TODOS os leads do Supabase sem limite
    console.log('🔄 Loading leads from Supabase...')
    
    // Buscar em batches para não ter limite
    let allLeads: any[] = []
    let start = 0
    const batchSize = 1000
    
    while (true) {
      let query = supabase
        .from('quiz_leads')
        .select('lead_score, whatsapp_status, status_tags, created_at, prioridade, elemento_principal, is_hot_lead_vip, id, nome, email, celular, quadrante')
        .order('id', { ascending: true })
        .range(start, start + batchSize - 1)
      
      if (!isTodoTempo) {
        query = query.gte('created_at', cutoffIso)
      }
      
      const { data, error } = await query
      
      if (error) {
        console.error('❌ Error loading leads batch:', error)
        throw new Error(`Failed to load leads: ${error.message}`)
      }
      
      if (!data || data.length === 0) break
      
      allLeads = allLeads.concat(data)
      console.log(`📦 Loaded batch: ${data.length} leads (total so far: ${allLeads.length})`)
      
      // Se retornou menos que o batch size, chegamos ao fim
      if (data.length < batchSize) break
      
      start += batchSize
    }
    
    // Erro já tratado no loop acima
    
    console.error(`✅✅✅ LOADED ${allLeads?.length || 0} LEADS FROM SUPABASE ✅✅✅`)
    
    // Se não conseguiu carregar leads, retornar erro
    if (!allLeads || allLeads.length === 0) {
      console.error('⚠️ No leads found in Supabase')
      // Continue mesmo sem leads para não quebrar o dashboard
    }
    
    // Fetch dados adicionais para dashboard completo
    let logsQuery = supabase
      .from('whatsapp_logs')
      .select('status, created_at')
      .range(0, 9999)
    
    if (!isTodoTempo) {
      logsQuery = logsQuery.gte('created_at', cutoffIso)
    }
    
    const [
      { data: logsData, error: logsError }
    ] = await Promise.all([
      logsQuery
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
      const raw = l.status_tags ?? l.whatsapp_status ?? ''

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

    const whatsappDistribution = Object.entries(statusTagCount)
      .filter(([status]) => status !== 'TEMPLATE_ENVIADO') // Ignorar template_enviado
      .map(([status, count]) => {
        const percentage = allLeads.length > 0 ? (count / allLeads.length * 100) : 0
        return { status, count, percentage }
      })
      .sort((a, b) => b.count - a.count)

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
        elemCount[l.elemento_principal] = (elemCount[l.elemento_principal] || 0) + 1
      }
    })
    const elementos = Object.entries(elemCount).map(([elemento, count]) => ({ elemento, count }))
    
    // VIPs recentes (últimas 24h)
    const vipsRecentes = allLeads
      .filter(l => l.is_hot_lead_vip === true && new Date(l.created_at) >= new Date(Date.now()-24*60*60*1000))
      .slice(0, 10)

    // Calcular evolução temporal dos leads
    // PRIORIDADE: Usar dados do ActiveCampaign se configurado, senão usar Supabase
    async function calcularEvolucaoTemporal() {
      const numDays = days >= 9999 ? 365 : days // Limitar "Todo o Tempo" a 1 ano de visualização
      
      // Tentar buscar do ActiveCampaign primeiro (usando updated_date)
      if (activeCampaignClient.isConfigured()) {
        try {
          console.log('📊 Buscando evolução temporal do ActiveCampaign (via updated_date)...')
          const { byDay } = await activeCampaignClient.getRecentContactsByTag(acTagId, numDays)
          
          // Preencher todos os dias (mesmo com 0)
          const resultado = []
          for(let i=numDays-1;i>=0;i--){ 
            const d = new Date(Date.now()-i*24*60*60*1000) 
            const dia = d.toISOString().split('T')[0] 
            resultado.push({ data: dia, leads: byDay[dia]||0 }) 
          }
          
          console.log(`✅ Evolução temporal do ActiveCampaign: ${Object.keys(byDay).length} dias com dados`)
          return resultado
        } catch (error) {
          console.error('❌ Erro ao buscar do ActiveCampaign, usando Supabase como fallback:', error)
        }
      }
      
      // Fallback: Buscar do Supabase
      console.log('📊 Buscando evolução temporal do Supabase...')
      let allData: any[] = []
      let start = 0
      const batchSize = 1000
      
      while (true) {
        const { data, error } = await supabase
          .from('quiz_leads')
          .select('created_at')
          .order('created_at', { ascending: true })
          .range(start, start + batchSize - 1)
        
        if (error) {
          console.error('Erro ao buscar dados para evolução temporal:', error)
          break
        }
        
        if (!data || data.length === 0) break
        
        allData = allData.concat(data)
        
        if (data.length < batchSize) break
        
        start += batchSize
      }
      
      const porDia: Record<string, number> = {}
      allData.forEach(l => { 
        const dia = new Date(l.created_at).toISOString().split('T')[0] 
        porDia[dia] = (porDia[dia]||0)+1 
      })
      
      const resultado = []
      for(let i=numDays-1;i>=0;i--){ 
        const d = new Date(Date.now()-i*24*60*60*1000) 
        const dia = d.toISOString().split('T')[0] 
        resultado.push({ data: dia, leads: porDia[dia]||0 }) 
      }
      
      console.log(`✅ Evolução temporal do Supabase: ${Object.keys(porDia).length} dias com dados`)
      return resultado
    }
    
    // Função para calcular comparação com período anterior
    async function calcularComparacaoPeriodo(days: number, currentLeads: any[], totalAC: number, gruposWA: number) {
      // Se for "Todo o Tempo" (9999), não faz comparação
      if (days >= 9999) {
        return {
          totalLeads: totalAC,
          totalDiagnosticos: 0,
          hotVips: 0,
          conversaoGeral: 0,
          whatsappSuccess: 0
        }
      }
      
      const now = Date.now()
      const periodStart = now - (days * 24 * 60 * 60 * 1000)
      const previousPeriodEnd = periodStart
      const previousPeriodStart = periodStart - (days * 24 * 60 * 60 * 1000)
      
      // Datas ISO para query
      const prevStartIso = new Date(previousPeriodStart).toISOString()
      const prevEndIso = new Date(previousPeriodEnd).toISOString()
      
      console.log(`📊 Buscando período anterior: ${prevStartIso} até ${prevEndIso}`)
      
      // Buscar leads do período anterior do banco
      const { data: previousLeads, count: previousCount } = await supabase
        .from('quiz_leads')
        .select('is_hot_lead_vip, whatsapp_status, created_at', { count: 'exact' })
        .gte('created_at', prevStartIso)
        .lt('created_at', prevEndIso)
      
      const previousTotal = previousCount || 0
      const previousVips = previousLeads?.filter(l => l.is_hot_lead_vip === true).length || 0
      
      // Calcular whatsappSuccess do período anterior
      const previousWhatsappSent = previousLeads?.filter(l => 
        l.whatsapp_status === 'sent' || 
        l.whatsapp_status === 'resultados_enviados' ||
        l.whatsapp_status === 'desafio_enviado'
      ).length || 0
      const previousWhatsappSuccess = previousTotal > 0 
        ? (previousWhatsappSent / previousTotal) * 100 
        : 0
      
      // VIPs do período atual
      const currentVips = currentLeads.filter(l => l.is_hot_lead_vip === true).length
      
      // Conversão anterior (estimativa baseada em proporção)
      const conversaoAnterior = previousTotal > 0 
        ? (previousVips / previousTotal) * 100 
        : 0
      
      console.log(`✅ Comparação: Anterior ${previousTotal} leads (${previousVips} VIPs, ${previousWhatsappSuccess.toFixed(1)}% WA) vs Atual ${currentLeads.length} leads (${currentVips} VIPs)`)
      
      return {
        totalLeads: totalAC, // Total AC não muda (é sempre total geral)
        totalDiagnosticos: previousTotal, // Total de diagnósticos do período anterior
        hotVips: previousVips,
        conversaoGeral: parseFloat(conversaoAnterior.toFixed(1)),
        whatsappSuccess: parseFloat(previousWhatsappSuccess.toFixed(1))
      }
    }

    const evolucaoTemporal = await calcularEvolucaoTemporal()

    

    // === Quadrantes (Matriz Urgência x Intensidade)
    // Prefer DB-stored `quadrante`, otherwise fallback to priority+lead_score
    const intensityThreshold = parseFloat(process.env.QUADRANT_INTENSITY_THRESHOLD || '70')
    const quadranteCounts: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0 }

    allLeads.forEach(l => {
      let q: number | null = null

      // Priority 1: explicit stored quadrant
      if (l.quadrante != null) {
        const qv = typeof l.quadrante === 'number' ? l.quadrante : (typeof l.quadrante === 'string' && l.quadrante !== '' ? Number(l.quadrante) : NaN)
        if (!isNaN(qv) && [1,2,3,4].includes(qv)) q = qv
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

  // Conta os leads que tem quadrante definido (diagnosticos armazenados)
  const storedDiagnosticsCount = allLeads.filter(l => l.quadrante != null).length || 0

    // Buscar dados externos em paralelo

    // O total de leads deve vir do ActiveCampaign (tag específica)
  // totalLeadsAC já definido acima
    
    console.log('External integrations:', {
      activeCampaign: totalLeadsAC,
      sendFlow: totalGruposWhatsApp
    })
    
    // Funil de conversão completo e detalhado (3 etapas)
    if (!totalLeadsAC || totalLeadsAC === 0) {
      console.log('No leads found, returning mock data')
      return NextResponse.json({
        success: true,
        metrics: mockMetrics(),
        note: 'No data found in database, showing mock data'
      })
    }
  // Total de diagnósticos finalizados (leads no Supabase do período filtrado)
  const total_quiz_completado = allLeads?.length || 0
  const diagnostico_completo = total_quiz_completado
  
  // IMPORTANTE: Total de cadastros SEMPRE vem do ActiveCampaign (total geral)
  const total_cadastros = totalLeadsAC || 0
  
  // Etapa 2: Diagnóstico → Grupos WhatsApp (dados do SendFlow - total geral)
  const grupos_whatsapp = totalGruposWhatsApp
  
  // Base para conversões: usar cadastros AC para conversão de diagnósticos
  const base_total = total_cadastros
    
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
        // Total de cadastros do ActiveCampaign
        cadastros_pdc: total_cadastros,
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

    // Calcular comparação com período anterior (mesma duração)
    const comparison = await calcularComparacaoPeriodo(days, allLeads, totalLeadsAC, grupos_whatsapp)

    const metrics = {
      // IMPORTANTE: Total de leads SEMPRE vem do ActiveCampaign (total geral)
      totalLeads: totalLeadsAC || 0,
      // Total de diagnósticos finalizados no período (Supabase filtrado)
      totalDiagnosticos: allLeads.length,
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
      resumo_diario,
      comparison
    }

    console.log('Métricas retornadas para o frontend:', JSON.stringify(metrics, null, 2));

    console.log('Métricas retornadas para o frontend:', JSON.stringify(metrics, null, 2));

    console.log('Métricas retornadas para o frontend:', JSON.stringify(metrics, null, 2));

  return NextResponse.json({ success: true, metrics })
  } catch (err: any) {
    console.error('ERRO 500 MÉTRICAS:', err && err.stack ? err.stack : err);
    // Fallback to mock
    const fallback = mockMetrics();
    return NextResponse.json(
      { success: false, metrics: fallback, note: 'fallback:error', error: err?.message },
      { status: 500 }
    );
  }
}
