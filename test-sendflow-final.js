/**
 * Teste com o ID correto da campanha BNY2 - LEADS
 */

const SENDFLOW_API_URL = 'https://sendflow.pro/sendapi'
const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'
const RELEASE_ID = 'wg2d0SAmAfwOR06KBOVG' // ID correto da campanha BNY2 - LEADS

async function testCorrectRelease() {
  console.log('='.repeat(60))
  console.log('TESTE COM ID CORRETO DA CAMPANHA')
  console.log('='.repeat(60))
  console.log('')
  
  // Teste 1: Buscar a release
  console.log('🧪 GET /releases/{releaseId}')
  const url1 = `${SENDFLOW_API_URL}/releases/${RELEASE_ID}`
  console.log('  URL:', url1)
  
  try {
    const response = await fetch(url1, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('  ✅ SUCESSO!')
      console.log(JSON.stringify(data, null, 2))
    } else {
      const error = await response.text()
      console.log('  ❌ Erro:', error.substring(0, 200))
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('-'.repeat(60))
  console.log('')
  
  // Teste 2: Buscar analytics
  console.log('🧪 GET /releases/{releaseId}/analytics')
  const url2 = `${SENDFLOW_API_URL}/releases/${RELEASE_ID}/analytics`
  console.log('  URL:', url2)
  
  try {
    const response = await fetch(url2, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SENDFLOW_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    })
    
    console.log('  Status:', response.status, response.statusText)
    
    if (response.ok) {
      const data = await response.json()
      console.log('  ✅ SUCESSO! Analytics:')
      console.log(JSON.stringify(data, null, 2))
    } else {
      const error = await response.text()
      console.log('  ❌ Erro:', error.substring(0, 200))
    }
  } catch (error) {
    console.log('  ❌ Exceção:', error.message)
  }
  
  console.log('')
  console.log('='.repeat(60))
}

testCorrectRelease().catch(console.error)
