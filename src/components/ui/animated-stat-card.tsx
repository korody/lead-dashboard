'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnimatedStatCardProps {
  title: string
  value: number | string
  previousValue?: number
  icon: LucideIcon
  color: string
  gradient: string
  subtitle?: string
  format?: 'number' | 'percentage' | 'currency'
  delay?: number
}

export function AnimatedStatCard({
  title,
  value,
  previousValue,
  icon: Icon,
  color,
  gradient,
  subtitle,
  format = 'number',
  delay = 0
}: AnimatedStatCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const numericValue = typeof value === 'string' ? parseFloat(value) : value

  useEffect(() => {
    // Use setTimeout to avoid setState during render
    const visTimer = setTimeout(() => setIsVisible(true), 0)
    
    // Animate number counting
    if (format !== 'percentage' && typeof numericValue === 'number' && numericValue > 0) {
      let start = 0
      const duration = 1000 // 1 second
      const increment = numericValue / (duration / 16) // 60fps
      
      const timer = setInterval(() => {
        start += increment
        if (start >= numericValue) {
          setDisplayValue(numericValue)
          clearInterval(timer)
        } else {
          setDisplayValue(Math.floor(start))
        }
      }, 16)

      return () => {
        clearInterval(timer)
        clearTimeout(visTimer)
      }
    } else {
      // Also defer this setState to avoid cascading renders
      const valueTimer = setTimeout(() => setDisplayValue(numericValue), 0)
      return () => {
        clearTimeout(visTimer)
        clearTimeout(valueTimer)
      }
    }
  }, [numericValue, format])

  const formatValue = (val: number) => {
    switch (format) {
      case 'percentage':
        return `${val.toFixed(1)}%`
      case 'currency':
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
      default:
        return val.toLocaleString('pt-BR')
    }
  }

  const getTrendInfo = () => {
    if (!previousValue || previousValue === 0) return null
    
    const change = ((numericValue - previousValue) / previousValue) * 100
    const isPositive = change > 0
    
    return {
      change: Math.abs(change),
      isPositive,
      label: isPositive ? 'aumento' : 'diminuição'
    }
  }

  const trend = getTrendInfo()

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      whileHover={{ 
        scale: 1.02,
        boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
        transition: { duration: 0.2 }
      }}
      className={`${gradient} text-white rounded-xl p-6 shadow-lg relative overflow-hidden cursor-pointer`}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-4 -right-4 w-24 h-24 rounded-full bg-white"></div>
        <div className="absolute -bottom-2 -left-2 w-16 h-16 rounded-full bg-white"></div>
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <motion.div
              initial={{ rotate: -180, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              transition={{ delay: delay + 0.3, duration: 0.5 }}
              className="p-2 bg-white/20 rounded-lg backdrop-blur-sm"
            >
              <Icon className="h-6 w-6" />
            </motion.div>
            <div>
              <h3 className="text-sm font-medium opacity-90">{title}</h3>
              {subtitle && (
                <p className="text-xs opacity-70">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <div className="mb-3">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isVisible ? 1 : 0 }}
            transition={{ delay: delay + 0.5, duration: 0.3 }}
            className="text-3xl font-bold"
          >
            {format === 'percentage' ? formatValue(numericValue) : formatValue(displayValue)}
          </motion.div>

          {trend && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: delay + 0.7, duration: 0.3 }}
              className="flex items-center space-x-1 mt-2"
            >
              <motion.div
                animate={{ 
                  scale: [1, 1.2, 1],
                  rotate: trend.isPositive ? [0, 10, 0] : [0, -10, 0]
                }}
                transition={{ 
                  duration: 2,
                  repeat: Infinity,
                  repeatDelay: 3
                }}
                className={`text-xs px-2 py-1 rounded-full font-medium ${
                  trend.isPositive 
                    ? 'bg-green-500/20 text-green-100' 
                    : 'bg-red-500/20 text-red-100'
                }`}
              >
                {trend.isPositive ? '↗' : '↘'} {trend.change.toFixed(1)}%
              </motion.div>
              <span className="text-xs opacity-70">vs período anterior</span>
            </motion.div>
          )}
        </div>

        {/* Pulse animation for real-time updates */}
        <motion.div
          animate={{
            opacity: [0.5, 1, 0.5],
            scale: [1, 1.05, 1]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute top-2 right-2 w-2 h-2 bg-white rounded-full"
        />
      </div>
    </motion.div>
  )
}