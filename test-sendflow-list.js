/**
 * Teste: Listar todas as campanhas do usuário
 */

const SENDFLOW_API_URL = 'https://sendflow.pro/sendapi'
const SENDFLOW_API_TOKEN = 'send_api-a3lrpaowqjg9ap3myksso3e3p9ri5aafas3l6qnw'

async function listUserCampaigns() {
  console.log('='.repeat(60))
  console.log('LISTAR CAMPANHAS DO USUÁRIO')
  console.log('='.repeat(60))
  console.log('')
  
  // Endpoint para buscar todas as campanhas
  const url = `${SENDFLOW_API_URL}/releases`
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
        console.log('  ✅ SUCESSO! Campanhas encontradas:')
        console.log(JSON.stringify(data, null, 2))
        
        // Se for um array, mostrar resumo
        if (Array.isArray(data)) {
          console.log('')
          console.log(`📊 Total de campanhas: ${data.length}`)
          data.forEach((campaign, i) => {
            console.log(`\n  Campanha ${i + 1}:`)
            console.log(`    ID: ${campaign.id || campaign._id || 'N/A'}`)
            console.log(`    Nome: ${campaign.name || campaign.title || 'N/A'}`)
          })
        }
      } catch (e) {
        console.log('  ⚠️ Resposta não é JSON')
        console.log('  Body:', text.substring(0, 500))
      }
    } else {
      try {
        const error = JSON.parse(text)
        console.log(`  ❌ ${error.message || 'Erro'}`)
      } catch {
        console.log('  ❌ Erro:', text.substring(0, 200))
      }
    }
  } catch (error) {
    console.log(`  ❌ Exceção: ${error.message}`)
  }
  
  console.log('')
  console.log('='.repeat(60))
}

listUserCampaigns().catch(console.error)
