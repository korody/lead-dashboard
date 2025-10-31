'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useDashboardStore } from '../stores/dashboard-store'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

export interface DashboardMetrics {
  totalLeads: number // Total geral do ActiveCampaign
  totalDiagnosticos: number // Total de diagnósticos do período (Supabase filtrado)
  hotVips: number
  avgScore: number
  whatsappSuccess: number
  withWhatsapp: number
  whatsappDistribution: Array<{ status: string; count: number; percentage: number }>
  priorities: Array<{ priority: string; count: number }>
  elementos: Array<{ elemento: string; count: number }>
  evolucaoTemporal: Array<{ data: string; leads: number }>
  funil: {
    etapas: {
      quiz_completado: number
      diagnostico_completo: number
      grupos_whatsapp: number
      cadastros_pdc: number
    }
    conversoes: {
      pdv_para_diagnostico: string
      diagnostico_para_grupos: string
      conversao_geral: string
    }
    perdas: {
      pdv_diagnostico: number
      diagnostico_grupos: number
      taxa_perda_pdv_diagnostico: string
      taxa_perda_diagnostico_grupos: string
    }
  }
  whatsappLogs: unknown
  vips24h: Array<unknown>
  resumo_diario: unknown
  // Comparação temporal
  comparison?: {
    totalLeads: number
    totalDiagnosticos: number
    hotVips: number
    conversaoGeral: number
    whatsappSuccess: number
  }
}

async function fetchMetrics(days: number = 30): Promise<DashboardMetrics> {
  const response = await fetch(`/api/metrics?days=${days}`)
  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`)
  }
  const data = await response.json()
  return data.metrics
}

export function useMetrics(days: number = 30) {
  const queryClient = useQueryClient()
  const { isRealTimeEnabled } = useDashboardStore()

  const query = useQuery({
    queryKey: ['metrics', days],
    queryFn: () => fetchMetrics(days),
    staleTime: isRealTimeEnabled ? 30 * 1000 : 5 * 60 * 1000, // 30s if real-time, 5min otherwise
    refetchInterval: isRealTimeEnabled ? 60 * 1000 : false, // 1min if real-time enabled
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  })

  // Show toast notifications for data updates
  useEffect(() => {
    if (query.data && !query.isLoading && !query.isError) {
      // Detect significant changes
      const previousData = queryClient.getQueryData(['metrics', days]) as DashboardMetrics | undefined
      if (previousData && query.data.totalLeads > previousData.totalLeads) {
        const newLeads = query.data.totalLeads - previousData.totalLeads
        toast.success(`🚀 ${newLeads} novo(s) cadastro(s) detectado(s)!`, {
          duration: 4000,
          icon: '📈',
        })
      }
      
      if (previousData && query.data.hotVips > previousData.hotVips) {
        const newVips = query.data.hotVips - previousData.hotVips
        toast.success(`⭐ ${newVips} novo(s) VIP(s) identificado(s)!`, {
          duration: 5000,
          icon: '🔥',
        })
      }
    }
  }, [query.data, queryClient, days])

  // Show error toast
  useEffect(() => {
    if (query.isError) {
      toast.error('Erro ao carregar dados do dashboard', {
        duration: 4000,
        icon: '⚠️',
      })
    }
  }, [query.isError])

  return {
    ...query,
    refresh: () => {
      queryClient.invalidateQueries({ queryKey: ['metrics', days] })
      toast.loading('Atualizando dados...', { duration: 2000 })
    }
  }
}

export function useRealTimeMetrics(days: number = 30) {
  const { isRealTimeEnabled, setRealTimeEnabled } = useDashboardStore()
  const metricsQuery = useMetrics(days)

  const toggleRealTime = () => {
    const newState = !isRealTimeEnabled
    setRealTimeEnabled(newState)
    
    if (newState) {
      toast.success('📡 Modo tempo real ativado!', {
        duration: 3000,
        icon: '⚡',
      })
    } else {
      toast('⏸️ Modo tempo real desativado', {
        duration: 2000,
        icon: '⏹️',
      })
    }
  }

  return {
    ...metricsQuery,
    isRealTimeEnabled,
    toggleRealTime,
  }
}