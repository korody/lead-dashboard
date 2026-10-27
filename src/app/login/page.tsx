"use client"

import { Suspense, useState } from 'react'
import { useSearchParams } from 'next/navigation'

function LoginForm() {
  const searchParams = useSearchParams()
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const entrar = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(json.error || 'Não foi possível entrar')
        return
      }
      // Só caminhos internos, para o ?next= não virar redirecionamento para fora
      const next = searchParams?.get('next') || '/'
      window.location.href = next.startsWith('/') && !next.startsWith('//') ? next : '/'
    } catch {
      setError('Erro de conexão')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={entrar}
      className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md border border-gray-200 dark:border-gray-700"
    >
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Lead Dashboard</h1>
      <p className="text-gray-600 dark:text-gray-400 mb-8">Digite a senha da equipe para entrar.</p>
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Senha"
        autoFocus
        className="w-full px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white mb-4"
      />
      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
      <button
        type="submit"
        disabled={loading || !password}
        className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold py-3 rounded-lg"
      >
        {loading ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  )
}

export default function LoginPage() {
  return (
    <div className="w-full min-h-screen flex items-center justify-center p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </div>
  )
}
