const https = require('https');
const fs = require('fs');

// Ler .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const AC_API_URL = envContent.match(/ACTIVECAMPAIGN_API_URL=(.+)/)[1].trim();
const AC_API_KEY = envContent.match(/ACTIVECAMPAIGN_API_KEY=(.+)/)[1].trim();

console.log('🔍 Testando include com fieldData\n');

// Testar com apenas 1 contato para ver estrutura completa
const url = new URL(`${AC_API_URL}/api/3/contacts?tagid=583&limit=1&include=fieldData`);

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
  res.on('data', (chunk) => { data += chunk; });
  res.on('end', () => {
    try {
      const json = JSON.parse(data);
      
      // Salvar resposta completa
      fs.writeFileSync('ac-response-fielddata.json', JSON.stringify(json, null, 2));
      console.log('✅ Resposta salva em ac-response-fielddata.json\n');
      
      const contacts = json.contacts || [];
      console.log(`📧 ${contacts.length} contato(s) retornado(s)\n`);
      
      if (contacts.length > 0) {
        const contact = contacts[0];
        console.log(`Email: ${contact.email}`);
        console.log(`ID: ${contact.id}`);
        console.log(`cdate: ${contact.cdate}\n`);
        
        // Verificar fieldData no nível raiz
        if (json.fieldData && json.fieldData.length > 0) {
          console.log('✅ fieldData encontrado no nível raiz:');
          json.fieldData.forEach(fd => {
            console.log(`   ID: ${fd.id} | Contact: ${fd.contact} | Field: ${fd.field} | Value: "${fd.value}"`);
            if (fd.field === '150') {
              console.log('   ⭐⭐⭐ CAMPO 150 ENCONTRADO! ⭐⭐⭐');
            }
          });
        } else {
          console.log('⚠️  Nenhum fieldData no nível raiz');
        }
        
        // Verificar fieldData no contato
        if (contact.fieldData && contact.fieldData.length > 0) {
          console.log('\n✅ fieldData encontrado no contato:');
          contact.fieldData.forEach(fd => {
            console.log(`   ID: ${fd.id} | Field: ${fd.field} | Value: "${fd.value}"`);
            if (fd.field === '150') {
              console.log('   ⭐⭐⭐ CAMPO 150 ENCONTRADO! ⭐⭐⭐');
            }
          });
        } else {
          console.log('\n⚠️  Nenhum fieldData no contato');
        }
        
        // Verificar fieldValues
        if (contact.fieldValues && contact.fieldValues.length > 0) {
          console.log('\n📝 fieldValues (apenas IDs):');
          console.log(`   Total: ${contact.fieldValues.length}`);
          console.log(`   Valores: ${contact.fieldValues.slice(0, 5).join(', ')}...`);
        }
      }
      
    } catch (e) {
      console.error('❌ Erro:', e.message);
    }
  });
});

req.on('error', (e) => console.error('❌ Erro:', e.message));
req.end();
