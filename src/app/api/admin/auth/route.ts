import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  try {
    const { password } = await request.json()
    // Sem ADMIN_PASSWORD própria, vale a senha do painel (esta rota já exige o login dele)
    const adminPassword = process.env.ADMIN_PASSWORD || process.env.DASHBOARD_PASSWORD

    if (!adminPassword) {
      return NextResponse.json(
        { error: 'ADMIN_PASSWORD/DASHBOARD_PASSWORD not configured' },
        { status: 500 }
      )
    }

    if (password !== adminPassword) {
      return NextResponse.json(
        { error: 'Senha incorreta' },
        { status: 401 }
      )
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Erro na autenticação admin:', error)
    return NextResponse.json(
      { error: 'Erro ao processar autenticação' },
      { status: 500 }
    )
  }
}
