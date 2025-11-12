import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const phone = searchParams.get('phone')
    const email = searchParams.get('email')

    if (!phone && !email) {
      return NextResponse.json(
        { error: 'É necessário fornecer phone ou email' },
        { status: 400 }
      )
    }

    let query = supabase.from('quiz_leads').select('*')
    let searchMethod = ''

    if (phone) {
      // Normalizar telefone (remover caracteres não numéricos)
      const phoneDigits = phone.replace(/\D/g, '')
      query = query.ilike('celular', `%${phoneDigits}%`)
      searchMethod = 'phone_exact'
    } else if (email) {
      query = query.ilike('email', email)
      searchMethod = 'email'
    }

    const { data: leads, error } = await query.limit(1)

    if (error) {
      console.error('Erro ao buscar lead:', error)
      return NextResponse.json(
        { error: 'Erro ao buscar no banco de dados' },
        { status: 500 }
      )
    }

    if (!leads || leads.length === 0) {
      return NextResponse.json(
        { 
          success: false, 
          message: 'Lead não encontrado',
          searchMethod 
        },
        { status: 404 }
      )
    }

    const lead = leads[0]

    return NextResponse.json({
      success: true,
      lead: {
        id: lead.id,
        nome: lead.nome,
        celular: lead.celular,
        email: lead.email,
        elemento_principal: lead.elemento_principal,
        lead_score: lead.lead_score || 0,
        diagnostico_completo: lead.diagnostico_completo,
        script_abertura: lead.script_abertura,
        is_hot_lead_vip: lead.is_hot_lead_vip || false,
        whatsapp_status: lead.whatsapp_status || 'pendente',
        created_at: lead.created_at,
        is_aluno: lead.is_aluno || false,
        is_aluno_bny2: lead.is_aluno_bny2 || false
      },
      searchMethod
    })

  } catch (error) {
    console.error('Erro ao processar busca:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    )
  }
}
