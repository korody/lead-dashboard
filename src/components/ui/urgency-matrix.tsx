import React from 'react'
import UrgencyMatrixCard from './urgency-matrix-card'
import UrgencyMatrixDbCard from './urgency-matrix-db-card'

type Quadrant = {
  id: number
  title: string
  desc: string
  color: string
  count: number
  percentage: number
}

export default function UrgencyMatrix({ quadrants, storedCount, total }: { quadrants: Quadrant[]; storedCount?: number; total?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        {quadrants.map(q => (
          <UrgencyMatrixCard key={q.id} q={q} />
        ))}
      </div>

      <div className="md:col-span-1 flex flex-col gap-4">
        <UrgencyMatrixDbCard storedCount={storedCount || 0} total={total || 0} />
        <div className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
          <div className="text-sm font-medium text-gray-700 dark:text-gray-100">Legenda</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">Q1: Alta Urgência + Alta Intensidade • Q2: Alta Urgência + Baixa Intensidade</div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Q3: Baixa Urgência + Alta Intensidade • Q4: Baixa Urgência + Baixa Intensidade</div>
        </div>
      </div>
    </div>
  )
}
