import { useState, useCallback } from 'react'
import { Toaster } from '@/components/ui/sonner'
import { ScientificBackground } from './components/ScientificBackground'
import { Header } from './components/Header'
import { ServerWorkflow } from './components/ServerWorkflow'

export default function App() {
  // Key to force re-mount of ServerWorkflow on reset
  const [workflowKey, setWorkflowKey] = useState(0)
  const [showReset, setShowReset] = useState(false)

  const handleReset = useCallback(() => {
    // Increment key to force ServerWorkflow to re-mount and reset all state
    setWorkflowKey((prev) => prev + 1)
    setShowReset(false)
  }, [])

  const handleWorkflowStart = useCallback(() => {
    setShowReset(true)
  }, [])

  return (
    <div className="min-h-screen bg-background relative">
      <ScientificBackground />
      <Header onReset={handleReset} showReset={showReset} />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl relative z-10">
        <ServerWorkflow key={workflowKey} onWorkflowStart={handleWorkflowStart} />
      </main>

      <Toaster position="top-right" />
    </div>
  )
}
