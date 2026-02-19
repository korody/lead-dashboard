export interface Campaign {
  id: string
  slug: string
  nome: string
  meta_leads: number
  data_inicio: string | null // YYYY-MM-DD
  data_fim: string | null    // YYYY-MM-DD
  ativo: boolean
  created_at: string
}

export interface CampaignContextValue {
  campaigns: Campaign[]
  selectedCampaign: Campaign | null
  setSelectedCampaign: (campaign: Campaign | null) => void
  isLoading: boolean
}
