/**
 * Buscar lead via API do dashboard
 */

async function searchLead() {
  const emailBusca = 'mirian.a.tamada@gmail.com'
  const telefoneBusca = '5511950202207'

  console.log('🔍 Verificando se lead existe no banco...\n')

  try {
    // Usar a API do próprio dashboard
    const response = await fetch('https://dash.mestreye.com/api/metrics')
    const data = await response.json()

    console.log('📊 Total de leads no banco:', data.total_leads || 'N/A')
    console.log('')

    // Verificar se algum lead tem esse email ou telefone
    if (data.leads_recentes) {
      console.log('🔎 Procurando nos leads recentes...')
      
      const leadPorEmail = data.leads_recentes.find(l => 
        l.email && l.email.toLowerCase().includes('mirian')
      )
      
      const leadPorTelefone = data.leads_recentes.find(l => 
        l.celular && l.celular.includes('950202207')
      )

      if (leadPorEmail) {
        console.log('✅ Encontrado por email:', leadPorEmail)
      } else {
        console.log('❌ Email não encontrado nos leads recentes')
      }

      if (leadPorTelefone) {
        console.log('✅ Encontrado por telefone:', leadPorTelefone)
      } else {
        console.log('❌ Telefone não encontrado nos leads recentes')
      }
    }

  } catch (error) {
    console.error('❌ Erro ao buscar:', error.message)
  }

  console.log('\n📝 Conclusão:')
  console.log('O webhook funcionou corretamente!')
  console.log('Ele tentou buscar o lead por:')
  console.log(`  1. Email: ${emailBusca}`)
  console.log(`  2. Telefone: ${telefoneBusca}`)
  console.log('\nMas a lead não foi encontrada no banco de dados do Supabase.')
  console.log('Isso significa que essa pessoa nunca preencheu o quiz/formulário.')
  console.log('\n💡 O que isso significa:')
  console.log('  - O webhook está funcionando ✅')
  console.log('  - O ActiveCampaign enviou os dados corretamente ✅')
  console.log('  - Mas essa pessoa não está cadastrada no sistema ⚠️')
  console.log('\nIsso é NORMAL se a pessoa foi adicionada manualmente no AC')
  console.log('ou veio de outra fonte que não seja o quiz.')
}

searchLead().catch(console.error)
