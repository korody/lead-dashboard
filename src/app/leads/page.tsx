"use client"

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card"
import { Badge } from "../../components/ui/badge"
import { motion } from "framer-motion"
import { 
  Search, Filter, Download, Flame, ChevronDown, ChevronUp, 
  ArrowLeft, SortAsc, SortDesc, Users, Target
} from "lucide-react"
import Link from 'next/link'
import { supabase } from '../../lib/supabase'
import { ELEMENTOS_MTC } from '../../lib/constants'

interface Lead {
  id: string
  nome: string
  email: string
  celular: string
  lead_score: number
  elemento_principal: string
  prioridade: string
  quadrante: number
  is_hot_lead_vip: boolean
  whatsapp_status?: string
  created_at: string
}

type SortField = 'nome' | 'lead_score' | 'elemento_principal' | 'prioridade' | 'quadrante' | 'created_at'
type SortDirection = 'asc' | 'desc'

export default function LeadsPage() {
  const searchParams = useSearchParams()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [isMounted, setIsMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [filtroElemento, setFiltroElemento] = useState<string>(searchParams?.get('elemento') || 'TODOS')
  const [filtroPrioridade, setFiltroPrioridade] = useState<string>(searchParams?.get('prioridade') || 'TODOS')
  const [filtroQuadrante, setFiltroQuadrante] = useState<string>(searchParams?.get('quadrante') || 'TODOS')
  const [filtroVIP, setFiltroVIP] = useState<boolean>(searchParams?.get('vip') === 'true')
  const [mostrarFiltros, setMostrarFiltros] = useState(false)
  const [sortField, setSortField] = useState<SortField>('lead_score')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

  useEffect(() => {
    setIsMounted(true)
    carregarLeads()
  }, [])

  const carregarLeads = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('quiz_leads')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setLeads(data || [])
    } catch (error) {
      console.error('Erro ao carregar leads:', error)
    } finally {
      setLoading(false)
    }
  }

  const leadsFiltrados = leads.filter(lead => {
    const matchSearch = searchTerm === '' || 
      lead.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.celular?.includes(searchTerm)
    
    const matchElemento = filtroElemento === 'TODOS' || lead.elemento_principal === filtroElemento
    const matchPrioridade = filtroPrioridade === 'TODOS' || lead.prioridade === filtroPrioridade
    const matchQuadrante = filtroQuadrante === 'TODOS' || lead.quadrante === parseInt(filtroQuadrante)
    const matchVIP = !filtroVIP || lead.is_hot_lead_vip === true
    
    return matchSearch && matchElemento && matchPrioridade && matchQuadrante && matchVIP
  })

  const leadsOrdenados = [...leadsFiltrados].sort((a, b) => {
    const mult = sortDirection === 'asc' ? 1 : -1
    const aVal = a[sortField]
    const bVal = b[sortField]
    
    if (aVal === null || aVal === undefined) return 1
    if (bVal === null || bVal === undefined) return -1
    
    if (typeof aVal === 'string' && typeof bVal === 'string') {
      return aVal.localeCompare(bVal) * mult
    }
    
    if (aVal < bVal) return -1 * mult
    if (aVal > bVal) return 1 * mult
    return 0
  })

  const alternarOrdenacao = (campo: SortField) => {
    if (sortField === campo) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc')
    } else {
      setSortField(campo)
      setSortDirection('desc')
    }
  }

  const exportarCSV = () => {
    const headers = ['Nome', 'Email', 'Celular', 'Elemento', 'Score', 'Prioridade', 'Quadrante', 'VIP', 'Data']
    const rows = leadsOrdenados.map(lead => [
      lead.nome,
      lead.email,
      lead.celular,
      lead.elemento_principal,
      lead.lead_score,
      lead.prioridade,
      `Q${lead.quadrante}`,
      lead.is_hot_lead_vip ? 'Sim' : 'Não',
      new Date(lead.created_at).toLocaleDateString('pt-BR')
    ])
    
    const csv = [headers, ...rows].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `leads-${new Date().toISOString().split('T')[0]}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const getIconeElemento = (elemento: string) => {
    return ELEMENTOS_MTC[elemento as keyof typeof ELEMENTOS_MTC]?.emoji || '⚪'
  }

  const getCorElemento = (elemento: string) => {
    return ELEMENTOS_MTC[elemento as keyof typeof ELEMENTOS_MTC]?.cor || '#6366f1'
  }

  const getCorPrioridade = (prioridade: string) => {
    const cores = {
      'ALTA': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'MEDIA': 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      'BAIXA': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
    }
    return cores[prioridade as keyof typeof cores] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
  }

  const getCorQuadrante = (quadrante: number) => {
    const cores = {
      1: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      2: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      3: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      4: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
    }
    return cores[quadrante as keyof typeof cores] || 'bg-gray-100 text-gray-700'
  }

  const limparFiltros = () => {
    setSearchTerm('')
    setFiltroElemento('TODOS')
    setFiltroPrioridade('TODOS')
    setFiltroQuadrante('TODOS')
    setFiltroVIP(false)
    window.history.replaceState({}, '', '/leads')
  }

  const SortIcon = ({ campo }: { campo: SortField }) => {
    if (sortField !== campo) return null
    return sortDirection === 'desc' ? <SortDesc className="w-4 h-4" /> : <SortAsc className="w-4 h-4" />
  }

  if (!isMounted || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full mx-auto mb-4"
          />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Carregando Leads...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sincronizando dados do Supabase
          </p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 p-4 md:p-8" suppressHydrationWarning>
      <div className="max-w-7xl mx-auto" suppressHydrationWarning>
        
        {/* Header com navegação */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <Link 
            href="/"
            className="inline-flex items-center gap-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Voltar ao Dashboard
          </Link>
        </motion.div>

        {/* Card Principal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-2xl border-0 bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                    <Users className="h-8 w-8 text-indigo-600 dark:text-indigo-400" />
                    Gestão de Leads
                  </CardTitle>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    {leadsOrdenados.length} de {leads.length} leads
                    {(filtroElemento !== 'TODOS' || filtroPrioridade !== 'TODOS' || filtroQuadrante !== 'TODOS' || filtroVIP) && (
                      <button
                        onClick={limparFiltros}
                        className="ml-3 text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
                      >
                        Limpar filtros
                      </button>
                    )}
                  </p>
                </div>
                <button
                  onClick={exportarCSV}
                  className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all shadow-lg hover:shadow-xl font-semibold"
                >
                  <Download className="w-5 h-5" />
                  Exportar CSV
                </button>
              </div>
            </CardHeader>

            <CardContent>
              {/* Busca */}
              <div className="relative mb-4">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nome, email ou celular..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white transition-all"
                />
              </div>

              {/* Toggle Filtros */}
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-4 font-medium"
              >
                <Filter className="w-5 h-5" />
                Filtros Avançados
                {mostrarFiltros ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {/* Filtros Avançados */}
              {mostrarFiltros && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700 rounded-xl"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Elemento MTC
                    </label>
                    <select
                      value={filtroElemento}
                      onChange={(e) => setFiltroElemento(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="TODOS">Todos os Elementos</option>
                      {Object.entries(ELEMENTOS_MTC).map(([key, elem]) => (
                        <option key={key} value={key}>
                          {elem.emoji} {elem.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Prioridade
                    </label>
                    <select
                      value={filtroPrioridade}
                      onChange={(e) => setFiltroPrioridade(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="TODOS">Todas</option>
                      <option value="ALTA">🔴 Alta</option>
                      <option value="MEDIA">🟠 Média</option>
                      <option value="BAIXA">🟢 Baixa</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Quadrante
                    </label>
                    <select
                      value={filtroQuadrante}
                      onChange={(e) => setFiltroQuadrante(e.target.value)}
                      className="w-full px-3 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
                    >
                      <option value="TODOS">Todos</option>
                      <option value="1">Q1 - Crítico</option>
                      <option value="2">Q2 - Urgente</option>
                      <option value="3">Q3 - Importante</option>
                      <option value="4">Q4 - Normal</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                      Status VIP
                    </label>
                    <button
                      onClick={() => setFiltroVIP(!filtroVIP)}
                      className={`w-full px-3 py-2 border-2 rounded-lg font-semibold transition-all ${
                        filtroVIP
                          ? 'bg-orange-500 text-white border-orange-600'
                          : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      <Flame className={`w-5 h-5 inline mr-2 ${filtroVIP ? 'text-white' : 'text-orange-500'}`} />
                      {filtroVIP ? 'Apenas VIPs' : 'Todos'}
                    </button>
                  </div>
                </motion.div>
              )}

              {/* Tabela de Leads */}
              <div className="overflow-x-auto rounded-xl border-2 border-gray-200 dark:border-gray-700">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                    <tr>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => alternarOrdenacao('nome')}
                          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Lead
                          <SortIcon campo="nome" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <span className="font-bold text-gray-700 dark:text-gray-200">Contato</span>
                      </th>
                      <th className="px-6 py-4 text-left">
                        <button
                          onClick={() => alternarOrdenacao('elemento_principal')}
                          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
                        >
                          Elemento
                          <SortIcon campo="elemento_principal" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <button
                          onClick={() => alternarOrdenacao('lead_score')}
                          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mx-auto"
                        >
                          Score
                          <SortIcon campo="lead_score" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <button
                          onClick={() => alternarOrdenacao('prioridade')}
                          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mx-auto"
                        >
                          Prioridade
                          <SortIcon campo="prioridade" />
                        </button>
                      </th>
                      <th className="px-6 py-4 text-center">
                        <button
                          onClick={() => alternarOrdenacao('quadrante')}
                          className="flex items-center gap-2 font-bold text-gray-700 dark:text-gray-200 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mx-auto"
                        >
                          Quadrante
                          <SortIcon campo="quadrante" />
                        </button>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {leadsOrdenados.map((lead, index) => (
                      <motion.tr
                        key={lead.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="hover:bg-indigo-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl shadow-lg"
                              style={{ backgroundColor: getCorElemento(lead.elemento_principal) }}
                            >
                              {getIconeElemento(lead.elemento_principal)}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 dark:text-white">
                                {lead.nome}
                              </div>
                              {lead.is_hot_lead_vip && (
                                <Badge className="mt-1 bg-gradient-to-r from-orange-500 to-red-500 text-white border-0">
                                  <Flame className="w-3 h-3 mr-1" />
                                  HOT VIP
                                </Badge>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-gray-200">
                            {lead.email}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {lead.celular}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <span className="text-2xl">{getIconeElemento(lead.elemento_principal)}</span>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {ELEMENTOS_MTC[lead.elemento_principal as keyof typeof ELEMENTOS_MTC]?.nome || lead.elemento_principal}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold text-lg shadow-lg">
                            {lead.lead_score}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={`${getCorPrioridade(lead.prioridade)} font-semibold`}>
                            {lead.prioridade}
                          </Badge>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Badge className={`${getCorQuadrante(lead.quadrante)} font-bold`}>
                            Q{lead.quadrante}
                          </Badge>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {leadsOrdenados.length === 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center py-16"
                >
                  <Target className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">
                    Nenhum lead encontrado com os filtros aplicados.
                  </p>
                  <button
                    onClick={limparFiltros}
                    className="mt-4 text-indigo-600 dark:text-indigo-400 hover:underline font-semibold"
                  >
                    Limpar todos os filtros
                  </button>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
