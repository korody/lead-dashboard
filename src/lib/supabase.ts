import { createClient } from '@supabase/supabase-js'

// Só no servidor (rotas de API). quiz_leads e dash_campaigns têm RLS e não aceitam
// a chave pública; as telas buscam os dados pelas rotas em /api/data/*.
if (typeof window !== 'undefined') {
  throw new Error('lib/supabase é só do servidor: use as rotas /api/data/* no navegador')
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SECRET_API_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️ Variáveis de ambiente do Supabase não configuradas!')
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✓' : '✗')
  console.error('SUPABASE_SECRET_API_KEY / SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✓' : '✗')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key',
  { auth: { persistSession: false, autoRefreshToken: false } }
)
