const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = 'Bearer 68aaf071-82e8-4771-aaab-2963ec81add5';

console.log('============================================================');
console.log('TESTE UNNICHAT - CONTAGEM POR TAG');
console.log('============================================================\n');

async function testUnnichatTag() {
  try {
    // Buscar diretamente a tag #SIM-DIAGNOSTICO
    console.log('🧪 Teste 1: POST /tags/search (buscar tag específica)');
    console.log(`  URL: ${UNNICHAT_API_URL}/tags/search`);
    
    const tagNames = ['#SIM-DIAGNOSTICO', 'SIM-DIAGNOSTICO', '#sim-diagnostico'];
    let diagnosticoTag = null;
    
    for (const tagName of tagNames) {
      console.log(`\n  Tentando buscar tag: "${tagName}"`);
      
      const tagsResponse = await fetch(`${UNNICHAT_API_URL}/tags/search`, {
        method: 'POST',
        headers: {
          'Authorization': UNNICHAT_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: tagName })
      });

      console.log(`  Status: ${tagsResponse.status} ${tagsResponse.statusText}`);

      if (tagsResponse.ok) {
        const response = await tagsResponse.json();
        console.log(`  ✅ Resposta recebida:`, response);
        
        const tags = response.data || response;
        
        if (tags && (Array.isArray(tags) ? tags.length > 0 : tags.id)) {
          diagnosticoTag = Array.isArray(tags) ? tags[0] : tags;
          console.log(`  🎯 TAG ENCONTRADA: ${diagnosticoTag.name} (ID: ${diagnosticoTag.id})`);
          break;
        }
      } else {
        const errorText = await tagsResponse.text();
        console.log(`  ❌ ERRO:`, errorText);
      }
    }
    
    if (diagnosticoTag) {
          console.log(`\n  🎯 TAG ENCONTRADA: ${diagnosticoTag.name} (ID: ${diagnosticoTag.id})`);
          
          // Agora tentar buscar contatos com essa tag
          console.log(`\n🧪 Teste 2: POST /contact/search (buscar por tag + name)`);
          console.log(`  Buscando contatos com tag: ${diagnosticoTag.name}`);
          
          // Tentar diferentes combinações
          const payloads = [
            { name: " ", tags: [diagnosticoTag.id] }, // Nome com espaço + tag
            { phone: "55", tags: [diagnosticoTag.id] }, // Telefone BR + tag
            { name: "", tags: [diagnosticoTag.id] }, // Nome vazio + tag
          ];
          
          for (const payload of payloads) {
            console.log(`\n  Tentando payload:`, JSON.stringify(payload));
            
            const contactsResponse = await fetch(`${UNNICHAT_API_URL}/contact/search`, {
              method: 'POST',
              headers: {
                'Authorization': UNNICHAT_TOKEN,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(payload)
            });

            console.log(`  Status: ${contactsResponse.status} ${contactsResponse.statusText}`);

            if (contactsResponse.ok) {
              const response = await contactsResponse.json();
              const contacts = response.data || response;
              console.log(`  ✅ SUCESSO!`);
              console.log(`\n  📊 TOTAL DE WHATSAPPS INICIADOS: ${Array.isArray(contacts) ? contacts.length : 0}`);
              console.log(`     (Contatos com tag ${diagnosticoTag.name})\n`);
              return;
            } else {
              const errorText = await contactsResponse.text();
              console.log(`  ❌ ERRO:`, errorText.substring(0, 100));
            }
          }
          
          console.log(`\n  ⚠️  Não conseguiu buscar contatos por tag`);
          console.log(`     A API do Unnichat pode não suportar filtro apenas por tag\n`);
        } else {
          console.log('\n  ⚠️  Tag #SIM-DIAGNOSTICO não encontrada');
          console.log('     Tentou buscar: #SIM-DIAGNOSTICO, SIM-DIAGNOSTICO, #sim-diagnostico');
          console.log('     Verifique o nome exato da tag no Unnichat\n');
        }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testUnnichatTag();

console.log('============================================================');
