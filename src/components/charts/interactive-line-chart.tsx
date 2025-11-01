'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useState, useEffect } from 'react'

interface InteractiveLineChartProps {
  data?: Array<{ data: string; leads: number }>
  title: string
  color?: string
  gradient?: boolean
}
// Tooltip declared at module level to satisfy eslint rule about components created during render
function LineChartCustomTooltip(props: unknown) {
  if (typeof props !== 'object' || props === null) return null
  const p = props as { active?: boolean; payload?: unknown[] }
  const { active, payload } = p
  if (active && Array.isArray(payload) && payload.length) {
    const first = payload[0] as { value?: number; payload?: Record<string, unknown> }
    const value = typeof first.value === 'number' ? first.value : (typeof first.value === 'string' ? Number(first.value) : 0)
    const originalData = first.payload?.data as string | undefined
    const date = originalData ? new Date(originalData) : new Date()
    const dateFormatted = date.toLocaleDateString('pt-BR', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    }).replace(/^./, str => str.toUpperCase())
    const previous = first.payload?.previous as number | undefined
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg border"
        suppressHydrationWarning
      >
        <p className="text-sm text-gray-600 dark:text-gray-400" suppressHydrationWarning>{dateFormatted}</p>
        <p className="text-lg font-bold text-gray-900 dark:text-white">
          {value.toLocaleString ? value.toLocaleString('pt-BR') : String(value)} leads
        </p>
        {typeof previous === 'number' && (
          <div className="flex items-center gap-1 mt-1">
            {value > previous ? (
              <TrendingUp className="h-3 w-3 text-green-500" />
            ) : (
              <TrendingDown className="h-3 w-3 text-red-500" />
            )}
            <span className={`text-xs ${
              value > previous ? 'text-green-500' : 'text-red-500'
            }`}>
              {value > previous ? '+' : ''}
              {previous !== 0 ? (((value - previous) / previous) * 100).toFixed(1) : '0.0'}%
            </span>
          </div>
        )}
      </motion.div>
    )
  }
  return null
}

export function InteractiveLineChart({ data, title, color = "#3b82f6", gradient = false }: InteractiveLineChartProps) {
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const timer = setTimeout(() => setIsMounted(true), 0)
    return () => clearTimeout(timer)
  }, [])

  // Generate mock data similar to the image if no data provided
  const generateMockData = () => {
    const mockData = []
    const today = new Date()
    
    // Data pattern similar to the image - high peak around 10/16, then decline
    const pattern = [
      0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, // First 16 days (low)
      230, 220, 40, 150, 140, 100, 90, 40, 30, 80, 70, 50, 30, 10 // Last 14 days with peak
    ]
    
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      mockData.push({
        data: date.toISOString().split('T')[0],
        leads: pattern[29 - i] || 0
      })
    }
    
    return mockData
  }

  // Use provided data or fallback to mock data
  const chartData = data && data.length > 0 ? data : generateMockData()
  
  // Debug logs
  console.log('InteractiveLineChart - Received data:', data)
  console.log('InteractiveLineChart - Using chartData:', chartData)

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' })
  }

  // use module-level LineChartCustomTooltip instead of inline component

  // Add previous day data for trend calculation
  const enrichedData = chartData.map((item, index) => ({
    ...item,
    date: formatDate(item.data),
    previous: index > 0 ? chartData[index - 1].leads : null
  }))

  const ChartComponent = gradient ? AreaChart : LineChart

  if (!isMounted) {
    return (
      <div className="h-full">
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-3 h-3 rounded-full animate-pulse" style={{ backgroundColor: color }}></div>
            <span>Carregando...</span>
          </div>
        </div>
        <div className="w-full h-[300px] bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse"></div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="h-full"
      suppressHydrationWarning
    >
      <div className="mb-4" suppressHydrationWarning>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white" suppressHydrationWarning>{title}</h3>
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400" suppressHydrationWarning>
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
          <span suppressHydrationWarning>Total: {chartData.reduce((sum, item) => sum + item.leads, 0).toLocaleString('pt-BR')} leads</span>
        </div>
      </div>
      
      <div style={{ width: '100%', height: '300px' }} suppressHydrationWarning>
        <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={enrichedData} margin={{ top: 10, right: 30, left: 10, bottom: 20 }}>
          <defs>
            <linearGradient id="evolutionGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity={0.4}/>
              <stop offset="50%" stopColor="#8b5cf6" stopOpacity={0.2}/>
              <stop offset="100%" stopColor="#a855f7" stopOpacity={0.05}/>
            </linearGradient>
          </defs>
          
          <CartesianGrid 
            strokeDasharray="1 1" 
            stroke="#e5e7eb" 
            horizontal={true}
            vertical={false}
          />
          
          <XAxis 
            dataKey="date" 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 13, fill: '#ffffff' }}
            height={40}
            interval="preserveStartEnd"
          />
          
          <YAxis 
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 14, fill: '#ffffff' }}
            width={50}
            domain={[0, 'dataMax + 20']}
            tickFormatter={(value) => value.toString()}
          />
          
          <Tooltip content={<LineChartCustomTooltip />} />
          
          <Area
            type="monotone"
            dataKey="leads"
            stroke="#6366f1"
            strokeWidth={2.5}
            fill="url(#evolutionGradient)"
            dot={false}
            activeDot={{ 
              r: 5, 
              fill: "#6366f1",
              stroke: '#fff',
              strokeWidth: 2,
            }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </motion.div>
  )
}