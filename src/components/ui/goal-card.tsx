"use client"

import { cn } from "@/lib/utils"

export function GoalCard({
  current,
  goal = 10000,
  label = "Meta de Leads",
  className
}: {
  current: number
  goal?: number
  label?: string
  className?: string
}) {
  const safeGoal = Math.max(goal || 0, 0)
  const safeCurrent = Math.max(current || 0, 0)
  const percent = safeGoal > 0 ? Math.min(100, (safeCurrent / safeGoal) * 100) : 0
  const remaining = Math.max(0, safeGoal - safeCurrent)
  const color =
    percent >= 100 ? "from-emerald-500 to-emerald-600"
    : percent >= 70 ? "from-green-500 to-green-600"
    : percent >= 40 ? "from-yellow-500 to-yellow-600"
    : "from-red-500 to-red-600"

  return (
    <div className={cn("bg-white dark:bg-gray-800 rounded-xl shadow-lg p-5", className)}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm text-gray-600 dark:text-gray-400">{label}</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {safeCurrent.toLocaleString("pt-BR")} / {safeGoal.toLocaleString("pt-BR")}
          </div>
        </div>
        <div className="text-right">
          <span className={`text-sm font-semibold ${percent >= 100 ? "text-emerald-600 dark:text-emerald-400" : "text-gray-700 dark:text-gray-200"}`}>
            {percent.toFixed(1)}%
          </span>
          {percent >= 100 && (
            <div className="mt-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 inline-block">
              Meta atingida
            </div>
          )}
        </div>
      </div>

      <div className="mt-3 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full bg-gradient-to-r ${color}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
        {percent >= 100 ? "🎯 Objetivo alcançado" : <>Faltam <strong>{remaining.toLocaleString("pt-BR")}</strong></>}
      </div>
    </div>
  )
}
