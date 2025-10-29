import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface DashboardState {
  isRealTimeEnabled: boolean
  selectedTimeRange: '24h' | '7d' | '30d' | '90d'
  selectedMetric: string
  filters: {
    element?: string
    priority?: string
    status?: string
  }
  setRealTimeEnabled: (enabled: boolean) => void
  setTimeRange: (range: '24h' | '7d' | '30d' | '90d') => void
  setSelectedMetric: (metric: string) => void
  setFilters: (filters: any) => void
  clearFilters: () => void
}

export const useDashboardStore = create<DashboardState>()(
  persist(
    (set) => ({
      isRealTimeEnabled: true,
      selectedTimeRange: '30d',
      selectedMetric: 'leads',
      filters: {},
      setRealTimeEnabled: (enabled) => set({ isRealTimeEnabled: enabled }),
      setTimeRange: (range) => set({ selectedTimeRange: range }),
      setSelectedMetric: (metric) => set({ selectedMetric: metric }),
      setFilters: (filters) => set({ filters }),
      clearFilters: () => set({ filters: {} }),
    }),
    {
      name: 'dashboard-storage',
    }
  )
)