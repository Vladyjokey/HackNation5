import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, CheckCircle2, AlertCircle, FileWarning, ExternalLink, ArrowRight, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { cn } from '@/lib/utils'
import type { LiteratureResult, NoveltySignal } from '../types'
import { simulateLiteratureSearch } from '../lib/mockData'

interface LiteratureQCProps {
  hypothesis: string
  isLoading: boolean
  result: LiteratureResult | null
  onComplete: (result: LiteratureResult) => void
  onProceed: () => void
}

const noveltyConfig: Record<NoveltySignal, { icon: typeof CheckCircle2; color: string; label: string; description: string }> = {
  'not-found': {
    icon: CheckCircle2,
    color: 'text-green-600',
    label: 'Novel Research',
    description: 'No existing protocols found for this exact approach. You may be breaking new ground.',
  },
  'similar-work-exists': {
    icon: AlertCircle,
    color: 'text-amber-600',
    label: 'Similar Work Exists',
    description: 'Related experiments have been conducted. Review the references to build on existing work.',
  },
  'exact-match-found': {
    icon: FileWarning,
    color: 'text-red-600',
    label: 'Exact Match Found',
    description: 'This protocol has been done before. Consider how your approach differs.',
  },
}

export function LiteratureQC({ hypothesis, isLoading, result, onComplete, onProceed }: LiteratureQCProps) {
  const [progress, setProgress] = useState(0)
  const [searchPhase, setSearchPhase] = useState('Initializing search...')

  useEffect(() => {
    if (isLoading && !result) {
      const phases = [
        { progress: 20, text: 'Searching protocol repositories...' },
        { progress: 40, text: 'Querying academic databases...' },
        { progress: 60, text: 'Analyzing semantic similarity...' },
        { progress: 80, text: 'Ranking relevant papers...' },
        { progress: 95, text: 'Finalizing results...' },
      ]

      let phaseIndex = 0
      const interval = setInterval(() => {
        if (phaseIndex < phases.length) {
          setProgress(phases[phaseIndex].progress)
          setSearchPhase(phases[phaseIndex].text)
          phaseIndex++
        }
      }, 600)

      // Simulate API call
      const timeout = setTimeout(() => {
        const mockResult = simulateLiteratureSearch(hypothesis)
        setProgress(100)
        onComplete(mockResult)
      }, 3500)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isLoading, result, hypothesis, onComplete])

  const config = result ? noveltyConfig[result.noveltySignal] : null
  const NoveltyIcon = config?.icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
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
          <p className="text-sm text-muted-foreground italic">&quot;{hypothesis}&quot;</p>
        </CardContent>
      </Card>

      <AnimatePresence mode="wait">
        {isLoading && !result ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <Card>
              <CardContent className="py-8">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span className="text-sm font-medium">{searchPhase}</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                  <p className="text-center text-xs text-muted-foreground">
                    Searching protocols.io, PubMed, bioRxiv, and more...
                  </p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ) : result && config && NoveltyIcon ? (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <Card className={cn(
              'border-2',
              result.noveltySignal === 'not-found' && 'border-green-500/30 bg-green-500/10',
              result.noveltySignal === 'similar-work-exists' && 'border-amber-500/30 bg-amber-500/10',
              result.noveltySignal === 'exact-match-found' && 'border-red-500/30 bg-red-500/10'
            )}>
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

            {result.references.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="h-5 w-5" />
                    Relevant References
                  </CardTitle>
                  <CardDescription>
                    {result.references.length} related papers found
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {result.references.map((ref, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="border rounded-lg p-4 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{ref.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            {ref.authors} • {ref.journal} • {ref.year}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            {Math.round(ref.relevanceScore * 100)}% match
                          </Badge>
                          <Button variant="ghost" size="icon" asChild>
                            <a href={ref.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="h-4 w-4" />
                            </a>
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </CardContent>
              </Card>
            )}

            <Card>
              <CardContent className="py-6">
                <p className="text-sm text-muted-foreground mb-4">{result.summary}</p>
                <Button onClick={onProceed} className="w-full" size="lg">
                  Explore Experiment Plan
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.div>
  )
}
