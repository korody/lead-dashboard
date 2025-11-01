"use client"

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSidebarControls } from '@/contexts/sidebar-controls-context'
import { 
  LayoutDashboard, 
  Users, 
  TrendingUp, 
  ClipboardCheck,
  Menu,
  X,
  ChevronRight
} from 'lucide-react'

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  description: string
}

const navItems: NavItem[] = [
  {
    name: 'Insights de Marketing',
    href: '/',
    icon: TrendingUp,
    description: 'Análises e campanhas'
  },
  {
    name: 'Gestão de Leads',
    href: '/leads',
    icon: Users,
    description: 'Gerenciar e filtrar leads'
  },
  {
    name: 'Diagnósticos',
    href: '/diagnosticos',
    icon: ClipboardCheck,
    description: 'Resultados dos quizzes'
  }
  // {
  //   name: 'Dashboard',
  //   href: '/dashboard',
  //   icon: LayoutDashboard,
  //   description: 'Visão geral e métricas'
  // },
]

interface NavigationProps {
  children?: React.ReactNode
}

export function Navigation({ children }: NavigationProps) {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()
  const { controls } = useSidebarControls()

  return (
    <>
      {/* Mobile Menu Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700"
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700 dark:text-gray-300" />
        )}
      </motion.button>

      {/* Backdrop for mobile */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/50 z-40"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed top-0 left-0 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 z-40
          transition-transform duration-300 shadow-2xl
          lg:translate-x-0 lg:sticky lg:shadow-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full">
          {/* Logo - Top */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            <Link href="/" onClick={() => setIsOpen(false)} className="block">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="flex items-center justify-center"
              >
                <img 
                  src="/black-logo.png" 
                  alt="Black Logo" 
                  className="w-full h-auto max-w-[180px] object-contain"
                  onError={(e) => {
                    e.currentTarget.src = '/black-logo.svg'
                  }}
                />
              </motion.div>
            </Link>
          </div>

          {/* Controls & Filters */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-800">
            {/* Dynamic controls from context */}
            {controls && (
              <div className="space-y-3">
                {controls}
              </div>
            )}
          </div>

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Navigation Links - Bottom */}
          <nav className="p-4 space-y-2 border-t border-gray-200 dark:border-gray-800">
            {navItems.map((item) => {
              const isActive = pathname === item.href
              const Icon = item.icon

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                >
                  <motion.div
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                    className={`
                      relative flex items-center space-x-3 px-4 py-3 rounded-lg
                      transition-all duration-200 group
                      ${isActive 
                        ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                      }
                    `}
                  >
                    {/* Active indicator */}
                    {isActive && (
                      <motion.div
                        layoutId="activeTab"
                        className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg"
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    )}

                    <div className="relative z-10 flex items-center flex-1 space-x-3">
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-gray-500 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400'}`} />
                      <div className="flex-1">
                        <div className={`font-medium ${isActive ? 'text-white' : ''}`}>
                          {item.name}
                        </div>
                        <div className={`text-xs ${isActive ? 'text-indigo-100' : 'text-gray-500 dark:text-gray-400'}`}>
                          {item.description}
                        </div>
                      </div>
                      {isActive && (
                        <ChevronRight className="w-4 h-4 text-white" />
                      )}
                    </div>
                  </motion.div>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}
