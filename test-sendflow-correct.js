/**
 * Teste com a Base URL correta do SendFlow
 */

const SENDFLOW_API_URL = 'https://sendflow.pro/sendapi'
const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'
const RELEASE_GROUP_ID = 'wg2d0SAmMwoRt0kBOVG'

async function testSendFlowAPI() {
  console.log('='.repeat(60))
  console.log('TESTE DA API SENDFLOW (Base URL Correta)')
  console.log('='.repeat(60))
  console.log('')
  
  console.log('📋 Configuração:')
  console.log('  Base URL:', SENDFLOW_API_URL)
  console.log('  Release Group ID:', RELEASE_GROUP_ID)
  console.log('')
  
  // Teste: GET /release-groups/{releaseGroupId}
  console.log('🧪 GET /release-groups/{releaseGroupId}')
  const url = `${SENDFLOW_API_URL}/release-groups/${RELEASE_GROUP_ID}`
  console.log('  URL:', url)
  
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response.status, response.statusText)
    
    const text = await response.text()
    
    if (response.ok) {
      try {
        const data = JSON.parse(text)
        console.log('  ✅ SUCESSO! Dados recebidos:')
        console.log(JSON.stringify(data, null, 2))
        
        // Procurar campos relacionados a participantes/membros
        console.log('')
        console.log('🔍 Campos de interesse:')
        Object.keys(data).forEach(key => {
          const lowerKey = key.toLowerCase()
          if (lowerKey.includes('member') || 
              lowerKey.includes('participant') || 
              lowerKey.includes('user') ||
              lowerKey.includes('count') ||
              lowerKey.includes('total') ||
              lowerKey.includes('grupo')) {
            console.log(`  ✓ ${key}:`, data[key])
          }
        })
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
        console.log('  Body:', text.substring(0, 500))
      }
    } else {
      console.log('  ❌ Erro')
      console.log('  Body:', text.substring(0, 500))
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('='.repeat(60))
}

testSendFlowAPI().catch(console.error)
