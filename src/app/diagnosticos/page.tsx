"use client"

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { 
  ClipboardCheck,
  TrendingUp
} from 'lucide-react'
import { useRealTimeMetrics } from '@/hooks/use-metrics'
import { useSidebarControls } from '@/contexts/sidebar-controls-context'
import { DashboardControls } from '@/components/ui/dashboard-controls'
import { DateRangeOption } from '@/components/ui/date-range-filter'
import { ELEMENTOS_MTC } from '@/lib/constants'

export default function DiagnosticosPage() {
  const [selectedDays, setSelectedDays] = useState<DateRangeOption>(9999)
  const { data: metrics, isLoading, refresh, isRealTimeEnabled, toggleRealTime } = useRealTimeMetrics(selectedDays)
  const { setControls } = useSidebarControls()

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
    <div className="w-full min-h-screen p-8">
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-3 mb-2">
            <ClipboardCheck className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Visão Geral dos Diagnósticos
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Resultados e análises dos quizzes completados
          </p>
        </motion.div>

        {/* MTC Elements Chart */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔬 Elementos MTC</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribuição por elemento dominante</p>
              </div>
              
              {isLoading || !metrics?.elementos ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full animate-pulse" />
                      <div className="flex-1 h-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                      <div className="h-8 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(ELEMENTOS_MTC).map(([key, elem], index) => {
                    const count = metrics?.elementos?.find((e: { elemento: string; count: number }) => e.elemento === key)?.count || 0;
                    const maxCount = Math.max(...(metrics?.elementos?.map((e: { elemento: string; count: number }) => e.count) || [1]));
                    const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                    return (
                      <motion.div
                        key={key}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 + index * 0.1, duration: 0.3 }}
                        onClick={() => window.location.href = `/leads?elemento=${key}`}
                        className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-all cursor-pointer hover:ring-2 hover:ring-indigo-300 dark:hover:ring-indigo-600"
                        title={`Clique para ver os ${count} leads do elemento ${elem.nome}`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3">
                            <motion.span 
                              whileHover={{ scale: 1.2 }}
                              className="text-2xl"
                            >
                              {elem.emoji}
                            </motion.span>
                            <div>
                              <span className="font-medium text-gray-900 dark:text-white">{elem.nome}</span>
                              <div className="text-xs text-gray-600 dark:text-gray-400">{key}</div>
                            </div>
                          </div>
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.4 + index * 0.1, duration: 0.3 }}
                            className="text-right"
                          >
                            <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              {percentage.toFixed(1)}%
                            </div>
                          </motion.div>
                        </div>
                        
                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${percentage}%` }}
                            transition={{ delay: 0.5 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                            className="h-2 rounded-full transition-all duration-300 group-hover:brightness-110"
                            style={{ backgroundColor: elem.cor }}
                          />
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Insights Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                <span>Insights dos Diagnósticos</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Elemento Dominante
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics?.elementos?.[0]?.elemento || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metrics?.elementos?.[0]?.count || 0} leads identificados
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Prioridade Mais Comum
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics?.priorities?.[0]?.priority || 'N/A'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {metrics?.priorities?.[0]?.count || 0} leads nesta categoria
                  </div>
                </div>

                <div className="bg-white/50 dark:bg-gray-800/50 rounded-lg p-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Taxa VIP
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {metrics?.totalDiagnosticos && metrics?.hotVips 
                      ? ((metrics.hotVips / metrics.totalDiagnosticos) * 100).toFixed(1)
                      : '0'}%
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    Leads com alto potencial
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
