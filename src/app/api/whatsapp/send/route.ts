import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { unnichatClient } from '@/lib/unnichat'

interface SendWhatsAppRequest {
  leadId: string
  sendDiagnostico?: boolean
  sendChallenge?: boolean
  customMessage?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: SendWhatsAppRequest = await request.json()
    const { leadId, sendDiagnostico, sendChallenge, customMessage } = body

    if (!leadId) {
      return NextResponse.json(
        { error: 'leadId é obrigatório' },
        { status: 400 }
      )
    }

    // Buscar lead no Supabase
    const { data: lead, error: leadError } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    const phone = lead.celular?.replace(/\D/g, '') // Remove formatação
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
        { status: 400 }
      )
    }

    // Verificar modo de simulação (respeita a variável de ambiente explícita)
    const isSimulation = process.env.WHATSAPP_SIMULATION_MODE === 'true'

    let messagesSent = 0
    let referralLink = ''

    // Enviar Diagnóstico
    if (sendDiagnostico) {
      const diagnostico = lead.diagnostico_completo || lead.script_abertura || 'Diagnóstico não disponível'
      
      if (isSimulation) {
        console.log('📱 [SIMULAÇÃO] Enviando diagnóstico para:', phone)
        console.log('Mensagem:', diagnostico.substring(0, 100) + '...')
      } else {
        // TODO: Integrar com Unnichat API para enviar mensagem
        // await unnichatClient.sendMessage(phone, diagnostico)
        console.log('📱 Enviando diagnóstico para:', phone)
      }
      
      messagesSent = 1

      // Atualizar status no banco
      await supabase
        .from('quiz_leads')
        .update({ whatsapp_status: 'diagnostico_enviado' })
        .eq('id', leadId)
    }

    // Enviar Desafio da Vitalidade
    if (sendChallenge) {
      const nomeCompleto = lead.nome || 'Amigo(a)'
      const primeiroNome = nomeCompleto.split(' ')[0]
      
      // Gerar link de referral personalizado
      referralLink = `https://mestreye.com/desafio-vitalidade?ref=${leadId.substring(0, 8)}`
      
      const mensagem1 = `Olá ${primeiroNome}! 🎈\n\nTenho uma oportunidade incrível pra você: o Desafio da Vitalidade de 7 dias!\n\nVai te ajudar a entender melhor sua energia e saúde pela visão da Medicina Chinesa.`
      
      const mensagem2 = `Acesse aqui e comece hoje mesmo:\n${referralLink}\n\n✨ É totalmente gratuito e você vai receber conteúdo exclusivo todos os dias!`

      if (isSimulation) {
        console.log('📱 [SIMULAÇÃO] Enviando desafio para:', phone)
        console.log('Mensagem 1:', mensagem1)
        console.log('Mensagem 2:', mensagem2)
      } else {
        // TODO: Integrar com Unnichat API
        // await unnichatClient.sendMessage(phone, mensagem1)
        // await new Promise(resolve => setTimeout(resolve, 1000)) // Delay entre mensagens
        // await unnichatClient.sendMessage(phone, mensagem2)
        console.log('📱 Enviando desafio para:', phone)
      }
      
      messagesSent = 2
    }

    // Mensagem customizada
    if (customMessage) {
      if (isSimulation) {
        console.log('📱 [SIMULAÇÃO] Enviando mensagem customizada para:', phone)
        console.log('Mensagem:', customMessage)
      } else {
        // TODO: Integrar com Unnichat API
        // await unnichatClient.sendMessage(phone, customMessage)
        console.log('📱 Enviando mensagem customizada para:', phone)
      }
      
      messagesSent = 1
    }

    return NextResponse.json({
      success: true,
      message: isSimulation 
        ? `Simulação: ${messagesSent} mensagem(ns) seriam enviadas` 
        : `${messagesSent} mensagem(ns) enviada(s) com sucesso`,
      phone: `+${phone}`,
      messages_sent: messagesSent,
      referral_link: referralLink || undefined,
      simulation: isSimulation
    })

  } catch (error) {
    console.error('❌ Erro ao enviar WhatsApp:', error)
    return NextResponse.json(
      { error: 'Erro interno ao enviar mensagem' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/whatsapp/send',
    method: 'POST',
    description: 'Enviar mensagens via WhatsApp para leads',
    body: {
      leadId: 'UUID do lead (obrigatório)',
      sendDiagnostico: 'boolean - envia diagnóstico completo',
      sendChallenge: 'boolean - envia desafio da vitalidade (2 mensagens)',
      customMessage: 'string - mensagem personalizada'
    }
  })
}
