require('dotenv').config({ path: '.env.local' });
const https = require('https');

const AC_API_URL = process.env.ACTIVECAMPAIGN_API_URL;
const AC_API_KEY = process.env.ACTIVECAMPAIGN_API_KEY;

console.log('🔍 Testando fieldValues do ActiveCampaign\n');
console.log(`API URL: ${AC_API_URL}`);
console.log(`API Key: ${AC_API_KEY ? '✓ configurada' : '✗ não encontrada'}\n`);

const url = new URL(`${AC_API_URL}/api/3/contacts?tagid=583&limit=2&include=fieldValues`);

const options = {
  hostname: url.hostname,
  path: url.pathname + url.search,
  method: 'GET',
  headers: {
    'Api-Token': AC_API_KEY
  }
};

const req = https.request(options, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      const contacts = json.contacts || [];
      
      console.log(`✅ ${contacts.length} contatos encontrados\n`);
      
      contacts.forEach((contact, index) => {
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
        console.log(`📧 CONTATO ${index + 1}: ${contact.email}`);
        console.log(`   ID: ${contact.id}`);
        console.log(`   cdate: ${contact.cdate}`);
        console.log(`   udate: ${contact.udate}`);
        
        const fieldValues = contact.fieldValues || [];
        console.log(`\n   📝 fieldValues: ${fieldValues.length} campos`);
        
        if (fieldValues.length === 0) {
          console.log('   ⚠️  NENHUM fieldValue encontrado!\n');
        } else {
          fieldValues.forEach((fv, i) => {
            console.log(`\n   [${i + 1}] field: "${fv.field}"`);
            console.log(`       value: "${fv.value}"`);
            
            // Verificar se é o campo que procuramos
            const fieldStr = String(fv.field);
            if (fieldStr.includes('150') || 
                fieldStr.toUpperCase().includes('BNY') || 
                fieldStr.toLowerCase().includes('cadastro') ||
                fieldStr.toLowerCase().includes('data')) {
              console.log('       ⭐⭐⭐ ESTE PODE SER O CAMPO! ⭐⭐⭐');
            }
          });
        }
        console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);
      });
      
    } catch (e) {
      console.error('❌ Erro ao parsear resposta:', e.message);
      console.log('Resposta:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.end();
