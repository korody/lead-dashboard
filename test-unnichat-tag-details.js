const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = 'Bearer 68aaf071-82e8-4771-aaab-2963ec81add5';
const TAG_ID = '019a0928-07ee-7734-99f5-571f7c6d0d3f'; // SIM-DIAGNOSTICO

console.log('============================================================');
console.log('TESTE UNNICHAT - BUSCAR DETALHES DA TAG');
console.log('============================================================\n');

async function testTagDetails() {
  try {
    // Buscar detalhes da tag pelo ID
    console.log('🧪 GET /tags/{id} (buscar detalhes da tag)');
    console.log(`  URL: ${UNNICHAT_API_URL}/tags/${TAG_ID}`);
    
    const tagResponse = await fetch(`${UNNICHAT_API_URL}/tags/${TAG_ID}`, {
      method: 'GET',
      headers: {
        'Authorization': UNNICHAT_TOKEN,
        'Content-Type': 'application/json',
      },
    });

    console.log(`  Status: ${tagResponse.status} ${tagResponse.statusText}\n`);

    if (tagResponse.ok) {
      const tagData = await tagResponse.json();
      console.log('  ✅ SUCESSO! Dados da tag:');
      console.log(JSON.stringify(tagData, null, 2));
      
      // Verificar se há contador de contatos
      if (tagData.contactCount || tagData.count || tagData.contacts || tagData.totalContacts) {
        const count = tagData.contactCount || tagData.count || tagData.contacts || tagData.totalContacts;
        console.log(`\n  📊 TOTAL DE CONTATOS COM A TAG: ${count}`);
      } else {
        console.log('\n  ⚠️  A tag não retorna contador de contatos');
        console.log('     Vamos usar o valor manual: 1817');
      }
    } else {
      const errorText = await tagResponse.text();
      console.log(`  ❌ ERRO:`, errorText);
    }

  } catch (error) {
    console.error('❌ Erro durante o teste:', error.message);
  }
}

testTagDetails();

console.log('\n============================================================');
