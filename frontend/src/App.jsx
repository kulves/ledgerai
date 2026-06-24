/**
 * App.jsx — Ledger AI Root Application
 * =======================================
 * Module 10: Added tab navigation between Chat and Expenses pages.
 * Manages global backend status and passes it to all pages.
 */

import { useState, useEffect } from 'react'
import { api } from './services/api'
import ChatPage from './pages/ChatPage'
import ExpensesPage from './pages/ExpensesPage'
import MileagePage from './pages/MileagePage'

const TABS = [
  { id: 'chat',     label: 'Ask Luca' },
  { id: 'expenses', label: 'Expenses' },
  { id: 'mileage',  label: 'Mileage'  },
]

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [activeTab, setActiveTab] = useState('chat')

  useEffect(() => {
    const checkBackend = async () => {
      const data = await api.getHealth()
      setBackendStatus(data.status === 'ok' ? 'connected' : 'disconnected')
    }
    checkBackend()
    const interval = setInterval(checkBackend, 8000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">

      {/* ── Header ── */}
      <header className="bg-[#0C2340] text-white px-6 py-4 flex items-center justify-between shadow-md flex-shrink-0">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Luca</h1>
          <p className="text-[#C9962C] text-sm font-medium">by Ledger AI</p>
        </div>

        {/* Tab navigation */}
        <nav className="flex gap-1">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-white/20 text-white'
                  : 'text-white/60 hover:text-white hover:bg-white/10'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Backend status */}
        <div className="flex items-center gap-2 text-sm">
          <span className={`w-2.5 h-2.5 rounded-full ${
            backendStatus === 'connected'    ? 'bg-emerald-400' :
            backendStatus === 'checking'     ? 'bg-yellow-400'  :
                                               'bg-rose-400'
          }`} />
          <span className="text-gray-300 capitalize">{backendStatus}</span>
        </div>
      </header>

      {/* ── Page content ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'chat'     && <ChatPage     backendStatus={backendStatus} />}
        {activeTab === 'expenses' && <ExpensesPage backendStatus={backendStatus} />}
        {activeTab === 'mileage'   && <MileagePage   backendStatus={backendStatus} />}
      </main>

    </div>
  )
}