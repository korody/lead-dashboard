import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Endpoint para receber webhooks do ActiveCampaign
// URL: /api/webhook/activecampaign

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    console.log('📥 Webhook recebido do ActiveCampaign:', JSON.stringify(body, null, 2))

    // ActiveCampaign envia diferentes tipos de eventos
    // Exemplo: { type: "subscribe", contact: {...}, list: {...} }
    const { type, contact, list } = body

    if (!contact) {
      return NextResponse.json(
        { error: 'Nenhum contato encontrado no payload' },
        { status: 400 }
      )
    }

    const email = contact.email
    const contactId = contact.id

    console.log(`📧 Processando contato: ${email} (ID: ${contactId})`)

    // Buscar o lead no Supabase pelo email
    const { data: leads, error: searchError } = await supabase
      .from('quiz_leads')
      .select('id, email, nome, is_aluno, is_aluno_bny2')
      .eq('email', email)
      .limit(1)

    if (searchError) {
      console.error('❌ Erro ao buscar lead no Supabase:', searchError)
      return NextResponse.json(
        { error: 'Erro ao buscar lead no banco de dados' },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      console.log(`⚠️ Lead com email ${email} não encontrado no Supabase`)
      return NextResponse.json({
        message: 'Lead não encontrado no banco de dados',
        email,
        action: 'ignored'
      })
    }

    const lead = leads[0]
    console.log(`✅ Lead encontrado: ${lead.nome} (${lead.email})`)

    // Verificar em qual lista o contato foi adicionado
    // Lista ID pode indicar se é aluno geral ou aluno BNY2
    const listId = list?.id
    const listName = list?.name || ''

    console.log(`📋 Lista: ${listName} (ID: ${listId})`)

    // Definir quais campos atualizar baseado na lista
    let updateData: { is_aluno?: boolean; is_aluno_bny2?: boolean } = {}

    // Você pode ajustar essas condições baseado nos IDs/nomes das suas listas no AC
    // Exemplo: Lista "Alunos Mestre Ye" -> is_aluno = true
    // Exemplo: Lista "Alunos BNY2" -> is_aluno_bny2 = true
    
    // Verificar pelo nome da lista (case insensitive)
    const listNameLower = listName.toLowerCase()
    
    if (listNameLower.includes('bny') || listNameLower.includes('bny2')) {
      updateData.is_aluno_bny2 = true
      console.log('🏆 Marcando como aluno BNY2')
    }
    
    // Qualquer lista de alunos marca como aluno geral
    if (listNameLower.includes('aluno') || listNameLower.includes('student')) {
      updateData.is_aluno = true
      console.log('🎓 Marcando como aluno geral')
    }

    // Se não identificou nenhuma lista específica, marcar como aluno geral
    if (Object.keys(updateData).length === 0) {
      updateData.is_aluno = true
      console.log('🎓 Marcando como aluno geral (lista padrão)')
    }

    // Atualizar o lead no Supabase
    const { error: updateError } = await supabase
      .from('quiz_leads')
      .update(updateData)
      .eq('id', lead.id)

    if (updateError) {
      console.error('❌ Erro ao atualizar lead:', updateError)
      return NextResponse.json(
        { error: 'Erro ao atualizar lead' },
        { status: 500 }
      )
    }

    console.log(`✅ Lead atualizado com sucesso:`, updateData)

    return NextResponse.json({
      success: true,
      message: 'Lead atualizado com sucesso',
      lead: {
        id: lead.id,
        email: lead.email,
        nome: lead.nome
      },
      updates: updateData,
      webhook_type: type,
      list: {
        id: listId,
        name: listName
      }
    })

  } catch (error) {
    console.error('❌ Erro ao processar webhook:', error)
    return NextResponse.json(
      { error: 'Erro interno ao processar webhook' },
      { status: 500 }
    )
  }
}

// Método GET para testar se o endpoint está ativo
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/webhook/activecampaign',
    description: 'Webhook para receber eventos do ActiveCampaign',
    usage: 'Configure este URL no ActiveCampaign webhook settings'
  })
}
