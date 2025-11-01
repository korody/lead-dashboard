"use client"

import { motion } from 'framer-motion'
import { RefreshCw, Zap, ZapOff } from 'lucide-react'
import { DateRangeFilter, DateRangeOption } from './date-range-filter'

interface DashboardControlsProps {
  selectedDays: DateRangeOption
  onDaysChange: (days: DateRangeOption) => void
  isRealTimeEnabled: boolean
  onToggleRealTime: () => void
  onRefresh: () => void
}

export function DashboardControls({
  selectedDays,
  onDaysChange,
  isRealTimeEnabled,
  onToggleRealTime,
  onRefresh
}: DashboardControlsProps) {
  return (
    <div className="space-y-3">
      {/* Filtro de Período - Full Width */}
      <div className="w-full">
        <DateRangeFilter
          selected={selectedDays}
          onChange={onDaysChange}
        />
      </div>

      {/* Botões de Controle */}
      <div className="flex items-stretch gap-2">
        {/* Toggle Tempo Real */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onToggleRealTime}
          className={`flex-1 flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg font-medium transition-all ${
            isRealTimeEnabled
              ? 'bg-green-500 hover:bg-green-600 text-white shadow-lg'
              : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
          }`}
        >
          {isRealTimeEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
          <span>{isRealTimeEnabled ? 'Tempo Real' : 'Manual'}</span>
        </motion.button>

        {/* Botão Atualizar - Apenas Ícone */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onRefresh}
          className="flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2.5 rounded-lg transition-all shadow-lg"
          title="Atualizar dados"
        >
          <RefreshCw className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  )
}
