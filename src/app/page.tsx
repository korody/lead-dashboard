"use client"

import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { ELEMENTOS_MTC } from "../lib/constants";
import { useRealTimeMetrics } from "../hooks/use-metrics";
import { useDashboardStore } from "../stores/dashboard-store";
import { AnimatedStatCard } from "../components/ui/animated-stat-card";
import { InteractiveLineChart } from "../components/charts/interactive-line-chart";
import { InteractivePieChart } from "../components/charts/interactive-pie-chart";
import { InteractiveHorizontalBarChart } from "../components/charts/interactive-horizontal-bar-chart";
import { ConversionFunnel } from "../components/charts/conversion-funnel";
import UrgencyMatrix from "../components/ui/urgency-matrix";
import { motion, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, Users, Target, Send, AlertTriangle, Activity, BarChart3, 
  Download, FileText, Moon, Sun, Zap, ZapOff, RefreshCw, Filter,
  Bell, Settings, Eye
} from "lucide-react";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

type PriorityItem = { priority: string; count: number };
type ElementoItem = { elemento: string; count: number };
type EvolucaoItem = { data: string; leads: number };
type VipItem = { id: string; nome: string; email: string; celular: string; lead_score: number; created_at: string };
type Metrics = {
  totalLeads?: number;
  hotVips?: number;
  avgScore?: number;
  whatsappSuccess?: number;
  withWhatsapp?: number;
  priorities?: PriorityItem[];
  elementos?: ElementoItem[];
  evolucaoTemporal?: EvolucaoItem[];
  funil?: any;
  whatsappLogs?: any;
  vips24h?: VipItem[];
  resumo_diario?: any;
};

export default function DashboardPage() {
  const { data: metrics, isLoading, isError, error, refresh, isRealTimeEnabled, toggleRealTime } = useRealTimeMetrics();
  const { theme, setTheme } = useTheme();

  if (isLoading) {
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
            Carregando Dashboard...
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Sincronizando dados em tempo real
          </p>
        </motion.div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-red-900 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md mx-auto p-8"
        >
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Erro no Dashboard
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {error?.message || 'Falha ao carregar os dados'}
          </p>
          <button
            onClick={refresh}
            className="bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            Tentar Novamente
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-900 transition-all duration-500">
      {/* Advanced Header */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, type: "spring" }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg shadow-xl border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50"
      >
        <div className="px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <motion.div
                whileHover={{ rotate: 360 }}
                transition={{ duration: 0.6 }}
                className="flex items-center space-x-3"
              >
                <div className="relative">
                  <Activity className="h-10 w-10 text-indigo-600 dark:text-indigo-400" />
                  {isRealTimeEnabled && (
                    <motion.div
                      animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full"
                    />
                  )}
                </div>
                <div>
                  <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    Dashboard MTC
                  </h1>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Analytics Avançado • {metrics?.totalLeads?.toLocaleString('pt-BR')} leads
                  </p>
                </div>
              </motion.div>
            </div>

            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={toggleRealTime}
                className={`flex items-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  isRealTimeEnabled
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                }`}
              >
                {isRealTimeEnabled ? <Zap className="h-4 w-4" /> : <ZapOff className="h-4 w-4" />}
                <span>{isRealTimeEnabled ? 'Tempo Real' : 'Manual'}</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={refresh}
                className="flex items-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Atualizar</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => toast.success('CSV exportado com sucesso!', { duration: 3000 })}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-all"
              >
                <Download className="h-4 w-4" />
                <span>CSV</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className="p-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all"
              >
                {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="p-8 space-y-8">
        {/* Advanced Animated Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnimatedStatCard
            title="Total de Leads"
            value={metrics?.totalLeads || 0}
            previousValue={metrics?.totalLeads ? metrics.totalLeads - 100 : undefined}
            icon={Users}
            color="#6366f1"
            gradient="bg-gradient-to-br from-indigo-500 to-indigo-600"
            subtitle="Desde 01 Mai 2024"
            format="number"
            delay={0}
          />

          <AnimatedStatCard
            title="Leads VIP"
            value={metrics?.hotVips || 0}
            previousValue={metrics?.hotVips ? metrics.hotVips - 5 : undefined}
            icon={Target}
            color="#8b5cf6"
            gradient="bg-gradient-to-br from-purple-500 to-purple-600"
            subtitle="Score alto conversão"
            format="number"
            delay={0.1}
          />

          <AnimatedStatCard
            title="Média Lead Score"
            value={metrics?.avgScore || 0}
            previousValue={metrics?.avgScore ? metrics.avgScore - 0.5 : undefined}
            icon={TrendingUp}
            color="#06b6d4"
            gradient="bg-gradient-to-br from-cyan-500 to-blue-600"
            subtitle="Qualidade dos leads"
            format="number"
            delay={0.2}
          />

          <AnimatedStatCard
            title="Conversão Geral do Funil"
            value={metrics?.funil?.conversoes?.conversao_geral ? parseFloat(metrics.funil.conversoes.conversao_geral) : 0}
            previousValue={metrics?.funil?.conversoes?.conversao_geral ? parseFloat(metrics.funil.conversoes.conversao_geral) - 2.5 : undefined}
            icon={BarChart3}
            color="#10b981"
            gradient="bg-gradient-to-br from-green-500 to-emerald-600"
            subtitle="Cadastro → Grupos WhatsApp"
            format="percentage"
            delay={0.3}
          />
        </div>

        {/* Funil de Conversão Completo */}
        {metrics?.funil && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <Card className="shadow-2xl border-4 border-indigo-500 dark:border-indigo-400 bg-gray-50/50 dark:bg-gray-900/50">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Target className="h-7 w-7 text-indigo-600 dark:text-indigo-400" />
                  🎯 Funil de Conversão Completo
                </CardTitle>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Do cadastro até a entrada nos grupos WhatsApp
                </p>
              </CardHeader>
              <CardContent>
                <ConversionFunnel data={metrics.funil} />
              </CardContent>
            </Card>
          </motion.div>
        )}

  

        {/* Interactive Timeline Chart (moved above Status) */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <InteractiveLineChart
                data={metrics?.evolucaoTemporal}
                title="📈 Evolução Temporal"
                color="#8b5cf6"
                gradient={true}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Interactive Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* WhatsApp Status Bar Chart (full width) */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
              <CardContent className="p-6">
                <InteractiveHorizontalBarChart
                  title="📱 Status no Funil"
                  subtitle="Distribuição completa de todos os status"
                    data={
                    metrics?.whatsappDistribution?.map((item) => {
                      // Mapear status para nomes legíveis e cores.
                      // Normalizamos a chave aqui para bater com o que o backend retorna.
                      const normalize = (s: string) =>
                        String(s || '')
                          .trim()
                          .toUpperCase()
                          .normalize('NFD')
                          .replace(/\p{Diacritic}/gu, '')

                      const key = normalize(item.status)

                      const statusMap: Record<string, { name: string; color: string }> = {
                        'RESULTADOS_ENVIADOS': { name: 'Resultado Enviado', color: '#10b981' },
                        'RESULTADOSENVIADOS': { name: 'Resultado Enviado', color: '#10b981' },
                        'SENT': { name: 'Enviado', color: '#059669' },
                        'DESAFIO_ENVIADO': { name: 'Desafio Enviado', color: '#34d399' },
                        'DESAFIOENVIADO': { name: 'Desafio Enviado', color: '#34d399' },
                        'PENDING': { name: 'Pendente', color: '#f59e0b' },
                        'ERROR': { name: 'Erro', color: '#ef4444' },
                        'FAILED': { name: 'Falhou', color: '#dc2626' },
                        'DIAGNOSTICO_FINALIZADO': { name: 'Diagnóstico Finalizado', color: '#8b5cf6' },
                        'DIAGNOSTICOFINALIZADO': { name: 'Diagnóstico Finalizado', color: '#8b5cf6' },
                        'DIAGNOSTICO_ENVIADO': { name: 'Diagnóstico Enviado', color: '#7c3aed' },
                        'DIAGNOSTICOENVIADO': { name: 'Diagnóstico Enviado', color: '#7c3aed' },
                        'AGUARDANDO_CONTATO': { name: 'Aguardando Contato', color: '#6366f1' },
                        'AGUARDANDOCONTATO': { name: 'Aguardando Contato', color: '#6366f1' },
                      }

                      const mapped = statusMap[key] || { name: item.status, color: '#8b5cf6' }

                      return {
                        name: mapped.name,
                        value: item.count,
                        percentage: item.percentage,
                        color: mapped.color
                      }
                    }) || []}
                  totalLeads={metrics?.totalLeads}
                />
              </CardContent>
            </Card>
          </motion.div>
        </div>

        

        {/* Urgency x Intensity Matrix */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center gap-2">
                🧭 Matriz Urgência × Intensidade
              </CardTitle>
              <p className="text-sm text-gray-600 dark:text-gray-400">Distribuição de leads por quadrante (Q1..Q4)</p>
            </CardHeader>
            <CardContent>
              <UrgencyMatrix
                quadrants={metrics?.quadrants || []}
                storedCount={metrics?.storedDiagnosticsCount || 0}
                total={metrics?.funil?.etapas?.diagnostico_completo || metrics?.totalLeads || 0}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Advanced Priority Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardHeader>
              <CardTitle className="text-lg text-gray-900 dark:text-white flex items-center">
                🎯 Leads por Prioridade
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  className="ml-2"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                </motion.div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {[
                  { label: 'Alta', value: metrics?.priorities?.find((p: any) => p.priority === 'ALTA')?.count || 0, color: 'from-red-500 to-red-600', textColor: 'text-red-600', bgColor: 'bg-red-50 dark:bg-red-900/20' },
                  { label: 'Média', value: metrics?.priorities?.find((p: any) => p.priority === 'MEDIA')?.count || 0, color: 'from-orange-500 to-orange-600', textColor: 'text-orange-600', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
                  { label: 'Baixa', value: metrics?.priorities?.find((p: any) => p.priority === 'BAIXA')?.count || 0, color: 'from-green-500 to-green-600', textColor: 'text-green-600', bgColor: 'bg-green-50 dark:bg-green-900/20' }
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.8 + index * 0.1, duration: 0.4 }}
                    whileHover={{ scale: 1.05, y: -5 }}
                    className={`${item.bgColor} p-6 rounded-2xl text-center cursor-pointer transition-all duration-300 hover:shadow-lg`}
                  >
                    <div className={`text-sm font-medium mb-3 ${item.textColor} dark:text-white`}>
                      {item.label}
                    </div>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 1 + index * 0.1, duration: 0.5, type: "spring" }}
                      className={`text-4xl font-bold ${item.textColor} dark:text-white mb-2`}
                    >
                      {item.value}
                    </motion.div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      leads
                    </div>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* MTC Elements Chart (moved to bottom) */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <Card className="shadow-xl border-0 bg-white/80 dark:bg-gray-800/80 backdrop-blur-lg">
            <CardContent className="p-6">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">🔬 Elementos MTC</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">Distribuição por elemento dominante</p>
              </div>
              
              <div className="space-y-4">
                {Object.entries(ELEMENTOS_MTC).map(([key, elem], index) => {
                  const count = metrics?.elementos?.find((e: any) => e.elemento === key)?.count || 0;
                  const maxCount = Math.max(...(metrics?.elementos?.map((e: any) => e.count) || [1]));
                  const percentage = maxCount > 0 ? (count / maxCount) * 100 : 0;

                  return (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.6 + index * 0.1, duration: 0.3 }}
                      className="group hover:bg-gray-50 dark:hover:bg-gray-700/50 p-3 rounded-lg transition-all cursor-pointer"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          <motion.span 
                            whileHover={{ scale: 1.2 }}
                            className="text-2xl"
                          >
                            {elem.emoji}
                          </motion.span>
                          <div>
                            <span className="font-medium text-gray-900 dark:text-white">{elem.nome}</span>
                            <div className="text-xs text-gray-600 dark:text-gray-400">{key}</div>
                          </div>
                        </div>
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ delay: 0.8 + index * 0.1, duration: 0.3 }}
                          className="text-right"
                        >
                          <div className="text-lg font-bold text-gray-900 dark:text-white">{count}</div>
                          <div className="text-xs text-gray-600 dark:text-gray-400">
                            {percentage.toFixed(1)}%
                          </div>
                        </motion.div>
                      </div>
                      
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${percentage}%` }}
                          transition={{ delay: 0.9 + index * 0.1, duration: 0.8, ease: "easeOut" }}
                          className="h-2 rounded-full transition-all duration-300 group-hover:brightness-110"
                          style={{ backgroundColor: elem.cor }}
                        />
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer with real-time indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.5 }}
          className="text-center py-8"
        >
          <div className="flex items-center justify-center space-x-2 text-gray-600 dark:text-gray-400">
            <motion.div
              animate={{ 
                scale: isRealTimeEnabled ? [1, 1.2, 1] : 1,
                opacity: isRealTimeEnabled ? [1, 0.5, 1] : 0.5
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className={`w-2 h-2 rounded-full ${isRealTimeEnabled ? 'bg-green-500' : 'bg-gray-400'}`}
            />
            <span className="text-sm">
              {isRealTimeEnabled ? 'Dados atualizando em tempo real' : 'Modo manual ativo'} • 
              Última atualização: {new Date().toLocaleTimeString('pt-BR')}
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
