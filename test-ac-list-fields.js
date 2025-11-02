const https = require('https');
const fs = require('fs');

// Ler .env.local manualmente
const envContent = fs.readFileSync('.env.local', 'utf8');
const AC_API_URL = envContent.match(/ACTIVECAMPAIGN_API_URL=(.+)/)[1].trim();
const AC_API_KEY = envContent.match(/ACTIVECAMPAIGN_API_KEY=(.+)/)[1].trim();

console.log('📊 Buscando lista de campos (fields) do ActiveCampaign...\n');

const url = new URL(`${AC_API_URL}/api/3/fields`);

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
      const fields = json.fields || [];
      
      console.log(`✅ ${fields.length} campos encontrados:\n`);
      
      fields.forEach(field => {
        console.log(`ID: ${field.id} | Título: "${field.title}" | Tipo: ${field.type}`);
        
        // Marcar campos que podem ser o que procuramos
        const title = field.title.toLowerCase();
        if (title.includes('bny') || title.includes('cadastro') || title.includes('data') || field.id === '150') {
          console.log('   ⭐⭐⭐ ESTE PODE SER O CAMPO! ⭐⭐⭐\n');
        }
      });
      
      // Salvar resultado completo em arquivo
      fs.writeFileSync('ac-fields.json', JSON.stringify(json, null, 2));
      console.log('\n📁 Resultado completo salvo em ac-fields.json');
      
    } catch (e) {
      console.error('❌ Erro:', e.message);
    }
  });
});

req.on('error', (e) => console.error('❌ Erro:', e.message));
req.end();
