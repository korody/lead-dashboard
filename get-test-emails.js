/**
 * Script helper para buscar emails e telefones válidos no Supabase para teste
 * Execute: node get-test-emails.js
 */

import { supabase } from './src/lib/supabase.ts'

const getTestData = async () => {
  console.log('🔍 Buscando dados de teste no Supabase...\n')

  try {
    // Buscar primeiros 5 leads
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('email, celular, nome, is_aluno, is_aluno_bny2')
      .limit(5)

    if (error) {
      console.error('❌ Erro:', error)
      return
    }

    console.log('✅ Dados disponíveis para teste:\n')
    data.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.nome}`)
      console.log(`   📧 Email: ${lead.email}`)
      console.log(`   📱 Telefone: ${lead.celular}`)
      console.log(`   🎓 is_aluno: ${lead.is_aluno || false}`)
      console.log(`   🏆 is_aluno_bny2: ${lead.is_aluno_bny2 || false}`)
      console.log('')
    })

    console.log('\n📝 Use estes dados no arquivo test-webhook-activecampaign.js')
    console.log('\n💡 Dica: O webhook agora busca por EMAIL primeiro, depois por TELEFONE se não encontrar')
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

getTestData()
