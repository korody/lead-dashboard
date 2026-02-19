/**
 * Script: mark-qgs1-leads.mjs
 *
 * Lê um CSV exportado do ActiveCampaign (tag QGS1) e atualiza
 * utm_campaign = 'qgs1' nos registros do Supabase (quiz_leads)
 * que tiverem o email correspondente.
 *
 * Uso:
 *   node scripts/mark-qgs1-leads.mjs caminho/para/arquivo.csv
 *
 * Exemplo:
 *   node scripts/mark-qgs1-leads.mjs scripts/qgs1-contacts.csv
 */

import fs from 'fs'
import path from 'path'
import { createClient } from '@supabase/supabase-js'

// ─── Configuração ────────────────────────────────────────────────────────────

// Lê .env.local para pegar as credenciais do Supabase
function loadEnv() {
  const envPath = path.join(process.cwd(), '.env.local')
  if (!fs.existsSync(envPath)) {
    throw new Error('.env.local não encontrado. Execute a partir da raiz do projeto.')
  }
  const env = {}
  fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
    const match = line.match(/^([^#=]+)=(.*)$/)
    if (match) env[match[1].trim()] = match[2].trim()
  })
  return env
}

// ─── Parser CSV simples ───────────────────────────────────────────────────────

function parseCSV(content) {
  const lines = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n')
  if (lines.length < 2) return []

  // Detecta separador (vírgula ou ponto-e-vírgula)
  const sep = lines[0].includes(';') ? ';' : ','

  const headers = splitCSVLine(lines[0], sep).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase())

  const rows = []
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = splitCSVLine(lines[i], sep).map(v => v.trim().replace(/^"|"$/g, ''))
    const row = {}
    headers.forEach((h, idx) => { row[h] = values[idx] ?? '' })
    rows.push(row)
  }
  return rows
}

function splitCSVLine(line, sep) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++ }
      else inQuotes = !inQuotes
    } else if (ch === sep && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2]
  if (!csvPath) {
    console.error('Uso: node scripts/mark-qgs1-leads.mjs <arquivo.csv>')
    process.exit(1)
  }

  const absPath = path.resolve(csvPath)
  if (!fs.existsSync(absPath)) {
    console.error(`Arquivo não encontrado: ${absPath}`)
    process.exit(1)
  }

  // Carrega env e inicializa Supabase com service role key
  const env = loadEnv()
  const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL']
  const serviceKey = env['SUPABASE_SERVICE_ROLE_KEY']
  if (!supabaseUrl || !serviceKey) {
    throw new Error('NEXT_PUBLIC_SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não encontrados no .env.local')
  }
  const supabase = createClient(supabaseUrl, serviceKey)

  // Lê e parseia o CSV
  console.log(`\n📂 Lendo CSV: ${absPath}`)
  const content = fs.readFileSync(absPath, 'utf-8')
  const rows = parseCSV(content)
  console.log(`📋 Total de linhas no CSV: ${rows.length}`)

  // Encontra a coluna de email (pode ser "email", "e-mail", "Email", etc.)
  const emailKey = Object.keys(rows[0] || {}).find(k =>
    k.includes('email') || k.includes('e-mail') || k === 'mail'
  )
  if (!emailKey) {
    console.error('❌ Coluna de email não encontrada. Colunas disponíveis:', Object.keys(rows[0] || {}))
    process.exit(1)
  }
  console.log(`✅ Coluna de email detectada: "${emailKey}"`)

  // Extrai emails válidos e únicos
  const emails = [...new Set(
    rows
      .map(r => (r[emailKey] || '').toLowerCase().trim())
      .filter(e => e && e.includes('@'))
  )]
  console.log(`📧 Emails únicos encontrados no CSV: ${emails.length}`)

  if (emails.length === 0) {
    console.error('❌ Nenhum email válido encontrado no CSV.')
    process.exit(1)
  }

  // Busca os leads no Supabase que batem com esses emails
  // (apenas os que ainda não têm utm_campaign definido, para não sobrescrever)
  console.log('\n🔍 Buscando leads correspondentes no Supabase...')

  const BATCH = 500
  let totalFound = 0
  let totalUpdated = 0
  let totalJaTemUTM = 0

  for (let i = 0; i < emails.length; i += BATCH) {
    const batch = emails.slice(i, i + BATCH)

    // Busca leads com esses emails
    const { data: leads, error } = await supabase
      .from('quiz_leads')
      .select('id, email, utm_campaign')
      .in('email', batch)

    if (error) {
      console.error('❌ Erro ao buscar leads:', error.message)
      continue
    }

    totalFound += leads.length

    const semUTM = leads.filter(l => !l.utm_campaign)
    const comOutraUTM = leads.filter(l => l.utm_campaign && l.utm_campaign.toLowerCase() !== 'qgs1')
    const jaQGS1 = leads.filter(l => l.utm_campaign?.toLowerCase() === 'qgs1')

    totalJaTemUTM += comOutraUTM.length

    if (semUTM.length > 0) {
      const ids = semUTM.map(l => l.id)
      const { error: updateError } = await supabase
        .from('quiz_leads')
        .update({ utm_campaign: 'qgs1' })
        .in('id', ids)

      if (updateError) {
        console.error(`❌ Erro ao atualizar batch ${i}-${i + BATCH}:`, updateError.message)
      } else {
        totalUpdated += semUTM.length
        process.stdout.write(`\r✏️  Atualizados: ${totalUpdated} | Encontrados: ${totalFound}`)
      }
    }

    if (jaQGS1.length > 0) {
      // Já marcados corretamente — não precisa atualizar
    }
  }

  console.log('\n\n═══════════════════════════════════════════')
  console.log('📊 RESULTADO DA MIGRAÇÃO')
  console.log('═══════════════════════════════════════════')
  console.log(`📧 Emails no CSV:              ${emails.length}`)
  console.log(`🔍 Leads encontrados:          ${totalFound}`)
  console.log(`✅ Marcados como qgs1:         ${totalUpdated}`)
  console.log(`⚠️  Com outra utm (não tocados): ${totalJaTemUTM}`)
  console.log(`❓ Emails sem match no DB:      ${emails.length - totalFound}`)
  console.log('═══════════════════════════════════════════\n')

  if (emails.length - totalFound > 0) {
    console.log('ℹ️  Leads sem match podem ter email diferente entre AC e Supabase,')
    console.log('   ou não completaram o diagnóstico ainda.')
  }
}

main().catch(err => {
  console.error('\n❌ Erro fatal:', err.message)
  process.exit(1)
})
