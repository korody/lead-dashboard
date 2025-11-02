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
   * USA CAMPO CUSTOMIZADO %BNY2_DATA_DO_CADASTRO% para data exata do evento
   * Fallback para cdate se o campo customizado não existir
   */
  async getRecentContactsByTag(tagId: number, days: number = 30): Promise<{ total: number; byDay: Record<string, number> }> {
    if (!this.isConfigured()) {
      return { total: 0, byDay: {} }
    }

    try {
      console.log(`📊 Buscando contatos com tag ${tagId} usando campo customizado BNY2_DATA_DO_CADASTRO...`)
      
      // Buscar TODOS os contatos com a tag E seus campos customizados
      let allContacts: Array<Record<string, unknown>> = []
      let offset = 0
      const limit = 100
      
      while (true) {
        // Incluir fieldValues para obter campos customizados
        const url = `${this.baseUrl}/api/3/contacts?tagid=${tagId}&limit=${limit}&offset=${offset}&include=fieldValues`
        
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
      
      console.log(`✅ ${allContacts.length} contatos carregados com campos customizados`)
      
      // Filtrar e agrupar por BNY2_DATA_DO_CADASTRO ou cdate (fallback)
      const dataLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const byDay: Record<string, number> = {}
      let dentroIntervalo = 0
      let usouCustomField = 0
      let usouCdate = 0
      
      allContacts.forEach((contact: Record<string, unknown>) => {
        let cadastroDate: Date | null = null
        
        // Tentar obter data do campo customizado primeiro
        const fieldValues = (contact as { fieldValues?: Array<{ field: string; value: string }> }).fieldValues
        if (fieldValues && Array.isArray(fieldValues)) {
          // Procurar especificamente pelo campo BNY2_DATA_DO_CADASTRO
          const bnyField = fieldValues.find(f => 
            f.field && (
              f.field.toString().toUpperCase().includes('BNY2_DATA_DO_CADASTRO') ||
              f.field.toString().toUpperCase().includes('%BNY2_DATA_DO_CADASTRO%') ||
              f.field.toString().includes('BNY2') || 
              f.field.toString().toLowerCase().includes('cadastro')
            )
          )
          
          if (bnyField && bnyField.value) {
            // Tentar parsear a data do campo customizado
            // Pode vir em formato ISO, timestamp, ou dd/mm/yyyy
            const valorData = bnyField.value.trim()
            
            // Tentar diferentes formatos
            if (valorData.match(/^\d{4}-\d{2}-\d{2}/)) {
              // Formato ISO: 2025-11-02
              cadastroDate = new Date(valorData)
            } else if (valorData.match(/^\d{2}\/\d{2}\/\d{4}/)) {
              // Formato BR: 02/11/2025
              const [dia, mes, ano] = valorData.split('/')
              cadastroDate = new Date(`${ano}-${mes}-${dia}`)
            } else if (!isNaN(Number(valorData))) {
              // Timestamp Unix
              cadastroDate = new Date(Number(valorData) * 1000)
            }
            
            if (cadastroDate && !isNaN(cadastroDate.getTime())) {
              usouCustomField++
            }
          }
        }
        
        // Fallback para cdate se não conseguiu obter do campo customizado
        if (!cadastroDate || isNaN(cadastroDate.getTime())) {
          const createRaw = (contact as { cdate?: string }).cdate
          if (createRaw) {
            cadastroDate = new Date(createRaw)
            usouCdate++
          }
        }
        
        if (!cadastroDate || isNaN(cadastroDate.getTime())) return
        
        if (cadastroDate >= dataLimite) {
          // Converter para timezone brasileiro usando Intl.DateTimeFormat
          const formatter = new Intl.DateTimeFormat('en-CA', {
            timeZone: 'America/Sao_Paulo',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit'
          })
          const dia = formatter.format(cadastroDate)
          byDay[dia] = (byDay[dia] || 0) + 1
          dentroIntervalo++
        }
      })
      
      console.log(`✅ ${dentroIntervalo} contatos nos últimos ${days} dias`)
      console.log(`   📅 Campo customizado: ${usouCustomField} | cdate: ${usouCdate}`)
      
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
