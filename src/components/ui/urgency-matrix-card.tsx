import React from 'react'

type Quadrant = {
  id: number
  title: string
  desc: string
  color: string
  count: number
  percentage: number
}

export default function UrgencyMatrixCard({ q }: { q: Quadrant }) {
  return (
    <div className="p-4 rounded-xl shadow-md dark:shadow-none bg-white/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
      <div className="flex items-start justify-between">
        <div>
          <div className="text-sm font-semibold text-gray-700 dark:text-gray-100">{q.title}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{q.desc}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{q.count}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{q.percentage}%</div>
        </div>
      </div>

      <div className="mt-4 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        <div
          className="h-2 rounded-full"
          style={{ width: `${q.percentage}%`, backgroundColor: q.color }}
        />
      </div>
    </div>
  )
}
