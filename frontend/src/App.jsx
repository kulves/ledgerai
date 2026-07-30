/**
 * App.jsx — Ledger AI Root Application
 */
import { useState, useEffect } from 'react'
import OnboardingFlow from './components/OnboardingFlow'
import { api } from './services/api'
import ChatPage from './pages/ChatPage'
import ExpensesPage from './pages/ExpensesPage'
import MileagePage from './pages/MileagePage'
import DocumentsPage from './pages/DocumentsPage'
import ReportsPage from './pages/ReportsPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import ParticlesHeader from './components/ParticlesHeader'
import OllamaSetup from './components/OllamaSetup'

const TABS = [
  { id: 'dashboard',    label: 'Dashboard'    },
  { id: 'chat',         label: 'Ask Luca'     },
  { id: 'expenses',     label: 'Expenses'     },
  { id: 'mileage',      label: 'Mileage'      },
  { id: 'documents',    label: 'Documents'    },
  { id: 'reports',      label: 'Reports'      },
  { id: 'subscription', label: 'Subscription' },
  { id: 'settings',     label: 'Settings'     },
]

export default function App() {
  const [backendStatus, setBackendStatus] = useState('checking')
  const [activeTab, setActiveTab] = useState('dashboard')
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('luca_onboarded') === 'true'
  )
  const [ollamaSetupDone, setOllamaSetupDone] = useState(
    () => localStorage.getItem('luca_ollama_setup_done') === 'true'
  )

  useEffect(() => {
    const checkBackend = async () => {
      const data = await api.getHealth()
      setBackendStatus(data.status === 'ok' ? 'connected' : 'disconnected')
    }
    checkBackend()
    const interval = setInterval(checkBackend, 8000)
    return () => clearInterval(interval)
  }, [])

  // Step 1 — Ollama setup (first time only, persisted to localStorage)
  if (!ollamaSetupDone) {
    return (
      <OllamaSetup
        onComplete={() => {
          localStorage.setItem('luca_ollama_setup_done', 'true')
          setOllamaSetupDone(true)
        }}
      />
    )
  }

  // Step 2 — Onboarding (first time only)
  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />
  }

  // Step 3 — Main app
  return (
    <div className="min-h-screen bg-[#FAFAF8] flex flex-col">
      <ParticlesHeader
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        backendStatus={backendStatus}
        tabs={TABS}
      />
      <main className="flex-1 overflow-hidden flex flex-col">
        {activeTab === 'dashboard' && (
          <DashboardPage
            backendStatus={backendStatus}
            onNavigate={setActiveTab}
          />
        )}
        {activeTab === 'chat' && (
          <ChatPage backendStatus={backendStatus} />
        )}
        {activeTab === 'expenses' && (
          <ExpensesPage backendStatus={backendStatus} />
        )}
        {activeTab === 'mileage' && (
          <MileagePage backendStatus={backendStatus} />
        )}
        {activeTab === 'documents' && (
          <DocumentsPage backendStatus={backendStatus} />
        )}
        {activeTab === 'reports' && (
          <ReportsPage backendStatus={backendStatus} />
        )}
        {activeTab === 'subscription' && (
          <SubscriptionPage backendStatus={backendStatus} />
        )}
        {activeTab === 'settings' && (
          <SettingsPage
            backendStatus={backendStatus}
            onResetOnboarding={() => setOnboarded(false)}
          />
        )}
      </main>
    </div>
  )
}