/**
 * Teste de múltiplos endpoints SendFlow
 */

const SENDFLOW_API_URL = 'https://sendflow.pro/sendapi'
const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'
const CAMPAIGN_ID = 'wg2d0SAmMwoRt0kBOVG'

const ENDPOINTS = [
  { path: `/releases/${CAMPAIGN_ID}`, desc: 'Buscar release/campanha' },
  { path: `/releases/${CAMPAIGN_ID}/analytics`, desc: 'Analytics da release' },
  { path: `/release-groups?campaignId=${CAMPAIGN_ID}`, desc: 'Grupos da campanha' },
]

async function testEndpoints() {
  console.log('='.repeat(60))
  console.log('TESTE DE ENDPOINTS SENDFLOW')
  console.log('='.repeat(60))
  console.log('')
  
  for (const endpoint of ENDPOINTS) {
    console.log(`🧪 ${endpoint.desc}`)
    const url = `${SENDFLOW_API_URL}${endpoint.path}`
    console.log(`  URL: ${url}`)
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      })
      
      console.log(`  Status: ${response.status} ${response.statusText}`)
      
      const text = await response.text()
      
      if (response.ok) {
        try {
          const data = JSON.parse(text)
          console.log('  ✅ SUCESSO!')
          console.log(JSON.stringify(data, null, 2))
          break // Para no primeiro sucesso
        } catch (e) {
          console.log('  ⚠️ Não é JSON')
        }
      } else {
        try {
          const error = JSON.parse(text)
          console.log(`  ❌ ${error.message || 'Erro'}`)
        } catch {
          console.log('  ❌ Erro')
        }
      }
    } catch (error) {
      console.log(`  ❌ Exceção: ${error.message}`)
    }
    
    console.log('')
  }
  
  console.log('='.repeat(60))
}

testEndpoints().catch(console.error)
