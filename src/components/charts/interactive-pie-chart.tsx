'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { motion } from 'framer-motion'
import { useState } from 'react'

interface InteractivePieChartProps {
  data: Array<{ name: string; value: number; color: string }>
  title: string
  centerMetric?: { label: string; value: string | number }
}

export function InteractivePieChart({ data, title, centerMetric }: InteractivePieChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)
  const CustomTooltip = null
  // Declare tooltip and label components at module level (below) to avoid creating components during render

  const onPieEnter = (_: unknown, index: number) => {
    setActiveIndex(index)
  }

  const onPieLeave = () => {
    setActiveIndex(null)
  }

  // Calculate total for percentages
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const enrichedData = data.map(item => ({ ...item, total }))

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
    >
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
      </div>
      
      <div className="relative">
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={enrichedData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={PieCustomLabel}
              outerRadius={100}
              innerRadius={60}
              fill="#8884d8"
              dataKey="value"
              onMouseEnter={onPieEnter}
              onMouseLeave={onPieLeave}
              animationBegin={0}
              animationDuration={800}
            >
              {enrichedData.map((entry, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={entry.color}
                  stroke={activeIndex === index ? '#fff' : 'none'}
                  strokeWidth={activeIndex === index ? 3 : 0}
                  style={{
                    filter: activeIndex === index ? 'brightness(1.1)' : 'none',
                    transform: activeIndex === index ? 'scale(1.05)' : 'scale(1)',
                    transformOrigin: 'center',
                    transition: 'all 0.2s ease-in-out'
                  }}
                />
              ))}
            </Pie>
            <Tooltip content={<PieCustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center metric */}
        {centerMetric && (
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.3 }}
            className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none"
          >
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {centerMetric.value}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {centerMetric.label}
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Legend */}
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((item, index) => (
          <motion.div
            key={item.name}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="flex items-center gap-2"
          >
            <div 
              className="w-3 h-3 rounded-full flex-shrink-0" 
              style={{ backgroundColor: item.color }}
            ></div>
            <span className="text-lg text-white truncate">
              {item.name}
            </span>
            <span className="text-lg font-medium text-white ml-auto">
              {item.value}
            </span>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}

// Module-level tooltip and label to avoid creating components during render
function PieCustomTooltip(props: unknown) {
  if (typeof props !== 'object' || props === null) return null
  const p = props as { active?: boolean; payload?: unknown[] }
  const { active, payload } = p
  if (active && Array.isArray(payload) && payload.length) {
    const first = payload[0] as { payload?: Record<string, unknown> }
    const data = first.payload || {}
    const value = typeof data.value === 'number' ? data.value : (typeof data.value === 'string' ? Number(data.value) : 0)
    const total = typeof data.total === 'number' ? data.total : (typeof data.total === 'string' ? Number(data.total) : 0)
    const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0'
    const name = typeof data.name === 'string' ? data.name : ''
    const color = typeof data.color === 'string' ? data.color : '#000'
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border"
      >
        <div className="flex items-center gap-2 mb-2">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: color }}
          ></div>
          <p className="font-medium text-gray-900 dark:text-white">{name}</p>
        </div>
        <p className="text-2xl font-bold text-gray-900 dark:text-white">
          {value.toLocaleString ? value.toLocaleString('pt-BR') : String(value)}
        </p>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {percentage}% do total
        </p>
      </motion.div>
    )
  }
  return null
}

function PieCustomLabel(props: Record<string, unknown>) {
  const cx = typeof props.cx === 'number' ? props.cx : 0
  const cy = typeof props.cy === 'number' ? props.cy : 0
  const midAngle = typeof props.midAngle === 'number' ? props.midAngle : 0
  const innerRadius = typeof props.innerRadius === 'number' ? props.innerRadius : 0
  const outerRadius = typeof props.outerRadius === 'number' ? props.outerRadius : 0
  const percent = typeof props.percent === 'number' ? props.percent : 0
  
  if (percent < 0.05) return null // Don't show label for slices < 5%
  const RADIAN = Math.PI / 180
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5
  const x = cx + radius * Math.cos(-midAngle * RADIAN)
  const y = cy + radius * Math.sin(-midAngle * RADIAN)
  return (
    <text 
      x={x} 
      y={y} 
      fill="white" 
      textAnchor={x > cx ? 'start' : 'end'} 
      dominantBaseline="central"
      fontSize={14}
      fontWeight="bold"
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  )
}