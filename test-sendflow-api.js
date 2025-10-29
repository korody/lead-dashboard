/**
 * Teste manual da API SendFlow (API REST Real)
 * Documentação mostra: Endpoint https://sendFlow.me/api/sendapi
 */

// Vamos testar diferentes combinações de URL
const TESTS = [
  { base: 'https://sendflow.me/api', path: '/sendapi/releases' },
  { base: 'https://sendflow.pro', path: '/api/sendapi/releases' },
  { base: 'https://api.sendflow.pro', path: '/sendapi/releases' },
  { base: 'https://api.sendflow.me', path: '/sendapi/releases' },
]

const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'
const RELEASE_ID = 'wg2d0SAmMwoRt0kBOVG'

async function testSendFlowAPI() {
  console.log('='.repeat(60))
  console.log('TESTE DA API SENDFLOW (REST API) - Múltiplas URLs')
  console.log('='.repeat(60))
  console.log('')
  
  for (let i = 0; i < TESTS.length; i++) {
    const test = TESTS[i]
    const url = `${test.base}${test.path}/${RELEASE_ID}`
    
    console.log(`🧪 Teste ${i+1}:`)
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
          return // Para no primeiro sucesso
        } catch (e) {
          console.log('  ⚠️ Status 200 mas resposta não é JSON')
        }
      } else {
        console.log('  ❌ Erro')
      }
    } catch (error) {
      console.log('  ❌ Exceção:', error.message)
    }
    
    console.log('')
  }
  
  console.log('='.repeat(60))
}

testSendFlowAPI().catch(console.error)
