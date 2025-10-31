import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface QuadrantData {
  quadrante: number
  count: number
  percentage: number
}

export interface UrgencyMatrixData {
  quadrants: QuadrantData[]
  total: number
  loading: boolean
  error: string | null
}

export function useUrgencyMatrix(refreshKey?: number) {
  const [data, setData] = useState<UrgencyMatrixData>({
    quadrants: [],
    total: 0,
    loading: true,
    error: null,
  })

  useEffect(() => {
    async function fetchUrgencyMatrix() {
      try {
        setData(prev => ({ ...prev, loading: true, error: null }))

        // Validar se o Supabase está configurado
        if (!supabase) {
          throw new Error('Supabase client não está configurado')
        }
        
        // IMPORTANTE: A tabela é chamada 'quiz_leads' no Supabase, não 'leads'
        // Buscar TODOS os leads (mesma base que o funil usa)
        // A API já faz busca em batch de todos os leads, aqui fazemos o mesmo
        let allLeads: any[] = []
        let start = 0
        const batchSize = 1000
        
        while (true) {
          const { data, error } = await supabase
            .from('quiz_leads')
            .select('quadrante, elemento_principal')
            .order('id', { ascending: true })
            .range(start, start + batchSize - 1)
          
          if (error) {
            console.error('❌ Error loading leads batch:', error)
            throw new Error(`Failed to load leads: ${error.message}`)
          }
          
          if (!data || data.length === 0) break
          
          allLeads = allLeads.concat(data)
          
          // Se retornou menos que o batch size, chegamos ao fim
          if (data.length < batchSize) break
          
          start += batchSize
        }
        
        const leads = allLeads
        const error = null
        const count = allLeads.length

        // Verificar se recebemos dados
        if (!leads || !Array.isArray(leads)) {
          console.warn('⚠️ Nenhum dado retornado ou formato inválido:', leads)
          throw new Error('Nenhum lead com diagnóstico completo encontrado na base de dados')
        }

        if (leads.length === 0) {
          console.warn('⚠️ Query retornou 0 leads')
          // Retornar dados vazios ao invés de erro
          setData({
            quadrants: [
              { quadrante: 1, count: 0, percentage: 0 },
              { quadrante: 2, count: 0, percentage: 0 },
              { quadrante: 3, count: 0, percentage: 0 },
              { quadrante: 4, count: 0, percentage: 0 },
            ],
            total: 0,
            loading: false,
            error: null,
          })
          return
        }

        // Total geral = todos os leads carregados
        const totalGeral = leads.length
        
        // Contar quantos têm quadrante definido (não nulo e válido)
        const leadsComQuadrante = leads.filter(l => 
          l.quadrante != null &&
          l.quadrante >= 1 && 
          l.quadrante <= 4
        )
        
        // Filtrar apenas leads com quadrante E elemento_principal definidos (para contagem dos quadrantes)
        const leadsComDiagnostico = leads.filter(l => 
          l.elemento_principal != null && 
          l.quadrante != null &&
          l.quadrante >= 1 && 
          l.quadrante <= 4
        )
        
        const percentualComQuadrante = totalGeral > 0 
          ? ((leadsComQuadrante.length / totalGeral) * 100).toFixed(1) 
          : '0'
        
        console.log(`✅ Matriz de Urgência: ${leadsComQuadrante.length}/${totalGeral} leads (${percentualComQuadrante}%)`)

        // Contar leads por quadrante
        const quadrantCounts: Record<number, number> = {
          1: 0,
          2: 0,
          3: 0,
          4: 0,
        }

        leadsComDiagnostico.forEach(lead => {
          quadrantCounts[lead.quadrante]++
        })

        const total = totalGeral // Usar total geral como base

        // Calcular percentagens
        const quadrants: QuadrantData[] = [1, 2, 3, 4].map(q => ({
          quadrante: q,
          count: quadrantCounts[q],
          percentage: total > 0 ? (quadrantCounts[q] / total) * 100 : 0,
        }))



        setData({
          quadrants,
          total,
          loading: false,
          error: null,
        })
      } catch (err) {
        console.error('❌ Erro capturado:', err)
        console.error('❌ Tipo do erro:', typeof err)
        console.error('❌ É Error?', err instanceof Error)
        
        let errorMessage = 'Erro desconhecido ao buscar dados'
        
        if (err instanceof Error) {
          errorMessage = err.message
        } else if (typeof err === 'string') {
          errorMessage = err
        } else if (err && typeof err === 'object') {
          try {
            const stringified = JSON.stringify(err)
            errorMessage = stringified === '{}' 
              ? 'Erro vazio capturado (verifique conexão com Supabase)' 
              : stringified
          } catch {
            errorMessage = 'Erro ao serializar objeto de erro'
          }
        }
        
        setData(prev => ({
          ...prev,
          loading: false,
          error: errorMessage,
        }))
      }
    }

    fetchUrgencyMatrix()
  }, [refreshKey])

  return data
}
