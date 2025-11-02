const https = require('https');

const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;
const AC_BASE_URL = process.env.ACTIVECAMPAIGN_BASE_URL;

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Api-Token': AC_API_KEY
      }
    };
    
    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

async function testFieldValues() {
  try {
    console.log('🔍 Buscando contatos com fieldValues...\n');
    
    // Pegar apenas 3 contatos para teste
    const response = await makeRequest(
      `${AC_BASE_URL}/api/3/contacts?tagid=583&limit=3&include=fieldValues`
    );

    const contacts = response.contacts || [];
    
    console.log(`✅ ${contacts.length} contatos encontrados\n`);
    
    for (const contact of contacts) {
      console.log(`\n📧 Contato: ${contact.email}`);
      console.log(`   ID: ${contact.id}`);
      console.log(`   cdate: ${contact.cdate}`);
      console.log(`   udate: ${contact.udate}`);
      
      const fieldValues = contact.fieldValues || [];
      console.log(`\n   📝 fieldValues (${fieldValues.length}):`);
      
      if (fieldValues.length === 0) {
        console.log('   ⚠️  NENHUM campo customizado encontrado!');
      } else {
        for (const fv of fieldValues) {
          console.log(`      - field: "${fv.field}"`);
          console.log(`        value: "${fv.value}"`);
          console.log('');
        }
      }
      
      console.log('   ---');
    }
    
    // Buscar também os campos disponíveis
    console.log('\n\n🔧 Buscando lista de campos customizados disponíveis...\n');
    
    const fieldsResponse = await makeRequest(
      `${AC_BASE_URL}/api/3/fields`
    );
    
    const fields = fieldsResponse.fields || [];
    console.log(`✅ ${fields.length} campos encontrados:\n`);
    
    for (const field of fields) {
      console.log(`   ${field.id}: ${field.title} (type: ${field.type})`);
      if (field.title.toLowerCase().includes('cadastro') || 
          field.title.toLowerCase().includes('data') ||
          field.title.toLowerCase().includes('bny')) {
        console.log(`      ⭐ ESTE PODE SER O CAMPO QUE PROCURAMOS!`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
    console.error(error);
  }
}

testFieldValues();
