const https = require('https');
const fs = require('fs');

// Ler .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const AC_API_URL = envContent.match(/ACTIVECAMPAIGN_API_URL=(.+)/)[1].trim();
const AC_API_KEY = envContent.match(/ACTIVECAMPAIGN_API_KEY=(.+)/)[1].trim();

console.log('🔍 Buscando todos os fieldValues do campo 150\n');

// Buscar fieldValues filtrados por field=150
const url = new URL(`${AC_API_URL}/api/3/fieldValues?filters[fieldid]=150&limit=10`);

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
      
      console.log('✅ Resposta:\n');
      console.log(JSON.stringify(json, null, 2).substring(0, 1500));
      
      const fieldValues = json.fieldValues || [];
      console.log(`\n\n📝 Total de fieldValues encontrados: ${fieldValues.length}`);
      
      if (fieldValues.length > 0) {
        console.log('\n✅ Primeiros valores do campo 150:\n');
        fieldValues.slice(0, 5).forEach((fv, i) => {
          console.log(`[${i + 1}] Contact ID: ${fv.contact} | Value: "${fv.value}" | Date: ${fv.cdate}`);
        });
      } else {
        console.log('\n⚠️  NENHUM fieldValue encontrado para o campo 150!');
        console.log('Isso significa que o campo 150 NÃO está preenchido nos contatos.');
      }
      
    } catch (e) {
      console.error('❌ Erro:', e.message);
      console.log('Resposta raw:', data.substring(0, 500));
    }
  });
});

req.on('error', (e) => console.error('❌ Erro:', e.message));
req.end();
