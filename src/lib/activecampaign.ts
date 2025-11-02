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
      
      // console.log(`ActiveCampaign: ${total} contacts with tag ${tagId}`)
      
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
      console.log(`📊 Buscando evolução temporal (${days} dias)...`)
      
      // PASSO 1: Buscar todos os fieldValues do campo 150 (BNY2 - Data do Cadastro)
      console.log(`   📝 Carregando campo 150...`)
      const field150Map = new Map<string, string>() // contactId -> data
      let offset150 = 0
      const limit150 = 100
      
      while (true) {
        const url150 = `${this.baseUrl}/api/3/fieldValues?filters[fieldid]=150&limit=${limit150}&offset=${offset150}`
        
        const response150 = await fetch(url150, {
          method: 'GET',
          headers: {
            'Api-Token': this.apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (!response150.ok) break

        const data150 = await response150.json()
        const fieldValues = data150.fieldValues || []
        
        if (fieldValues.length === 0) break
        
        // Armazenar mapeamento contactId -> data
        fieldValues.forEach((fv: { contact: string; value: string }) => {
          if (fv.contact && fv.value) {
            field150Map.set(fv.contact, fv.value)
          }
        })
        
        const total150 = parseInt(data150.meta?.total || '0', 10)
        if (field150Map.size >= total150) break
        
        offset150 += limit150
      }
      
      console.log(`   ✅ ${field150Map.size} contatos com campo 150`)
      
      // PASSO 2: Buscar TODOS os contatos com a tag
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
      
      // console.log(`✅ ${allContacts.length} contatos carregados`)
      
      // Filtrar e agrupar por BNY2_DATA_DO_CADASTRO ou cdate (fallback)
      const dataLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const byDay: Record<string, number> = {}
      let dentroIntervalo = 0
      let usouCustomField = 0
      let usouCdate = 0
      let contatoIndex = 0
      
      allContacts.forEach((contact: Record<string, unknown>) => {
        contatoIndex++
        let cadastroDate: Date | null = null
        
        const contactId = String((contact as { id?: string }).id || '')
        
        // BUSCAR NO MAPA do campo 150
        const valorCampo150 = field150Map.get(contactId)
        
        if (valorCampo150) {
          // DEBUG: Log do primeiro contato com campo 150
          if (usouCustomField === 0) {
            console.log(`🔍 Primeiro contato com campo 150:`)
            console.log(`   ID: ${contactId} | Email: ${(contact as {email?: string}).email}`)
            console.log(`   Campo 150 valor: "${valorCampo150}"`)
          }
          
          // Parsear a data do campo customizado (formato esperado: YYYY-MM-DD)
          const valorData = valorCampo150.trim()
          
          // Tentar diferentes formatos
          if (valorData.match(/^\d{4}-\d{2}-\d{2}/)) {
            // Formato ISO: 2025-11-02
            cadastroDate = new Date(valorData)
            usouCustomField++
          } else if (valorData.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            // Formato BR: 02/11/2025
            const [dia, mes, ano] = valorData.split('/')
            cadastroDate = new Date(`${ano}-${mes}-${dia}`)
            usouCustomField++
          } else if (!isNaN(Number(valorData))) {
            // Timestamp Unix
            cadastroDate = new Date(Number(valorData) * 1000)
            usouCustomField++
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
      
      console.log(`✅ ${dentroIntervalo} contatos | Campo BNY2: ${usouCustomField} | Fallback cdate: ${usouCdate}`)
      
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
