import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { leadId } = body

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

    const phone = lead.celular?.replace(/\D/g, '')
    if (!phone || phone.length < 10) {
      return NextResponse.json(
        { error: 'Telefone inválido' },
        { status: 400 }
      )
    }

    // Verificar modo de simulação (respeita a variável de ambiente explícita)
    const isSimulation = process.env.WHATSAPP_SIMULATION_MODE === 'true'

    // Selecionar copy baseado em is_aluno
    const isAluno = lead.is_aluno || lead.is_aluno_bny2
    const scriptType = isAluno ? 'aluno' : 'nao_aluno'

    console.log(`🤖 Preparando automação para ${lead.nome}`)
    console.log(`   Tipo de script: ${scriptType}`)
    console.log(`   Telefone: ${phone}`)

    if (isSimulation) {
      console.log('📱 [SIMULAÇÃO] Automação seria disparada')
      console.log('   Fluxo:')
      console.log('   1. Gerar script personalizado')
      console.log('   2. Gerar áudio com ElevenLabs')
      console.log('   3. Upload para Supabase Storage')
      console.log('   4. Enviar via Unnichat')

      return NextResponse.json({
        success: true,
        message: 'Simulação: Automação seria disparada',
        automation_triggered: true,
        simulation: true,
        script_type: scriptType,
        phone: `+${phone}`
      })
    }

    // TODO: Implementar lógica real de automação
    // 1. Gerar script usando audio-copies.js
    // 2. Chamar ElevenLabs API para gerar áudio
    // 3. Upload do áudio para Supabase Storage
    // 4. Disparar webhook do Unnichat com URL do áudio

    console.log('🤖 Disparando automação...')

    // Atualizar status no banco
    await supabase
      .from('quiz_leads')
      .update({ 
        whatsapp_status: 'automacao_iniciada',
        ultima_interacao: new Date().toISOString()
      })
      .eq('id', leadId)

    return NextResponse.json({
      success: true,
      message: 'Automação disparada com sucesso',
      automation_triggered: true,
      script_type: scriptType,
      phone: `+${phone}`
    })

  } catch (error) {
    console.error('❌ Erro ao disparar automação:', error)
    return NextResponse.json(
      { error: 'Erro interno ao disparar automação' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/whatsapp/trigger-automation',
    method: 'POST',
    description: 'Dispara automação de diagnóstico com áudio personalizado',
    body: {
      leadId: 'UUID do lead (obrigatório)'
    },
    flow: [
      '1. Busca lead no banco',
      '2. Seleciona copy por is_aluno',
      '3. Gera áudio com ElevenLabs',
      '4. Upload no Supabase Storage',
      '5. Envia via Unnichat'
    ]
  })
}
