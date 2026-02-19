"use client"

import { motion } from 'framer-motion'
import { ChevronDown, Megaphone } from 'lucide-react'
import { useState } from 'react'
import { useCampaign } from '@/contexts/campaign-context'

export function CampaignSelector() {
  const { campaigns, selectedCampaign, setSelectedCampaign, isLoading } =
    useCampaign()
  const [isOpen, setIsOpen] = useState(false)

  if (isLoading || campaigns.length === 0) {
    return null
  }

  return (
    <div className="relative w-full">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between space-x-2 bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-200 dark:border-indigo-700 hover:border-indigo-400 dark:hover:border-indigo-500 px-4 py-2.5 rounded-lg transition-all shadow-sm"
      >
        <div className="flex items-center gap-2">
          <Megaphone className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
            {selectedCampaign?.nome ?? 'Todas as campanhas'}
          </span>
        </div>
        <ChevronDown
          className={`h-4 w-4 text-indigo-500 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </motion.button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 w-full bg-white dark:bg-gray-800 border border-indigo-200 dark:border-indigo-700 rounded-lg shadow-xl z-20 overflow-hidden"
          >
            {/* Opção "Todas" */}
            <button
              onClick={() => {
                setSelectedCampaign(null)
                setIsOpen(false)
              }}
              className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between border-b border-gray-100 dark:border-gray-700 ${
                selectedCampaign === null
                  ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              <span>Todas as campanhas</span>
            </button>

            {campaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => {
                  setSelectedCampaign(campaign)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors flex items-center justify-between ${
                  campaign.id === selectedCampaign?.id
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <span>{campaign.nome}</span>
                {!campaign.ativo && (
                  <span className="text-xs text-gray-400">encerrada</span>
                )}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
