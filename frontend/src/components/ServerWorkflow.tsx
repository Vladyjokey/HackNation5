import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowRight,
  Lightbulb,
  Beaker,
  TestTube,
  Leaf,
  Activity,
  Search,
  CheckCircle2,
  AlertCircle,
  FileWarning,
  ExternalLink,
  Loader2,
  RefreshCw,
  AlertTriangle,
  BookOpen,
  Target,
  BarChart3,
  Flag,
  Info,
  Link2,
  Database,
  Users,
  History,
  MessageSquare,
  Settings,
  Shield,
  FileText,
  Brain,
  Package,
  Sparkles,
  Zap,
  Clock,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { cn } from '@/lib/utils'
import { ProgressIndicator } from './ProgressIndicator'
import { ServerPlanDisplay } from './ServerPlanDisplay'
import { ScientistReview } from './ScientistReview'
import {
  fetchFullExperiment,
  APIError,
  type LiteratureQCResponse,
  type ServerExperimentPlan,
} from '../lib/api'
import type { Feedback, ExperimentPlanData, Stage } from '../types'

type ServerStage = 'input' | 'literature-qc' | 'experiment-plan' | 'review'

interface ServerWorkflowState {
  stage: ServerStage
  hypothesis: string
  isLoading: boolean
  error: string | null
  literatureResult: LiteratureQCResponse | null
  experimentPlan: ServerExperimentPlan | null
  feedbackHistory: Feedback[]
}

const exampleHypotheses = [
  {
    title: 'Diagnostics',
    icon: Activity,
    hypothesis: 'A paper-based electrochemical biosensor functionalized with anti-CRP antibodies will detect C-reactive protein in whole blood at concentrations below 0.5 mg/L within 10 minutes.',
    plain: 'Can we build a cheap, fast blood test for inflammation?',
  },
  {
    title: 'Gut Health',
    icon: Beaker,
    hypothesis: 'Supplementing C57BL/6 mice with Lactobacillus rhamnosus GG for 4 weeks will reduce intestinal permeability by at least 30% compared to controls.',
    plain: 'Does a specific probiotic strengthen the gut lining in mice?',
  },
  {
    title: 'Cell Biology',
    icon: TestTube,
    hypothesis: 'Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw viability of HeLa cells by at least 15 percentage points.',
    plain: 'Can we keep more cells alive when freezing them?',
  },
  {
    title: 'Climate',
    icon: Leaf,
    hypothesis: 'Introducing Sporomusa ovata into a bioelectrochemical system will fix CO2 into acetate at a rate exceeding current biocatalytic benchmarks by 20%.',
    plain: 'Can microbes convert CO2 efficiently?',
  },
]

const noveltyConfig = {
  'not-found': {
    icon: CheckCircle2,
    color: 'text-green-600 dark:text-green-400',
    bgColor: 'border-green-500/30 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/10',
    label: 'Novel Research',
    description: 'No existing protocols found for this exact approach. You may be breaking new ground.',
  },
  'similar-work-exists': {
    icon: AlertCircle,
    color: 'text-amber-600 dark:text-amber-400',
    bgColor: 'border-amber-500/30 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10',
    label: 'Similar Work Exists',
    description: 'Related experiments have been conducted. Review the references to build on existing work.',
  },
  'exact-match-found': {
    icon: FileWarning,
    color: 'text-red-600 dark:text-red-400',
    bgColor: 'border-red-500/30 bg-red-500/10 dark:border-red-500/30 dark:bg-red-500/10',
    label: 'Exact Match Found',
    description: 'This protocol has been done before. Consider how your approach differs.',
  },
}

interface ServerWorkflowProps {
  onWorkflowStart?: () => void
}

export function ServerWorkflow({ onWorkflowStart }: ServerWorkflowProps) {
  const [state, setState] = useState<ServerWorkflowState>({
    stage: 'input',
    hypothesis: '',
    isLoading: false,
    error: null,
    literatureResult: null,
    experimentPlan: null,
    feedbackHistory: [],
  })

  const [inputValue, setInputValue] = useState('')
  const [inputError, setInputError] = useState('')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('')
  const [loadingElapsedTime, setLoadingElapsedTime] = useState(0)
  const [partialResults, setPartialResults] = useState<Partial<LiteratureQCResponse> | null>(null)
  const [showResetConfirm, setShowResetConfirm] = useState(false)
  
  // Track the highest stage reached for navigation
  const [highestStageReached, setHighestStageReached] = useState<Stage>('input')
  
  // Refs for smooth scrolling to sections
  const experimentPlanRef = useRef<HTMLDivElement>(null)
  const reviewSectionRef = useRef<HTMLDivElement>(null)
  
  const stageOrder: Stage[] = ['input', 'literature-qc', 'experiment-plan', 'review']
  
  // Smooth scroll helper with offset for header
  const scrollToSection = useCallback((ref: React.RefObject<HTMLDivElement | null>) => {
    setTimeout(() => {
      if (ref.current) {
        const headerOffset = 100 // Account for fixed header
        const elementPosition = ref.current.getBoundingClientRect().top
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset
        
        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth'
        })
      }
    }, 100) // Small delay to allow DOM to update after state change
  }, [])
  
  const getStageIndex = (stage: Stage) => stageOrder.indexOf(stage)

  // Handle hypothesis submission - fetch both QC and experiment plan in single request
  const handleHypothesisSubmit = useCallback(async () => {
    if (inputValue.trim().length < 20) {
      setInputError('Please enter a more detailed hypothesis (at least 20 characters)')
      return
    }
    setInputError('')

    const hypothesis = inputValue.trim()
    setPartialResults(null)
    setLoadingElapsedTime(0)
    
    // Notify parent that workflow has started
    onWorkflowStart?.()
    
    setState((prev) => ({
      ...prev,
      stage: 'literature-qc',
      hypothesis,
      isLoading: true,
      error: null,
    }))

    const startTime = Date.now()
    
    // Multi-phase loading for the full experiment generation pipeline:
    // 0-10s: "Analyzing Literature..."
    // 10-30s: "Designing Scientific Protocol..."
    // 30-50s: "Calculating Logistics and Budget..."
    // 50-70s: "Generating Experiment Plan..."
    // Then: Complete and reveal dashboard
    
    const updateLoadingPhase = () => {
      const elapsed = (Date.now() - startTime) / 1000
      setLoadingElapsedTime(elapsed)
      
      if (elapsed < 10) {
        setLoadingPhase('Analyzing Literature...')
        setLoadingProgress(Math.min(20, (elapsed / 10) * 20))
      } else if (elapsed < 30) {
        setLoadingPhase('Designing Scientific Protocol...')
        setLoadingProgress(20 + ((elapsed - 10) / 20) * 25)
      } else if (elapsed < 50) {
        setLoadingPhase('Calculating Logistics and Budget...')
        setLoadingProgress(45 + ((elapsed - 30) / 20) * 25)
      } else if (elapsed < 70) {
        setLoadingPhase('Generating Experiment Plan...')
        setLoadingProgress(70 + ((elapsed - 50) / 20) * 25)
      } else {
        setLoadingPhase('Finalizing analysis...')
        setLoadingProgress(95)
      }
    }

    // Update loading phase every 100ms for smooth progress
    const interval = setInterval(updateLoadingPhase, 100)
    updateLoadingPhase() // Initial call

    try {
      // Use single endpoint to fetch both QC report and experiment plan
      const { qcReport, experimentPlan } = await fetchFullExperiment(hypothesis)
      
      // Show partial results briefly if we got them quickly
      const elapsed = Date.now() - startTime
      if (elapsed < 2000) {
        setPartialResults({
          entity: qcReport.entity,
          novelty_signal: qcReport.novelty_signal,
          summary: qcReport.summary,
        })
        await new Promise(resolve => setTimeout(resolve, 1500))
      }
      
      setLoadingProgress(100)
      setLoadingPhase('Analysis Complete!')
      
      // Smooth transition to results
      await new Promise(resolve => setTimeout(resolve, 500))
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        literatureResult: qcReport,
        experimentPlan: experimentPlan, // Store the plan immediately
      }))
      setPartialResults(null)
      
      // Update highest stage reached - now we have both QC and plan
      if (getStageIndex('literature-qc') > getStageIndex(highestStageReached)) {
        setHighestStageReached('literature-qc')
      }
    } catch (err) {
      const errorMessage = err instanceof APIError 
        ? err.message 
        : err instanceof Error 
        ? `Analysis failed: ${err.message}`
        : 'Failed to complete experiment generation. Please check your connection and try again.'
      
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }))
      setPartialResults(null)
    } finally {
      clearInterval(interval)
      setLoadingElapsedTime(0)
    }
  }, [inputValue, highestStageReached, getStageIndex])

// Handle proceeding to experiment plan - plan is already loaded, just change stage
  const handleProceedToPlan = useCallback(() => {
    // Plan is already available from the initial fetch
    setState((prev) => ({
      ...prev,
      stage: 'experiment-plan',
      error: null,
    }))
    
    // Update highest stage reached
    if (getStageIndex('experiment-plan') > getStageIndex(highestStageReached)) {
      setHighestStageReached('experiment-plan')
    }
    
    // Smooth scroll to experiment plan section
    scrollToSection(experimentPlanRef)
  }, [highestStageReached, getStageIndex, scrollToSection])

  // Handle proceeding to review stage
  const handleProceedToReview = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: 'review',
      error: null,
    }))
    
    // Update highest stage reached
    if (getStageIndex('review') > getStageIndex(highestStageReached)) {
      setHighestStageReached('review')
    }
    
    // Smooth scroll to review section
    scrollToSection(reviewSectionRef)
  }, [highestStageReached, getStageIndex, scrollToSection])

  // Handle feedback submission
  const handleFeedbackSubmit = useCallback((feedback: Feedback) => {
    setState((prev) => ({
      ...prev,
      feedbackHistory: [...prev.feedbackHistory, feedback],
    }))
  }, [])

  // Handle retry on error
  const handleRetry = useCallback(() => {
    if (state.stage === 'literature-qc') {
      setState((prev) => ({ ...prev, error: null }))
      handleHypothesisSubmit()
    } else if (state.stage === 'experiment-plan') {
      setState((prev) => ({ ...prev, error: null }))
      handleProceedToPlan()
    }
  }, [state.stage, handleHypothesisSubmit, handleProceedToPlan])

  // Handle reset - returns to hypothesis input stage
  const handleReset = useCallback(() => {
    setState({
      stage: 'input',
      hypothesis: '',
      isLoading: false,
      error: null,
      literatureResult: null,
      experimentPlan: null,
      feedbackHistory: [],
    })
    setInputValue('')
    setInputError('')
    setLoadingProgress(0)
    setLoadingPhase('')
    setLoadingElapsedTime(0)
    setPartialResults(null)
    setHighestStageReached('input')
    setShowResetConfirm(false)
  }, [])

  const handleExampleClick = (text: string) => {
    setInputValue(text)
    setInputError('')
  }

  const config = state.literatureResult ? noveltyConfig[state.literatureResult.novelty_signal] : null
  const NoveltyIcon = config?.icon

  const handleStageNavigation = useCallback((stage: Stage) => {
    const targetIndex = getStageIndex(stage)
    const highestIndex = getStageIndex(highestStageReached)
    
    // Only allow navigation to stages we've already reached
    if (targetIndex <= highestIndex) {
      // Check if we have the required data for each stage
      if (stage === 'input') {
        setState(prev => ({
          ...prev,
          stage: 'input',
          isLoading: false,
        }))
      } else if (stage === 'literature-qc' && state.literatureResult) {
        setState(prev => ({
          ...prev,
          stage: 'literature-qc',
          isLoading: false,
        }))
      } else if (stage === 'experiment-plan' && state.experimentPlan) {
        setState(prev => ({
          ...prev,
          stage: 'experiment-plan',
          isLoading: false,
        }))
      } else if (stage === 'review' && state.experimentPlan) {
        setState(prev => ({
          ...prev,
          stage: 'review',
          isLoading: false,
        }))
      }
    }
  }, [state.literatureResult, state.experimentPlan, highestStageReached, getStageIndex])

  return (
    <div className="space-y-6">
      <ProgressIndicator 
        currentStage={state.stage} 
        highestStageReached={highestStageReached}
        onStageClick={handleStageNavigation} 
      />

      <div className="mt-8">
        <AnimatePresence mode="wait">
          {/* Stage 1: Hypothesis Input */}
          {state.stage === 'input' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-8"
            >
              <div className="text-center space-y-4">
                <h2 className="text-3xl font-bold text-foreground text-balance">
                  What experiment do you want to run?
                </h2>
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto text-pretty">
                  Enter your scientific hypothesis. We&apos;ll check the literature via our server,
                  then generate a complete experiment plan.
                </p>
              </div>

              <Card className="max-w-3xl mx-auto">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" />
                    Your Hypothesis
                  </CardTitle>
                  <CardDescription>
                    Be specific: name the intervention, state a measurable outcome with a threshold.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea
                    placeholder="e.g., Replacing sucrose with trehalose as a cryoprotectant will increase post-thaw viability of HeLa cells by at least 15 percentage points..."
                    value={inputValue}
                    onChange={(e) => {
                      setInputValue(e.target.value)
                      if (inputError) setInputError('')
                    }}
                    className="min-h-32 resize-none"
                  />
                  {inputError && <p className="text-sm text-destructive">{inputError}</p>}
                  <Button onClick={handleHypothesisSubmit} className="w-full" size="lg">
                    Analyze Hypothesis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h3 className="text-center text-sm font-medium text-muted-foreground">
                  Or try an example hypothesis
                </h3>
                <div className="grid gap-4 md:grid-cols-2">
                  {exampleHypotheses.map((example) => {
                    const Icon = example.icon
                    return (
                      <motion.div
                        key={example.title}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <Card
                          className="cursor-pointer hover:border-primary/50 transition-colors h-full"
                          onClick={() => handleExampleClick(example.hypothesis)}
                        >
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <Icon className="h-4 w-4 text-primary" />
                              {example.title}
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-muted-foreground italic">
                              &quot;{example.plain}&quot;
                            </p>
                          </CardContent>
                        </Card>
                      </motion.div>
                    )
                  })}
                </div>
              </div>
            </motion.div>
          )}

          {/* Stage 2: Literature QC */}
          {state.stage === 'literature-qc' && (
            <motion.div
              key="literature-qc"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="space-y-6 max-w-4xl mx-auto"
            >
              <div className="text-center space-y-2">
                <h2 className="text-2xl font-bold text-foreground">Literature Quality Control</h2>
                <p className="text-muted-foreground">
                  Checking if this experiment has been done before
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base font-medium">Your Hypothesis</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground italic">&quot;{state.hypothesis}&quot;</p>
                </CardContent>
              </Card>

              {/* Error State with Enhanced Feedback */}
              {state.error && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Alert variant="destructive" className="border-2">
                    <AlertTriangle className="h-5 w-5" />
                    <AlertTitle className="text-base font-semibold">Analysis Failed</AlertTitle>
                    <AlertDescription className="mt-3 space-y-4">
                      <p className="text-sm">{state.error}</p>
                      
                      {/* Troubleshooting tips */}
                      <div className="bg-destructive/10 rounded-lg p-3 space-y-2">
                        <p className="text-xs font-medium">Troubleshooting tips:</p>
                        <ul className="text-xs space-y-1 list-disc list-inside text-destructive/80">
                          <li>Check your internet connection</li>
                          <li>The analysis server may be temporarily unavailable</li>
                          <li>Try simplifying your hypothesis</li>
                          <li>Wait a moment and try again</li>
                        </ul>
                      </div>
                      
                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" onClick={handleRetry} className="bg-background">
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Try Again
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                          Start Over
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </motion.div>
              )}

              {/* Engaging Literature QC Loader with Gamified Experience */}
              {state.isLoading && !state.error && (() => {
                // Define the 6 engaging phases with icons and descriptions
                const phases = [
                  { 
                    id: 'hypothesis', 
                    label: 'Analyzing Hypothesis', 
                    icon: Lightbulb, 
                    color: 'from-amber-400 to-orange-500',
                    bgColor: 'bg-amber-500/10 dark:bg-amber-500/10',
                    description: 'Breaking down your hypothesis into key components...',
                    minTime: 0, maxTime: 12
                  },
                  { 
                    id: 'literature', 
                    label: 'Searching Literature', 
                    icon: Search, 
                    color: 'from-blue-400 to-cyan-500',
                    bgColor: 'bg-blue-500/10 dark:bg-blue-500/10',
                    description: 'Scanning scientific databases for relevant papers...',
                    minTime: 12, maxTime: 24
                  },
                  { 
                    id: 'evaluating', 
                    label: 'Evaluating Research', 
                    icon: BookOpen, 
                    color: 'from-purple-400 to-pink-500',
                    bgColor: 'bg-purple-500/10 dark:bg-purple-500/10',
                    description: 'Assessing quality and relevance of findings...',
                    minTime: 24, maxTime: 36
                  },
                  { 
                    id: 'designing', 
                    label: 'Designing Experiment', 
                    icon: Beaker, 
                    color: 'from-green-400 to-emerald-500',
                    bgColor: 'bg-green-500/10 dark:bg-green-500/10',
                    description: 'Creating optimal experimental protocol...',
                    minTime: 36, maxTime: 50
                  },
                  { 
                    id: 'materials', 
                    label: 'Selecting Materials', 
                    icon: Package, 
                    color: 'from-teal-400 to-cyan-500',
                    bgColor: 'bg-teal-500/10 dark:bg-teal-500/10',
                    description: 'Identifying required reagents and equipment...',
                    minTime: 50, maxTime: 62
                  },
                  { 
                    id: 'finalizing', 
                    label: 'Finalizing Plan', 
                    icon: CheckCircle2, 
                    color: 'from-indigo-400 to-violet-500',
                    bgColor: 'bg-indigo-500/10 dark:bg-indigo-500/10',
                    description: 'Compiling comprehensive experiment plan...',
                    minTime: 62, maxTime: 75
                  },
                ]
                
                const currentPhaseIndex = phases.findIndex(
                  (phase, index) => loadingElapsedTime >= phase.minTime && 
                    (index === phases.length - 1 || loadingElapsedTime < phases[index + 1].minTime)
                )
                const activePhase = phases[Math.max(0, currentPhaseIndex)]
                const ActiveIcon = activePhase.icon
                
                return (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                    className="space-y-6"
                  >
                    {/* Main Loader Card */}
                    <Card className="border-2 border-primary/20 shadow-xl overflow-hidden">
                      {/* Animated gradient header */}
                      <div className={cn(
                        "h-2 bg-gradient-to-r transition-all duration-500",
                        activePhase.color
                      )} />
                      
                      <CardContent className="py-8 px-6">
                        <div className="space-y-8">
                          {/* Central animated icon and phase label */}
                          <div className="flex flex-col items-center gap-5">
                            {/* Pulsing ring animation */}
                            <div className="relative">
                              <motion.div
                                className={cn("absolute inset-0 rounded-full bg-gradient-to-r opacity-20", activePhase.color)}
                                animate={{ scale: [1, 1.4, 1], opacity: [0.2, 0, 0.2] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                              />
                              <motion.div
                                className={cn("absolute inset-0 rounded-full bg-gradient-to-r opacity-10", activePhase.color)}
                                animate={{ scale: [1, 1.6, 1], opacity: [0.1, 0, 0.1] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                              />
                              <motion.div
                                key={activePhase.id}
                                initial={{ scale: 0.5, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                                className={cn(
                                  "relative w-20 h-20 rounded-full flex items-center justify-center bg-gradient-to-br shadow-lg",
                                  activePhase.color
                                )}
                              >
                                <ActiveIcon className="h-10 w-10 text-white" />
                              </motion.div>
                            </div>
                            
                            {/* Phase label with typewriter effect */}
                            <div className="text-center space-y-2">
                              <motion.h3 
                                key={activePhase.label}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.4 }}
                                className="text-xl font-bold text-foreground"
                              >
                                {activePhase.label}
                              </motion.h3>
                              <motion.p
                                key={activePhase.description}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.2 }}
                                className="text-sm text-muted-foreground max-w-md"
                              >
                                {activePhase.description}
                              </motion.p>
                            </div>
                          </div>
                          
                          {/* Progress bar with glow effect */}
                          <div className="space-y-3">
                            <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                              <motion.div 
                                className={cn("absolute inset-y-0 left-0 rounded-full bg-gradient-to-r", activePhase.color)}
                                initial={{ width: 0 }}
                                animate={{ width: `${loadingProgress}%` }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                              />
                              {/* Shimmer effect */}
                              <motion.div
                                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent"
                                animate={{ x: ['-100%', '200%'] }}
                                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-sm">
                              <span className="text-muted-foreground flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                {Math.floor(loadingElapsedTime)}s elapsed
                              </span>
                              <motion.span 
                                key={Math.round(loadingProgress)}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className="font-bold text-primary"
                              >
                                {Math.round(loadingProgress)}%
                              </motion.span>
                            </div>
                          </div>
                          
                          {/* Phase journey timeline */}
                          <div className="pt-4 border-t">
                            <div className="flex items-center justify-between relative">
                              {/* Connection line */}
                              <div className="absolute top-5 left-0 right-0 h-0.5 bg-muted" />
                              <motion.div 
                                className={cn("absolute top-5 left-0 h-0.5 bg-gradient-to-r", activePhase.color)}
                                initial={{ width: 0 }}
                                animate={{ width: `${((currentPhaseIndex + 1) / phases.length) * 100}%` }}
                                transition={{ duration: 0.5 }}
                              />
                              
                              {phases.map((phase, index) => {
                                const PhaseIcon = phase.icon
                                const isActive = index === currentPhaseIndex
                                const isCompleted = index < currentPhaseIndex
                                const isPending = index > currentPhaseIndex
                                
                                return (
                                  <motion.div 
                                    key={phase.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: index * 0.1 }}
                                    className="relative z-10 flex flex-col items-center"
                                  >
                                    <motion.div
                                      animate={isActive ? { 
                                        scale: [1, 1.1, 1],
                                        boxShadow: ['0 0 0 0 rgba(59, 130, 246, 0)', '0 0 0 8px rgba(59, 130, 246, 0.2)', '0 0 0 0 rgba(59, 130, 246, 0)']
                                      } : {}}
                                      transition={{ duration: 1.5, repeat: isActive ? Infinity : 0 }}
                                      className={cn(
                                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                                        isCompleted && "bg-gradient-to-br from-green-400 to-emerald-500 text-white",
                                        isActive && cn("bg-gradient-to-br text-white shadow-lg", phase.color),
                                        isPending && "bg-muted text-muted-foreground"
                                      )}
                                    >
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5" />
                                      ) : (
                                        <PhaseIcon className="h-5 w-5" />
                                      )}
                                    </motion.div>
                                    <span className={cn(
                                      "text-[10px] mt-2 font-medium text-center max-w-[60px] leading-tight",
                                      isActive ? "text-foreground" : "text-muted-foreground"
                                    )}>
                                      {phase.label.split(' ')[0]}
                                    </span>
                                  </motion.div>
                                )
                              })}
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Fun facts / tips carousel */}
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                    >
                      <Card className={cn("border-dashed border-2 transition-colors duration-500", activePhase.bgColor)}>
                        <CardContent className="py-4">
                          <div className="flex items-start gap-3">
                            <div className={cn(
                              "shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gradient-to-br",
                              activePhase.color
                            )}>
                              <Sparkles className="h-4 w-4 text-white" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-muted-foreground mb-1">Did you know?</p>
                              <motion.p
                                key={currentPhaseIndex}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="text-sm text-foreground"
                              >
                                {currentPhaseIndex === 0 && "A well-structured hypothesis can increase experiment success rates by up to 40%."}
                                {currentPhaseIndex === 1 && "Our AI searches through millions of peer-reviewed papers in seconds."}
                                {currentPhaseIndex === 2 && "Quality assessment ensures only the most relevant research informs your experiment."}
                                {currentPhaseIndex === 3 && "Protocol design considers reproducibility, efficiency, and scientific rigor."}
                                {currentPhaseIndex === 4 && "Smart material selection can reduce costs while maintaining quality."}
                                {currentPhaseIndex === 5 && "Your personalized experiment plan is being compiled with best practices."}
                              </motion.p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>

                    {/* Partial Results Preview */}
                    {partialResults && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                      >
                        <Card className="border-green-500/30 bg-green-500/10 dark:border-green-500/30 dark:bg-green-500/10">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium flex items-center gap-2 text-green-700 dark:text-green-400">
                              <Zap className="h-4 w-4" />
                              Early Insights Detected
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-3">
                            {partialResults.entity && (
                              <div className="flex items-center gap-2 text-sm">
                                <Badge variant="outline" className="border-green-500/50 text-green-700 dark:text-green-400">
                                  Entity Found
                                </Badge>
                                <span className="font-medium">{partialResults.entity.name}</span>
                              </div>
                            )}
                            {partialResults.novelty_signal && (
                              <Badge 
                                variant={
                                  partialResults.novelty_signal === 'not-found' ? 'default' :
                                  partialResults.novelty_signal === 'similar-work-exists' ? 'secondary' :
                                  'destructive'
                                }
                              >
                                {partialResults.novelty_signal === 'not-found' && 'Novel Research Opportunity'}
                                {partialResults.novelty_signal === 'similar-work-exists' && 'Building on Existing Work'}
                                {partialResults.novelty_signal === 'exact-match-found' && 'Prior Art Identified'}
                              </Badge>
                            )}
                            {partialResults.summary && (
                              <p className="text-xs text-muted-foreground line-clamp-2 italic">
                                &quot;{partialResults.summary}&quot;
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      </motion.div>
                    )}
                  </motion.div>
                )
              })()}

              {/* Results State */}
              {!state.isLoading && !state.error && state.literatureResult && config && NoveltyIcon && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-6"
                >
                  {/* Entity Information (if available from server) */}
                  {state.literatureResult.entity && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Beaker className="h-4 w-4 text-primary" />
                          Analyzed Entity
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Name:</span>
                            <p className="font-medium">{state.literatureResult.entity.name}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Type:</span>
                            <p className="font-medium capitalize">{state.literatureResult.entity.type.replace(/_/g, ' ')}</p>
                          </div>
                          {state.literatureResult.entity.target && (
                            <div>
                              <span className="text-muted-foreground">Target:</span>
                              <p className="font-medium">{state.literatureResult.entity.target}</p>
                            </div>
                          )}
                        </div>
                        {state.literatureResult.entity.description && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">Description:</span>
                            <p className="mt-1">{state.literatureResult.entity.description}</p>
                          </div>
                        )}
                        {state.literatureResult.entity.identifiers && (
                          <div className="flex flex-wrap gap-2 pt-2 border-t">
                            {state.literatureResult.entity.identifiers.cas_number && (
                              <Badge variant="outline" className="text-xs">
                                CAS: {state.literatureResult.entity.identifiers.cas_number}
                              </Badge>
                            )}
                            {state.literatureResult.entity.identifiers.pubchem_cid && (
                              <Badge variant="outline" className="text-xs">
                                PubChem: {state.literatureResult.entity.identifiers.pubchem_cid}
                              </Badge>
                            )}
                            {state.literatureResult.entity.identifiers.other_ids?.map((id, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {id}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {state.literatureResult.confidence !== undefined && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-muted-foreground">
                                Analysis Confidence
                                {state.literatureResult.confidenceType && (
                                  <span className="text-xs ml-1">({state.literatureResult.confidenceType.replace(/_/g, ' ')})</span>
                                )}
                              </span>
                              <Badge variant="secondary">
                                {Math.round(state.literatureResult.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )}

                  <Card className={cn('border-2', config.bgColor)}>
                    <CardContent className="py-6">
                      <div className="flex items-start gap-4">
                        <div className={cn('rounded-full p-2', config.color, 'bg-white')}>
                          <NoveltyIcon className="h-6 w-6" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{config.label}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {config.description}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Metrics Summary */}
                  {state.literatureResult.metrics && (
                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <BarChart3 className="h-4 w-4 text-primary" />
                          Evidence Metrics
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                          <div className="p-3 bg-muted/50 rounded-lg">
                            <p className="text-2xl font-bold text-foreground">{state.literatureResult.metrics.num_references}</p>
                            <p className="text-xs text-muted-foreground">References</p>
                          </div>
                          <div className="p-3 bg-green-500/10 dark:bg-green-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-green-600 dark:text-green-400">{state.literatureResult.metrics.num_supporting_claims}</p>
                            <p className="text-xs text-muted-foreground">Supporting</p>
                          </div>
                          <div className="p-3 bg-red-500/10 dark:bg-red-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-red-600 dark:text-red-400">{state.literatureResult.metrics.num_contradicting_claims}</p>
                            <p className="text-xs text-muted-foreground">Contradicting</p>
                          </div>
                          <div className="p-3 bg-blue-500/10 dark:bg-blue-500/10 rounded-lg">
                            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{Math.round(state.literatureResult.metrics.evidence_coverage_score * 100)}%</p>
                            <p className="text-xs text-muted-foreground">Coverage</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Risk Flags */}
                  {state.literatureResult.risk_flags && state.literatureResult.risk_flags.length > 0 && (
                    <Card className="border-amber-500/30 bg-amber-500/10 dark:border-amber-500/30 dark:bg-amber-500/10">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base font-medium flex items-center gap-2">
                          <Flag className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                          Risk Flags
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {state.literatureResult.risk_flags.map((flag, index) => (
                            <Badge key={index} variant="outline" className="border-amber-300 text-amber-700 capitalize">
                              {flag.replace(/_/g, ' ')}
                            </Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Key Claims */}
                  {state.literatureResult.key_claims && state.literatureResult.key_claims.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <BookOpen className="h-5 w-5" />
                          Key Claims
                        </CardTitle>
                        <CardDescription>
                          Evidence-backed claims from the literature
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {state.literatureResult.key_claims.map((claim, index) => (
                          <motion.div
                            key={claim.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                            className="border rounded-lg p-4"
                          >
                            <div className="flex items-start gap-3">
                              <Badge 
                                variant={claim.type === 'evidence' ? 'default' : claim.type === 'gap' ? 'destructive' : 'secondary'}
                                className="shrink-0 capitalize"
                              >
                                {claim.type}
                              </Badge>
                              <div className="flex-1">
                                <p className="text-sm">{claim.text}</p>
                                {claim.supporting_references.length > 0 && (
                                  <div className="flex items-center gap-1 mt-2">
                                    <Link2 className="h-3 w-3 text-muted-foreground" />
                                    <span className="text-xs text-muted-foreground">
                                      Refs: {claim.supporting_references.join(', ')}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  {/* Knowledge Gaps */}
                  {state.literatureResult.knowledge_gaps && state.literatureResult.knowledge_gaps.length > 0 && (
                    <Card className="border-blue-500/30 bg-blue-500/10 dark:border-blue-500/30 dark:bg-blue-500/10">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          Knowledge Gaps
                        </CardTitle>
                        <CardDescription>
                          Areas where more research is needed
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-2">
                          {state.literatureResult.knowledge_gaps.map((gap, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm">
                              <Info className="h-4 w-4 text-blue-500 dark:text-blue-400 shrink-0 mt-0.5" />
                              <span>{gap}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  {/* References */}
                  {state.literatureResult.references.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Search className="h-5 w-5" />
                          Relevant References
                        </CardTitle>
                        <CardDescription>
                          {state.literatureResult.references.length} related papers found
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {state.literatureResult.references.map((ref, index) => (
                          <motion.div
                            key={ref.id || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-sm line-clamp-2">{ref.title}</h4>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {ref.authors} - {ref.journal} - {ref.year}
                                </p>
                                <div className="flex items-center gap-2 mt-2">
                                  <Badge 
                                    variant={ref.quality === 'high' ? 'default' : ref.quality === 'medium' ? 'secondary' : 'outline'}
                                    className="text-xs capitalize"
                                  >
                                    {ref.quality} quality
                                  </Badge>
                                  <Badge variant="outline" className="text-xs capitalize">
                                    {ref.study_type?.replace(/_/g, ' ') || 'unknown'}
                                  </Badge>
                                </div>
                              </div>
                              <Button variant="ghost" size="icon" asChild className="shrink-0">
                                <a href={ref.url} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-4 w-4" />
                                </a>
                              </Button>
                            </div>
                          </motion.div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <Card>
                    <CardContent className="py-6">
                      <p className="text-sm text-muted-foreground mb-4">
                        {state.literatureResult.summary}
                      </p>
                      <Button onClick={handleProceedToPlan} className="w-full" size="lg">
                        Explore Experiment Plan
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stage 3: Experiment Plan */}
          {state.stage === 'experiment-plan' && (
            <motion.div
              ref={experimentPlanRef}
              key="experiment-plan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              {/* Error State */}
              {state.error && (
                <div className="max-w-4xl mx-auto space-y-6">
                  <div className="text-center space-y-2">
                    <h2 className="text-2xl font-bold text-foreground">Experiment Plan</h2>
                    <p className="text-muted-foreground">
                      Generating your complete experiment protocol
                    </p>
                  </div>
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription className="flex flex-col gap-3">
                      <span>{state.error}</span>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleRetry}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleReset}>
                          Start Over
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {/* Enhanced Step-by-Step Loading State */}
              {state.isLoading && !state.error && (() => {
                const protocolSteps = [
                  { icon: Database, text: 'Scanning Institutional Knowledge Base...', color: 'blue' },
                  { icon: Users, text: 'Retrieving Relevant Expert Constraints...', color: 'indigo' },
                  { icon: History, text: 'Analyzing Historical Data Patterns...', color: 'violet' },
                  { icon: MessageSquare, text: 'Synthesizing Multi-Scientist Feedback...', color: 'purple' },
                  { icon: Settings, text: 'Optimizing Protocol Parameters...', color: 'fuchsia' },
                  { icon: Shield, text: 'Validating Against Lab Standards...', color: 'pink' },
                  { icon: FileText, text: 'Compiling Actionable Instructions...', color: 'rose' },
                  { icon: Brain, text: 'Finalizing Reasoning Output...', color: 'orange' },
                ]
                
                // Determine current step based on loading phase text
                const currentStepIndex = protocolSteps.findIndex(step => step.text === loadingPhase)
                const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0
                
                return (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                    className="max-w-5xl mx-auto space-y-6"
                  >
                    <div className="text-center space-y-2">
                      <motion.h2 
                        className="text-2xl font-bold text-foreground"
                        animate={{ opacity: [1, 0.8, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        Building Your Experiment Protocol
                      </motion.h2>
                      <p className="text-muted-foreground">
                        Our AI is synthesizing insights from multiple scientific sources
                      </p>
                    </div>
                    
                    <Card className="border-primary/20 shadow-xl overflow-hidden">
                      <CardContent className="py-8">
                        <div className="space-y-6">
                          {/* Step-by-Step Progress Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4">
                            {protocolSteps.map((step, index) => {
                              const StepIcon = step.icon
                              const isActive = index === activeStep
                              const isCompleted = index < activeStep
                              const isPending = index > activeStep
                              
                              return (
                                <motion.div
                                  key={index}
                                  initial={{ opacity: 0, y: 10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  transition={{ delay: index * 0.05 }}
                                  className={cn(
                                    "relative p-3 rounded-xl border-2 transition-all duration-300",
                                    isActive && "border-primary bg-primary/5 shadow-lg",
                                    isCompleted && "border-green-500/50 bg-green-500/5",
                                    isPending && "border-muted bg-muted/30 opacity-50"
                                  )}
                                >
                                  <div className="flex flex-col items-center gap-2 text-center">
                                    <div className={cn(
                                      "relative p-2 rounded-lg transition-all duration-300",
                                      isActive && "bg-primary/10",
                                      isCompleted && "bg-green-500/10",
                                      isPending && "bg-muted"
                                    )}>
                                      {isActive && (
                                        <motion.div
                                          className="absolute inset-0 rounded-lg bg-primary/20"
                                          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                          transition={{ duration: 1.5, repeat: Infinity }}
                                        />
                                      )}
                                      {isCompleted ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-500 relative z-10" />
                                      ) : (
                                        <StepIcon className={cn(
                                          "h-5 w-5 relative z-10",
                                          isActive && "text-primary",
                                          isPending && "text-muted-foreground"
                                        )} />
                                      )}
                                    </div>
                                    <span className={cn(
                                      "text-[10px] leading-tight font-medium line-clamp-2",
                                      isActive && "text-primary",
                                      isCompleted && "text-green-600",
                                      isPending && "text-muted-foreground"
                                    )}>
                                      {step.text.replace('...', '')}
                                    </span>
                                  </div>
                                  
                                  {/* Step number badge */}
                                  <div className={cn(
                                    "absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center",
                                    isActive && "bg-primary text-primary-foreground",
                                    isCompleted && "bg-green-500 text-white",
                                    isPending && "bg-muted-foreground/30 text-muted-foreground"
                                  )}>
                                    {isCompleted ? '✓' : index + 1}
                                  </div>
                                </motion.div>
                              )
                            })}
                          </div>

                          {/* Current Phase Highlight */}
                          <motion.div 
                            key={loadingPhase}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex items-center justify-center gap-3 py-4 px-6 mx-4 rounded-xl bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 border border-primary/20"
                          >
                            <motion.div
                              animate={{ rotate: 360 }}
                              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            >
                              <Loader2 className="h-5 w-5 text-primary" />
                            </motion.div>
                            <span className="text-base font-semibold text-foreground">
                              {loadingPhase}
                            </span>
                          </motion.div>

                          {/* Progress Bar with Gradient */}
                          <div className="space-y-2 px-4">
                            <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                              <motion.div
                                className="absolute inset-y-0 left-0 rounded-full"
                                style={{
                                  background: 'linear-gradient(90deg, #3b82f6 0%, #6366f1 15%, #8b5cf6 30%, #a855f7 45%, #d946ef 60%, #ec4899 75%, #f43f5e 85%, #f97316 100%)'
                                }}
                                initial={{ width: 0 }}
                                animate={{ width: `${loadingProgress}%` }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                              />
                              {loadingProgress < 100 && (
                                <motion.div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/50 to-transparent rounded-full shimmer-bar"
                                  style={{ width: "20%" }}
                                  exit={{ opacity: 0 }}
                                />
                              )}
                            </div>
                            <div className="flex justify-between text-sm px-1">
                              <span className="text-muted-foreground text-xs">
                                Step {activeStep + 1} of {protocolSteps.length}
                              </span>
                              <span className="font-semibold text-primary">{Math.round(loadingProgress)}%</span>
                            </div>
                          </div>

                          {/* Insight Panel */}
                          <motion.div 
                            key={activeStep}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mx-4 p-4 rounded-xl bg-muted/30 border border-border"
                          >
                            <div className="flex items-start gap-3">
                              <div className="p-2 rounded-lg bg-primary/10 shrink-0">
                                <Info className="h-4 w-4 text-primary" />
                              </div>
                              <div>
                                <p className="text-xs font-medium text-foreground mb-1">What&apos;s happening now</p>
                                <p className="text-xs text-muted-foreground">
                                  {activeStep === 0 && "Querying our comprehensive database of validated protocols and institutional best practices."}
                                  {activeStep === 1 && "Identifying domain-specific constraints from expert knowledge graphs."}
                                  {activeStep === 2 && "Mining historical experiment data to identify success patterns and common pitfalls."}
                                  {activeStep === 3 && "Aggregating feedback loops from previous scientist interactions and corrections."}
                                  {activeStep === 4 && "Fine-tuning protocol parameters for optimal reproducibility and efficiency."}
                                  {activeStep === 5 && "Cross-referencing against laboratory safety and quality standards."}
                                  {activeStep === 6 && "Generating step-by-step actionable instructions with clear success criteria."}
                                  {activeStep === 7 && "Completing final reasoning chain and preparing comprehensive output."}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )
              })()}

              {/* Plan Display */}
              {!state.isLoading && !state.error && state.experimentPlan && (
                <div className="space-y-6">
                  <ServerPlanDisplay initialPlan={state.experimentPlan} hypothesis={state.hypothesis} />
                  <Card className="max-w-4xl mx-auto">
                    <CardContent className="py-6">
                      <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-muted-foreground">
                          Ready to review and provide feedback on this experiment plan?
                        </p>
                        <Button onClick={handleProceedToReview} size="lg">
                          Proceed to Review
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
            </motion.div>
          )}

          {/* Stage 4: Review */}
          {state.stage === 'review' && state.experimentPlan && (
            <motion.div
              ref={reviewSectionRef}
              key="review"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <ScientistReview
                plan={convertServerPlanToLocalFormat(state.experimentPlan, state.hypothesis)}
                onFeedbackSubmit={handleFeedbackSubmit}
                feedbackHistory={state.feedbackHistory}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Action buttons based on stage */}
      {state.stage !== 'input' && !state.isLoading && (
        <div className="flex justify-center gap-4 pt-4">
          <Button variant="outline" onClick={() => setShowResetConfirm(true)}>
            Start New Experiment
          </Button>
        </div>
      )}

      {/* Reset Confirmation Dialog */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent className="sm:max-w-md">
          <AlertDialogHeader className="space-y-3">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-amber-500/15">
              <AlertTriangle className="h-7 w-7 text-amber-600 dark:text-amber-400" />
            </div>
            <AlertDialogTitle className="text-center text-xl">
              Start New Experiment?
            </AlertDialogTitle>
            <AlertDialogDescription className="text-center text-base">
              All your current progress will be lost, including your hypothesis, literature analysis, and experiment plan. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="mt-4 sm:justify-center gap-3">
            <AlertDialogCancel className="sm:w-32">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReset}
              className="sm:w-32 bg-amber-600 hover:bg-amber-700"
            >
              Yes, Start New
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Helper function to convert server plan format to local format for ScientistReview
function convertServerPlanToLocalFormat(
  serverPlan: ServerExperimentPlan,
  hypothesis: string
): ExperimentPlanData {
  return {
    id: `plan-${Date.now()}`,
    title: serverPlan.experiment_metadata.title,
    hypothesis: hypothesis,
    plainEnglish: serverPlan.experiment_metadata.objective,
    protocol: serverPlan.protocol.flatMap((phase, phaseIndex) =>
      phase.steps.map((step, stepIndex) => ({
        id: `step-${phaseIndex}-${stepIndex}`,
        stepNumber: step.step_id,
        title: `${phase.phase} - Step ${step.step_id}`,
        description: step.instruction,
        duration: `${step.duration_mins} minutes`,
        criticalNotes: step.troubleshooting.join('; '),
        equipment: step.equipment,
      }))
    ),
    materials: serverPlan.logistics.reagents.map((reagent, index) => ({
      id: `material-${index}`,
      name: reagent.name,
      catalogNumber: reagent.catalog_no,
      supplier: reagent.vendor_hint,
      quantity: reagent.quantity,
      unitPrice: reagent.unit_price,
      totalPrice: reagent.unit_price,
      category: 'reagent' as const,
    })),
    budget: {
      categories: [
        {
          name: 'Reagents',
          items: [],
          subtotal: serverPlan.logistics.budget_breakdown.reagents,
        },
        {
          name: 'Labor',
          items: [],
          subtotal: serverPlan.logistics.budget_breakdown.labor,
        },
        {
          name: 'Equipment',
          items: [],
          subtotal: serverPlan.logistics.budget_breakdown.equipment,
        },
      ],
      total: serverPlan.logistics.total_budget,
      currency: 'USD',
    },
    timeline: {
      totalDuration: `${serverPlan.logistics.lead_time_days} days`,
      phases: serverPlan.execution_plan.timeline.map((day, index) => ({
        id: `phase-${index}`,
        name: `Day ${day.day}`,
        duration: '1 day',
        startWeek: Math.floor(day.day / 7),
        endWeek: Math.floor(day.day / 7),
        dependencies: [],
        milestones: day.tasks,
      })),
    },
    validation: serverPlan.data_plan.statistical_tests.map((test, index) => ({
      id: `validation-${index}`,
      metric: test,
      targetValue: serverPlan.scientific_rationale.success_criteria,
      method: serverPlan.data_plan.analysis_pipeline[index] || test,
      successThreshold: serverPlan.quality_assurance.positive_control_expected_range,
    })),
    safetyConsiderations: [
      serverPlan.compliance.biosafety,
      ...serverPlan.compliance.waste_disposal,
    ],
    expectedOutcomes: [
      serverPlan.scientific_rationale.primary_endpoint,
      ...serverPlan.scientific_rationale.secondary_endpoints,
    ],
  }
}
