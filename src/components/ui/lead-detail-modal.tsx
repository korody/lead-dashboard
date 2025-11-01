"use client"

import { useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, Phone, Mail, Target, Flame, MessageCircle, Award, Clock, Tag } from "lucide-react"
import { Badge } from "./badge"
import { ELEMENTOS_MTC } from "../../lib/constants"

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
  status_tags?: string[]
  created_at: string
  script_abertura?: string
  diagnostico_completo?: string
  referral_link?: string
}

interface LeadDetailModalProps {
  lead: Lead | null
  isOpen: boolean
  onClose: () => void
}

export function LeadDetailModal({ lead, isOpen, onClose }: LeadDetailModalProps) {
  if (!lead) return null

  // Calcular dias no sistema usando useMemo para evitar impure function error
  const diasNoSistema = useMemo(() => {
    const now = new Date().getTime()
    const createdAt = new Date(lead.created_at).getTime()
    return Math.floor((now - createdAt) / (1000 * 60 * 60 * 24))
  }, [lead.created_at])

  // Gerar referral link baseado no lead (mesmo padrão do backend)
  const generateReferralLink = () => {
    const utm_public = lead.celular || (lead.email ? lead.email.split('@')[0] : 'unknown')
    return `https://curso.qigongbrasil.com/lead/bny-convite-wpp?utm_campaign=BNY2&utm_source=org&utm_medium=whatsapp&utm_public=${utm_public}&utm_content=convite-desafio`
  }

  const referralLink = generateReferralLink()

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
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/20 rounded-lg transition-all duration-200 text-white shrink-0"
                >
                  <X className="w-6 h-6" />
                </button>
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

              {/* Script de Abertura */}
              {lead.script_abertura && (
                <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500/30 rounded-2xl p-5 shadow-xl">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-cyan-400" />
                      Script de Abertura
                    </h3>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(lead.script_abertura || '')
                        // Você pode adicionar um toast notification aqui se quiser
                      }}
                      className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 rounded-lg border border-cyan-500/40 transition-all text-sm font-semibold flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copiar
                    </button>
                  </div>
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed">
                      {lead.script_abertura}
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-cyan-400/80 text-center">
                    💡 Use este script como base para iniciar a conversa com o lead
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
                  <div className="bg-gray-800/60 rounded-xl p-4 border border-gray-700/50">
                    <p className="text-gray-200 whitespace-pre-wrap leading-relaxed text-sm">
                      {lead.diagnostico_completo}
                    </p>
                  </div>
                  <div className="mt-3 text-xs text-purple-400/80 text-center">
                    📋 Envie o diagnóstico completo caso o lead precise receber novamente
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
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
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
