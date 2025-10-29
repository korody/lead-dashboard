/**
 * Teste manual da API SendFlow
 */

const SENDFLOW_API_URL = 'https://sendflow.pro'
const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'
const CAMPAIGN_ID = 'wg2d0SAmMwoRt0kBOVG'

async function testSendFlowAPI() {
  console.log('='.repeat(60))
  console.log('TESTE DA API SENDFLOW')
  console.log('='.repeat(60))
  console.log('')
  
  console.log('📋 Configurações:')
  console.log('  API URL:', SENDFLOW_API_URL)
  console.log('  Campaign ID:', CAMPAIGN_ID)
  console.log('  Token (primeiros 30 chars):', SENDFLOW_API_TOKEN.substring(0, 30) + '...')
  console.log('')
  
  // Teste 1: Endpoint original da documentação
  console.log('🧪 Teste 1: GET /whats/campaigns/{id}/overview')
  const url1 = `${SENDFLOW_API_URL}/whats/campaigns/${CAMPAIGN_ID}/overview`
  console.log('  URL:', url1)
  
  try {
    const response1 = await fetch(url1, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response1.status, response1.statusText)
    console.log('  Headers:', JSON.stringify(Object.fromEntries(response1.headers.entries()), null, 2))
    
    const text1 = await response1.text()
    console.log('  Response body:', text1.substring(0, 500))
    
    if (response1.ok) {
      try {
        const data = JSON.parse(text1)
        console.log('  ✅ Dados recebidos:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
      }
    } else {
      console.log('  ❌ Erro na requisição')
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('-'.repeat(60))
  console.log('')
  
  // Teste 2: Tentar sem /api no caminho
  console.log('🧪 Teste 2: Tentando sem /api no path')
  const url2 = `https://sendflow.pro/whats/campaigns/${CAMPAIGN_ID}/overview`
  console.log('  URL:', url2)
  
  try {
    const response2 = await fetch(url2, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response2.status, response2.statusText)
    
    const text2 = await response2.text()
    console.log('  Response body:', text2.substring(0, 500))
    
    if (response2.ok) {
      try {
        const data = JSON.parse(text2)
        console.log('  ✅ Dados recebidos:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
      }
    } else {
      console.log('  ❌ Erro na requisição')
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('-'.repeat(60))
  console.log('')
  
  // Teste 3: Tentar com v1 no path
  console.log('🧪 Teste 3: Tentando com /v1 no path')
  const url3 = `${SENDFLOW_API_URL}/v1/whats/campaigns/${CAMPAIGN_ID}/overview`
  console.log('  URL:', url3)
  
  try {
    const response3 = await fetch(url3, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response3.status, response3.statusText)
    
    const text3 = await response3.text()
    console.log('  Response body:', text3.substring(0, 500))
    
    if (response3.ok) {
      try {
        const data = JSON.parse(text3)
        console.log('  ✅ Dados recebidos:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
      }
    } else {
      console.log('  ❌ Erro na requisição')
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  // Teste 4: Tentar com /api no início
  console.log('🧪 Teste 4: Tentando com /api antes de /whats')
  const url4 = `https://sendflow.pro/api/whats/campaigns/${CAMPAIGN_ID}`
  console.log('  URL:', url4)
  
  try {
    const response4 = await fetch(url4, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response4.status, response4.statusText)
    
    const text4 = await response4.text()
    console.log('  Response body:', text4.substring(0, 500))
    
    if (response4.ok) {
      try {
        const data = JSON.parse(text4)
        console.log('  ✅ Dados recebidos:', JSON.stringify(data, null, 2))
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
      }
    } else {
      console.log('  ❌ Erro na requisição')
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('-'.repeat(60))
  console.log('')
  
  // Teste 5: Verificar o endpoint de API docs
  console.log('🧪 Teste 5: Verificando /api/docs')
  const url5 = `https://sendflow.pro/api/docs`
  console.log('  URL:', url5)
  
  try {
    const response5 = await fetch(url5, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
      },
    })
    
    console.log('  Status:', response5.status, response5.statusText)
    
    const text5 = await response5.text()
    console.log('  Response body (primeiros 500 chars):', text5.substring(0, 500))
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('='.repeat(60))
}

testSendFlowAPI().catch(console.error)
