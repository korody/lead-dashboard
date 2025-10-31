// Script para listar campos customizados do ActiveCampaign
// Execução: node test-ac-fields.js

// Ler .env.local manualmente
const fs = require('fs')
const path = require('path')

const envPath = path.join(__dirname, '.env.local')
const envContent = fs.readFileSync(envPath, 'utf-8')

const env = {}
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/)
  if (match) {
    env[match[1].trim()] = match[2].trim()
  }
})

const AC_API_URL = env.ACTIVECAMPAIGN_API_URL
const AC_API_KEY = env.ACTIVECAMPAIGN_API_KEY

async function listFields() {
  try {
    console.log('🔍 Buscando campos customizados do ActiveCampaign...\n')
    
    const url = `${AC_API_URL}/api/3/fields?limit=100`
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Api-Token': AC_API_KEY,
        'Content-Type': 'application/json',
      },
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.status}`)
    }
    
    const data = await response.json()
    const fields = data.fields || []
    
    console.log(`✅ Encontrados ${fields.length} campos\n`)
    console.log('═'.repeat(80))
    
    fields.forEach(field => {
      console.log(`\n📋 Campo: ${field.title}`)
      console.log(`   🆔 ID: ${field.id}`)
      console.log(`   📝 Tipo: ${field.type}`)
      console.log(`   🏷️  Tag: ${field.perstag || 'N/A'}`)
      console.log(`   ─`.repeat(40))
      
      // Destacar o campo BNY2
      if (field.title?.includes('BNY2') || field.title?.includes('Data do Cadastro')) {
        console.log(`   ⭐ >>> ESSE É O CAMPO QUE VOCÊ PROCURA! <<<`)
        console.log(`   ⭐ Adicione no .env.local:`)
        console.log(`   ⭐ ACTIVECAMPAIGN_CUSTOM_DATE_FIELD_ID=${field.id}`)
      }
    })
    
    console.log('\n' + '═'.repeat(80))
    console.log('\n✅ Busca concluída!')
    
  } catch (error) {
    console.error('❌ Erro:', error.message)
  }
}

listFields()
