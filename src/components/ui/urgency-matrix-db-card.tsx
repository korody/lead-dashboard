import React from 'react'

export default function UrgencyMatrixDbCard({ storedCount, total }: { storedCount: number; total: number }) {
  const pct = total > 0 ? Math.round((storedCount / total) * 100) : 0
  return (
    <div className="p-4 rounded-xl shadow-sm bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm font-medium text-gray-700 dark:text-gray-100">Dados Persistidos</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Leads com diagnóstico salvo</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-900 dark:text-white">{storedCount}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">{pct}%</div>
        </div>
      </div>
    </div>
  )
}
