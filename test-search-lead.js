/**
 * Verificar se existe lead com email ou telefone similar
 */

const { createClient } = require('@supabase/supabase-js')

// Configuração do Supabase
const supabase = createClient(
  'https://xctyutsabznhzrxuyhvw.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdHl1dHNhYnpuaHpyeHV5aHZ3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzA3NTQ1NTcsImV4cCI6MjA0NjMzMDU1N30.U4FeZRGl--sJ1Tl5NtzLWg0Pn7i3yt_xWLa8f5gUeEA'
)

async function searchLead() {
  const emailBusca = 'mirian.a.tamada@gmail.com'
  const telefoneBusca = '5511950202207'

  console.log('🔍 Buscando lead...\n')

  // Busca por email
  console.log(`📧 Buscando por email: ${emailBusca}`)
  const { data: byEmail, error: emailError } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, is_aluno, is_aluno_bny2')
    .ilike('email', `%mirian%`)
    .limit(5)

  if (emailError) {
    console.error('❌ Erro:', emailError)
  } else {
    console.log(`   Resultados: ${byEmail?.length || 0}`)
    if (byEmail && byEmail.length > 0) {
      byEmail.forEach(lead => {
        console.log(`   - ${lead.nome} | ${lead.email} | ${lead.celular}`)
      })
    }
  }

  console.log('')

  // Busca por telefone
  console.log(`📱 Buscando por telefone: ${telefoneBusca}`)
  const { data: byPhone, error: phoneError } = await supabase
    .from('quiz_leads')
    .select('id, nome, email, celular, is_aluno, is_aluno_bny2')
    .ilike('celular', `%950202207%`)
    .limit(5)

  if (phoneError) {
    console.error('❌ Erro:', phoneError)
  } else {
    console.log(`   Resultados: ${byPhone?.length || 0}`)
    if (byPhone && byPhone.length > 0) {
      byPhone.forEach(lead => {
        console.log(`   - ${lead.nome} | ${lead.email} | ${lead.celular}`)
      })
    }
  }

  console.log('')

  // Busca por telefone com variações
  console.log('📱 Buscando variações do telefone...')
  const variacoes = [
    '11950202207',
    '5511950202207',
    '+5511950202207',
    '950202207'
  ]

  for (const tel of variacoes) {
    const { data, error } = await supabase
      .from('quiz_leads')
      .select('id, nome, email, celular')
      .ilike('celular', `%${tel}%`)
      .limit(1)

    if (!error && data && data.length > 0) {
      console.log(`   ✅ Encontrado com: ${tel}`)
      console.log(`      - ${data[0].nome} | ${data[0].email} | ${data[0].celular}`)
      return
    }
  }

  console.log('   ❌ Nenhuma variação encontrada')
}

searchLead().catch(console.error)
