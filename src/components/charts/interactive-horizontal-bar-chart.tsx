"use client"

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts'
import { motion } from 'framer-motion'

interface BarData {
  name: string
  value: number
  percentage?: number
  color: string
}

interface InteractiveHorizontalBarChartProps {
  data: BarData[]
  title: string
  subtitle?: string
  totalLeads?: number
}

// Tooltip component declared at module level to avoid creating components during render
function HorizontalBarCustomTooltip(props: unknown) {
  if (typeof props !== 'object' || props === null) return null
  const p = props as { active?: boolean; payload?: unknown[]; displayedTotal?: number }
  const { active, payload, displayedTotal } = p
  if (active && Array.isArray(payload) && payload.length) {
    const first = payload[0] as { payload?: Record<string, unknown> }
    const d = first.payload || {}
    const name = typeof d.name === 'string' ? d.name : ''
    const value = typeof d.value === 'number' ? d.value : (typeof d.value === 'string' ? Number(d.value) : 0)
    const percentage = typeof d.percentage === 'number' ? d.percentage : undefined
    const percent = typeof percentage === 'number' ? percentage : (displayedTotal && displayedTotal > 0 ? (value / displayedTotal * 100) : 0)

    return (
      <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-white dark:bg-gray-800 p-3 rounded shadow">
        <div className="font-medium text-gray-900 dark:text-white">{name}</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">{value.toLocaleString ? value.toLocaleString('pt-BR') : String(value)} leads</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{percent.toFixed(1)}% do total</div>
      </motion.div>
    )
  }
  return null
}

export function InteractiveHorizontalBarChart({ data, title, subtitle, totalLeads }: InteractiveHorizontalBarChartProps) {
  const sumValues = data.reduce((s, i) => s + i.value, 0)
  const displayedTotal = typeof totalLeads === 'number' ? totalLeads : sumValues

  // Ensure each entry has a percentage value (fallback to computed from displayedTotal)
  const dataWithPercent: BarData[] = data.map(d => {
    const pct = typeof d.percentage === 'number' ? d.percentage : (displayedTotal > 0 ? (d.value / displayedTotal * 100) : 0)
    return { ...d, percentage: pct }
  })

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="h-full">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>}
        <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">Total: {displayedTotal.toLocaleString('pt-BR')} leads</div>
      </div>

      <div style={{ width: '100%', height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          {/* Reduced left margin and YAxis width to align bars more to the left */}
          <BarChart layout="vertical" data={dataWithPercent} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} stroke="#1f2937" />
            <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#ffffff' }} />
            {/* further reduced YAxis width to push bars left */}
            <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} tick={{ fontSize: 14, fill: '#ffffff' }} />
            <Tooltip content={<HorizontalBarCustomTooltip displayedTotal={displayedTotal} />} />
            <Bar dataKey="value" radius={[8, 8, 8, 8]}>
              {dataWithPercent.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
              {/* show percentage label at the end of each bar */}
              <LabelList dataKey="percentage" position="right" formatter={(v: number) => `${v.toFixed(1)}%`} style={{ fill: '#ffffff', fontSize: 13 }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend removed as per design: only chart is shown */}
    </motion.div>
  )
}
