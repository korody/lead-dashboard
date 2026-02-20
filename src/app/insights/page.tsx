"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Target,
  RefreshCw
} from 'lucide-react'
import { useRealTimeMetrics } from '@/hooks/use-metrics'
import { useSidebarControls } from '@/contexts/sidebar-controls-context'
import { useCampaign } from '@/contexts/campaign-context'
import { DashboardControls } from '@/components/ui/dashboard-controls'
import { InteractiveLineChart } from '@/components/charts/interactive-line-chart'
import { ScoreEvolutionChart } from '@/components/charts/score-evolution-chart'
import { ConversionFunnel } from '@/components/charts/conversion-funnel'
import UrgencyMatrixFull from '@/components/ui/urgency-matrix-full'
import { DateRangeOption } from '@/components/ui/date-range-filter'
import { CampaignComparisonSelector } from '@/components/ui/campaign-comparison-selector'
import { InteractiveHorizontalBarChart } from '@/components/charts/interactive-horizontal-bar-chart'

interface ExternalQuadrant { id: number; count: number; percentage: number }

interface UtmRow {
  utmValue: string
  count: number
  avgScore: number
  vipRate: number
  q1Rate: number
  altaRate: number
}

function utmScoreColor(score: number): string {
  if (score >= 65) return '#22c55e'
  if (score >= 50) return '#eab308'
  return '#ef4444'
}

function utmScoreTextClass(score: number): string {
  if (score >= 65) return 'text-green-400'
  if (score >= 50) return 'text-yellow-400'
  return 'text-red-400'
}

export default function InsightsPage() {
  const [selectedDays, setSelectedDays] = useState<DateRangeOption>(9999)
  const [customStart, setCustomStart] = useState<string>('')
  const [customEnd, setCustomEnd] = useState<string>('')
  const [selectedComparisonCampaignId, setSelectedComparisonCampaignId] = useState<string | null>(null)
  const [utmData, setUtmData] = useState<UtmRow[]>([])
  const [utmLoading, setUtmLoading] = useState(false)
  const [utmDimension, setUtmDimension] = useState<'campaign' | 'source' | 'medium' | 'content' | 'term'>('campaign')
  const { selectedCampaign, campaigns } = useCampaign()

  const campaignStart = selectedCampaign?.data_inicio ?? undefined
  const campaignEnd   = selectedCampaign?.data_fim   ?? undefined

  // Derive startDate/endDate based on selectedDays mode
  const startDate = selectedDays === 'custom'
    ? (customStart || undefined)
    : selectedDays === 9999 ? campaignStart : undefined
  const endDate = selectedDays === 'custom'
    ? (customEnd || undefined)
    : selectedDays === 9999 ? campaignEnd : undefined

  const { data: metrics, isLoading, refresh, isRealTimeEnabled, toggleRealTime } = useRealTimeMetrics(
    selectedDays,
    startDate,
    endDate,
    selectedCampaign?.utm_campaign ?? undefined,
    selectedCampaign?.ac_tag_id ?? undefined,
    selectedCampaign?.sendflow_campaign_id ?? undefined
  )

  // Fetch UTM quality analysis
  useEffect(() => {
    async function fetchUtm() {
      setUtmLoading(true)
      try {
        const params = new URLSearchParams()
        if (startDate) params.set('startDate', startDate)
        if (endDate) params.set('endDate', endDate)
        if (selectedCampaign?.utm_campaign) params.set('utmCampaignFilter', selectedCampaign.utm_campaign)
        params.set('dimension', utmDimension)
        const res = await fetch(`/api/utm-analysis?${params}`)
        const json = await res.json()
        setUtmData(json.data || [])
      } catch {
        setUtmData([])
      } finally {
        setUtmLoading(false)
      }
    }
    fetchUtm()
  }, [startDate, endDate, selectedCampaign?.utm_campaign, utmDimension])

  // Get comparison campaign data
  const comparisonCampaign = selectedComparisonCampaignId
    ? campaigns.find(c => c.id === selectedComparisonCampaignId)
    : null

  const comparisonStart = comparisonCampaign?.data_inicio ?? undefined
  const comparisonEnd = comparisonCampaign?.data_fim ?? undefined

  const { data: comparisonMetrics, isLoading: comparisonIsLoading } = useRealTimeMetrics(
    selectedDays,
    selectedDays === 9999 ? comparisonStart : undefined,
    selectedDays === 9999 ? comparisonEnd : undefined,
    comparisonCampaign?.utm_campaign ?? undefined,
    comparisonCampaign?.ac_tag_id ?? undefined,
    comparisonCampaign?.sendflow_campaign_id ?? undefined
  )

  const { setControls } = useSidebarControls()

  // Reset date filter when campaign changes
  useEffect(() => {
    setSelectedDays(9999)
    setCustomStart('')
    setCustomEnd('')
  }, [selectedCampaign?.id])

  // Calcula o número real de dias desde o primeiro lead
  const calcularDiasReais = (): number => {
    if (!metrics?.evolucaoTemporal || metrics.evolucaoTemporal.length === 0) {
      return typeof selectedDays === 'number' ? selectedDays : 0
    }
    
    const primeiraData = new Date(metrics.evolucaoTemporal[0].data)
    const hoje = new Date()
    const diferencaMilissegundos = hoje.getTime() - primeiraData.getTime()
    const diferencaDias = Math.ceil(diferencaMilissegundos / (1000 * 60 * 60 * 24))
    
    return diferencaDias
  }

  const diasReais = (selectedDays === 'custom' || (typeof selectedDays === 'number' && selectedDays >= 9999))
    ? calcularDiasReais()
    : (selectedDays as number)

  // Calculate average score from daily evolution
  const calculateAverageScore = (data: Array<{ data: string; avgScore: number }> | undefined): number => {
    if (!data || data.length === 0) return 0
    const validScores = data.filter(d => d.avgScore > 0).map(d => d.avgScore)
    if (validScores.length === 0) return 0
    return validScores.reduce((a, b) => a + b, 0) / validScores.length
  }

  const avgScoreFromEvolution = calculateAverageScore(metrics?.evolucaoScore)
  const comparisonAvgScoreFromEvolution = calculateAverageScore(comparisonMetrics?.evolucaoScore)

  // Set sidebar controls
  useEffect(() => {
    setControls(
      <DashboardControls
        selectedDays={selectedDays}
        onDaysChange={setSelectedDays}
        isRealTimeEnabled={isRealTimeEnabled}
        onToggleRealTime={toggleRealTime}
        onRefresh={refresh}
        campaignStart={campaignStart}
        campaignEnd={campaignEnd}
        customStart={customStart}
        customEnd={customEnd}
        onCustomDatesChange={(s, e) => { setCustomStart(s); setCustomEnd(e) }}
      />
    )

    return () => setControls(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, isRealTimeEnabled, customStart, customEnd, campaignStart, campaignEnd])

  return (
    <div className="w-full min-h-screen transition-all duration-500">
      <div className="p-8 space-y-8">
        {/* Advanced Animated Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <Card className="shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-indigo-500 to-indigo-600">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">Total de Leads</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">
                      {isLoading ? '...' : (metrics?.totalLeads || 0).toLocaleString('pt-BR')}
                    </p>
                    {selectedCampaign && (
                      <p className="text-sm text-white/70 text-right">
                        {isLoading ? '...' : `${((metrics?.totalLeads || 0) / (selectedCampaign?.meta_leads ?? 10000) * 100).toFixed(1)}% da meta`}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
          >
            <Card className="shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-purple-500 to-purple-600">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-white/80">Diagnósticos Finalizados</p>
                  <div className="flex items-end justify-between">
                    <p className="text-3xl font-bold text-white">
                      {isLoading ? '...' : (metrics?.totalDiagnosticos || 0).toLocaleString('pt-BR')}
                    </p>
                    <p className="text-sm text-white/70 text-right">
                      {isLoading ? '...' : `${((metrics?.totalDiagnosticos || 0) / (metrics?.totalLeads || 1) * 100).toFixed(1)}% do total de leads`}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {(selectedDays === 30 || selectedDays === 'custom' || (typeof selectedDays === 'number' && selectedDays >= 9999)) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
            >
              <Card className="shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-green-500 to-emerald-600">
                <CardContent className="p-6 relative">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm font-medium text-white/80">Leads nos Grupos</p>
                    <div className="flex items-end justify-between">
                      <p className="text-3xl font-bold text-white">
                        {isLoading ? '...' : `${(metrics?.funil?.conversoes?.conversao_geral ? parseFloat(metrics.funil.conversoes.conversao_geral) : 0).toFixed(1)}%`}
                      </p>
                      <p className="text-sm text-white/70 text-right">
                        {isLoading ? '...' : `${(metrics?.funil?.etapas?.grupos_whatsapp || 0).toLocaleString('pt-BR')} em grupos`}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

        </div>

        {/* Interactive Timeline Chart - Evolução Temporal */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              {isLoading || !metrics?.evolucaoTemporal ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-2">
                      <div className="h-6 w-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-4 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        Carregando dados...
                      </span>
                    </div>
                  </div>
                  <div className="h-64 bg-gray-100 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <div className="mx-auto h-12 w-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Processando evolução temporal...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <InteractiveLineChart
                  data={metrics.evolucaoTemporal}
                  title={`📈 Evolução Temporal - ${diasReais} dias`}
                  color="#8b5cf6"
                  gradient={true}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== QUALIDADE DA CAPTAÇÃO ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.32 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    📊 Qualidade da Captação
                  </CardTitle>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Indicadores para avaliar a qualidade dos leads gerados</p>
                </div>
              </div>
              {selectedComparisonCampaignId && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <CampaignComparisonSelector
                    selectedComparison={selectedComparisonCampaignId}
                    onComparisonChange={setSelectedComparisonCampaignId}
                  />
                </div>
              )}
              {!selectedComparisonCampaignId && (
                <div className="mt-3">
                  <CampaignComparisonSelector
                    selectedComparison={selectedComparisonCampaignId}
                    onComparisonChange={setSelectedComparisonCampaignId}
                  />
                </div>
              )}
            </CardHeader>
            <CardContent className="space-y-6">

              {/* KPI Cards - Normal or Comparison Mode */}
              {!selectedComparisonCampaignId ? (
                // Normal view: 3 KPI Cards
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Score Médio */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 rounded-xl p-4 text-center border border-amber-100 dark:border-amber-800/30">
                    <p className="text-xs font-medium text-amber-600 dark:text-amber-400 mb-2 uppercase tracking-wide">Score Médio</p>
                    <p className="text-3xl font-bold text-amber-700 dark:text-amber-300">
                      {isLoading ? '...' : avgScoreFromEvolution.toFixed(1)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">escala 0–100</p>
                  </div>

                  {/* Taxa de VIPs */}
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-xl p-4 text-center border border-cyan-100 dark:border-cyan-800/30">
                    <p className="text-xs font-medium text-cyan-600 dark:text-cyan-400 mb-2 uppercase tracking-wide">Taxa de VIPs</p>
                    <p className="text-3xl font-bold text-cyan-700 dark:text-cyan-300">
                      {isLoading ? '...' : `${((metrics?.hotVips || 0) / Math.max(metrics?.totalDiagnosticos || 1, 1) * 100).toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isLoading ? '...' : `${(metrics?.hotVips || 0).toLocaleString('pt-BR')} leads de alta qualidade`}
                    </p>
                  </div>

                  {/* Leads Críticos Q1 */}
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 text-center border border-red-100 dark:border-red-800/30">
                    <p className="text-xs font-medium text-red-600 dark:text-red-400 mb-2 uppercase tracking-wide">Leads Críticos (Q1)</p>
                    <p className="text-3xl font-bold text-red-700 dark:text-red-300">
                      {isLoading ? '...' : `${(metrics?.quadrants?.find((q: ExternalQuadrant) => q.id === 1)?.percentage || 0).toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {isLoading ? '...' : `${(metrics?.quadrants?.find((q: ExternalQuadrant) => q.id === 1)?.count || 0).toLocaleString('pt-BR')} leads críticos`}
                    </p>
                  </div>
                </div>
              ) : (
                // Comparison view
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
                    {selectedCampaign?.nome} vs {comparisonCampaign?.nome}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Score Médio Comparison */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Score Médio</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{selectedCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {isLoading ? '...' : avgScoreFromEvolution.toFixed(1)}
                          </p>
                        </div>
                        <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mx-3" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{comparisonCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                            {comparisonIsLoading ? '...' : comparisonAvgScoreFromEvolution.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Taxa VIP Comparison */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Taxa de VIPs</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{selectedCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {isLoading ? '...' : `${((metrics?.hotVips || 0) / Math.max(metrics?.totalDiagnosticos || 1, 1) * 100).toFixed(1)}%`}
                          </p>
                        </div>
                        <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mx-3" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{comparisonCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">
                            {comparisonIsLoading ? '...' : `${((comparisonMetrics?.hotVips || 0) / Math.max(comparisonMetrics?.totalDiagnosticos || 1, 1) * 100).toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Leads Críticos Q1 Comparison */}
                    <div className="bg-gray-50 dark:bg-gray-900/30 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-3 uppercase tracking-wide">Leads Críticos (Q1)</p>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{selectedCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {isLoading ? '...' : `${(metrics?.quadrants?.find((q: ExternalQuadrant) => q.id === 1)?.percentage || 0).toFixed(1)}%`}
                          </p>
                        </div>
                        <div className="w-px h-12 bg-gray-300 dark:bg-gray-600 mx-3" />
                        <div className="flex-1 text-right">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{comparisonCampaign?.nome}</p>
                          <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                            {comparisonIsLoading ? '...' : `${(comparisonMetrics?.quadrants?.find((q: ExternalQuadrant) => q.id === 1)?.percentage || 0).toFixed(1)}%`}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Score Evolution Chart */}
              {!isLoading && metrics?.evolucaoScore && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <ScoreEvolutionChart data={metrics.evolucaoScore} />
                </div>
              )}

              {/* Elemento × Qualidade Table */}
              {!isLoading && metrics?.elementoQualidade && metrics.elementoQualidade.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-700 pt-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Elemento × Qualidade</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Elemento</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Leads</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Score Médio</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">% VIP</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">VIPs</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.elementoQualidade.map((el) => {
                          const config: Record<string, { emoji: string; color: string }> = {
                            'RIM': { emoji: '🌊', color: 'text-cyan-600 dark:text-cyan-400' },
                            'FÍGADO': { emoji: '🌳', color: 'text-green-600 dark:text-green-400' },
                            'BAÇO': { emoji: '🌍', color: 'text-amber-600 dark:text-amber-400' },
                            'CORAÇÃO': { emoji: '❤️', color: 'text-red-600 dark:text-red-400' },
                            'PULMÃO': { emoji: '💨', color: 'text-slate-500 dark:text-slate-400' },
                          }
                          const { emoji, color } = config[el.elemento] ?? { emoji: '⭐', color: 'text-gray-600 dark:text-gray-400' }
                          return (
                            <tr key={el.elemento} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <td className={`py-3 px-3 font-medium ${color}`}>
                                {emoji} {el.elemento}
                              </td>
                              <td className="text-right py-3 px-3 text-gray-700 dark:text-gray-300">
                                {el.count.toLocaleString('pt-BR')}
                              </td>
                              <td className="text-right py-3 px-3">
                                <span className={`font-bold ${el.avgScore >= 70 ? 'text-green-600 dark:text-green-400' : el.avgScore >= 50 ? 'text-amber-600 dark:text-amber-400' : 'text-red-600 dark:text-red-400'}`}>
                                  {el.avgScore.toFixed(1)}
                                </span>
                              </td>
                              <td className="text-right py-3 px-3">
                                <span className={`font-medium ${el.vipRate >= 10 ? 'text-green-600 dark:text-green-400' : el.vipRate >= 5 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                                  {el.vipRate.toFixed(1)}%
                                </span>
                              </td>
                              <td className="text-right py-3 px-3 text-gray-500 dark:text-gray-400">
                                {el.vipCount}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </motion.div>

        {/* Funil de Conversão Completo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="hidden"
        >
          <Card className="shadow-2xl border-4 border-indigo-500 dark:border-indigo-400 bg-gray-50/50 dark:bg-gray-900/50">
            <CardHeader>
              <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Target className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                Funil de Conversão
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !metrics?.funil ? (
                <div className="space-y-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                  ))}
                </div>
              ) : (
                <ConversionFunnel data={metrics.funil} hideWhatsApp={selectedDays !== 30 && selectedDays !== 'custom' && (typeof selectedDays === 'number' && selectedDays < 9999)} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Advanced Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white">
                🎯 Leads por Prioridade
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading || !metrics?.priorities ? (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {(() => {
                    const totalLeads = metrics?.totalDiagnosticos || 1;
                    type PriorityItem = { priority: string; count: number }
                    return [
                      { label: 'Alta', value: metrics?.priorities?.find((p: PriorityItem) => p.priority === 'ALTA')?.count || 0, color: 'from-red-500 to-red-600', textColor: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
                      { label: 'Média', value: metrics?.priorities?.find((p: PriorityItem) => p.priority === 'MEDIA')?.count || 0, color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
                      { label: 'Baixa', value: metrics?.priorities?.find((p: PriorityItem) => p.priority === 'BAIXA')?.count || 0, color: 'from-green-500 to-green-600', textColor: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' }
                    ].map((item, index) => {
                      const percentage = ((item.value / totalLeads) * 100).toFixed(1);
                      return (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: 0.5 + index * 0.1, duration: 0.4 }}
                          whileHover={{ scale: 1.05, y: -5 }}
                          onClick={() => window.location.href = `/leads?prioridade=${item.label.toUpperCase()}`}
                          className={`${item.bgColor} p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:shadow-lg hover:ring-2 hover:ring-offset-2 hover:ring-indigo-500`}
                          title={`Clique para ver os ${item.value} leads de prioridade ${item.label}`}
                        >
                          <div className={`text-sm font-medium mb-3 ${item.textColor} dark:text-white`}>
                            {item.label}
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6 + index * 0.1, duration: 0.5, type: "spring" }}
                            className={`text-4xl font-bold ${item.textColor} dark:text-white mb-1`}
                          >
                            {item.value}
                          </motion.div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                            leads
                          </div>
                          <div className={`text-sm font-semibold ${item.textColor} dark:text-white`}>
                            {percentage}%
                          </div>
                        </motion.div>
                      );
                    });
                  })()}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Urgency x Intensity Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                🧭 Matriz Urgência × Intensidade
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Distribuição de leads por quadrante (Q1..Q4)</p>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 justify-center py-4">
                    <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Carregando matriz de urgência...
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {[...Array(4)].map((_, i) => (
                      <div key={i} className="h-32 bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
                    ))}
                  </div>
                </div>
              ) : (
                <UrgencyMatrixFull
                  externalData={metrics?.quadrants as ExternalQuadrant[] | undefined}
                  externalTotal={metrics?.totalDiagnosticos}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* ===== QUALIDADE POR UTM ===== */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div>
                  <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                    📊 Qualidade por UTM
                  </CardTitle>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    Score médio, VIPs e leads críticos por origem — rankeados por qualidade
                  </p>
                </div>
                {/* Dimension selector */}
                <div className="flex flex-wrap gap-1">
                  {(['campaign', 'source', 'medium', 'content', 'term'] as const).map(dim => (
                    <button
                      key={dim}
                      onClick={() => setUtmDimension(dim)}
                      className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${
                        utmDimension === dim
                          ? 'bg-indigo-600 text-white border-indigo-600'
                          : 'bg-transparent text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:border-indigo-400 hover:text-indigo-500'
                      }`}
                    >
                      {dim.charAt(0).toUpperCase() + dim.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {utmLoading ? (
                <div className="flex items-center gap-2 py-8 justify-center">
                  <RefreshCw className="h-5 w-5 text-indigo-500 animate-spin" />
                  <span className="text-sm text-gray-500 dark:text-gray-400">Carregando análise UTM...</span>
                </div>
              ) : utmData.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                  Nenhum dado UTM encontrado para o período selecionado.
                </p>
              ) : (
                <div className="space-y-8">
                  {/* Tabela rankeada */}
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 dark:border-gray-700">
                          <th className="text-left py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">#</th>
                          <th className="text-left py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">UTM {utmDimension.charAt(0).toUpperCase() + utmDimension.slice(1)}</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Leads</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Score Médio</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">VIPs</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Q1 (Críticos)</th>
                          <th className="text-right py-2 px-3 text-xs text-gray-500 dark:text-gray-400 font-medium">Prioridade ALTA</th>
                        </tr>
                      </thead>
                      <tbody>
                        {utmData.map((row, i) => (
                          <tr
                            key={row.utmValue}
                            className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors"
                          >
                            <td className="py-2 px-3 text-xs text-gray-400">{i + 1}</td>
                            <td className="py-2 px-3 font-medium text-gray-900 dark:text-white max-w-[200px] truncate">
                              {row.utmValue}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                              {row.count.toLocaleString('pt-BR')}
                            </td>
                            <td className={`py-2 px-3 text-right font-bold ${utmScoreTextClass(row.avgScore)}`}>
                              {row.avgScore.toFixed(1)}
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                              {row.vipRate.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                              {row.q1Rate.toFixed(1)}%
                            </td>
                            <td className="py-2 px-3 text-right text-gray-700 dark:text-gray-300">
                              {row.altaRate.toFixed(1)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Gráfico horizontal: Score Médio por UTM */}
                  {utmData.length > 1 && (
                    <div className="border-t border-gray-100 dark:border-gray-700 pt-6">
                      <InteractiveHorizontalBarChart
                        title={`Score Médio por UTM ${utmDimension.charAt(0).toUpperCase() + utmDimension.slice(1)}`}
                        subtitle={`${utmData.length} origens distintas`}
                        data={utmData.slice(0, 20).map(row => ({
                          name: row.utmValue,
                          value: row.avgScore,
                          percentage: row.avgScore, // reutiliza como label
                          color: utmScoreColor(row.avgScore),
                        }))}
                        totalLeads={100} // escala 0-100 para score
                      />
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

      </div>
    </div>
  )
}
