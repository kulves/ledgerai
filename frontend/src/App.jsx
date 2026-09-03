/**
 * App.jsx — Ledger AI Root Application
 * New sidebar-based layout with dark/light/system theme support.
 * selectedBusiness lifted here so all pages share the same state.
 */
import { useState, useEffect } from 'react'
import OnboardingFlow from './components/OnboardingFlow'
import Sidebar from './components/Sidebar'
import ParticlesHeader from './components/ParticlesHeader'
import OllamaSetup from './components/OllamaSetup'
import { api } from './services/api'
import ChatPage from './pages/ChatPage'
import ExpensesPage from './pages/ExpensesPage'
import MileagePage from './pages/MileagePage'
import DocumentsPage from './pages/DocumentsPage'
import ReportsPage from './pages/ReportsPage'
import DashboardPage from './pages/DashboardPage'
import SettingsPage from './pages/SettingsPage'
import SubscriptionPage from './pages/SubscriptionPage'
import IncomePage from './pages/IncomePage'


export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [backendStatus, setBackendStatus] = useState('checking')
  const [businesses, setBusinesses] = useState([])
  const [selectedBusiness, setSelectedBusiness] = useState(null)
  const [onboarded, setOnboarded] = useState(
    () => localStorage.getItem('luca_onboarded') === 'true'
  )
  const [ollamaSetupDone, setOllamaSetupDone] = useState(
    () => localStorage.getItem('luca_ollama_setup_done') === 'true'
  )
  const [theme, setThemeState] = useState(
    () => localStorage.getItem('luca_theme') || 'dark'
  )

  // Apply theme to DOM
  const applyTheme = (t) => {
    const resolved = t === 'system'
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : t
    document.documentElement.setAttribute('data-theme', resolved)
  }

  const setTheme = (t) => {
    setThemeState(t)
    localStorage.setItem('luca_theme', t)
    applyTheme(t)
  }

  useEffect(() => { applyTheme(theme) }, [])

  useEffect(() => {
    const checkBackend = async () => {
      const data = await api.getHealth()
      setBackendStatus(data?.status === 'ok' ? 'connected' : 'disconnected')
    }
    checkBackend()
    const interval = setInterval(checkBackend, 8000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (onboarded && ollamaSetupDone) {
      api.getBusinesses().then(data => {
        if (data?.length) {
          setBusinesses(data)
          if (!selectedBusiness) setSelectedBusiness(data[0])
        }
      })
    }
  }, [onboarded, ollamaSetupDone])

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

  if (!onboarded) {
    return <OnboardingFlow onComplete={() => setOnboarded(true)} />
  }

  const pageProps = {
    backendStatus,
    selectedBusiness,
    onSelectBusiness: setSelectedBusiness,
    businesses,
  }

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--bg)' }}>
      {/* Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        businesses={businesses}
        selectedBusiness={selectedBusiness}
        onSelectBusiness={setSelectedBusiness}
        theme={theme}
        setTheme={setTheme}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Particles header — online status, no nav tabs */}
        <ParticlesHeader backendStatus={backendStatus} 
          activeTab={activeTab}
          theme={theme}
          setTheme={setTheme}
        />
     
        {/* Page */}
        <main className="flex-1 overflow-y-auto" style={{ background: 'var(--bg)' }}>
          {activeTab === 'dashboard'    && <DashboardPage    {...pageProps} onNavigate={setActiveTab} />}
          {activeTab === 'chat'         && <ChatPage         {...pageProps} />}
          {activeTab === 'expenses'     && <ExpensesPage     {...pageProps} />}
          {activeTab === 'mileage'      && <MileagePage      {...pageProps} />}
          {activeTab === 'documents'    && <DocumentsPage    {...pageProps} />}
          {activeTab === 'reports'      && <ReportsPage      {...pageProps} />}
          {activeTab === 'subscription' && <SubscriptionPage {...pageProps} />}
          {activeTab === 'settings'     && <SettingsPage     {...pageProps} onResetOnboarding={() => setOnboarded(false)} />}
          {activeTab === 'income'       && <IncomePage       {...pageProps} />}
        </main>
      </div>
    </div>
  )
}

function BanksPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
      <svg className="w-16 h-16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
        <rect x="2" y="5" width="20" height="14" rx="2"/><path d="M2 10h20"/>
      </svg>
      <div className="text-center">
        <p className="font-bold text-lg" style={{ color: 'var(--text-0)' }}>Connected Banks</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text-2)' }}>Bank connections coming in Phase 2</p>
      </div>
    </div>
  )
}