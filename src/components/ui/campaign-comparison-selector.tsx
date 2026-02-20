'use client'

import { useState } from 'react'
import { useCampaign } from '@/contexts/campaign-context'
import { ChevronDown, X } from 'lucide-react'

interface CampaignComparisonSelectorProps {
  selectedComparison: string | null
  onComparisonChange: (campaignId: string | null) => void
}

export function CampaignComparisonSelector({
  selectedComparison,
  onComparisonChange,
}: CampaignComparisonSelectorProps) {
  const { campaigns, selectedCampaign } = useCampaign()
  const [isOpen, setIsOpen] = useState(false)

  // Filter out the currently selected campaign
  const availableCampaigns = campaigns.filter(
    (c) => c.id !== selectedCampaign?.id
  )

  const selectedComparisonCampaign = campaigns.find(
    (c) => c.id === selectedComparison
  )

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
        Comparar com:
      </span>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 transition-colors text-sm text-gray-700 dark:text-gray-300"
        >
          <span>
            {selectedComparisonCampaign
              ? selectedComparisonCampaign.nome
              : 'Nenhuma'}
          </span>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>

        {isOpen && (
          <div className="absolute top-full left-0 mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 min-w-max">
            {/* Option to clear comparison */}
            <button
              onClick={() => {
                onComparisonChange(null)
                setIsOpen(false)
              }}
              className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700"
            >
              Nenhuma
            </button>

            {/* Available campaigns */}
            {availableCampaigns.map((campaign) => (
              <button
                key={campaign.id}
                onClick={() => {
                  onComparisonChange(campaign.id)
                  setIsOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {campaign.nome}
                {!campaign.ativo && (
                  <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                    (encerrada)
                  </span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Clear button when something is selected */}
        {selectedComparison && (
          <button
            onClick={() => onComparisonChange(null)}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:text-gray-900 dark:hover:text-gray-200 transition-colors"
            title="Limpar comparação"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  )
}
