'use client'

import { motion } from 'framer-motion'
import { Users, ClipboardCheck, MessageCircle, Target, UserPlus, UsersRound, TrendingDown, AlertCircle } from 'lucide-react'

interface FunnelData {
  etapas: {
    quiz_completado: number
    diagnostico_completo: number
    grupos_whatsapp: number
    cadastros_pdc: number
  }
  conversoes: {
    pdv_para_diagnostico: string
    diagnostico_para_grupos: string
    conversao_geral: string
  }
  perdas: {
    pdv_diagnostico: number
    diagnostico_grupos: number
    taxa_perda_pdv_diagnostico: string
    taxa_perda_diagnostico_grupos: string
  }
}

interface ConversionFunnelProps {
  data: FunnelData
  hideWhatsApp?: boolean
}

export function ConversionFunnel({ data, hideWhatsApp = false }: ConversionFunnelProps) {
  const allStages = [
    {
      id: 'pdv',
      label: 'Total de Cadastros',
      sublabel: 'Inscritos na Lista',
      value: data.etapas.cadastros_pdc,
      icon: UserPlus,
      color: 'from-blue-500 to-blue-600',
      status: data.etapas.cadastros_pdc > 0 ? 'active' : 'pending',
      description: data.etapas.cadastros_pdc === 0 ? 'Configure as credenciais do ActiveCampaign' : undefined
    },
    {
      id: 'quiz',
      label: 'Diagnósticos Finalizados',
      sublabel: 'Quiz Completado',
      value: data.etapas.quiz_completado,
      icon: ClipboardCheck,
      color: 'from-indigo-500 to-indigo-600',
      conversionFrom: 'pdv',
      conversionRate: data.conversoes.pdv_para_diagnostico,
      dropOff: data.perdas.pdv_diagnostico,
      dropOffRate: data.perdas.taxa_perda_pdv_diagnostico,
      status: 'active'
    },
    {
      id: 'grupos',
      label: 'Grupos WhatsApp',
      sublabel: 'Conversão Final (Total Geral)',
      value: data.etapas.grupos_whatsapp,
      icon: UsersRound,
      color: 'from-green-500 to-green-600',
      conversionFrom: 'quiz',
      conversionRate: data.conversoes.diagnostico_para_grupos,
      dropOff: data.perdas.diagnostico_grupos,
      dropOffRate: data.perdas.taxa_perda_diagnostico_grupos,
      status: data.etapas.grupos_whatsapp > 0 ? 'active' : 'pending',
      description: data.etapas.grupos_whatsapp === 0 ? 'Configure SENDFLOW_CAMPAIGN_ID no .env.local' : 'Nota: SendFlow não fornece filtro por período - mostra total geral'
    }
  ]

  const stages = hideWhatsApp ? allStages.filter(s => s.id !== 'grupos') : allStages

  return (
    <div className="space-y-6">
      {/* Aviso quando WhatsApp está oculto */}
      {hideWhatsApp && (
        <div className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg">
          <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
          <p className="text-sm text-amber-800 dark:text-amber-300">
            <strong>Dados de WhatsApp ocultos:</strong> O SendFlow não suporta filtro por período. Para visualizar os grupos WhatsApp (total geral), selecione o período de 30 dias.
          </p>
        </div>
      )}
      
      {/* Etapas do Funil */}
      <div className="grid gap-4">
        {stages.map((stage, index) => (
          <motion.div
            key={stage.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative"
          >
            {/* Linha conectora */}
            {index < stages.length - 1 && (
              <div className="absolute left-8 top-full w-0.5 h-4 bg-gray-300 dark:bg-gray-600 z-0" />
            )}

            <div className={`
              relative bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 
              ${stage.status === 'pending' ? 'opacity-60 border-2 border-dashed border-gray-300 dark:border-gray-600' : ''}
            `}>
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`
                  flex-shrink-0 w-16 h-16 rounded-xl bg-gradient-to-br ${stage.color} 
                  flex items-center justify-center text-white shadow-lg
                `}>
                  <stage.icon className="w-8 h-8" />
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="text-lg font-bold text-gray-900 dark:text-white">
                        {stage.label}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{stage.sublabel}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold text-gray-900 dark:text-white">
                        {stage.value.toLocaleString('pt-BR')}
                      </div>
                      {stage.status === 'pending' && (
                        <span className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                          Em breve
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Conversion Rate */}
                  {stage.conversionFrom && (
                    <div className="mt-4 flex items-center gap-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Taxa de Conversão
                          </span>
                          <span className={`text-sm font-bold ${
                            parseFloat(stage.conversionRate) >= 50 
                              ? 'text-green-600 dark:text-green-400' 
                              : parseFloat(stage.conversionRate) >= 30
                              ? 'text-yellow-600 dark:text-yellow-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}>
                            {stage.conversionRate}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full bg-gradient-to-r ${stage.color} transition-all duration-500`}
                            style={{ width: `${stage.conversionRate}%` }}
                          />
                        </div>
                      </div>

                      {/* Drop-off warning */}
                      {stage.dropOff && stage.dropOff > 0 && (
                        <div className="flex items-center gap-2 px-3 py-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                          <TrendingDown className="w-4 h-4 text-red-600 dark:text-red-400" />
                          <div className="text-right">
                            <div className="text-xs text-red-600 dark:text-red-400 font-medium">
                              Perda: {stage.dropOff.toLocaleString()}
                            </div>
                            <div className="text-xs text-red-500 dark:text-red-500">
                              {stage.dropOffRate}%
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Pending description */}
                  {stage.status === 'pending' && stage.description && (
                    <div className="mt-3 flex items-center gap-2 text-sm text-amber-600 dark:text-amber-400">
                      <AlertCircle className="w-4 h-4" />
                      <span>{stage.description}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
