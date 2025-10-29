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
    } catch (error: any) {
      console.error('Error fetching ActiveCampaign contacts:', error)
      throw new Error(`Failed to fetch contacts: ${error.message}`)
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
    } catch (error: any) {
      console.error('Error fetching ActiveCampaign total:', error.message)
      return 0
    }
  }

  /**
   * Busca contatos criados nos últimos N dias
   */
  async getRecentContactsByTag(tagId: number, days: number = 30): Promise<{ total: number; byDay: Record<string, number> }> {
    if (!this.isConfigured()) {
      return { total: 0, byDay: {} }
    }

    try {
      const dataInicio = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
      
      // ActiveCampaign usa filtros de data específicos
      const url = `${this.baseUrl}/api/3/contacts?tagid=${tagId}&created_after=${dataInicio}&limit=100`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Api-Token': this.apiKey,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`ActiveCampaign API error: ${response.status}`)
      }

      const data = await response.json()
      const contacts = data.contacts || []
      
      // Agrupar por dia
      const byDay: Record<string, number> = {}
      contacts.forEach((contact: any) => {
        const dia = new Date(contact.cdate).toISOString().split('T')[0]
        byDay[dia] = (byDay[dia] || 0) + 1
      })
      
      return {
        total: parseInt(data.meta?.total || '0', 10),
        byDay
      }
    } catch (error: any) {
      console.error('Error fetching recent contacts:', error)
      return { total: 0, byDay: {} }
    }
  }
}

export const activeCampaignClient = new ActiveCampaignClient()
