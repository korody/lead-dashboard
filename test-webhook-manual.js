/**
 * Teste manual do webhook com telefone 11998457676
 */

const testWebhookManual = async () => {
  // Use localhost se estiver testando localmente, ou a URL de produção
  const webhookUrl = 'https://dash.mestreye.com/api/webhook/update-student-status'
  
  console.log('🧪 Testando webhook com telefone 11998457676...\n')

  // Teste: Simular webhook de aluno BNY2 com seu telefone
  console.log('📌 Simulando adição à lista "Alunos BNY2"')
  try {
    const payload = {
      type: 'subscribe',
      date_time: new Date().toISOString(),
      initiated_from: 'admin',
      contact: {
        id: '999',
        email: 'email-qualquer@teste.com', // Email que provavelmente não existe, vai buscar por telefone
        phone: '+5511998457676', // Seu telefone
        first_name: 'Teste',
        last_name: 'Manual'
      },
      list: {
        id: '99',
        name: 'Alunos BNY2', // Nome contém "BNY" - vai marcar is_aluno_bny2 = true
        stringid: 'alunos-bny2'
      }
    }

    console.log('📤 Enviando payload:')
    console.log(JSON.stringify(payload, null, 2))
    console.log('')

    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    
    const data = await response.json()
    
    console.log('📥 Resposta do webhook:')
    console.log(JSON.stringify(data, null, 2))
    console.log('')

    if (data.success) {
      console.log('✅ SUCESSO! Lead atualizado com:')
      console.log(`   - is_aluno_bny2: ${data.updated?.is_aluno_bny2}`)
      console.log(`   - is_aluno: ${data.updated?.is_aluno}`)
      console.log(`   - Método de busca: ${data.searchMethod}`)
    } else {
      console.log('❌ ERRO:', data.error)
      if (data.details) {
        console.log('   Detalhes:', data.details)
      }
    }
  } catch (error) {
    console.error('❌ Erro na requisição:', error.message)
  }

  console.log('\n💡 Próximos passos:')
  console.log('   1. Verifique no dashboard se o lead aparece com a tag 🏆 BNY-Aluno')
  console.log('   2. Abra os detalhes do lead e veja se a seção "Aluno BNY2" está destacada')
  console.log('   3. Teste o filtro "Aluno BNY" na página de leads')
}

// Executar teste
testWebhookManual().catch(console.error)
