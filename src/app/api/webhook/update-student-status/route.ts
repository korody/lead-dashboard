import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// Endpoint para receber webhooks do ActiveCampaign
// URL: /api/webhook/activecampaign

export async function POST(request: NextRequest) {
  try {
    // ActiveCampaign pode enviar dados em diferentes formatos
    let body: any
    const contentType = request.headers.get('content-type') || ''
    
    console.log('📨 Content-Type recebido:', contentType)
    
    if (contentType.includes('application/json')) {
      // Formato JSON
      body = await request.json()
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      // Formato form-urlencoded (ActiveCampaign usa esse formato por padrão)
      const formData = await request.text()
      console.log('📝 Form data raw:', formData)
      
      // Parse dos dados do formulário
      const params = new URLSearchParams(formData)
      body = {
        type: params.get('type') || params.get('contact[type]'),
        contact: {
          id: params.get('contact[id]'),
          email: params.get('contact[email]'),
          phone: params.get('contact[phone]'),
          first_name: params.get('contact[first_name]'),
          last_name: params.get('contact[last_name]')
        },
        list: {
          id: params.get('list[id]') || params.get('list'),
          name: params.get('list[name]'),
          stringid: params.get('list[stringid]')
        }
      }
    } else {
      // Tentar como texto e parsear
      const text = await request.text()
      console.log('📝 Texto raw recebido:', text)
      
      try {
        body = JSON.parse(text)
      } catch {
        // Se falhar, tentar como URLSearchParams
        const params = new URLSearchParams(text)
        body = {
          type: params.get('type') || params.get('contact[type]'),
          contact: {
            id: params.get('contact[id]'),
            email: params.get('contact[email]'),
            phone: params.get('contact[phone]'),
            first_name: params.get('contact[first_name]'),
            last_name: params.get('contact[last_name]')
          },
          list: {
            id: params.get('list[id]') || params.get('list'),
            name: params.get('list[name]'),
            stringid: params.get('list[stringid]')
          }
        }
      }
    }
    
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
    const phone = contact.phone
    const contactId = contact.id

    console.log(`📧 Processando contato: ${email} (ID: ${contactId})`)
    if (phone) console.log(`📱 Telefone: ${phone}`)

    // ========================================
    // BUSCA FLEXÍVEL: Email OU Telefone
    // ========================================
    let lead = null
    let searchMethod = ''

    // Estratégia 1: Buscar por email
    if (email) {
      console.log('🔍 Tentativa 1: Busca por email...')
      const { data: emailResults, error: emailError } = await supabase
        .from('quiz_leads')
        .select('id, email, celular, nome, is_aluno, is_aluno_bny2')
        .ilike('email', email)
        .limit(1)

      if (emailError) {
        console.error('❌ Erro ao buscar por email:', emailError)
      } else if (emailResults && emailResults.length > 0) {
        lead = emailResults[0]
        searchMethod = 'email'
        console.log(`✅ Lead encontrado por email: ${lead.nome}`)
      }
    }

    // Estratégia 2: Se não encontrou por email, tentar por telefone
    if (!lead && phone) {
      console.log('🔍 Tentativa 2: Busca por telefone...')
      
      // Extrair apenas dígitos do telefone
      const phoneDigits = phone.replace(/\D/g, '')
      
      if (phoneDigits.length >= 10) {
        console.log(`   📱 Buscando telefone com dígitos: ${phoneDigits}`)
        
        const { data: phoneResults, error: phoneError } = await supabase
          .from('quiz_leads')
          .select('id, email, celular, nome, is_aluno, is_aluno_bny2')
          .ilike('celular', `%${phoneDigits}%`)
          .limit(1)

        if (phoneError) {
          console.error('❌ Erro ao buscar por telefone:', phoneError)
        } else if (phoneResults && phoneResults.length > 0) {
          lead = phoneResults[0]
          searchMethod = 'telefone'
          console.log(`✅ Lead encontrado por telefone: ${lead.nome}`)
        }
      } else {
        console.log(`⚠️ Telefone muito curto (${phoneDigits.length} dígitos), ignorando busca por telefone`)
      }
    }

    // Se não encontrou o lead
    if (!lead) {
      console.log(`⚠️ Lead não encontrado no Supabase`)
      console.log(`   Email tentado: ${email || 'N/A'}`)
      console.log(`   Telefone tentado: ${phone || 'N/A'}`)
      
      return NextResponse.json({
        message: 'Lead não encontrado no banco de dados',
        email: email || null,
        phone: phone || null,
        action: 'ignored'
      })
    }

    console.log(`✅ Lead encontrado via ${searchMethod}: ${lead.nome} (${lead.email})`)

    // Verificar em qual lista o contato foi adicionado
    // Lista ID pode indicar se é aluno geral ou aluno BNY2
    const listId = list?.id
    const listName = list?.name || ''

    console.log(`📋 Lista: ${listName} (ID: ${listId})`)

    // Definir quais campos atualizar baseado na lista
    const updateData: { is_aluno?: boolean; is_aluno_bny2?: boolean } = {}

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
        celular: lead.celular,
        nome: lead.nome
      },
      searchMethod: searchMethod, // 'email' ou 'telefone'
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
    endpoint: '/api/webhook/update-student-status',
    description: 'Webhook para atualizar status de alunos quando adicionados a listas no ActiveCampaign',
    usage: 'Configure este URL no ActiveCampaign webhook settings'
  })
}
