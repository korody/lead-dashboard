'use client'

import { QUADRANTES } from '@/lib/constants'
import { useUrgencyMatrix } from '@/hooks/use-urgency-matrix'
import { motion } from 'framer-motion'

interface UrgencyMatrixFullProps {
  refreshKey?: number
}

export default function UrgencyMatrixFull({ refreshKey }: UrgencyMatrixFullProps = {}) {
  const { quadrants, total, loading, error } = useUrgencyMatrix(refreshKey)

  if (error) {
    const isEnvError = error.includes('Supabase') || error.includes('configurado')
    return (
      <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
        <p className="text-sm font-semibold text-red-600 dark:text-red-400 mb-2">
          ❌ Erro ao carregar dados da matriz
        </p>
        <p className="text-xs text-red-500 dark:text-red-300 mb-3">
          {error}
        </p>
        {isEnvError && (
          <div className="text-xs text-gray-600 dark:text-gray-400 mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            💡 <strong>Solução:</strong> Configure as variáveis de ambiente do Supabase no arquivo <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env.local</code>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Loading skeleton para quadrantes */}
        <div className="md:col-span-2 grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse"
            >
              <div className="h-16 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))}
        </div>
        {/* Loading skeleton para info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse">
            <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
          <div className="p-4 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse">
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {/* Quadrantes 2x2 */}
      <div className="md:col-span-2 grid grid-cols-2 gap-4">
        {quadrants.map(({ quadrante, count, percentage }, index) => {
          const info = QUADRANTES[quadrante as keyof typeof QUADRANTES]
          return (
            <motion.div
              key={quadrante}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1, duration: 0.3 }}
              whileHover={{ scale: 1.02, y: -2 }}
              onClick={() => window.location.href = `/leads?quadrante=${quadrante}`}
              className="p-4 rounded-xl shadow-md dark:shadow-none bg-white/70 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700 cursor-pointer transition-all hover:shadow-lg hover:border-indigo-300 dark:hover:border-indigo-600"
              title={`Clique para ver os ${count} leads do ${info.title}`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-semibold text-gray-700 dark:text-gray-100">
                    {info.title}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {info.desc}
                  </div>
                </div>
                <div className="text-right">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2 + index * 0.1, duration: 0.4, type: 'spring' }}
                    className="text-2xl font-bold text-gray-900 dark:text-white"
                  >
                    {count}
                  </motion.div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {percentage.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Progress bar animada */}
              <div className="mt-4 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.8, ease: 'easeOut' }}
                  className="h-2 rounded-full"
                  style={{
                    backgroundColor: info.color,
                  }}
                />
              </div>
            </motion.div>
          )
        })}
      </div>

      {/* Info lateral */}
      <div className="md:col-span-1 flex flex-col gap-4">
        {/* Card de total */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="p-4 rounded-xl shadow-sm bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-gray-700 dark:text-gray-100">
                Dados Persistidos
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Leads com diagnóstico salvo
              </div>
            </div>
            <div className="text-right">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.6, duration: 0.4, type: 'spring' }}
                className="text-2xl font-bold text-gray-900 dark:text-white"
              >
                {total}
              </motion.div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                100%
              </div>
            </div>
          </div>
        </motion.div>

        {/* Legenda */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="p-4 rounded-xl bg-white/60 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700"
        >
          <div className="text-sm font-medium text-gray-700 dark:text-gray-100">
            Legenda
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
            Q1: Alta Urgência + Alta Intensidade • Q2: Alta Urgência + Baixa Intensidade
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Q3: Baixa Urgência + Alta Intensidade • Q4: Baixa Urgência + Baixa Intensidade
          </div>
        </motion.div>
      </div>
    </div>
  )
}
