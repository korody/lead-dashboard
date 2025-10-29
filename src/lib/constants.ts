export const ELEMENTOS_MTC = {
  RIM: { emoji: '🌊', nome: 'Rim (Água)', cor: '#06b6d4' },
  FÍGADO: { emoji: '🌳', nome: 'Fígado (Madeira)', cor: '#10b981' },
  BAÇO: { emoji: '🌍', nome: 'Baço (Terra)', cor: '#f59e0b' },
  CORAÇÃO: { emoji: '🔥', nome: 'Coração (Fogo)', cor: '#ef4444' },
  PULMÃO: { emoji: '💨', nome: 'Pulmão (Metal)', cor: '#94a3b8' },
} as const

export type ElementoMTC = keyof typeof ELEMENTOS_MTC

export const PRIORIDADES = {
  ALTA: { label: 'Alta', cor: '#ef4444' },
  MEDIA: { label: 'Média', cor: '#f59e0b' },
  BAIXA: { label: 'Baixa', cor: '#10b981' },
} as const

export const QUADRANTES = {
  1: { title: 'Q1: Crítico', desc: 'Alta Urgência + Alta Intensidade', color: '#ef4444' },
  2: { title: 'Q2: Urgente', desc: 'Alta Urgência + Baixa Intensidade', color: '#f97316' },
  3: { title: 'Q3: Importante', desc: 'Baixa Urgência + Alta Intensidade', color: '#f59e0b' },
  4: { title: 'Q4: Normal', desc: 'Baixa Urgência + Baixa Intensidade', color: '#10b981' },
} as const
