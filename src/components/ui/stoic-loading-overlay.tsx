"use client"

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { RefreshCw } from 'lucide-react'

const STOIC_QUOTES = [
  {
    text: "Você tem poder sobre sua mente, não sobre eventos externos. Realize isso e você encontrará força.",
    author: "Marco Aurélio"
  },
  {
    text: "A felicidade de sua vida depende da qualidade de seus pensamentos.",
    author: "Marco Aurélio"
  },
  {
    text: "O impedimento à ação avança a ação. O que fica no caminho se torna o caminho.",
    author: "Marco Aurélio"
  },
  {
    text: "Não é o que acontece com você, mas como você reage a isso que importa.",
    author: "Epicteto"
  },
  {
    text: "Primeiro, diga a si mesmo o que você gostaria de ser; então faça o que você tem que fazer.",
    author: "Epicteto"
  },
  {
    text: "A riqueza consiste não em ter grandes posses, mas em ter poucas necessidades.",
    author: "Epicteto"
  },
  {
    text: "Às vezes até viver é um ato de coragem.",
    author: "Sêneca"
  },
  {
    text: "A sorte é o que acontece quando a preparação encontra a oportunidade.",
    author: "Sêneca"
  },
  {
    text: "Não temos pouco tempo, mas perdemos muito dele.",
    author: "Sêneca"
  },
  {
    text: "Melhor conquistar a si mesmo do que vencer mil batalhas.",
    author: "Marco Aurélio"
  }
]

interface StoicLoadingOverlayProps {
  message?: string
}

export function StoicLoadingOverlay({ message = "Carregando insights..." }: StoicLoadingOverlayProps) {
  // Randomiza a primeira citação no useState
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(() => 
    Math.floor(Math.random() * STOIC_QUOTES.length)
  )

  useEffect(() => {
    // Muda a citação a cada 6 segundos
    const interval = setInterval(() => {
      setCurrentQuoteIndex((prev) => (prev + 1) % STOIC_QUOTES.length)
    }, 6000)

    return () => clearInterval(interval)
  }, [])

  const currentQuote = STOIC_QUOTES[currentQuoteIndex]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-sm"
    >
      <div className="max-w-2xl mx-auto px-6 text-center space-y-8">
        {/* Spinner animado */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="mx-auto w-20 h-20 border-4 border-white/20 border-t-white rounded-full"
        />

        {/* Mensagem de carregamento */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          <RefreshCw className="h-6 w-6 text-white/80 animate-pulse" />
          <p className="text-xl font-semibold text-white/90">
            {message}
          </p>
        </motion.div>

        {/* Citações estoicas com transição */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuoteIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.5 }}
            className="space-y-4"
          >
            <div className="relative">
              <svg className="absolute -top-4 -left-4 h-8 w-8 text-white/20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
              <p className="text-2xl md:text-3xl font-light text-white leading-relaxed italic px-8">
                &ldquo;{currentQuote.text}&rdquo;
              </p>
            </div>
            <p className="text-lg text-white/70 font-medium">
              — {currentQuote.author}
            </p>
          </motion.div>
        </AnimatePresence>

        {/* Indicador de progresso */}
        <div className="flex justify-center gap-2 pt-4">
          {STOIC_QUOTES.map((_, index) => (
            <motion.div
              key={index}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                index === currentQuoteIndex 
                  ? 'w-8 bg-white' 
                  : 'w-1.5 bg-white/30'
              }`}
              animate={{
                scale: index === currentQuoteIndex ? 1.2 : 1
              }}
            />
          ))}
        </div>
      </div>
    </motion.div>
  )
}
