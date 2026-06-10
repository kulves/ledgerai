import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

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
          className="bg-[#C9962C] hover:bg-[#B88A24] text-white px-10 py-4 rounded-xl text-lg font-semibold transition-all active:scale-95 shadow-lg"
        >
          Test Button — Clicked {count} times
        </button>

        <div className="mt-12 text-sm text-gray-500">
          Backend Status: <span className="text-green-600 font-medium">🟢 Connected</span>
        </div>
      </div>
    </div>
  )
}

export default App