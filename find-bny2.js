const fs = require('fs');
const path = require('path');

// Ler o arquivo .env.local
const envPath = path.join(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');

// Parse manual das variáveis
const envVars = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const [key, ...valueParts] = trimmed.split('=');
    envVars[key.trim()] = valueParts.join('=').trim();
  }
});

const API_URL = envVars.ACTIVECAMPAIGN_API_URL;
const API_KEY = envVars.ACTIVECAMPAIGN_API_KEY;

if (!API_URL || !API_KEY) {
  console.error('❌ Erro: ACTIVECAMPAIGN_API_URL ou ACTIVECAMPAIGN_API_KEY não encontrado no .env.local');
  process.exit(1);
}

console.log('🔍 Buscando campo BNY2 no ActiveCampaign...\n');

async function findBNY2() {
  try {
    let allFields = [];
    let offset = 0;
    const limit = 100;
    let hasMore = true;

    // Buscar TODOS os campos
    while (hasMore) {
      const response = await fetch(`${API_URL}/api/3/fields?limit=${limit}&offset=${offset}`, {
        method: 'GET',
        headers: {
          'Api-Token': API_KEY,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const fields = data.fields || [];
      
      allFields = allFields.concat(fields);
      
      hasMore = fields.length === limit;
      offset += limit;
      
      console.log(`📦 Carregados ${allFields.length} campos...`);
    }

    console.log(`\n✅ Total: ${allFields.length} campos\n`);
    console.log('═'.repeat(80));
    
    // Buscar campos que mencionam BNY2
    console.log('\n🔎 Campos que contêm "BNY2":\n');
    
    const bny2Fields = allFields.filter(field => 
      field.title?.toUpperCase().includes('BNY2') || 
      field.perstag?.toUpperCase().includes('BNY2')
    );
    
    if (bny2Fields.length === 0) {
      console.log('❌ Nenhum campo encontrado com "BNY2" no título ou tag.\n');
      console.log('📋 Listando todos os campos "BNY":\n');
      
      // Buscar qualquer campo BNY
      const bnyFields = allFields.filter(field => 
        field.title?.toUpperCase().includes('BNY') || 
        field.perstag?.toUpperCase().includes('BNY')
      );
      
      bnyFields.forEach(field => {
        console.log(`📋 ${field.title}`);
        console.log(`   🆔 ID: ${field.id}`);
        console.log(`   📝 Tipo: ${field.type}`);
        console.log(`   🏷️  Tag: %${field.perstag}%`);
        console.log('   ' + '─'.repeat(76));
      });
    } else {
      bny2Fields.forEach(field => {
        console.log(`⭐ ENCONTRADO!`);
        console.log(`📋 ${field.title}`);
        console.log(`   🆔 ID: ${field.id}`);
        console.log(`   📝 Tipo: ${field.type}`);
        console.log(`   🏷️  Tag: %${field.perstag}%`);
        console.log('\n   ✅ Adicione no .env.local:');
        console.log(`   ✅ ACTIVECAMPAIGN_CUSTOM_DATE_FIELD_ID=${field.id}\n`);
        console.log('   ' + '─'.repeat(76));
      });
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    process.exit(1);
  }
}

findBNY2();
