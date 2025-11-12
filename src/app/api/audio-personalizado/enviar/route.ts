import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { gerarScriptParaLead, normalizarTelefone } from '@/lib/audio-copies'

interface SendAudioRequest {
  leadId: string
}

/**
 * Gera áudio usando ElevenLabs API
 */
async function gerarAudioElevenLabs(script: string): Promise<Buffer> {
  const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY
  const ELEVENLABS_VOICE_ID = process.env.ELEVENLABS_VOICE_ID || 'hdFLFm20uYE7qa0TxNDq'

  if (!ELEVENLABS_API_KEY) {
    throw new Error('ELEVENLABS_API_KEY não configurada')
  }

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`,
    {
      method: 'POST',
      headers: {
        'Accept': 'audio/mpeg',
        'xi-api-key': ELEVENLABS_API_KEY,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text: script,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.5,
          use_speaker_boost: true
        }
      })
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro ElevenLabs: ${response.status} - ${errorText}`)
  }

  const arrayBuffer = await response.arrayBuffer()
  return Buffer.from(arrayBuffer)
}

/**
 * Faz upload do áudio no Supabase Storage
 */
async function uploadAudioSupabase(audioBuffer: Buffer, leadId: string): Promise<string> {
  const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
  const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    throw new Error('Credenciais Supabase não configuradas')
  }

  const fileName = `audio_${leadId}_${Date.now()}.mp3`
  const uploadUrl = `${SUPABASE_URL}/storage/v1/object/audio-mensagens/${fileName}`

  const response = await fetch(uploadUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
      'Content-Type': 'audio/mpeg',
      'x-upsert': 'false'
    },
    body: audioBuffer as unknown as BodyInit
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`Erro upload Supabase: ${response.status} - ${errorText}`)
  }

  const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/audio-mensagens/${fileName}`
  return publicUrl
}

/**
 * Dispara automação Unnichat
 */
async function dispararAutomacaoUnnichat(celular: string, email?: string): Promise<void> {
  const phoneE164 = normalizarTelefone(celular)

  const response = await fetch(
    'https://unnichat.com.br/a/start/ujzdbrjxV1lpg9X2uM65',
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        phone: phoneE164,
        email: email || ''
      })
    }
  )

  const data = await response.json()

  if (!data.response) {
    throw new Error(`Erro Unnichat: ${data.message || 'Erro desconhecido'}`)
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: SendAudioRequest = await request.json()
    const { leadId } = body

    if (!leadId) {
      return NextResponse.json(
        { success: false, error: 'leadId obrigatório' },
        { status: 400 }
      )
    }

    // 1. Buscar lead
    const { data: lead, error: leadError } = await supabase
      .from('quiz_leads')
      .select('*')
      .eq('id', leadId)
      .single()

    if (leadError || !lead) {
      return NextResponse.json(
        { success: false, error: 'Lead não encontrado' },
        { status: 404 }
      )
    }

    // Validações
    if (!lead.celular) {
      return NextResponse.json(
        { success: false, error: 'Lead sem telefone' },
        { status: 400 }
      )
    }

    if (!lead.elemento_principal) {
      return NextResponse.json(
        { success: false, error: 'Lead sem elemento principal' },
        { status: 400 }
      )
    }

    // Verificar modo simulação
    const isSimulation = process.env.NODE_ENV !== 'production' || 
                         process.env.WHATSAPP_SIMULATION_MODE === 'true'

    if (isSimulation) {
      // Modo simulação - apenas retorna o que seria feito
      const { script, scriptType } = gerarScriptParaLead(lead)
      
      console.log('🎙️ [SIMULAÇÃO] Áudio seria gerado')
      console.log('Script Type:', scriptType)
      console.log('Script Length:', script.length, 'caracteres')
      console.log('Lead:', lead.nome, '/', lead.celular)

      return NextResponse.json({
        success: true,
        simulation: true,
        message: 'Simulação: Áudio seria gerado e enviado',
        scriptType,
        scriptLength: script.length,
        leadName: lead.nome,
        audioUrl: 'https://example.com/simulated-audio.mp3'
      })
    }

    // Modo produção - executar de verdade
    console.log(`🎙️ Gerando áudio para ${lead.nome}...`)

    // 2. Gerar script
    const { script, scriptType } = gerarScriptParaLead(lead)
    console.log(`📝 Script gerado (${scriptType}): ${script.length} caracteres`)

    // 3. Gerar áudio
    console.log('🎵 Chamando ElevenLabs...')
    const audioBuffer = await gerarAudioElevenLabs(script)
    console.log(`✅ Áudio gerado: ${audioBuffer.length} bytes`)

    // 4. Upload
    console.log('📤 Fazendo upload no Supabase...')
    const audioUrl = await uploadAudioSupabase(audioBuffer, leadId)
    console.log(`✅ Upload concluído: ${audioUrl}`)

    // 5. Disparar automação
    console.log('🤖 Disparando automação Unnichat...')
    await dispararAutomacaoUnnichat(lead.celular, lead.email)
    console.log('✅ Automação disparada')

    // 6. Atualizar status do lead
    await supabase
      .from('quiz_leads')
      .update({
        whatsapp_status: 'automacao_audio_personalizado',
        updated_at: new Date().toISOString()
      })
      .eq('id', leadId)

    // 7. Registrar log (opcional)
    // await supabase.from('whatsapp_logs').insert({ ... })

    return NextResponse.json({
      success: true,
      message: 'Áudio gerado e enviado com sucesso',
      audioUrl,
      scriptType,
      scriptLength: script.length,
      leadName: lead.nome
    })

  } catch (error) {
    console.error('❌ Erro ao enviar áudio:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido'
    
    return NextResponse.json(
      { 
        success: false, 
        error: errorMessage 
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    endpoint: '/api/audio-personalizado/enviar',
    method: 'POST',
    description: 'Gera áudio personalizado com ElevenLabs e envia via Unnichat',
    body: {
      leadId: 'UUID do lead (obrigatório)'
    },
    flow: [
      '1. Busca lead no Supabase',
      '2. Gera script baseado em is_aluno',
      '3. Gera áudio com ElevenLabs',
      '4. Upload no Supabase Storage',
      '5. Dispara automação Unnichat',
      '6. Atualiza status do lead'
    ],
    env_required: [
      'ELEVENLABS_API_KEY',
      'ELEVENLABS_VOICE_ID (opcional)',
      'SUPABASE_SERVICE_ROLE_KEY',
      'NEXT_PUBLIC_SUPABASE_URL'
    ]
  })
}
