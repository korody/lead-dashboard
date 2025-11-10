/**
 * Script de teste para o webhook do ActiveCampaign
 * 
 * Para testar localmente:
 * 1. Certifique-se que o servidor está rodando (npm run dev)
 * 2. Execute: node test-webhook-activecampaign.js
 */

const testWebhook = async () => {
  const webhookUrl = 'http://localhost:3002/api/webhook/activecampaign'

  console.log('🧪 Testando webhook do ActiveCampaign...\n')

  // Teste 1: Verificar se endpoint está ativo
  console.log('📌 Teste 1: GET - Verificar status do endpoint')
  try {
    const response = await fetch(webhookUrl)
    const data = await response.json()
    console.log('✅ Status:', data)
    console.log('')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('')
  }

  // Teste 2: Simular webhook de aluno geral
  console.log('📌 Teste 2: POST - Aluno geral (busca por email)')
  try {
    const payload1 = {
      type: 'subscribe',
      date_time: new Date().toISOString(),
      initiated_from: 'admin',
      contact: {
        id: '12345',
        email: 'teste@example.com', // ⚠️ ALTERE para um email que existe no seu Supabase
        phone: '+5511999999999',
        first_name: 'João',
        last_name: 'Teste'
      },
      list: {
        id: '1',
        name: 'Alunos Mestre Ye',
        stringid: 'alunos-mestre-ye'
      }
    }

    const response1 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload1)
    })
    const data1 = await response1.json()
    console.log('✅ Resposta:', JSON.stringify(data1, null, 2))
    console.log('')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('')
  }

  // Teste 3: Simular webhook de aluno BNY2
  console.log('📌 Teste 3: POST - Aluno BNY2 (busca por email)')
  try {
    const payload2 = {
      type: 'subscribe',
      date_time: new Date().toISOString(),
      initiated_from: 'admin',
      contact: {
        id: '67890',
        email: 'teste2@example.com', // ⚠️ ALTERE para um email que existe no seu Supabase
        phone: '+5511888888888',
        first_name: 'Maria',
        last_name: 'Teste'
      },
      list: {
        id: '2',
        name: 'Alunos BNY2',
        stringid: 'alunos-bny2'
      }
    }

    const response2 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload2)
    })
    const data2 = await response2.json()
    console.log('✅ Resposta:', JSON.stringify(data2, null, 2))
    console.log('')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('')
  }

  // Teste 4: Busca por telefone (sem email ou email inexistente)
  console.log('📌 Teste 4: POST - Busca por telefone (fallback)')
  try {
    const payload3 = {
      type: 'subscribe',
      date_time: new Date().toISOString(),
      initiated_from: 'admin',
      contact: {
        id: '11111',
        email: 'emailinexistente@example.com', // Email que não existe
        phone: '+5511999999999', // ⚠️ ALTERE para um telefone que existe no seu Supabase
        first_name: 'Teste',
        last_name: 'Telefone'
      },
      list: {
        id: '1',
        name: 'Alunos Mestre Ye',
        stringid: 'alunos'
      }
    }

    const response3 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload3)
    })
    const data3 = await response3.json()
    console.log('✅ Resposta:', JSON.stringify(data3, null, 2))
    console.log('')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('')
  }

  // Teste 5: Email e telefone que não existem
  console.log('📌 Teste 5: POST - Email e telefone não encontrados')
  // Teste 5: Email e telefone que não existem
  console.log('📌 Teste 5: POST - Email e telefone não encontrados')
  try {
    const payload4 = {
      type: 'subscribe',
      date_time: new Date().toISOString(),
      initiated_from: 'admin',
      contact: {
        id: '99999',
        email: 'naoexiste@example.com',
        phone: '+5599999999999',
        first_name: 'Não',
        last_name: 'Existe'
      },
      list: {
        id: '1',
        name: 'Alunos Mestre Ye',
        stringid: 'alunos'
      }
    }

    const response4 = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload4)
    })
    const data4 = await response4.json()
    console.log('✅ Resposta:', JSON.stringify(data4, null, 2))
    console.log('')
  } catch (error) {
    console.error('❌ Erro:', error.message)
    console.log('')
  }

  console.log('🎉 Testes concluídos!')
  console.log('\n📝 Resumo dos testes:')
  console.log('   ✅ Teste 1: Verificação de status do endpoint')
  console.log('   ✅ Teste 2: Busca por email (aluno geral)')
  console.log('   ✅ Teste 3: Busca por email (aluno BNY2)')
  console.log('   ✅ Teste 4: Busca por telefone (fallback quando email não encontrado)')
  console.log('   ✅ Teste 5: Nenhum dado encontrado')
}

// Executar testes
testWebhook().catch(console.error)
