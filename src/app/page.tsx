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
import { DashboardControls } from '@/components/ui/dashboard-controls'
import { InteractiveLineChart } from '@/components/charts/interactive-line-chart'
import { InteractiveHorizontalBarChart } from '@/components/charts/interactive-horizontal-bar-chart'
import { ConversionFunnel } from '@/components/charts/conversion-funnel'
import UrgencyMatrixFull from '@/components/ui/urgency-matrix-full'
import { DateRangeOption } from '@/components/ui/date-range-filter'

export default function HomePage() {
  const [selectedDays, setSelectedDays] = useState<DateRangeOption>(9999)
  const { data: metrics, isLoading, refresh, isRealTimeEnabled, toggleRealTime } = useRealTimeMetrics(selectedDays)
  const { setControls } = useSidebarControls()

  // Calcula o número real de dias desde o primeiro lead
  const calcularDiasReais = () => {
    if (!metrics?.evolucaoTemporal || metrics.evolucaoTemporal.length === 0) {
      return selectedDays
    }
    
    const primeiraData = new Date(metrics.evolucaoTemporal[0].data)
    const hoje = new Date()
    const diferencaMilissegundos = hoje.getTime() - primeiraData.getTime()
    const diferencaDias = Math.ceil(diferencaMilissegundos / (1000 * 60 * 60 * 24))
    
    return diferencaDias
  }

  const diasReais = selectedDays >= 9999 ? calcularDiasReais() : selectedDays

  // Set sidebar controls
  useEffect(() => {
    setControls(
      <DashboardControls
        selectedDays={selectedDays}
        onDaysChange={setSelectedDays}
        isRealTimeEnabled={isRealTimeEnabled}
        onToggleRealTime={toggleRealTime}
        onRefresh={refresh}
      />
    )
    
    return () => setControls(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDays, isRealTimeEnabled])

  return (
    <div className="w-full min-h-screen transition-all duration-500">
      <div className="p-8 space-y-8">
        {/* Advanced Animated Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Total de Leads</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : (metrics?.totalLeads || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-white/70">Total geral (ActiveCampaign)</p>
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
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Diagnósticos Finalizados</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : (metrics?.totalDiagnosticos || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-white/70">Quiz completado</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            onClick={() => window.location.href = '/leads?vip=true'}
            className="cursor-pointer"
          >
            <Card className="shadow-xl border-0 overflow-hidden group hover:shadow-2xl transition-all duration-300 bg-gradient-to-br from-cyan-500 to-blue-600">
              <CardContent className="p-6 relative">
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="w-3 h-3 rounded-full bg-white/40 animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-white/80">Leads VIP</p>
                  <p className="text-3xl font-bold text-white">
                    {isLoading ? '...' : (metrics?.hotVips || 0).toLocaleString('pt-BR')}
                  </p>
                  <p className="text-xs text-white/70">Score alto</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {(selectedDays === 30 || selectedDays >= 9999) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.25 }}
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
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-white/80">Conversão Grupos</p>
                    <p className="text-3xl font-bold text-white">
                      {isLoading ? '...' : `${(metrics?.funil?.conversoes?.conversao_geral ? parseFloat(metrics.funil.conversoes.conversao_geral) : 0).toFixed(1)}%`}
                    </p>
                    <p className="text-xs text-white/70">Grupos Whatsapp (SendFlow)</p>
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

        {/* Funil de Conversão Completo */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
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
                <ConversionFunnel data={metrics.funil} hideWhatsApp={selectedDays !== 30 && selectedDays < 9999} />
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
                <UrgencyMatrixFull refreshKey={selectedDays} />
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Status no Funil - Horizontal Bar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              {isLoading || !metrics?.whatsappDistribution ? (
                <div className="space-y-4">
                  <div className="h-6 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                  <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="h-8 flex-1 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" style={{ width: `${100 - i * 15}%` }} />
                        <div className="h-6 w-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <InteractiveHorizontalBarChart
                  title="📱 Status no Funil"
                  subtitle="Distribuição completa de todos os status"
                  data={
                  metrics.whatsappDistribution?.map((item) => {
                    // Mapear status para nomes legíveis e cores.
                    const normalize = (s: string) =>
                      String(s || '')
                        .trim()
                        .toUpperCase()
                        .normalize('NFD')
                        .replace(/\p{Diacritic}/gu, '')

                    const key = normalize(item.status)

                    const statusMap: Record<string, { name: string; color: string }> = {
                      'RESULTADOS_ENVIADOS': { name: 'Resultado Enviado', color: '#10b981' },
                      'RESULTADOSENVIADOS': { name: 'Resultado Enviado', color: '#10b981' },
                      'SENT': { name: 'Enviado', color: '#059669' },
                      'DESAFIO_ENVIADO': { name: 'Desafio Enviado', color: '#34d399' },
                      'DESAFIOENVIADO': { name: 'Desafio Enviado', color: '#34d399' },
                      'PENDING': { name: 'Pendente', color: '#f59e0b' },
                      'ERROR': { name: 'Erro', color: '#ef4444' },
                      'FAILED': { name: 'Falhou', color: '#dc2626' },
                      'DIAGNOSTICO_FINALIZADO': { name: 'Diagnóstico Finalizado', color: '#8b5cf6' },
                      'DIAGNOSTICOFINALIZADO': { name: 'Diagnóstico Finalizado', color: '#8b5cf6' },
                      'DIAGNOSTICO_ENVIADO': { name: 'Diagnóstico Enviado', color: '#7c3aed' },
                      'DIAGNOSTICOENVIADO': { name: 'Diagnóstico Enviado', color: '#7c3aed' },
                      'AGUARDANDO_CONTATO': { name: 'Aguardando Contato', color: '#6366f1' },
                      'AGUARDANDOCONTATO': { name: 'Aguardando Contato', color: '#6366f1' },
                    }

                    const mapped = statusMap[key] || { name: item.status, color: '#8b5cf6' }

                    return {
                      name: mapped.name,
                      value: item.count,
                      percentage: item.percentage,
                      color: mapped.color
                    }
                  }) || []}
                  totalLeads={metrics?.totalLeads}
                />
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
