const https = require('https');
const fs = require('fs');

// Ler .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const AC_API_URL = envContent.match(/ACTIVECAMPAIGN_API_URL=(.+)/)[1].trim();
const AC_API_KEY = envContent.match(/ACTIVECAMPAIGN_API_KEY=(.+)/)[1].trim();

console.log('🔍 Testando busca do fieldValue 150 diretamente\n');

// Pegar um dos IDs de fieldValue que vimos antes
const fieldValueId = '3711682'; // Do primeiro contato de teste

const url = new URL(`${AC_API_URL}/api/3/fieldValues/${fieldValueId}`);

const options = {
  hostname: url.hostname,
  path: url.pathname,
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
      console.log('✅ Resposta:\n');
      console.log(JSON.stringify(json, null, 2));
      
      if (json.fieldValue) {
        const fv = json.fieldValue;
        console.log(`\n📝 FieldValue:`);
        console.log(`   ID: ${fv.id}`);
        console.log(`   Contact: ${fv.contact}`);
        console.log(`   Field: ${fv.field}`);
        console.log(`   Value: "${fv.value}"`);
        
        if (fv.field === '150') {
          console.log('\n   ⭐⭐⭐ É O CAMPO 150! ⭐⭐⭐');
        }
      }
      
    } catch (e) {
      console.error('❌ Erro:', e.message);
      console.log('Resposta raw:', data);
    }
  });
});

req.on('error', (e) => console.error('❌ Erro:', e.message));
req.end();
