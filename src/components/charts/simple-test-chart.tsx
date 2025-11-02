'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const testData = [
  { date: '2025-10-01', leads: 15 },
  { date: '2025-10-02', leads: 25 },
  { date: '2025-10-03', leads: 35 },
  { date: '2025-10-04', leads: 45 },
  { date: '2025-10-05', leads: 55 },
  { date: '2025-10-06', leads: 65 },
  { date: '2025-10-07', leads: 75 }
]

export function SimpleTestChart() {
  console.log('SimpleTestChart is rendering with data:', testData)
  
  return (
    <div className="w-full h-80 p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-semibold mb-4">Teste do Gráfico</h3>
      <ResponsiveContainer width="100%" height="90%">
        <AreaChart data={testData}>
          <defs>
            <linearGradient id="testGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.8}/>
              <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis 
            dataKey="date" 
            tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: '2-digit', day: '2-digit' })}
          />
          <YAxis />
          <Tooltip 
            labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' })}
            formatter={(value) => [`${value} leads`, 'Leads']}
          />
          <Area 
            type="monotone" 
            dataKey="leads" 
            stroke="#8b5cf6" 
            fill="url(#testGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}