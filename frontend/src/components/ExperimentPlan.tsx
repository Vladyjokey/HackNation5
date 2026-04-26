import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ClipboardList,
  Package,
  DollarSign,
  Calendar,
  CheckSquare,
  ShieldAlert,
  Target,
  ChevronDown,
  Loader2,
  MessageSquare,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'
import type { ExperimentPlanData, LiteratureResult, Feedback } from '../types'
import { generateMockExperimentPlan } from '../lib/mockData'

interface ExperimentPlanProps {
  hypothesis: string
  literatureResult: LiteratureResult | null
  isLoading: boolean
  plan: ExperimentPlanData | null
  feedbackHistory: Feedback[]
  onComplete: (plan: ExperimentPlanData) => void
  onStartReview: () => void
}

export function ExperimentPlan({
  hypothesis,
  isLoading,
  plan,
  feedbackHistory,
  onComplete,
  onStartReview,
}: ExperimentPlanProps) {
  const [progress, setProgress] = useState(0)
  const [generationPhase, setGenerationPhase] = useState('Initializing...')
  const [activeTab, setActiveTab] = useState('protocol')

  useEffect(() => {
    if (isLoading && !plan) {
      const phases = [
        { progress: 15, text: 'Analyzing hypothesis structure...' },
        { progress: 30, text: 'Designing protocol steps...' },
        { progress: 45, text: 'Sourcing materials and suppliers...' },
        { progress: 60, text: 'Calculating budget estimates...' },
        { progress: 75, text: 'Building timeline with dependencies...' },
        { progress: 90, text: 'Defining validation criteria...' },
        { progress: 100, text: 'Finalizing experiment plan...' },
      ]

      let phaseIndex = 0
      const interval = setInterval(() => {
        if (phaseIndex < phases.length) {
          setProgress(phases[phaseIndex].progress)
          setGenerationPhase(phases[phaseIndex].text)
          phaseIndex++
        }
      }, 800)

      const timeout = setTimeout(() => {
        const mockPlan = generateMockExperimentPlan(hypothesis)
        onComplete(mockPlan)
      }, 6000)

      return () => {
        clearInterval(interval)
        clearTimeout(timeout)
      }
    }
  }, [isLoading, plan, hypothesis, onComplete])

  if (isLoading && !plan) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <h2 className="text-2xl font-bold text-foreground">Generating Experiment Plan</h2>
          <p className="text-muted-foreground">
            Creating a complete, operationally realistic plan
          </p>
        </div>

        <Card>
          <CardContent className="py-12">
            <div className="space-y-6">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="h-20 w-20 rounded-full border-4 border-muted flex items-center justify-center">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  </div>
                </div>
                <span className="text-sm font-medium">{generationPhase}</span>
              </div>
              <Progress value={progress} className="h-2 max-w-md mx-auto" />
              <div className="flex justify-center gap-8 text-xs text-muted-foreground">
                <span>Protocol</span>
                <span>Materials</span>
                <span>Budget</span>
                <span>Timeline</span>
                <span>Validation</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (!plan) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto space-y-6"
    >
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">{plan.title}</h2>
          <p className="text-muted-foreground mt-1">{plan.plainEnglish}</p>
        </div>
        <Button onClick={onStartReview} variant="outline">
          <MessageSquare className="mr-2 h-4 w-4" />
          Review & Feedback
        </Button>
      </div>

      {feedbackHistory.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="py-3">
            <p className="text-sm text-primary">
              This plan incorporates {feedbackHistory.length} prior review(s) from scientists
            </p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ClipboardList}
          label="Protocol Steps"
          value={plan.protocol.length.toString()}
        />
        <SummaryCard
          icon={Package}
          label="Materials"
          value={plan.materials.length.toString()}
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Budget"
          value={`$${plan.budget.total.toLocaleString()}`}
        />
        <SummaryCard
          icon={Calendar}
          label="Duration"
          value={plan.timeline.totalDuration}
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="validation">Validation</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="protocol" className="mt-6">
            <ProtocolTab protocol={plan.protocol} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <MaterialsTab materials={plan.materials} />
          </TabsContent>

          <TabsContent value="budget" className="mt-6">
            <BudgetTab budget={plan.budget} materials={plan.materials} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TimelineTab timeline={plan.timeline} />
          </TabsContent>

          <TabsContent value="validation" className="mt-6">
            <ValidationTab
              validation={plan.validation}
              safety={plan.safetyConsiderations}
              outcomes={plan.expectedOutcomes}
            />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}

function SummaryCard({ icon: Icon, label, value }: { icon: typeof ClipboardList; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center gap-4">
          <div className="rounded-lg bg-primary/10 p-3">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div>
            <p className="text-2xl font-bold">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function ProtocolTab({ protocol }: { protocol: ExperimentPlanData['protocol'] }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {protocol.map((step, index) => (
        <Collapsible key={step.id}>
          <Card>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {step.stepNumber}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{step.title}</CardTitle>
                    <CardDescription>Duration: {step.duration}</CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                <p className="text-sm text-muted-foreground">{step.description}</p>
                {step.criticalNotes && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-3">
                    <p className="text-sm text-amber-800">
                      <strong>Critical Note:</strong> {step.criticalNotes}
                    </p>
                  </div>
                )}
                {step.equipment && step.equipment.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {step.equipment.map((eq) => (
                      <Badge key={eq} variant="secondary">
                        {eq}
                      </Badge>
                    ))}
                  </div>
                )}
              </CardContent>
            </CollapsibleContent>
          </Card>
        </Collapsible>
      ))}
    </motion.div>
  )
}

function MaterialsTab({ materials }: { materials: ExperimentPlanData['materials'] }) {
  const categoryColors: Record<string, string> = {
    reagent: 'bg-blue-100 text-blue-800',
    consumable: 'bg-green-100 text-green-800',
    equipment: 'bg-purple-100 text-purple-800',
    other: 'bg-gray-100 text-gray-800',
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Catalog #</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead className="text-right">Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {materials.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Badge className={cn('text-xs capitalize', categoryColors[item.category])}>
                        {item.category}
                      </Badge>
                      <span className="font-medium">{item.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-xs">{item.catalogNumber}</TableCell>
                  <TableCell>{item.supplier}</TableCell>
                  <TableCell>{item.quantity}</TableCell>
                  <TableCell className="text-right font-medium">
                    ${item.totalPrice.toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </Card>
    </motion.div>
  )
}

function BudgetTab({ budget, materials }: { budget: ExperimentPlanData['budget']; materials: ExperimentPlanData['materials'] }) {
  const categories = [
    { name: 'Reagents', color: 'bg-blue-500', items: materials.filter(m => m.category === 'reagent') },
    { name: 'Consumables', color: 'bg-green-500', items: materials.filter(m => m.category === 'consumable') },
    { name: 'Equipment', color: 'bg-purple-500', items: materials.filter(m => m.category === 'equipment') },
    { name: 'Other', color: 'bg-gray-500', items: materials.filter(m => m.category === 'other') },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-6 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {categories.map((cat) => {
            const subtotal = cat.items.reduce((sum, item) => sum + item.totalPrice, 0)
            const percentage = (subtotal / budget.total) * 100
            return (
              <div key={cat.name} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{cat.name}</span>
                  <span className="font-medium">${subtotal.toLocaleString()}</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', cat.color)}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            )
          })}
          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total Estimated Cost</span>
              <span>${budget.total.toLocaleString()} {budget.currency}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cost Considerations</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Assumptions</h4>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Prices based on US suppliers (Q1 2026)</li>
              <li>Institutional discounts may reduce costs by 10-20%</li>
              <li>Equipment assumes new purchase; rental options available</li>
              <li>Does not include labor, overhead, or facility costs</li>
            </ul>
          </div>
          <div className="rounded-lg bg-green-50 border border-green-200 p-4">
            <h4 className="font-medium text-green-800 mb-2">Cost-Saving Tips</h4>
            <ul className="text-sm text-green-700 space-y-1 list-disc list-inside">
              <li>Check institutional stockroom for common reagents</li>
              <li>Consider multi-lab equipment sharing</li>
              <li>Bulk ordering may reduce consumable costs</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function TimelineTab({ timeline }: { timeline: ExperimentPlanData['timeline'] }) {
  const maxWeek = Math.max(...timeline.phases.map((p) => p.endWeek))

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Project Timeline - {timeline.totalDuration}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Week headers */}
            <div className="flex">
              <div className="w-40 shrink-0" />
              <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${maxWeek}, 1fr)` }}>
                {Array.from({ length: maxWeek }, (_, i) => (
                  <div key={i} className="text-center text-xs text-muted-foreground pb-2">
                    Week {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Phase bars */}
            {timeline.phases.map((phase, index) => (
              <div key={phase.id} className="flex items-center">
                <div className="w-40 shrink-0 pr-4">
                  <p className="font-medium text-sm truncate">{phase.name}</p>
                  <p className="text-xs text-muted-foreground">{phase.duration}</p>
                </div>
                <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${maxWeek}, 1fr)` }}>
                  {Array.from({ length: maxWeek }, (_, weekIndex) => {
                    const weekNum = weekIndex + 1
                    const isInPhase = weekNum >= phase.startWeek && weekNum <= phase.endWeek
                    const isStart = weekNum === phase.startWeek
                    const isEnd = weekNum === phase.endWeek
                    
                    return (
                      <div key={weekIndex} className="h-8 flex items-center">
                        {isInPhase && (
                          <div
                            className={cn(
                              'h-6 w-full bg-primary',
                              isStart && 'rounded-l-md',
                              isEnd && 'rounded-r-md'
                            )}
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {timeline.phases.map((phase) => (
          <Card key={phase.id}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{phase.name}</CardTitle>
              <CardDescription>
                Weeks {phase.startWeek}-{phase.endWeek} • {phase.duration}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {phase.dependencies.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Dependencies:</p>
                    <div className="flex flex-wrap gap-1">
                      {phase.dependencies.map((dep) => (
                        <Badge key={dep} variant="outline" className="text-xs">
                          {timeline.phases.find((p) => p.id === dep)?.name || dep}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Milestones:</p>
                  <ul className="space-y-1">
                    {phase.milestones.map((milestone, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm">
                        <CheckSquare className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {milestone}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </motion.div>
  )
}

function ValidationTab({
  validation,
  safety,
  outcomes,
}: {
  validation: ExperimentPlanData['validation']
  safety: string[]
  outcomes: string[]
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckSquare className="h-5 w-5" />
            Success Criteria
          </CardTitle>
          <CardDescription>
            How success or failure will be measured
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {validation.map((criteria) => (
              <div key={criteria.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="font-medium">{criteria.metric}</h4>
                    <p className="text-sm text-muted-foreground mt-1">
                      Target: {criteria.targetValue}
                    </p>
                  </div>
                  <Badge variant="secondary">{criteria.method}</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Success threshold: {criteria.successThreshold}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldAlert className="h-5 w-5 text-amber-600" />
              Safety Considerations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {safety.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-amber-500 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-green-600" />
              Expected Outcomes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {outcomes.map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}
