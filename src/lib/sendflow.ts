/**
 * SendFlow API Client
 * Documentação: https://sendflow.pro/sendapi (Base URL)
 * Autenticação: Authorization: Bearer YOUR_API_KEY
 */

interface SendFlowConfig {
  apiUrl: string
  apiToken: string
}

interface ReleaseAnalytics {
  add: {
    total: number
    dates: Record<string, number>
  }
  remove: {
    total: number
    dates: Record<string, number>
  }
  clicks: {
    total: number
    dates: Record<string, number>
  }
}

class SendFlowClient {
  private config: SendFlowConfig

  constructor() {
    this.config = {
      apiUrl: 'https://sendflow.pro/sendapi',
      apiToken: process.env.SENDFLOW_API_TOKEN || '',
    }
  }

  private isConfigured(): boolean {
    return !!this.config.apiToken
  }

  /**
   * Get release analytics with participant count
   * GET /releases/{releaseId}/analytics
   */
  async getReleaseAnalytics(releaseId: string): Promise<ReleaseAnalytics | null> {
    if (!this.isConfigured()) {
      console.warn('SendFlow API token not configured')
      return null
    }

    try {
      const url = `${this.config.apiUrl}/releases/${releaseId}/analytics`
      
      console.log('SendFlow request URL:', url)
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiToken}`,
          'Content-Type': 'application/json',
        },
      })

      console.log('SendFlow response status:', response.status, response.statusText)

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`SendFlow API error: ${response.status} ${response.statusText}`)
        console.error('SendFlow error body:', errorText.substring(0, 500))
        return null
      }

      const data = await response.json()
      
      console.log('SendFlow analytics received:', {
        added: data.add?.total || 0,
        removed: data.remove?.total || 0,
        active: (data.add?.total || 0) - (data.remove?.total || 0)
      })

      return data
    } catch (error) {
      console.error('Error fetching SendFlow analytics:', error)
      return null
    }
  }

  /**
   * Get total active participants (added - removed)
   */
  async getTotalParticipants(releaseId: string): Promise<number> {
    const analytics = await this.getReleaseAnalytics(releaseId)
    
    if (!analytics) {
      // Fallback para valor manual se API falhar
      const manualValue = process.env.SENDFLOW_PARTICIPANTES_GRUPOS
      if (manualValue) {
        const participantes = parseInt(manualValue, 10)
        console.log(`SendFlow: Using manual fallback value of ${participantes} participants`)
        return participantes
      }
      return 0
    }
    
    // Calcular participantes ativos: total adicionado - total removido
    const added = analytics.add?.total || 0
    const removed = analytics.remove?.total || 0
    const active = added - removed
    
    console.log(`SendFlow: ${active} active participants (${added} added - ${removed} removed)`)
    
    return active
  }

  /**
   * Get total groups count
   */
  async getTotalGroups(releaseId: string): Promise<number> {
    // Por enquanto não temos endpoint específico para contar grupos
    return 0
  }
}

// Singleton instance
export const sendFlowClient = new SendFlowClient()
