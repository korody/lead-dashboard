/**
 * Script helper para buscar emails válidos no Supabase para teste
 * Execute: node get-test-emails.js
 */

import { supabase } from './src/lib/supabase.ts'

const getTestEmails = async () => {
  console.log('🔍 Buscando emails de teste no Supabase...\n')

  try {
    // Buscar primeiros 5 leads
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('email, nome, is_aluno, is_aluno_bny2')
      .limit(5)

    if (error) {
      console.error('❌ Erro:', error)
      return
    }

    console.log('✅ Emails disponíveis para teste:\n')
    data.forEach((lead, index) => {
      console.log(`${index + 1}. ${lead.email}`)
      console.log(`   Nome: ${lead.nome}`)
      console.log(`   is_aluno: ${lead.is_aluno || false}`)
      console.log(`   is_aluno_bny2: ${lead.is_aluno_bny2 || false}`)
      console.log('')
    })

    console.log('\n📝 Use estes emails no arquivo test-webhook-activecampaign.js')
  } catch (error) {
    console.error('❌ Erro:', error)
  }
}

getTestEmails()
