"use client"

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { Campaign } from '@/types/campaign'
import { motion } from 'framer-motion'
import { Plus, Trash2, Save, X, LogOut } from 'lucide-react'
import toast from 'react-hot-toast'

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [leadCounts, setLeadCounts] = useState<Record<string, number>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<Partial<Campaign>>({})
  const [isLoading, setIsLoading] = useState(false)

  const handleAuth = async () => {
    setAuthError('')
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        body: JSON.stringify({ password }),
        headers: { 'Content-Type': 'application/json' },
      })

      if (res.ok) {
        setIsAuthenticated(true)
        setPassword('')
        loadCampaigns()
        toast.success('Autenticado com sucesso!')
      } else {
        setAuthError('Senha incorreta')
        toast.error('Senha incorreta')
      }
    } catch (error) {
      setAuthError('Erro ao autenticar')
      console.error(error)
    }
  }

  const loadCampaigns = async () => {
    try {
      const { data: campaignsData, error } = await supabase
        .from('dash_campaigns')
        .select('*')
        .order('prioridade', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error
      setCampaigns(campaignsData ?? [])

      // Conta leads por campanha usando count exato (sem paginação)
      const utms = campaignsData?.filter(c => c.utm_campaign).map(c => c.utm_campaign as string) ?? []
      const countResults = await Promise.all(
        utms.map(utm =>
          supabase
            .from('quiz_leads')
            .select('*', { count: 'exact', head: true })
            .ilike('utm_campaign', utm)
            .then(({ count }) => ({ utm: utm.toLowerCase(), count: count ?? 0 }))
        )
      )

      const counts: Record<string, number> = {}
      countResults.forEach(({ utm, count }) => { counts[utm] = count })
      setLeadCounts(counts)
    } catch (error) {
      console.error('Erro ao carregar campanhas:', error)
      toast.error('Erro ao carregar campanhas')
    }
  }

  const handleEdit = (campaign: Campaign) => {
    setEditingId(campaign.id)
    setEditForm({ ...campaign })
  }

  const handleSave = async () => {
    if (!editingId) return

    setIsLoading(true)
    try {
      const { error } = await supabase
        .from('dash_campaigns')
        .update({
          nome: editForm.nome,
          slug: editForm.slug,
          meta_leads: editForm.meta_leads,
          data_inicio: editForm.data_inicio,
          data_fim: editForm.data_fim,
          utm_campaign: editForm.utm_campaign,
          ac_tag_id: editForm.ac_tag_id ?? null,
          sendflow_campaign_id: editForm.sendflow_campaign_id ?? null,
          prioridade: editForm.prioridade ?? 0,
          ativo: editForm.ativo,
        })
        .eq('id', editingId)

      if (error) throw error

      toast.success('Campanha atualizada com sucesso!')
      setEditingId(null)
      setEditForm({})
      loadCampaigns()
    } catch (error) {
      const msg = (error as { message?: string })?.message || JSON.stringify(error)
      console.error('Erro ao salvar:', msg)
      toast.error(`Erro ao salvar: ${msg}`)
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja deletar esta campanha?')) {
      try {
        const { error } = await supabase
          .from('dash_campaigns')
          .delete()
          .eq('id', id)

        if (error) throw error

        toast.success('Campanha deletada com sucesso!')
        loadCampaigns()
      } catch (error) {
        console.error('Erro ao deletar:', error)
        toast.error('Erro ao deletar campanha')
      }
    }
  }

  const handleAddNew = async () => {
    try {
      const maxPrioridade = campaigns.length > 0
        ? Math.max(...campaigns.map(c => c.prioridade ?? 0)) + 1
        : 0
      const { error } = await supabase.from('dash_campaigns').insert({
        slug: `campaign-${Date.now()}`,
        nome: 'Nova Campanha',
        meta_leads: 10000,
        data_inicio: null,
        data_fim: null,
        utm_campaign: null,
        prioridade: maxPrioridade,
        ativo: true,
      })

      if (error) throw error

      toast.success('Campanha criada com sucesso!')
      loadCampaigns()
    } catch (error) {
      console.error('Erro ao criar:', error)
      toast.error('Erro ao criar campanha')
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="w-full min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
        >
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Admin
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Gerenciamento de campanhas
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') handleAuth()
                }}
                placeholder="Digite a senha de admin"
                className="w-full px-4 py-2 border-2 border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-gray-900 dark:text-white"
              />
              {authError && (
                <p className="text-red-500 text-sm mt-2">{authError}</p>
              )}
            </div>

            <button
              onClick={handleAuth}
              className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-semibold py-2 px-4 rounded-lg transition-all"
            >
              Entrar
            </button>
          </div>

        </motion.div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-gradient-to-br from-gray-50 via-white to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-indigo-950 p-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl mx-auto"
      >
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
            Gerenciamento de Campanhas
          </h1>
          <button
            onClick={() => {
              setIsAuthenticated(false)
              setCampaigns([])
            }}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-all"
          >
            <LogOut className="w-4 h-4" />
            Sair
          </button>
        </div>

        <button
          onClick={handleAddNew}
          className="mb-6 flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-semibold transition-all"
        >
          <Plus className="w-5 h-5" />
          Nova Campanha
        </button>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-gray-800 dark:to-gray-700">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white w-20">
                    Prioridade
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Nome
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    UTM Campaign
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    AC Tag ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    SendFlow ID
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Total de Leads
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Meta
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Data Início
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Data Fim
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900 dark:text-white">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {campaigns.map((campaign) => (
                  <tr
                    key={campaign.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {editingId === campaign.id ? (
                      <>
                        <td className="px-4 py-4">
                          <input
                            type="number"
                            min="0"
                            value={editForm.prioridade ?? 0}
                            onChange={(e) =>
                              setEditForm({ ...editForm, prioridade: parseInt(e.target.value) || 0 })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white text-sm w-16 text-center"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            value={editForm.nome ?? ''}
                            onChange={(e) =>
                              setEditForm({ ...editForm, nome: e.target.value })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="ex: bny2, qgs1, dex"
                            value={editForm.utm_campaign ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                utm_campaign: e.target.value || null,
                              })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white text-sm w-28"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            placeholder="ex: 679"
                            value={editForm.ac_tag_id ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                ac_tag_id: e.target.value ? parseInt(e.target.value) : null,
                              })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white text-sm w-24"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="text"
                            placeholder="ex: wg2d0SAmMwoRt0kBOVG"
                            value={editForm.sendflow_campaign_id ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                sendflow_campaign_id: e.target.value || null,
                              })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white text-sm w-40 font-mono"
                          />
                        </td>
                        <td className="px-6 py-4 text-gray-400 text-sm">
                          {campaign.utm_campaign ? (leadCounts[campaign.utm_campaign] ?? 0).toLocaleString('pt-BR') : '-'}
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="number"
                            value={editForm.meta_leads ?? 0}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                meta_leads: parseInt(e.target.value),
                              })
                            }
                            className="px-2 py-1 border rounded w-24 dark:bg-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editForm.data_inicio ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                data_inicio: e.target.value || null,
                              })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="date"
                            value={editForm.data_fim ?? ''}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                data_fim: e.target.value || null,
                              })
                            }
                            className="px-2 py-1 border rounded dark:bg-gray-900 dark:text-white"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <input
                            type="checkbox"
                            checked={editForm.ativo ?? true}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                ativo: e.target.checked,
                              })
                            }
                            className="w-4 h-4"
                          />
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={handleSave}
                            disabled={isLoading}
                            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded transition-all text-sm disabled:opacity-50"
                          >
                            <Save className="w-4 h-4" />
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="flex items-center gap-1 bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded transition-all text-sm"
                          >
                            <X className="w-4 h-4" />
                            Cancelar
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4 text-center">
                          <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-sm font-bold">
                            {campaign.prioridade ?? 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                          {campaign.nome}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.utm_campaign ? (
                            <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">
                              {campaign.utm_campaign}
                            </code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.ac_tag_id ? (
                            <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs">
                              {campaign.ac_tag_id}
                            </code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.sendflow_campaign_id ? (
                            <code className="bg-gray-100 dark:bg-gray-900 px-2 py-1 rounded text-xs font-mono">
                              {campaign.sendflow_campaign_id.slice(0, 10)}…
                            </code>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="px-6 py-4">
                          {campaign.utm_campaign ? (
                            <div className="flex flex-col">
                              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                                {(leadCounts[campaign.utm_campaign] ?? 0).toLocaleString('pt-BR')}
                              </span>
                              <span className="text-xs text-gray-400">
                                de {campaign.meta_leads.toLocaleString('pt-BR')}
                                {' '}({Math.round((leadCounts[campaign.utm_campaign] ?? 0) / campaign.meta_leads * 100)}%)
                              </span>
                            </div>
                          ) : (
                            <span className="text-gray-400">-</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900 dark:text-white text-sm">
                          {campaign.meta_leads.toLocaleString('pt-BR')}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.data_inicio ?? '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400">
                          {campaign.data_fim ?? '-'}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-3 py-1 rounded-full text-sm font-medium ${
                              campaign.ativo
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                                : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                            }`}
                          >
                            {campaign.ativo ? 'Ativa' : 'Encerrada'}
                          </span>
                        </td>
                        <td className="px-6 py-4 flex gap-2">
                          <button
                            onClick={() => handleEdit(campaign)}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1 rounded transition-all text-sm"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(campaign.id)}
                            className="flex items-center gap-1 bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded transition-all text-sm"
                          >
                            <Trash2 className="w-4 h-4" />
                            Deletar
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
