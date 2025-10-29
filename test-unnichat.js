const UNNICHAT_API_URL = 'https://unnichat.com.br/api';
const UNNICHAT_TOKEN = 'Bearer 68aaf071-82e8-4771-aaab-2963ec81add5';

console.log('============================================================');
console.log('TESTE DA API UNNICHAT');
console.log('============================================================\n');

console.log('Token configurado:', UNNICHAT_TOKEN ? 'Sim ✓' : 'Não ✗');
console.log('Base URL:', UNNICHAT_API_URL);
console.log('');

async function testUnnichatAPI() {
  try {
    // Teste 1: Buscar contatos com diferentes payloads
    console.log('🧪 Teste 1: POST /contact/search (buscar contatos)');
    console.log(`  URL: ${UNNICHAT_API_URL}/contact/search`);
    
    // Tentar buscar com um nome parcial (pode ter mais sucesso)
    const payload = { name: "a", limit: 5 }; // Buscar nomes que contenham "a"
    
    console.log(`  Payload:`, JSON.stringify(payload));
    
    const searchResponse = await fetch(`${UNNICHAT_API_URL}/contact/search`, {
      method: 'POST',
      headers: {
        'Authorization': UNNICHAT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    console.log(`  Status: ${searchResponse.status} ${searchResponse.statusText}`);

    if (searchResponse.ok) {
      const contacts = await searchResponse.json();
      console.log(`  ✅ SUCESSO! Total de contatos: ${contacts?.length || 0}`);
      
      if (contacts && contacts.length > 0) {
        console.log(`  Exemplo de contato:`, {
          id: contacts[0].id,
          name: contacts[0].name,
          phone: contacts[0].phone
        });
        
        // Teste 2: Buscar mensagens do primeiro contato
        console.log('\n🧪 Teste 2: GET /contact/{id}/messages');
        const contactId = contacts[0].id;
        console.log(`  URL: ${UNNICHAT_API_URL}/contact/${contactId}/messages`);
        
        const messagesResponse = await fetch(`${UNNICHAT_API_URL}/contact/${contactId}/messages`, {
          method: 'GET',
          headers: {
            'Authorization': UNNICHAT_TOKEN,
            'Content-Type': 'application/json',
          },
        });

        console.log(`  Status: ${messagesResponse.status} ${messagesResponse.statusText}`);

        if (messagesResponse.ok) {
          const messages = await messagesResponse.json();
          console.log(`  ✅ SUCESSO! Total de mensagens: ${messages?.length || 0}`);
          
          if (messages && messages.length > 0) {
            const targetMessage = "Olá Mestre Ye! Quero receber meu Diagnóstico Express";
            const diagnosticMessage = messages.find(msg => 
              msg.text?.includes(targetMessage)
            );
            
            if (diagnosticMessage) {
              console.log(`  🎯 ENCONTROU mensagem de diagnóstico!`);
            } else {
              console.log(`  ℹ️  Não encontrou mensagem de diagnóstico neste contato`);
            }
            
            console.log(`  Exemplo de mensagem:`, {
              text: messages[0].text?.substring(0, 50) + '...',
              direction: messages[0].direction,
              timestamp: messages[0].timestamp
            });
          }
        } else {
          const errorText = await messagesResponse.text();
          console.log(`  ❌ ERRO:`, errorText.substring(0, 200));
        }
      }
    } else {
      const errorText = await searchResponse.text();
      console.log(`  ❌ ERRO:`, errorText);
    }

  } catch (error) {
    console.error('❌ Erro durante os testes:', error.message);
  }
}

testUnnichatAPI();

console.log('\n============================================================');
