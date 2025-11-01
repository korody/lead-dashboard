'use client'

import { motion } from 'framer-motion'
import { LucideIcon } from 'lucide-react'
import { useEffect, useState } from 'react'

interface AnimatedGoalCardProps {
  title: string
  current: number
  goal: number
  icon: LucideIcon
  color: string
  gradient: string
  subtitle?: string
  delay?: number
}

export function AnimatedGoalCard({
  title,
  current,
  goal,
  icon: Icon,
  color,
  gradient,
  subtitle,
  delay = 0
}: AnimatedGoalCardProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const [isVisible, setIsVisible] = useState(false)

  const safeGoal = Math.max(goal || 0, 0)
  const safeCurrent = Math.max(current || 0, 0)
  const percent = safeGoal > 0 ? Math.min(100, (safeCurrent / safeGoal) * 100) : 0
  const remaining = Math.max(0, safeGoal - safeCurrent)

  useEffect(() => {
    setIsVisible(true)
    
    // Animate number counting
    let start = 0
    const duration = 1000 // 1 second
    const increment = safeCurrent / (duration / 16) // 60fps
    
    const timer = setInterval(() => {
      start += increment
      if (start >= safeCurrent) {
        setDisplayValue(safeCurrent)
        clearInterval(timer)
      } else {
        setDisplayValue(Math.floor(start))
      }
    }, 16)

    return () => clearInterval(timer)
  }, [safeCurrent])

  const getColorClass = () => {
    if (percent >= 100) return 'text-emerald-100'
    if (percent >= 70) return 'text-green-100'
    if (percent >= 40) return 'text-yellow-100'
    return 'text-red-100'
  }

  const getBarColor = () => {
    if (percent >= 100) return '#10b981' // emerald
    if (percent >= 70) return '#22c55e' // green
    if (percent >= 40) return '#f59e0b' // amber
    return '#ef4444' // red
  }

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
            className="space-y-2"
          >
            <div className="flex items-baseline justify-between">
              <div className="text-3xl font-bold">
                {displayValue.toLocaleString('pt-BR')}
              </div>
              <div className="text-sm opacity-70">
                / {safeGoal.toLocaleString('pt-BR')}
              </div>
            </div>

            {/* Progress bar */}
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs opacity-80">Progresso</span>
                <span className={`text-sm font-semibold ${getColorClass()}`}>
                  {percent.toFixed(1)}%
                </span>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden backdrop-blur-sm">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percent}%` }}
                  transition={{ delay: delay + 0.7, duration: 1, ease: "easeOut" }}
                  className="h-2 rounded-full shadow-lg"
                  style={{ backgroundColor: getBarColor() }}
                />
              </div>
            </div>

            {/* Status message */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: delay + 0.9, duration: 0.3 }}
              className="text-xs opacity-80 mt-2"
            >
              {percent >= 100 ? (
                <span className="flex items-center gap-1">
                  🎯 <strong>Meta atingida!</strong>
                </span>
              ) : (
                <span>
                  Faltam <strong>{remaining.toLocaleString('pt-BR')}</strong>
                </span>
              )}
            </motion.div>
          </motion.div>
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
