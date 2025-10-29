'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'

interface BarData {
  name: string
  value: number
  percentage: number
  color: string
}

interface InteractiveBarChartProps {
  data: BarData[]
  title: string
  subtitle?: string
  totalLeads?: number
  showPercentage?: boolean
}

// Module-level tooltip and label to avoid creating components during render
function BarCustomTooltip(props: unknown) {
  if (typeof props !== 'object' || props === null) return null
  const p = props as { active?: boolean; payload?: unknown[]; displayedTotal?: number }
  const { active, payload, displayedTotal } = p
  if (active && Array.isArray(payload) && payload.length) {
    const first = payload[0] as { payload?: Record<string, unknown> }
    const data = first.payload || {}
    const name = typeof data.name === 'string' ? data.name : ''
    const value = typeof data.value === 'number' ? data.value : (typeof data.value === 'string' ? Number(data.value) : 0)
    const percentage = typeof data.percentage === 'number' ? data.percentage : undefined
    const percent = typeof percentage === 'number' ? percentage : (displayedTotal && displayedTotal > 0 ? (value / displayedTotal * 100) : 0)

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: typeof data.color === 'string' ? data.color : '#000' }}
          ></div>
          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString ? value.toLocaleString('pt-BR') : String(value)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {percent.toFixed(1)}% do total
        </p>
      </motion.div>
    )
  }
  return null
}

function BarCustomLabel(props: { x: number; y: number; width: number; value: number; index: number; data: BarData[]; displayedTotal: number; showPercentage: boolean }) {
  const { x, y, width, index, data, displayedTotal, showPercentage } = props
  const item = data[index]
  const percent = typeof item.percentage === 'number'
    ? item.percentage
    : (displayedTotal > 0 ? (item.value / displayedTotal * 100) : 0)
  return (
    <g>
      <text 
        x={x + width / 2} 
        y={y - 5} 
        fill={item.color}
        textAnchor="middle"
        fontSize={12}
        fontWeight="bold"
      >
        {showPercentage ? `${percent.toFixed(1)}%` : String(item.value)}
      </text>
    </g>
  )
}

export function InteractiveBarChart({ 
  data, 
  title, 
  subtitle,
  totalLeads,
  showPercentage = true 
}: InteractiveBarChartProps) {
  const sumValues = data.reduce((sum, item) => sum + item.value, 0)
  const displayedTotal = typeof totalLeads === 'number' ? totalLeads : sumValues

  

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        )}
        <div className="mt-2 flex items-center gap-2 text-sm">
          <span className="font-medium text-gray-700 dark:text-gray-300">
            Total: {displayedTotal.toLocaleString('pt-BR')} leads
          </span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '350px' }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart 
            data={data} 
            margin={{ top: 30, right: 30, left: 10, bottom: 80 }}
          >
            <CartesianGrid 
              strokeDasharray="3 3" 
              stroke="#e5e7eb" 
              horizontal={true}
              vertical={false}
            />
            
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: '#ffffff' }}
              angle={-45}
              textAnchor="end"
              height={100}
            />
            
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 14, fill: '#ffffff' }}
              width={70}
            />
            
            <Tooltip content={<BarCustomTooltip displayedTotal={displayedTotal} />} cursor={{ fill: 'rgba(99, 102, 241, 0.1)' }} />
            
            <Bar 
              dataKey="value" 
              radius={[8, 8, 0, 0]}
              label={<BarCustomLabel data={data} displayedTotal={displayedTotal} showPercentage={showPercentage} />}
            >
              {data.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  style={{
                    filter: 'drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))',
                  }}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Legend */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        {data.map((item, index) => {
          const percent = typeof item.percentage === 'number'
            ? item.percentage
            : (displayedTotal > 0 ? (item.value / displayedTotal * 100) : 0)
          return (
            <motion.div
              key={item.name}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors"
            >
              <div 
                className="w-4 h-4 rounded flex-shrink-0" 
                style={{ backgroundColor: item.color }}
              ></div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-medium text-white truncate">
                  {item.name}
                </p>
                <p className="text-sm text-white/70">
                  {percent.toFixed(1)}%
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold text-gray-900 dark:text-white">
                  {item.value.toLocaleString('pt-BR')}
                </p>
              </div>
            </motion.div>
          )
        })}
      </div>
    </motion.div>
  )
}
