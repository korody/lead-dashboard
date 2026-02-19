"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { supabase } from '@/lib/supabase'
import type { Campaign, CampaignContextValue } from '@/types/campaign'

const CampaignContext = createContext<CampaignContextValue | undefined>(undefined)

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const { data, error } = await supabase
          .from('dash_campaigns')
          .select('*')
          .order('prioridade', { ascending: true })
          .order('created_at', { ascending: true })

        if (error) throw error

        if (data && data.length > 0) {
          setCampaigns(data)
          // Seleciona a campanha ativa com menor prioridade (primeira na lista)
          const active = data.find((c) => c.ativo) ?? data[0]
          setSelectedCampaign(active)
        }
      } catch (error) {
        console.error('Erro ao carregar campanhas:', error)
      } finally {
        setIsLoading(false)
      }
    }

    load()
  }, [])

  return (
    <CampaignContext.Provider
      value={{ campaigns, selectedCampaign, setSelectedCampaign, isLoading }}
    >
      {children}
    </CampaignContext.Provider>
  )
}

export function useCampaign() {
  const ctx = useContext(CampaignContext)
  if (!ctx) {
    throw new Error('useCampaign must be used within CampaignProvider')
  }
  return ctx
}
