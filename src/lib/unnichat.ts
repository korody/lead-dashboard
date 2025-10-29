/**
 * Unnichat API Client
 * Documentação: https://unnichat.com.br/api/api-docs/
 * Autenticação: Bearer Token
 */

interface UnnichatConfig {
  apiUrl: string
  apiToken: string
}

interface UnnichatContact {
  id: string
  name: string
  phone: string
  // Additional fields returned by the API (kept as unknown for safety)
  metadata?: Record<string, unknown>
}

interface UnnichatMessage {
  id: string
  text?: string | null
  timestamp?: string
  direction?: 'incoming' | 'outgoing'
  // Additional fields returned by the API (kept as unknown for safety)
  metadata?: Record<string, unknown>
}

class UnnichatClient {
  private config: UnnichatConfig

  constructor() {
    this.config = {
      apiUrl: 'https://unnichat.com.br/api',
      apiToken: process.env.UNNICHAT_API_TOKEN || '',
    }
  }

  private isConfigured(): boolean {
    return !!this.config.apiToken
  }

  /**
   * Buscar contatos por condições
   * POST /contact/search
   */
  async searchContacts(conditions: Record<string, unknown> = {}): Promise<UnnichatContact[]> {
    if (!this.isConfigured()) {
      console.warn('Unnichat API token not configured')
      return []
    }

    try {
      const url = `${this.config.apiUrl}/contact/search`
      
      console.log('Unnichat search request URL:', url)
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': this.config.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(conditions)
      })

      console.log('Unnichat response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Unnichat API error: ${response.status} ${response.statusText}`)
        console.error('Unnichat error body:', errorText.substring(0, 500))
        return []
      }

      const data: unknown = await response.json()

      if (!Array.isArray(data)) {
        console.warn('Unnichat: unexpected contacts response shape')
        return []
      }

      const contacts: UnnichatContact[] = (data as unknown[])
        .map((item) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            const id = typeof obj['id'] === 'string' ? obj['id'] : ''
            const name = typeof obj['name'] === 'string' ? obj['name'] : ''
            const phone = typeof obj['phone'] === 'string' ? obj['phone'] : ''
            const metadata = { ...obj }
            return { id, name, phone, metadata }
          }
          return null
        })
        .filter(Boolean) as UnnichatContact[]

      console.log('Unnichat contacts found:', contacts.length)

      return contacts
    } catch (error) {
      console.error('Error fetching Unnichat contacts:', error)
      return []
    }
  }

  /**
   * Buscar mensagens de um contato específico
   * GET /contact/{id}/messages
   */
  async getContactMessages(contactId: string): Promise<UnnichatMessage[]> {
    if (!this.isConfigured()) {
      console.warn('Unnichat API token not configured')
      return []
    }

    try {
      const url = `${this.config.apiUrl}/contact/${contactId}/messages`
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': this.config.apiToken,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Unnichat API error for contact ${contactId}:`, response.status)
        return []
      }

      const data: unknown = await response.json()

      if (!Array.isArray(data)) {
        console.warn(`Unnichat: unexpected messages shape for contact ${contactId}`)
        return []
      }

      const messages: UnnichatMessage[] = (data as unknown[])
        .map((item) => {
          if (item && typeof item === 'object') {
            const obj = item as Record<string, unknown>
            return {
              id: typeof obj['id'] === 'string' ? obj['id'] : '',
              text: typeof obj['text'] === 'string' ? obj['text'] : obj['text'] ?? null,
              timestamp: typeof obj['timestamp'] === 'string' ? obj['timestamp'] : undefined,
              direction: obj['direction'] === 'incoming' || obj['direction'] === 'outgoing' ? (obj['direction'] as 'incoming' | 'outgoing') : undefined,
              metadata: { ...obj },
            }
          }
          return null
        })
        .filter(Boolean) as UnnichatMessage[]

      return messages
    } catch (error) {
      console.error(`Error fetching messages for contact ${contactId}:`, error)
      return []
    }
  }

  /**
   * Contar contatos que enviaram mensagem específica solicitando diagnóstico
   * Mensagem: "Olá Mestre Ye! Quero receber meu Diagnóstico Express"
   */
  async countDiagnosticoRequests(): Promise<number> {
    if (!this.isConfigured()) {
      console.warn('Unnichat API token not configured')
      // Fallback para valor manual se API falhar
      const manualValue = process.env.UNNICHAT_DIAGNOSTICO_REQUESTS
      if (manualValue) {
        const count = parseInt(manualValue, 10)
        console.log(`Unnichat: Using manual fallback value of ${count} requests`)
        return count
      }
      return 0
    }

    try {
      // Mensagem exata que os leads enviam
      const targetMessage = "Olá Mestre Ye! Quero receber meu Diagnóstico Express"
      
      // Buscar todos os contatos (ou com filtros específicos se a API suportar)
      // Como a API não tem filtro direto por mensagem, vamos buscar todos os contatos
      const contacts = await this.searchContacts({})
      
      if (!contacts || contacts.length === 0) {
        console.log('Unnichat: No contacts found')
        return 0
      }

      console.log(`Unnichat: Checking ${contacts.length} contacts for diagnostic requests...`)

      // Para cada contato, verificar se enviou a mensagem alvo
      // Nota: Isso pode ser lento com muitos contatos. Pode ser necessário otimizar.
      let count = 0
      const batchSize = 10 // Processar em lotes para não sobrecarregar
      
      for (let i = 0; i < Math.min(contacts.length, 100); i += batchSize) {
        const batch = contacts.slice(i, i + batchSize)
        
        const batchPromises = batch.map(async (contact) => {
          const messages = await this.getContactMessages(contact.id)
          
          // Verificar se alguma mensagem recebida contém o texto alvo
          const hasDiagnosticRequest = messages.some(msg => 
            msg.direction === 'incoming' && 
            msg.text?.includes(targetMessage)
          )
          
          return hasDiagnosticRequest ? 1 : 0
        })
        
        const batchResults = await Promise.all(batchPromises)
        count += batchResults.reduce((sum, val) => sum + val, 0)
        
        console.log(`Unnichat: Processed ${i + batch.length}/${contacts.length} contacts, found ${count} requests so far`)
      }

      console.log(`Unnichat: Total diagnostic requests found: ${count}`)
      return count

    } catch (error) {
      console.error('Error counting Unnichat diagnostic requests:', error)
      
      // Fallback para valor manual se API falhar
      const manualValue = process.env.UNNICHAT_DIAGNOSTICO_REQUESTS
      if (manualValue) {
        const count = parseInt(manualValue, 10)
        console.log(`Unnichat: Using manual fallback value of ${count} requests after error`)
        return count
      }
      
      return 0
    }
  }
}

// Singleton instance
export const unnichatClient = new UnnichatClient()
