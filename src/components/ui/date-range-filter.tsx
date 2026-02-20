"use client"

import { motion } from "framer-motion"
import { Calendar, ChevronDown } from "lucide-react"
import { useState } from "react"

export type DateRangeOption = 3 | 7 | 15 | 30 | 9999 | 'custom'

interface DateRangeFilterProps {
  selected: DateRangeOption
  onChange: (days: DateRangeOption) => void
  /** Data início da campanha selecionada (YYYY-MM-DD) — usada para o label quando selected=9999 */
  campaignStart?: string
  /** Data fim da campanha selecionada (YYYY-MM-DD) */
  campaignEnd?: string
  /** Valor atual do início do período customizado */
  customStart?: string
  /** Valor atual do fim do período customizado */
  customEnd?: string
  /** Callback quando o usuário define um período customizado */
  onCustomDatesChange?: (start: string, end: string) => void
}

const PRESETS: { value: Exclude<DateRangeOption, 'custom'>; label: string }[] = [
  { value: 3,    label: "Últimos 3 dias" },
  { value: 7,    label: "Últimos 7 dias" },
  { value: 15,   label: "Últimos 15 dias" },
  { value: 30,   label: "Últimos 30 dias" },
  { value: 9999, label: "Tempo Todo" },
]

function fmtDate(iso: string): string {
  const [y, m, d] = iso.split('-')
  return `${d}/${m}/${y.slice(2)}`
}

export function DateRangeFilter({
  selected,
  onChange,
  campaignStart,
  campaignEnd,
  customStart = '',
  customEnd = '',
  onCustomDatesChange,
}: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [localStart, setLocalStart] = useState(customStart)
  const [localEnd, setLocalEnd] = useState(customEnd)

  // Label do botão
  function getLabel(): string {
    if (selected === 'custom') {
      if (customStart && customEnd) return `${fmtDate(customStart)} – ${fmtDate(customEnd)}`
      if (customStart) return `A partir de ${fmtDate(customStart)}`
      return 'Personalizado'
    }
    if (selected === 9999 && campaignStart) {
      const end = campaignEnd ? fmtDate(campaignEnd) : 'Hoje'
      return `${fmtDate(campaignStart)} – ${end}`
    }
    return PRESETS.find(o => o.value === selected)?.label ?? 'Tempo Todo'
  }

  // Cor do indicador de campanha no label
  const showingCampaignDates = selected === 9999 && !!campaignStart
  const showingCustomDates   = selected === 'custom'

  function handleCustomDateChange(start: string, end: string) {
    setLocalStart(start)
    setLocalEnd(end)
    onCustomDatesChange?.(start, end)
    // Fecha automaticamente quando ambas as datas estão preenchidas
    if (start && end) setIsOpen(false)
  }

  return (
    <div className="relative w-full">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 px-4 py-2 rounded-lg transition-all shadow-sm"
      >
        <Calendar className={`h-4 w-4 ${showingCampaignDates || showingCustomDates ? 'text-indigo-500' : 'text-indigo-600 dark:text-indigo-400'}`} />
        <span className={`text-sm font-medium flex-1 text-left ${showingCampaignDates ? 'text-indigo-600 dark:text-indigo-300' : showingCustomDates ? 'text-purple-600 dark:text-purple-300' : 'text-gray-700 dark:text-gray-300'}`}>
          {getLabel()}
        </span>
        {(showingCampaignDates || showingCustomDates) && (
          <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${showingCampaignDates ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300' : 'bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-300'}`}>
            {showingCampaignDates ? 'campanha' : 'custom'}
          </span>
        )}
        <ChevronDown
          className={`h-4 w-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </motion.button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />

          {/* Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-full mt-2 left-0 right-0 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"
          >
            {/* Presets */}
            {PRESETS.map((option) => {
              const isCampaignPreset = option.value === 9999 && !!campaignStart
              return (
                <button
                  key={option.value}
                  onClick={() => { onChange(option.value); setIsOpen(false) }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                    selected !== 'custom' && option.value === selected
                      ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                  }`}
                >
                  <span>{option.label}</span>
                  {isCampaignPreset && (
                    <span className="ml-2 text-xs text-indigo-500 dark:text-indigo-400">
                      ({fmtDate(campaignStart)}{campaignEnd ? ` – ${fmtDate(campaignEnd)}` : ' – Hoje'})
                    </span>
                  )}
                </button>
              )
            })}

            {/* Separador */}
            <div className="border-t border-gray-100 dark:border-gray-700" />

            {/* Opção personalizado */}
            <button
              onClick={() => onChange('custom')}
              className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                selected === 'custom'
                  ? 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 font-medium'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              Período personalizado
            </button>

            {/* Date pickers — visíveis quando 'custom' está selecionado */}
            {selected === 'custom' && (
              <div className="px-4 pb-4 pt-2 bg-purple-50/50 dark:bg-purple-900/10 border-t border-purple-100 dark:border-purple-800/30">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-2 font-medium">Selecione o período:</p>
                <div className="flex flex-col gap-2">
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">De</label>
                    <input
                      type="date"
                      value={localStart}
                      max={localEnd || undefined}
                      onChange={e => handleCustomDateChange(e.target.value, localEnd)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">Até</label>
                    <input
                      type="date"
                      value={localEnd}
                      min={localStart || undefined}
                      onChange={e => handleCustomDateChange(localStart, e.target.value)}
                      className="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  )
}
