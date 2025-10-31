import re

# Ler arquivo
with open('src/lib/activecampaign.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# PASSO 1: Adicionar variável de ambiente para custom field
content = content.replace(
    "const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL // Ex: https://seudominio.api-us1.com\nconst AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY",
    "const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL // Ex: https://seudominio.api-us1.com\nconst AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY\nconst AC_CUSTOM_FIELD_ID = process.env.ACTIVECAMPAIGN_CUSTOM_DATE_FIELD_ID"
)

# PASSO 2: Adicionar customFieldId no constructor
content = content.replace(
    "export class ActiveCampaignClient {\n  private baseUrl: string\n  private apiKey: string",
    "export class ActiveCampaignClient {\n  private baseUrl: string\n  private apiKey: string\n  private customFieldId?: string"
)

content = content.replace(
    "    } else {\n      this.baseUrl = AC_API_URL.replace(/\\/$/, '') // Remove trailing slash\n      this.apiKey = AC_API_KEY\n    }",
    "    } else {\n      this.baseUrl = AC_API_URL.replace(/\\/$/, '') // Remove trailing slash\n      this.apiKey = AC_API_KEY\n      this.customFieldId = AC_CUSTOM_FIELD_ID\n    }"
)

# PASSO 3: Adicionar método otimizado
optimized_method = '''
  /**
   * OTIMIZADO: Busca fieldValues diretamente (não contatos individuais)
   * Reduz de 5.920 chamadas para ~60 chamadas
   */
  async getContactsByTagAndCustomDate(
    tagId: number, 
    days: number = 30, 
    customFieldId?: string
  ): Promise<{ total: number; byDay: Record<string, number> }> {
    if (!this.isConfigured()) {
      return { total: 0, byDay: {} }
    }

    const fieldId = customFieldId || this.customFieldId

    if (!fieldId) {
      console.warn('⚠️ Campo customizado não configurado')
      return { total: 0, byDay: {} }
    }

    try {
      console.log(`📊 ActiveCampaign OTIMIZADO: Buscando fieldValues do campo ${fieldId}...`)
      
      const byDay: Record<string, number> = {}
      const dataLimite = new Date(Date.now() - days * 24 * 60 * 60 * 1000)
      const dataLimiteStr = dataLimite.toISOString().split('T')[0]
      
      let offset = 0
      const limit = 100
      let totalProcessado = 0
      let comValor = 0
      
      while (true) {
        const url = `${this.baseUrl}/api/3/fieldValues?filters[field]=${fieldId}&limit=${limit}&offset=${offset}`
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Api-Token': this.apiKey,
            'Content-Type': 'application/json',
          },
        })

        if (!response.ok) {
          console.error(`ActiveCampaign API error: ${response.status}`)
          break
        }

        const data = await response.json()
        const fieldValues = data.fieldValues || []
        
        if (fieldValues.length === 0) break
        
        for (const fv of fieldValues) {
          totalProcessado++
          
          if (fv.value) {
            comValor++
            let dataCadastro: Date | null = null
            
            if (fv.value.match(/^\\d{2}\\/\\d{2}\\/\\d{4}$/)) {
              const [dia, mes, ano] = fv.value.split('/')
              dataCadastro = new Date(`${ano}-${mes}-${dia}`)
            } else {
              dataCadastro = new Date(fv.value)
            }
            
            if (dataCadastro && !isNaN(dataCadastro.getTime())) {
              const dia = dataCadastro.toISOString().split('T')[0]
              
              if (dia >= dataLimiteStr) {
                byDay[dia] = (byDay[dia] || 0) + 1
              }
            }
          }
        }
        
        const total = parseInt(data.meta?.total || '0', 10)
        
        if (offset === 0) {
          console.log(`  📊 Total de field values: ${total}`)
        }
        
        if (totalProcessado >= total) break
        
        offset += limit
        
        if (offset % 500 === 0) {
          console.log(`  📦 Processados ${totalProcessado}/${total}...`)
        }
      }
      
      const dentroIntervalo = Object.values(byDay).reduce((sum, count) => sum + count, 0)
      
      console.log(`✅ RÁPIDO - Processados ${comValor} valores, ${dentroIntervalo} nos últimos ${days} dias`)
      
      return {
        total: dentroIntervalo,
        byDay
      }
    } catch (error: any) {
      console.error('Error fetching field values:', error)
      return { total: 0, byDay: {} }
    }
  }

  /**
   * @deprecated Use getContactsByTagAndCustomDate
   */
  async getRecentContactsByTag(tagId: number, days: number = 30): Promise<{ total: number; byDay: Record<string, number> }> {
    return this.getContactsByTagAndCustomDate(tagId, days)
  }
'''

# Inserir antes do export final
content = content.replace(
    "export const activeCampaignClient = new ActiveCampaignClient()",
    optimized_method + "\n}\n\nexport const activeCampaignClient = new ActiveCampaignClient()"
)

# Salvar
with open('src/lib/activecampaign.ts', 'w', encoding='utf-8') as f:
    f.write(content)

print("✅ Arquivo otimizado com sucesso!")
