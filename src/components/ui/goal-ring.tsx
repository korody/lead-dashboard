"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"

export function GoalRing({
  current,
  goal = 10000,
  size = 120,
  thickness = 12,
  label = "Meta de Leads",
  className
}: {
  current: number
  goal?: number
  size?: number
  thickness?: number
  label?: string
  className?: string
}) {
  const safeGoal = Math.max(goal || 0, 0)
  const safeCurrent = Math.max(current || 0, 0)
  const percent = safeGoal > 0 ? Math.min(100, (safeCurrent / safeGoal) * 100) : 0
  const remaining = Math.max(0, safeGoal - safeCurrent)

  const color = useMemo(() => {
    if (percent >= 100) return "#10b981" // emerald
    if (percent >= 70) return "#22c55e" // green
    if (percent >= 40) return "#f59e0b" // amber
    return "#ef4444" // red
  }, [percent])

  const radius = (size - thickness) / 2
  const circumference = 2 * Math.PI * radius
  const dash = (percent / 100) * circumference

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5", className)}>
      <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">{label}</div>
      <div className="flex items-center gap-5">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <g transform={`rotate(-90 ${size/2} ${size/2})`}>
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke="#e5e7eb"
              strokeWidth={thickness}
              fill="none"
            />
            <circle
              cx={size/2}
              cy={size/2}
              r={radius}
              stroke={color}
              strokeWidth={thickness}
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference - dash}`}
              fill="none"
            />
          </g>
          <text
            x="50%"
            y="50%"
            dominantBaseline="middle"
            textAnchor="middle"
            className="fill-gray-900 dark:fill-white"
            style={{ fontSize: 18, fontWeight: 700 }}
          >
            {percent.toFixed(1)}%
          </text>
        </svg>
        <div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {safeCurrent.toLocaleString("pt-BR")} / {safeGoal.toLocaleString("pt-BR")}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">
            {percent >= 100 ? "🎯 Objetivo alcançado" : <>Faltam <strong>{remaining.toLocaleString("pt-BR")}</strong></>}
          </div>
        </div>
      </div>
    </div>
  )
}
