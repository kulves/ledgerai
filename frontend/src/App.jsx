import { useState, useEffect } from 'react'
import { api } from './services/api'

function App() {
  const [count, setCount] = useState(0)
  const [backendStatus, setBackendStatus] = useState('Checking...')
  const [backendInfo, setBackendInfo] = useState(null)

  useEffect(() => {
    const checkBackend = async () => {
      const data = await api.getHealth()
      setBackendInfo(data)
      
      if (data.status === 'ok') {
        setBackendStatus('🟢 Connected')
      } else {
        setBackendStatus('🔴 Disconnected')
      }
    }

    checkBackend()
    const interval = setInterval(checkBackend, 8000) // Check every 8 seconds
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-[#FAFAF8] flex items-center justify-center p-8">
      <div className="max-w-md text-center">
        <h1 className="text-6xl font-bold text-[#0C2340] mb-2 tracking-tight">
          Luca
        </h1>
        <p className="text-xl text-[#C9962C] mb-8 font-medium">
          by Ledger AI
        </p>
        
        <p className="text-lg text-gray-700 mb-10">
          Your local-first AI bookkeeping and tax assistant
        </p>

        <button 
          onClick={() => setCount(count + 1)}
          className="bg-[#C9962C] hover:bg-[#B88A24] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 shadow-lg mb-8"
        >
          Test Button — Clicked {count} times
        </button>

        <div className="text-sm text-gray-600 mb-4">
          Backend Status: <span className="font-medium">{backendStatus}</span>
        </div>

        {backendInfo && (
          <div className="text-xs bg-white p-4 rounded border border-gray-200 text-left">
            <strong>Backend Info:</strong><br />
            Status: {backendInfo.status}<br />
            Version: {backendInfo.version || '0.1.0'}<br />
            Model: {backendInfo.model || 'llama3.2-vision'}
          </div>
        )}
      </div>
    </div>
  )
}

export default App