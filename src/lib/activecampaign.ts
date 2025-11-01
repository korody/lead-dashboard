/**
 * ActiveCampaign Client
 * Configuração e métodos para integração com ActiveCampaign API
 */

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL // Ex: https://seudominio.api-us1.com
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY

interface ActiveCampaignContact {
  id: string
  email: string
  firstName?: string
  lastName?: string
  tags?: string[]
  createdDate: string
}

export class ActiveCampaignClient {
  private baseUrl: string
  private apiKey: string

  constructor() {
    if (!AC_API_URL || !AC_API_KEY) {
      console.warn('ActiveCampaign credentials not configured')
      this.baseUrl = ''
      this.apiKey = ''
    } else {
      this.baseUrl = AC_API_URL.replace(/\/$/, '') // Remove trailing slash
      this.apiKey = AC_API_KEY
    }
  }

  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey)
  }

  /**
   * Busca contatos por tag ID
   * @param tagId - ID da tag no ActiveCampaign
   * @returns Total de contatos e lista
   */
  async getContactsByTag(tagId: number): Promise<{ total: number; contacts: ActiveCampaignContact[] }> {
    if (!this.isConfigured()) {
      console.warn('ActiveCampaign not configured, returning mock data')
      return { total: 0, contacts: [] }
    }

    try {
      const url = `${this.baseUrl}/api/3/contacts?tagid=${tagId}&limit=100`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`ActiveCampaign API error: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      
      // Buscar total de páginas se houver mais de 100 contatos
      const total = parseInt(data.meta?.total || '0', 10)
      
      return {
        total,
        contacts: data.contacts || []
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching ActiveCampaign contacts:', err)
      throw new Error(`Failed to fetch contacts: ${err.message}`)
    }
  }

  /**
   * Busca apenas o total de contatos por tag (mais rápido)
   */
  async getTotalContactsByTag(tagId: number): Promise<number> {
    if (!this.isConfigured()) {
      console.warn('ActiveCampaign not configured, returning 0')
      return 0
    }

    try {
      const url = `${this.baseUrl}/api/3/contacts?tagid=${tagId}&limit=1`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        console.error(`ActiveCampaign API error: ${response.status}`)
        return 0
      }

      const data = await response.json()
      const total = parseInt(data.meta?.total || '0', 10)
      
      console.log(`ActiveCampaign: ${total} contacts with tag ${tagId}`)
      
      return total
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching ActiveCampaign total:', err.message)
      return 0
    }
  }

  /**
   * Busca contatos nos últimos N dias
   * USA UPDATED_DATE (udate) ao invés de created_date para melhor precisão
   * udate é atualizado quando campos customizados são preenchidos
   */
  async getRecentContactsByTag(tagId: number, days: number = 30): Promise<{ total: number; byDay: Record<string, number> }> {
    if (!this.isConfigured()) {
      return { total: 0, byDay: {} }
    }

    try {
      console.log(`📊 Buscando contatos com tag ${tagId} usando updated_date...`)
      
  // Buscar TODOS os contatos com a tag (sem filtro de data na API)
  let allContacts: Array<Record<string, unknown>> = []
      let offset = 0
      const limit = 100
      
      while (true) {
        const url = `${this.baseUrl}/api/3/contacts?tagid=${tagId}&limit=${limit}&offset=${offset}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Api-Token': this.apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) break

        const data = await response.json()
        const contacts = data.contacts || []
        
        if (contacts.length === 0) break
        
        allContacts = allContacts.concat(contacts)
        
        const total = parseInt(data.meta?.total || '0', 10)
        if (allContacts.length >= total) break
        
        offset += limit
      }
      
      console.log(`✅ ${allContacts.length} contatos carregados`)
      
      // Filtrar e agrupar por udate (data de atualização) - Timezone Brasil
      const nowBrasil = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
      const dataLimite = new Date(nowBrasil.getTime() - days * 24 * 60 * 60 * 1000)
      const byDay: Record<string, number> = {}
      let dentroIntervalo = 0
      
      allContacts.forEach((contact: Record<string, unknown>) => {
        // Usar UDATE (updated date) ao invés de CDATE (created date)
        const updateRaw = (contact as { udate?: string }).udate
        if (!updateRaw) return
        const updateDate = new Date(updateRaw)
        
        if (updateDate >= dataLimite) {
          // Converter para timezone brasileiro
          const dataBrasil = new Date(updateDate.toLocaleString('en-US', { timeZone: 'America/Sao_Paulo' }))
          const dia = dataBrasil.toISOString().split('T')[0]
          byDay[dia] = (byDay[dia] || 0) + 1
          dentroIntervalo++
        }
      })
      
      console.log(`✅ ${dentroIntervalo} contatos atualizados nos últimos ${days} dias (via udate)`)
      
      return {
        total: dentroIntervalo,
        byDay
      }
    } catch (error: unknown) {
      const err = error as Error;
      console.error('Error fetching recent contacts:', err)
      return { total: 0, byDay: {} }
    }
  }
}

export const activeCampaignClient = new ActiveCampaignClient()
