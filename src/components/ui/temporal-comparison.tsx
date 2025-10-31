"use client"

import { motion } from "framer-motion"
import { TrendingUp, TrendingDown, Minus } from "lucide-react"

interface TemporalComparisonProps {
  currentValue: number
  previousValue: number
  label: string
  format?: 'number' | 'percentage'
}

export function TemporalComparison({ 
  currentValue, 
  previousValue, 
  label,
  format = 'number'
}: TemporalComparisonProps) {
  const diff = currentValue - previousValue
  const percentChange = previousValue > 0 
    ? ((diff / previousValue) * 100).toFixed(1)
    : '0'
  
  const isPositive = diff > 0
  const isNeutral = diff === 0
  
  const formatValue = (val: number) => {
    if (format === 'percentage') {
      return `${val.toFixed(1)}%`
    }
    return val.toLocaleString('pt-BR')
  }

  return (
    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex-1">
        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</div>
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900 dark:text-white">
            {formatValue(currentValue)}
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            (anterior: {formatValue(previousValue)})
          </span>
        </div>
      </div>
      
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
        className={`flex items-center space-x-1 px-3 py-2 rounded-full ${
          isNeutral
            ? 'bg-gray-200 dark:bg-gray-700'
            : isPositive
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        }`}
      >
        {isNeutral ? (
          <Minus className="h-4 w-4 text-gray-600 dark:text-gray-400" />
        ) : isPositive ? (
          <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
        ) : (
          <TrendingDown className="h-4 w-4 text-red-600 dark:text-red-400" />
        )}
        <span className={`text-sm font-bold ${
          isNeutral
            ? 'text-gray-600 dark:text-gray-400'
            : isPositive
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {isPositive ? '+' : ''}{percentChange}%
        </span>
      </motion.div>
    </div>
  )
}
