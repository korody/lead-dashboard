"use client"

import { createContext, useContext, useState, ReactNode } from 'react'

interface SidebarControlsContextType {
  controls: ReactNode | null
  setControls: (controls: ReactNode | null) => void
}

const SidebarControlsContext = createContext<SidebarControlsContextType | undefined>(undefined)

export function SidebarControlsProvider({ children }: { children: ReactNode }) {
  const [controls, setControls] = useState<ReactNode | null>(null)

  return (
    <SidebarControlsContext.Provider value={{ controls, setControls }}>
      {children}
    </SidebarControlsContext.Provider>
  )
}

export function useSidebarControls() {
  const context = useContext(SidebarControlsContext)
  if (!context) {
    throw new Error('useSidebarControls must be used within SidebarControlsProvider')
  }
  return context
}
