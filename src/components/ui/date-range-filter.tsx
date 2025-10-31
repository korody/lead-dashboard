"use client"

import { motion } from "framer-motion"
import { Calendar, ChevronDown } from "lucide-react"
import { useState } from "react"

export type DateRangeOption = 3 | 7 | 15 | 30

interface DateRangeFilterProps {
  selected: DateRangeOption
  onChange: (days: DateRangeOption) => void
}

const OPTIONS: { value: DateRangeOption; label: string }[] = [
  { value: 3, label: "Últimos 3 dias" },
  { value: 7, label: "Últimos 7 dias" },
  { value: 15, label: "Últimos 15 dias" },
  { value: 30, label: "Últimos 30 dias" },
]

export function DateRangeFilter({ selected, onChange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  
  const selectedOption = OPTIONS.find(o => o.value === selected) || OPTIONS[1]

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-indigo-500 dark:hover:border-indigo-400 px-4 py-2 rounded-lg transition-all shadow-sm"
      >
        <Calendar className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {selectedOption.label}
        </span>
        <ChevronDown 
          className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
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
            className="absolute top-full mt-2 right-0 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-20 overflow-hidden"
          >
            {OPTIONS.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value)
                  setIsOpen(false)
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  option.value === selected
                    ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
