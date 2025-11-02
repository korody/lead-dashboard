const https = require('https');
const fs = require('fs');

// Ler .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const AC_API_URL = envContent.match(/ACTIVECAMPAIGN_API_URL=(.+)/)[1].trim();
const AC_API_KEY = envContent.match(/ACTIVECAMPAIGN_API_KEY=(.+)/)[1].trim();

console.log('🔍 Testando API do ActiveCampaign - Buscar contactData\n');
console.log(`API URL: ${AC_API_URL}`);
console.log(`API Key: ${AC_API_KEY ? '✓ configurada' : '✗ não encontrada'}\n`);

// Primeiro, buscar um contato com fieldData incluído
const url = new URL(`${AC_API_URL}/api/3/contacts?tagid=583&limit=2`);

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
      
      if (contacts.length > 0) {
        const contactId = contacts[0].id;
        console.log(`📧 Buscando detalhes completos do contato ${contactId}...\n`);
        
        // Buscar detalhes completos incluindo fieldData
        const detailUrl = new URL(`${AC_API_URL}/api/3/contacts/${contactId}?include=fieldData`);
        const detailOpts = {
          hostname: detailUrl.hostname,
          path: detailUrl.pathname + detailUrl.search,
          method: 'GET',
          headers: {
            'Api-Token': AC_API_KEY
          }
        };
        
        const detailReq = https.request(detailOpts, (detailRes) => {
          let detailData = '';
          detailRes.on('data', chunk => detailData += chunk);
          detailRes.on('end', () => {
            try {
              const detailJson = JSON.parse(detailData);
              console.log('📦 Resposta completa:\n');
              console.log(JSON.stringify(detailJson, null, 2).substring(0, 2000));
              
              if (detailJson.contact && detailJson.contact.fieldData) {
                console.log('\n\n✅ fieldData encontrado!');
                console.log(JSON.stringify(detailJson.contact.fieldData, null, 2));
              }
              
              if (detailJson.fieldData) {
                console.log('\n\n✅ fieldData na raiz encontrado!');
                console.log(JSON.stringify(detailJson.fieldData, null, 2));
              }
            } catch (e) {
              console.error('❌ Erro ao parsear detalhes:', e.message);
            }
          });
        });
        
        detailReq.on('error', (e) => console.error('❌ Erro:', e.message));
        detailReq.end();
      }
      
    } catch (e) {
      console.error('❌ Erro ao parsear resposta:', e.message);
    }
  });
});

req.on('error', (e) => {
  console.error('❌ Erro na requisição:', e.message);
});

req.end();
