'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'

interface ScoreEvolutionChartProps {
  data: Array<{ data: string; avgScore: number }>
  title?: string
}

function ScoreTooltip(props: unknown) {
  if (typeof props !== 'object' || props === null) return null
  const p = props as { active?: boolean; payload?: unknown[] }
  const { active, payload } = p
  if (active && Array.isArray(payload) && payload.length) {
    const first = payload[0] as { value?: number; payload?: Record<string, unknown> }
    const value = typeof first.value === 'number' ? first.value : 0
    const originalData = first.payload?.data as string | undefined
    const date = originalData ? new Date(`${originalData}T00:00:00-03:00`) : new Date()
    const dateFormatted = date.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })
    return (
      <div className="bg-white dark:bg-gray-800 p-3 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">{dateFormatted}</p>
        <p className="text-sm font-bold text-amber-600 dark:text-amber-400">Score médio: {value.toFixed(1)}</p>
      </div>
    )
  }
  return null
}

export function ScoreEvolutionChart({ data, title = 'Evolução do Score Médio por Dia' }: ScoreEvolutionChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  const formatDate = (dateStr: string) => {
    const parts = dateStr.split('-')
    if (parts.length === 3) {
      const [, m, d] = parts
      return `${d}/${m}`
    }
    return dateStr
  }

  const enrichedData = data.map(item => ({
    ...item,
    date: formatDate(item.data),
  }))

  const hasData = enrichedData.some(d => d.avgScore > 0)

  if (!isMounted) {
    return <div className="w-full h-[200px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse" />
  }

  if (!hasData) {
    return (
      <div className="w-full h-[200px] flex items-center justify-center text-gray-400 text-sm">
        Sem dados de score para o período selecionado
      </div>
    )
  }

  const scores = enrichedData.filter(d => d.avgScore > 0).map(d => d.avgScore)
  const overallAvg = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      suppressHydrationWarning
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</h3>
        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium bg-amber-50 dark:bg-amber-900/20 px-2 py-1 rounded-full">
          Média geral: {overallAvg}
        </span>
      </div>
      <div style={{ width: '100%', height: '200px' }} suppressHydrationWarning>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={enrichedData} margin={{ top: 5, right: 20, left: 0, bottom: 10 }}>
            <defs>
              <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="1 1" stroke="#e5e7eb" horizontal={true} vertical={false} />
            <XAxis
              dataKey="date"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              height={30}
              interval="preserveStartEnd"
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              width={35}
              domain={[0, 100]}
            />
            <Tooltip content={<ScoreTooltip />} />
            <Area
              type="monotone"
              dataKey="avgScore"
              stroke="#f59e0b"
              strokeWidth={2}
              fill="url(#scoreGradient)"
              dot={false}
              activeDot={{ r: 4, fill: '#f59e0b', stroke: '#fff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
