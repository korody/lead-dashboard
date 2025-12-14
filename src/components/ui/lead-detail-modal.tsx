"use client"

import { useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, Mail, Target, Flame, MessageCircle, Award, Clock, Tag, Send, Bot, Zap, Copy, Loader2, FileText, Mic, Video, CheckSquare, AlertTriangle } from "lucide-react"
import { Badge } from "./badge"
import { ELEMENTOS_MTC } from "../../lib/constants"
import { gerarScriptParaLead } from "../../lib/audio-copies"

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
  is_aluno?: boolean
  is_aluno_bny2?: boolean
  whatsapp_status?: string
  status_tags?: string[]
  created_at: string
  script_abertura?: string
  diagnostico_completo?: string
  referral_link?: string
  respostas?: Record<string, string>
}

interface LeadDetailModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
}

export function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  // Estados para loading e feedback
  const [loadingAction, setLoadingAction] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<{type: 'success' | 'error', message: string} | null>(null)

  // Logs transitórios por bloco (somem automaticamente)
  const [logsMain, setLogsMain] = useState<string[]>([])
  const [logsScript, setLogsScript] = useState<string[]>([])
  const logsMainTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const logsScriptTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const pushLogMain = (msg: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour12: false })
    setLogsMain(prev => [...prev, `${ts} • ${msg}`])
    if (logsMainTimer.current) clearTimeout(logsMainTimer.current)
    logsMainTimer.current = setTimeout(() => setLogsMain([]), 7000)
  }

  const pushLogScript = (msg: string) => {
    const ts = new Date().toLocaleTimeString('pt-BR', { hour12: false })
    setLogsScript(prev => [...prev, `${ts} • ${msg}`])
    if (logsScriptTimer.current) clearTimeout(logsScriptTimer.current)
    logsScriptTimer.current = setTimeout(() => setLogsScript([]), 7000)
  }

  const handleCopyLeadLink = () => {
    if (!lead) return
    const url = `${window.location.origin}/leads?leadId=${lead.id}`
    navigator.clipboard.writeText(url)
    setActionFeedback({ type: 'success', message: '🔗 Link do lead copiado!' })
    setTimeout(() => setActionFeedback(null), 3000)
  }

  // Calcular dias no sistema usando useMemo (MUST be before early return)
  const diasNoSistema = useMemo(() => {
    if (!lead) return 0
    const now = new Date().getTime()
    const createdAt = new Date(lead.created_at).getTime()
    return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
  }, [lead])

  // Gerar script personalizado baseado em is_aluno
  const scriptPersonalizado = useMemo(() => {
    if (!lead) return { script: '', scriptType: '' }
    return gerarScriptParaLead(lead)
  }, [lead])

  if (!lead) return null

  // Gerar referral link baseado no lead (mesmo padrão do backend)
  const generateReferralLink = () => {
    const utm_public = lead.celular || (lead.email ? lead.email.split('@')[0] : 'unknown')
    return `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${utm_public}&utm_content=convite-desafio`
  }

  const referralLink = generateReferralLink()

  // Funções de ação WhatsApp
  const handleSendDiagnostico = async () => {
    setLoadingAction('diagnostico')
    setActionFeedback(null)
    setLogsMain([])
    pushLogMain('Iniciando envio do diagnóstico...')
    
    try {
      pushLogMain('Chamando /api/whatsapp/send (sendDiagnostico=true)')
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          sendDiagnostico: true
        })
      })

      const data = await response.json()

      if (data.success) {
        pushLogMain(data.simulation ? 'Simulação ativada' : 'Execução real')
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? '✅ Simulação: Diagnóstico seria enviado' 
            : '✅ Diagnóstico enviado com sucesso!'
        })
        pushLogMain('Diagnóstico enviado com sucesso')
      } else {
        setActionFeedback({ type: 'error', message: '❌ Erro ao enviar diagnóstico' })
        pushLogMain('Falha ao enviar diagnóstico')
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
      pushLogMain('Erro de rede/requisição')
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
      pushLogMain('Finalizado')
    }
  }

  const handleTriggerAutomation = async () => {
    setLoadingAction('automation')
    setActionFeedback(null)
    setLogsMain([])
    pushLogMain('Iniciando inserção na automação...')
    
    try {
      pushLogMain('Chamando /api/whatsapp/trigger-automation')
      const response = await fetch('/api/whatsapp/trigger-automation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id })
      })

      const data = await response.json()

      if (data.success) {
        pushLogMain(data.simulation ? 'Simulação ativada' : 'Execução real')
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? '✅ Simulação: Automação seria disparada' 
            : '✅ Automação iniciada com sucesso!'
        })
        pushLogMain('Lead inserido na automação com sucesso')
      } else {
        setActionFeedback({ type: 'error', message: '❌ Erro ao disparar automação' })
        pushLogMain('Falha ao inserir lead na automação')
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
      pushLogMain('Erro de rede/requisição')
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
      pushLogMain('Finalizado')
    }
  }

  const handleSendChallenge = async () => {
    setLoadingAction('challenge')
    setActionFeedback(null)
    
    try {
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          sendChallenge: true
        })
      })

      const data = await response.json()

      if (data.success) {
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? '✅ Simulação: Desafio seria enviado' 
            : '✅ Desafio enviado com sucesso!'
        })
      } else {
        setActionFeedback({ type: 'error', message: '❌ Erro ao enviar desafio' })
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
    }
  }

  const handleCopyText = () => {
    const texto = lead.diagnostico_completo || lead.script_abertura || 'Diagnóstico não disponível'
    navigator.clipboard.writeText(texto)
    setActionFeedback({ type: 'success', message: '✅ Texto copiado!' })
    setTimeout(() => setActionFeedback(null), 3000)
  }

  const handleSendScriptText = async () => {
    setLoadingAction('script_text')
    setActionFeedback(null)
    setLogsScript([])
    pushLogScript('Preparando envio do script como texto...')
    
    try {
      pushLogScript('Chamando /api/whatsapp/send (scriptType=text)')
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          sendScript: true,
          scriptType: 'text'
        })
      })

      const data = await response.json()

      if (data.success) {
        pushLogScript(data.simulation ? 'Simulação ativada' : 'Execução real')
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? '✅ Simulação: Script seria enviado como texto' 
            : '✅ Script enviado como texto!'
        })
        pushLogScript('Script enviado como texto com sucesso')
      } else {
        setActionFeedback({ type: 'error', message: '❌ Erro ao enviar script' })
        pushLogScript('Falha ao enviar script como texto')
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
      pushLogScript('Erro de rede/requisição')
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
      pushLogScript('Finalizado')
    }
  }

  const handleSendScriptAudio = async () => {
    setLoadingAction('script_audio')
    setActionFeedback(null)
    setLogsScript([])
    pushLogScript('Gerando áudio personalizado via ElevenLabs...')
    
    try {
      pushLogScript('Chamando /api/audio-personalizado/enviar')
      const response = await fetch('/api/audio-personalizado/enviar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id
        })
      })

      const data = await response.json()

      if (data.success) {
        pushLogScript(data.simulation ? 'Simulação ativada' : 'Execução real')
        if (data.scriptType) pushLogScript(`Tipo de script: ${data.scriptType}`)
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? `✅ Simulação: Áudio seria gerado (${data.scriptType})` 
            : `✅ Áudio gerado e enviado! (${data.scriptType})`
        })
        pushLogScript('Upload para o Supabase concluído')
        pushLogScript('Automação do WhatsApp disparada com link do áudio')
      } else {
        setActionFeedback({ type: 'error', message: `❌ Erro: ${data.error}` })
        pushLogScript('Falha ao gerar/enviar áudio')
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
      pushLogScript('Erro de rede/requisição')
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
      pushLogScript('Finalizado')
    }
  }

  const handleSendScriptVideo = async () => {
    setLoadingAction('script_video')
    setActionFeedback(null)
    setLogsScript([])
    pushLogScript('Preparando envio do script como vídeo...')
    
    try {
      pushLogScript('Chamando /api/whatsapp/send (scriptType=video)')
      const response = await fetch('/api/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          leadId: lead.id,
          sendScript: true,
          scriptType: 'video'
        })
      })

      const data = await response.json()

      if (data.success) {
        pushLogScript(data.simulation ? 'Simulação ativada' : 'Execução real')
        setActionFeedback({
          type: 'success',
          message: data.simulation 
            ? '✅ Simulação: Script seria enviado como vídeo' 
            : '✅ Script enviado como vídeo!'
        })
        pushLogScript('Script enviado como vídeo com sucesso')
      } else {
        setActionFeedback({ type: 'error', message: '❌ Erro ao enviar script' })
        pushLogScript('Falha ao enviar script como vídeo')
      }
    } catch (error) {
      setActionFeedback({ type: 'error', message: '❌ Erro na requisição' })
      pushLogScript('Erro de rede/requisição')
    } finally {
      setLoadingAction(null)
      setTimeout(() => setActionFeedback(null), 5000)
      pushLogScript('Finalizado')
    }
  }

  const getIconeElemento = (elemento: string) => {
    return ELEMENTOS_MTC[elemento as keyof typeof ELEMENTOS_MTC]?.emoji || '⚪'
  }

  const getCorElemento = (elemento: string) => {
    return ELEMENTOS_MTC[elemento as keyof typeof ELEMENTOS_MTC]?.cor || '#6366f1'
  }

  const getNomeElemento = (elemento: string) => {
    return ELEMENTOS_MTC[elemento as keyof typeof ELEMENTOS_MTC]?.nome || elemento
  }

  const getCorPrioridade = (prioridade: string) => {
    const prio = prioridade.toUpperCase()
    const cores = {
      'ALTA': 'bg-red-500/20 text-red-300 border border-red-500/40',
      'MÉDIA': 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
      'MEDIA': 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
      'BAIXA': 'bg-green-500/20 text-green-300 border border-green-500/40'
    }
    return cores[prio as keyof typeof cores] || 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
  }

  const getCorQuadrante = (quadrante: number) => {
    const cores = {
      1: 'bg-red-500/20 text-red-300 border border-red-500/40',
      2: 'bg-orange-500/20 text-orange-300 border border-orange-500/40',
      3: 'bg-amber-500/20 text-amber-300 border border-amber-500/40',
      4: 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
    }
    return cores[quadrante as keyof typeof cores] || 'bg-gray-500/20 text-gray-300 border border-gray-500/40'
  }

  const formatStatusTags = (tags?: string[]) => {
    if (!tags || tags.length === 0) return []
    return tags.map(tag => tag.replace(/_/g, ' ').toUpperCase())
  }

  // Mapeamento das respostas de marketing
  const getRendaMensal = (resposta?: string) => {
    const mapeamento: Record<string, string> = {
      'A': 'Até R$ 3.000',
      'B': 'R$ 3.000 - R$ 7.000',
      'C': 'R$ 7.000 - R$ 15.000',
      'D': 'Acima de R$ 15.000',
      'E': 'Prefiro não informar'
    }
    return resposta ? mapeamento[resposta] || 'Não informado' : 'Não informado'
  }

  const getStatusAluno = (resposta?: string) => {
    const mapeamento: Record<string, string> = {
      'A': 'Ainda não sou aluno(a)',
      'B': 'Sim, sou ou já fui aluno(a)'
    }
    return resposta ? mapeamento[resposta] || 'Não informado' : 'Não informado'
  }

  const getTempoConhece = (resposta?: string) => {
    const mapeamento: Record<string, string> = {
      'A': 'Conheci agora através de amigos ou familiares',
      'B': 'Conheci agora através de anúncios',
      'C': 'Há pouco tempo (1-3 meses)',
      'D': 'Há cerca de 6 meses',
      'E': 'Há bastante tempo (mais de 1 ano)'
    }
    return resposta ? mapeamento[resposta] || 'Não informado' : 'Não informado'
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal Drawer */}
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 h-full w-full md:w-[700px] lg:w-[800px] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 shadow-2xl z-50 overflow-y-auto border-l border-indigo-500/20"
          >
            {/* Header with gradient */}
            <div className="sticky top-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 p-5 shadow-2xl z-10 border-b border-indigo-400/30">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div
                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-2xl ring-4 ring-white/20 shrink-0"
                    style={{ backgroundColor: getCorElemento(lead.elemento_principal) }}
                  >
                    {getIconeElemento(lead.elemento_principal)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-2xl font-bold text-white truncate">{lead.nome}</h2>
                    {/* Quick Status Badges */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {lead.is_hot_lead_vip && (
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white border-0 shadow-lg">
                          <Flame className="w-3 h-3 mr-1" />
                          HOT VIP
                        </Badge>
                      )}
                      {lead.is_aluno && (
                        <Badge className="bg-gradient-to-r from-emerald-500 to-green-600 text-white border-0 shadow-lg">
                          🎓 Aluno
                        </Badge>
                      )}
                      {lead.is_aluno_bny2 && (
                        <Badge className="bg-gradient-to-r from-black to-gray-800 text-white border-0 shadow-lg">
                          🏆 BNY - Aluno
                        </Badge>
                      )}
                      <Badge className={`${getCorPrioridade(lead.prioridade)} font-semibold shadow-lg text-xs`}>
                        Prioridade {lead.prioridade.toUpperCase()}
                      </Badge>
                      <Badge className={`${getCorQuadrante(lead.quadrante)} font-semibold shadow-lg text-xs`}>
                        Q{lead.quadrante}
                      </Badge>
                      <Badge className="bg-indigo-500/30 text-indigo-200 border border-indigo-400/40 shadow-lg text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Score: {lead.lead_score}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={handleCopyLeadLink}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
                    title="Copiar link do lead"
                  >
                    <Copy className="w-5 h-5" />
                  </button>
                  <button
                    onClick={onClose}
                    className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Content with dark mode styling */}
            <div className="p-6 space-y-6">
              
              {/* Contact Info - PRIORITY for sales */}
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-500/10 border-2 border-indigo-500/30 rounded-2xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5 text-indigo-400" />
                  Informações de Contato
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <Phone className="w-5 h-5 text-indigo-400 shrink-0" />
                    <a 
                      href={`tel:${lead.celular}`} 
                      className="text-lg font-bold text-indigo-300 hover:text-indigo-200 transition-colors flex-1"
                    >
                      {lead.celular}
                    </a>
                  </div>
                  <div className="flex items-center gap-3 p-3 bg-gray-800/50 rounded-xl border border-gray-700/50">
                    <Mail className="w-5 h-5 text-purple-400 shrink-0" />
                    <a 
                      href={`mailto:${lead.email}`} 
                      className="text-purple-300 hover:text-purple-200 hover:underline transition-colors flex-1 break-all text-sm"
                    >
                      {lead.email}
                    </a>
                  </div>
                </div>
              </div>

              {/* Status Tags */}
              {lead.status_tags && lead.status_tags.length > 0 && (
                <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <Tag className="w-5 h-5 text-amber-400" />
                    Status e Tags
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {formatStatusTags(lead.status_tags).map((tag, idx) => (
                      <Badge 
                        key={idx} 
                        className="bg-amber-500/20 text-amber-200 border border-amber-500/40 text-sm"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Score Details */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border-2 border-emerald-500/30 rounded-2xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-400" />
                  Leadscore
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 text-center">
                    <div className="text-4xl font-bold text-emerald-400 mb-2">{lead.lead_score}</div>
                    <div className="text-sm text-gray-400">Score Total</div>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 text-center">
                    <div className="text-4xl font-bold text-purple-400 mb-2">Q{lead.quadrante}</div>
                    <div className="text-sm text-gray-300 leading-tight">
                      {lead.quadrante === 1 && "Alta Urgência + Alta Intensidade"}
                      {lead.quadrante === 2 && "Alta Urgência + Baixa Intensidade"}
                      {lead.quadrante === 3 && "Baixa Urgência + Alta Intensidade"}
                      {lead.quadrante === 4 && "Baixa Urgência + Baixa Intensidade"}
                    </div>
                  </div>
                </div>
                <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <p className="text-sm text-gray-300 text-center font-semibold">
                    Prioridade {lead.prioridade.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Perfil de Marketing */}
              {lead.respostas && (lead.respostas.P11 || lead.respostas.P12 || lead.respostas.P13) && (
                <div className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border-2 border-blue-500/30 rounded-2xl p-5 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                    <svg className="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    Perfil de Marketing
                  </h3>
                  <div className="space-y-3">
                    {/* Renda Mensal */}
                    {lead.respostas.P11 && (
                      <div className="flex items-start gap-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                        <div className="text-2xl shrink-0">💰</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">Renda Mensal</div>
                          <div className="font-semibold text-white">
                            {getRendaMensal(lead.respostas.P11)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Status Aluno */}
                    {lead.respostas.P12 && (
                      <div className="flex items-start gap-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                        <div className="text-2xl shrink-0">🎓</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">Status</div>
                          <div className="font-semibold text-white">
                            {getStatusAluno(lead.respostas.P12)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Tempo que Conhece */}
                    {lead.respostas.P13 && (
                      <div className="flex items-start gap-3 p-4 bg-gray-800/60 rounded-xl border border-gray-700/50">
                        <div className="text-2xl shrink-0">📅</div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-400 mb-1">Conhece há</div>
                          <div className="font-semibold text-white">
                            {getTempoConhece(lead.respostas.P13)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 text-xs text-blue-400/80 text-center">
                    📊 Informações coletadas no quiz de diagnóstico
                  </div>
                </div>
              )}

              {/* Perfil MTC - Compacto */}
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-4 shadow-xl">
                <h3 className="text-base font-bold text-white mb-3 flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-400" />
                  Perfil MTC
                </h3>
                <div className="flex items-center gap-4 bg-gray-800/60 rounded-xl p-3 border border-gray-700/50">
                  <div 
                    className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-lg ring-2 ring-white/10 shrink-0"
                    style={{ backgroundColor: getCorElemento(lead.elemento_principal) }}
                  >
                    {getIconeElemento(lead.elemento_principal)}
                  </div>
                  <div>
                    <div className="text-sm text-gray-400">Elemento Principal</div>
                    <div className="font-semibold text-white">
                      {getNomeElemento(lead.elemento_principal)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Diagnóstico Completo */}
              {lead.diagnostico_completo && (
                <div className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/30 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <Target className="w-5 h-5 text-purple-400" />
                      Diagnóstico Completo
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lead.diagnostico_completo || '')
                      }}
                      className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 rounded-lg border border-purple-500/40 transition-all text-sm font-semibold flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </button>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 max-h-96 overflow-y-auto">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                      {lead.diagnostico_completo}
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-purple-400/80 text-center">
                    📋 Envie o diagnóstico completo caso o lead precise receber novamente
                  </div>
                </div>
              )}

              {/* Ações WhatsApp - Nova seção */}
              <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                  <MessageCircle className="w-5 h-5 text-green-400" />
                  Ações de WhatsApp
                </h3>


                <div className="space-y-3">
                  {/* Botão 1: Enviar Diagnóstico */}
                  <button
                    onClick={handleSendDiagnostico}
                    disabled={loadingAction !== null}
                    className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingAction === 'diagnostico' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                    ) : (
                      <><Send className="w-5 h-5" /> Enviar Diagnóstico (janela aberta)</>
                    )}
                  </button>

                  {/* Botão 2: Acionar Automação */}
                  <button
                    onClick={handleTriggerAutomation}
                    disabled={loadingAction !== null}
                    className="w-full p-4 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loadingAction === 'automation' ? (
                      <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                    ) : (
                      <><Bot className="w-5 h-5" /> Inserir na Automação (janela fechada)</>
                    )}
                  </button>
                  {/* Painel de Logs (movido para baixo) */}
                  {logsMain.length > 0 && (
                    <div className="bg-black/40 border border-green-500/30 rounded-lg p-3 max-h-40 overflow-y-auto text-xs font-mono space-y-1">
                      {logsMain.map((l, i) => (
                        <div key={i} className="text-green-300/80 flex items-start">
                          <span className="mr-2">▹</span>
                          <span>{l}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {/* Feedback de ação (agora abaixo dos logs) */}
                  {actionFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className={`mt-3 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow ${
                        actionFeedback.type === 'success'
                          ? 'bg-green-900/40 border-green-500/40 text-green-300'
                          : 'bg-red-900/40 border-red-500/40 text-red-300'
                      }`}
                    >
                      {actionFeedback.type === 'success' ? (
                        <CheckSquare className="w-4 h-4 flex-shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                      )}
                      <span>{actionFeedback.message}</span>
                    </motion.div>
                  )}
                </div>

                {/* Nota explicativa */}
                <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <p className="text-xs text-gray-400 text-center leading-relaxed">
                    💡 <strong>Diagnóstico:</strong> Envia texto completo • 
                    <strong> Automação:</strong> Inicia fluxo automatizado
                  </p>
                </div>
              </div>

              {/* Script de Abertura Personalizado */}
              <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-cyan-400" />
                    Script Personalizado
                    <span className="ml-2 px-2 py-1 text-xs rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                      {scriptPersonalizado.scriptType}
                    </span>
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(scriptPersonalizado.script)
                      setActionFeedback({ type: 'success', message: '✅ Script copiado!' })
                      setTimeout(() => setActionFeedback(null), 3000)
                    }}
                    className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/40 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </button>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50 max-h-96 overflow-y-auto">
                  <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                    {scriptPersonalizado.script}
                  </p>
                </div>
                <div className="mt-3 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                  <p className="text-xs text-cyan-400/80 text-center">
                    💡 Script gerado automaticamente baseado em: <strong>Elemento {lead.elemento_principal}</strong> • 
                    <strong> {scriptPersonalizado.scriptType === 'ALUNO' ? 'Copy de Reativação' : 'Copy de Vendas'}</strong>
                  </p>
                </div>
              </div>

              {/* Ações de Envio do Script */}
              {lead.script_abertura && (
                <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-2 border-green-500/30 rounded-2xl p-6 shadow-xl">
                  <h3 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
                    <MessageCircle className="w-5 h-5 text-green-400" />
                    Ações de WhatsApp
                  </h3>


                  <div className="space-y-3">
                    {/* Botão 1: Enviar como Texto */}
                    <button
                      onClick={handleSendScriptText}
                      disabled={loadingAction !== null}
                      className="w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingAction === 'script_text' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Enviando...</>
                      ) : (
                        <><FileText className="w-5 h-5" /> Enviar Script por Texto</>
                      )}
                    </button>

                    {/* Botão 2: Enviar como Áudio (via Automação) */}
                    <button
                      onClick={handleSendScriptAudio}
                      disabled={loadingAction !== null}
                      className="w-full p-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingAction === 'script_audio' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                      ) : (
                        <><Mic className="w-5 h-5" /> Enviar Script por Áudio (via Automação)</>
                      )}
                    </button>

                    {/* Botão 3: Enviar como Vídeo */}
                    <button
                      onClick={handleSendScriptVideo}
                      disabled={loadingAction !== null}
                      className="w-full p-4 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white rounded-xl font-semibold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {loadingAction === 'script_video' ? (
                        <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                      ) : (
                        <><Video className="w-5 h-5" /> Enviar Script por Vídeo</>
                      )}
                    </button>
                    {/* Painel de Logs (movido para baixo) */}
                    {logsScript.length > 0 && (
                      <div className="bg-black/40 border border-cyan-500/30 rounded-lg p-3 max-h-40 overflow-y-auto text-xs font-mono space-y-1">
                        {logsScript.map((l, i) => (
                          <div key={i} className="text-cyan-300/80 flex items-start">
                            <span className="mr-2">▹</span>
                            <span>{l}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Feedback de ação (abaixo dos logs na seção de script) */}
                    {actionFeedback && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className={`mt-3 flex items-center gap-3 rounded-lg border px-4 py-3 text-sm font-medium shadow ${
                          actionFeedback.type === 'success'
                            ? 'bg-green-900/40 border-green-500/40 text-green-300'
                            : 'bg-red-900/40 border-red-500/40 text-red-300'
                        }`}
                      >
                        {actionFeedback.type === 'success' ? (
                          <CheckSquare className="w-4 h-4 flex-shrink-0" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                        )}
                        <span>{actionFeedback.message}</span>
                      </motion.div>
                    )}
                  </div>

                  {/* Nota explicativa */}
                  <div className="mt-4 p-3 bg-gray-800/40 rounded-lg border border-gray-700/30">
                    <p className="text-xs text-gray-400 text-center leading-relaxed">
                      💡 <strong>Texto:</strong> Mensagem simples • 
                      <strong> Áudio:</strong> Via fluxo automatizado com IA • 
                      <strong> Vídeo:</strong> Avatar falando o script
                    </p>
                  </div>
                </div>
              )}

              {/* Referral Link */}
              <div className="bg-gradient-to-br from-amber-500/10 to-orange-500/10 border-2 border-amber-500/30 rounded-2xl p-5 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <svg className="w-5 h-5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                    Link para Compartilhar Evento
                  </h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(referralLink)
                    }}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 rounded-lg border border-amber-500/40 transition-all text-sm font-semibold flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar
                  </button>
                </div>
                <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                  <a 
                    href={referralLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 hover:text-amber-200 hover:underline break-all"
                  >
                    {referralLink}
                  </a>
                </div>
                <div className="mt-3 text-xs text-amber-400/80 text-center">
                  🔗 Link de indicação personalizado para compartilhar com o lead
                </div>
              </div>

              {/* Timeline */}
              <div className="bg-gradient-to-br from-gray-700/30 to-gray-800/30 border border-gray-700/50 rounded-2xl p-5 shadow-xl">
                <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  Informações Temporais
                </h3>
                <div className="space-y-3 text-gray-300">
                  <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg">
                    <span className="text-gray-400">Data de Cadastro:</span>
                    <span className="font-semibold">
                      {new Date(lead.created_at).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-800/40 rounded-lg">
                    <span className="text-gray-400">Dias no Sistema:</span>
                    <span className="font-semibold">
                      {diasNoSistema} dias
                    </span>
                  </div>
                </div>
              </div>

              {/* ID do Lead (para referência) */}
              <div className="text-center p-4 bg-gray-800/30 rounded-xl border border-gray-700/30">
                <p className="text-xs text-gray-500 mb-1">ID do Lead</p>
                <p className="text-sm text-gray-400 font-mono">{lead.id}</p>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
