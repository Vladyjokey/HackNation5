import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  FlaskConical,
  TestTubes,
  ClipboardList,
  Database,
  ShieldCheck,
  Truck,
  Calendar,
  Users,
  AlertTriangle,
  FileOutput,
  Pill,
  CheckCircle2,
  HardDrive,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronDown,
  Clock,
  Thermometer,
  Wrench,
  Beaker,
  DollarSign,
  Package,
  BarChart3,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'
import { fetchExperimentPlan, type ServerExperimentPlan, APIError } from '../lib/api'

interface ServerPlanDisplayProps {
  initialPlan?: ServerExperimentPlan
  hypothesis?: string
}

export function ServerPlanDisplay({ initialPlan, hypothesis }: ServerPlanDisplayProps = {}) {
  const [plan, setPlan] = useState<ServerExperimentPlan | null>(initialPlan || null)
  const [isLoading, setIsLoading] = useState(!initialPlan)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState('overview')
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingPhase, setLoadingPhase] = useState('Connecting to server...')

  const loadPlan = async () => {
    setIsLoading(true)
    setError(null)
    setLoadingProgress(0)

    const phases = [
      { progress: 20, text: 'Connecting to server...' },
      { progress: 40, text: 'Fetching experiment plan...' },
      { progress: 60, text: 'Parsing protocol data...' },
      { progress: 80, text: 'Loading materials and logistics...' },
      { progress: 100, text: 'Finalizing...' },
    ]

    let phaseIndex = 0
    const interval = setInterval(() => {
      if (phaseIndex < phases.length) {
        setLoadingProgress(phases[phaseIndex].progress)
        setLoadingPhase(phases[phaseIndex].text)
        phaseIndex++
      }
    }, 400)

    try {
      const data = await fetchExperimentPlan()
      setPlan(data)
    } catch (err) {
      if (err instanceof APIError) {
        setError(err.message)
      } else {
        setError('An unexpected error occurred')
      }
    } finally {
      clearInterval(interval)
      setIsLoading(false)
    }
  }

  useEffect(() => {
    // Only fetch if no initial plan was provided
    if (!initialPlan) {
      loadPlan()
    }
  }, [initialPlan])

  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-4xl mx-auto space-y-6"
      >
        <div className="text-center space-y-2">
          <motion.h2 
            className="text-2xl font-bold text-foreground"
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            Loading Experiment Plan
          </motion.h2>
          <p className="text-muted-foreground">Fetching data from the server</p>
        </div>

        <Card className="border-primary/20 shadow-xl overflow-hidden">
          <CardContent className="py-12">
            <div className="space-y-8">
              {/* Animated Lab Icons */}
              <div className="flex justify-center items-end gap-6 h-24">
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg">
                    <FlaskConical className="h-8 w-8" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.4 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white shadow-lg">
                    <TestTubes className="h-8 w-8" />
                  </div>
                </motion.div>
                
                <motion.div
                  animate={{ y: [0, -12, 0], rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity, delay: 0.8 }}
                  className="flex flex-col items-center"
                >
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-lg">
                    <ClipboardList className="h-8 w-8" />
                  </div>
                </motion.div>
              </div>

              {/* Phase Text */}
              <motion.div 
                key={loadingPhase}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <span className="text-lg font-semibold text-foreground">{loadingPhase}</span>
              </motion.div>

              {/* Animated Progress Bar */}
              <div className="space-y-3 px-8">
                <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${loadingProgress}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                  {loadingProgress < 100 && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/40 to-transparent rounded-full shimmer-bar"
                      style={{ width: "25%" }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Building your protocol...</span>
                  <span className="font-medium text-primary">{loadingProgress}%</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    )
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="max-w-2xl mx-auto"
      >
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error Loading Plan</AlertTitle>
          <AlertDescription className="mt-2">
            <p>{error}</p>
            <p className="mt-2 text-sm">
              Make sure the API server is running at the configured URL.
            </p>
          </AlertDescription>
        </Alert>
        <div className="mt-4 flex justify-center">
          <Button onClick={loadPlan} variant="outline">
            <RefreshCw className="mr-2 h-4 w-4" />
            Retry
          </Button>
        </div>
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
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {plan.experiment_metadata.biosafety_level}
            </Badge>
            <Badge variant="secondary" className="text-xs capitalize">
              {plan.experimental_design.study_type}
            </Badge>
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {plan.experiment_metadata.title}
          </h2>
          <p className="text-muted-foreground">{plan.experiment_metadata.objective}</p>
        </div>
        <Button onClick={loadPlan} variant="outline" size="sm">
          <RefreshCw className="mr-2 h-4 w-4" />
          Refresh
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ClipboardList}
          label="Protocol Phases"
          value={plan.protocol.length.toString()}
        />
        <SummaryCard
          icon={Package}
          label="Reagents"
          value={plan.logistics.reagents.length.toString()}
        />
        <SummaryCard
          icon={DollarSign}
          label="Total Budget"
          value={`$${plan.logistics.total_budget.toLocaleString()}`}
        />
        <SummaryCard
          icon={Calendar}
          label="Lead Time"
          value={`${plan.logistics.lead_time_days} days`}
        />
      </div>

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4 lg:grid-cols-8">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="protocol">Protocol</TabsTrigger>
          <TabsTrigger value="materials">Materials</TabsTrigger>
          <TabsTrigger value="timeline">Timeline</TabsTrigger>
          <TabsTrigger value="data">Data Plan</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
          <TabsTrigger value="risk">Risk</TabsTrigger>
          <TabsTrigger value="quality">Quality</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="overview" className="mt-6">
            <OverviewTab plan={plan} />
          </TabsContent>

          <TabsContent value="protocol" className="mt-6">
            <ProtocolTab protocol={plan.protocol} />
          </TabsContent>

          <TabsContent value="materials" className="mt-6">
            <MaterialsTab logistics={plan.logistics} />
          </TabsContent>

          <TabsContent value="timeline" className="mt-6">
            <TimelineTab executionPlan={plan.execution_plan} />
          </TabsContent>

          <TabsContent value="data" className="mt-6">
            <DataPlanTab dataPlan={plan.data_plan} dataManagement={plan.data_management} />
          </TabsContent>

          <TabsContent value="compliance" className="mt-6">
            <ComplianceTab compliance={plan.compliance} />
          </TabsContent>

          <TabsContent value="risk" className="mt-6">
            <RiskTab
              riskManagement={plan.risk_management}
              operationalReadiness={plan.operational_readiness}
            />
          </TabsContent>

          <TabsContent value="quality" className="mt-6">
            <QualityTab
              qualityAssurance={plan.quality_assurance}
              drugSpecs={plan.drug_candidate_specs}
              reporting={plan.reporting}
            />
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  )
}

function SummaryCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ClipboardList
  label: string
  value: string
}) {
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

function OverviewTab({ plan }: { plan: ServerExperimentPlan }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Scientific Rationale */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5" />
            Scientific Rationale
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Background</h4>
            <p className="text-sm">{plan.scientific_rationale.background}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Hypothesis</h4>
            <p className="text-sm font-medium">{plan.scientific_rationale.hypothesis}</p>
          </div>
          <Separator />
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Primary Endpoint</h4>
              <p className="text-sm">{plan.scientific_rationale.primary_endpoint}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Success Criteria</h4>
              <p className="text-sm">{plan.scientific_rationale.success_criteria}</p>
            </div>
          </div>
          {plan.scientific_rationale.secondary_endpoints.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Secondary Endpoints</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  {plan.scientific_rationale.secondary_endpoints.map((endpoint, i) => (
                    <li key={i}>{endpoint}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Experimental Design */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTubes className="h-5 w-5" />
            Experimental Design
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Study Type</h4>
              <Badge variant="secondary" className="capitalize">
                {plan.experimental_design.study_type}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Blinding</h4>
              <Badge variant="outline" className="capitalize">
                {plan.experimental_design.blinding}
              </Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Replicates</h4>
              <p className="text-sm">
                Bio: {plan.experimental_design.replicates.biological} / Tech:{' '}
                {plan.experimental_design.replicates.technical}
              </p>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Model System</h4>
            <p className="text-sm">{plan.experimental_design.model_system}</p>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Randomization</h4>
            <p className="text-sm">{plan.experimental_design.randomization}</p>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Group Definitions</h4>
            <div className="grid md:grid-cols-2 gap-3">
              {plan.experimental_design.group_definitions.map((group, i) => (
                <div key={i} className="rounded-lg border p-3">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-medium text-sm">{group.group_name}</span>
                    <Badge variant="outline" className="text-xs">
                      n={group.sample_size}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{group.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Controls
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Positive Controls</h4>
              <ul className="space-y-1">
                {plan.controls.positive_controls.map((ctrl, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Negative Controls</h4>
              <ul className="space-y-1">
                {plan.controls.negative_controls.map((ctrl, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-red-500" />
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Internal Controls</h4>
              <ul className="space-y-1">
                {plan.controls.internal_controls.map((ctrl, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    {ctrl}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Calibration Procedures
              </h4>
              <ul className="space-y-1">
                {plan.controls.calibration_procedures.map((proc, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-amber-500" />
                    {proc}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ProtocolTab({ protocol }: { protocol: ServerExperimentPlan['protocol'] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
      {protocol.map((phase, phaseIndex) => (
        <Card key={phaseIndex}>
          <Collapsible defaultOpen={phaseIndex === 0}>
            <CollapsibleTrigger asChild>
              <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground font-bold">
                    {phaseIndex + 1}
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base">{phase.phase}</CardTitle>
                    <CardDescription>
                      {phase.steps.length} steps • Dependencies: {phase.dependencies.length > 0 ? phase.dependencies.join(', ') : 'None'}
                    </CardDescription>
                  </div>
                  <ChevronDown className="h-5 w-5 text-muted-foreground transition-transform [[data-state=open]_&]:rotate-180" />
                </div>
              </CardHeader>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <CardContent className="pt-0 space-y-4">
                {phase.qc_checks.length > 0 && (
                  <div className="rounded-lg bg-blue-500/10 border border-blue-500/30 p-3 mb-4">
                    <h4 className="font-medium text-sm text-blue-700 dark:text-blue-300 mb-2">QC Checks</h4>
                    <div className="flex flex-wrap gap-2">
                      {phase.qc_checks.map((check, i) => (
                        <Badge key={i} variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/30">
                          {check}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {phase.steps.map((step) => (
                    <div key={step.step_id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary">Step {step.step_id}</Badge>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-4 w-4" />
                            {step.duration_mins} min
                          </div>
                          {step.temp_celsius !== undefined && (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Thermometer className="h-4 w-4" />
                              {step.temp_celsius}°C
                            </div>
                          )}
                        </div>
                      </div>

                      <p className="text-sm">{step.instruction}</p>

                      <div className="grid md:grid-cols-2 gap-3">
                        {step.equipment.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <Wrench className="h-3 w-3" /> Equipment
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {step.equipment.map((eq, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {eq}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                        {step.consumables.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-muted-foreground mb-1 flex items-center gap-1">
                              <Beaker className="h-3 w-3" /> Consumables
                            </h5>
                            <div className="flex flex-wrap gap-1">
                              {step.consumables.map((cons, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {cons}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-lg bg-muted/50 p-3">
                        <h5 className="text-xs font-medium mb-1">Expected Output</h5>
                        <p className="text-sm text-muted-foreground">{step.expected_output}</p>
                      </div>

                      {step.failure_modes.length > 0 && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="w-full justify-between">
                              <span className="text-xs text-amber-600 flex items-center gap-1">
                                <AlertTriangle className="h-3 w-3" />
                                View failure modes & troubleshooting
                              </span>
                              <ChevronDown className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="grid md:grid-cols-2 gap-3 mt-2">
                              <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3">
                                <h5 className="text-xs font-medium text-amber-700 dark:text-amber-300 mb-2">
                                  Failure Modes
                                </h5>
                                <ul className="text-xs text-amber-600 dark:text-amber-400 space-y-1">
                                  {step.failure_modes.map((mode, i) => (
                                    <li key={i}>• {mode}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-3">
                                <h5 className="text-xs font-medium text-green-700 dark:text-green-300 mb-2">
                                  Troubleshooting
                                </h5>
                                <ul className="text-xs text-green-600 dark:text-green-400 space-y-1">
                                  {step.troubleshooting.map((tip, i) => (
                                    <li key={i}>• {tip}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </CollapsibleContent>
          </Collapsible>
        </Card>
      ))}
    </motion.div>
  )
}

function MaterialsTab({ logistics }: { logistics: ServerExperimentPlan['logistics'] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Reagents Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Beaker className="h-5 w-5" />
              Reagents
            </CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">
                {logistics.reagents.length} items
              </span>
              <span className="font-semibold text-primary">
                ${logistics.reagents.reduce((sum, r) => sum + (r.unit_price || 0), 0).toLocaleString()}
              </span>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Vendor</TableHead>
                  <TableHead>Catalog #</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead className="text-right">Unit Price</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logistics.reagents.map((reagent, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{reagent.name}</TableCell>
                    <TableCell>{reagent.vendor_hint}</TableCell>
                    <TableCell className="font-mono text-xs">{reagent.catalog_no}</TableCell>
                    <TableCell>{reagent.quantity}</TableCell>
                    <TableCell className="text-right">
                      ${reagent.unit_price.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={reagent.is_in_stock_simulated ? 'default' : 'destructive'}
                        className="text-xs"
                      >
                        {reagent.is_in_stock_simulated ? 'In Stock' : 'Out of Stock'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Consumables Table */}
      {logistics.consumables && logistics.consumables.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Consumables
              </CardTitle>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  {logistics.consumables.length} items
                </span>
                <span className="font-semibold text-primary">
                  ${logistics.consumables.reduce((sum, c) => sum + (c.unit_price || 0), 0).toLocaleString()}
                </span>
              </div>
            </div>
            <CardDescription>
              Lab supplies and disposables required for this experiment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2">
              {logistics.consumables.map((consumable, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={cn(
                    "group relative flex flex-col rounded-xl border p-4 transition-all duration-200 hover:shadow-md hover:border-primary/30",
                    consumable.is_in_stock_simulated 
                      ? "border-border" 
                      : "border-red-500/30 bg-red-500/10"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">{consumable.name}</h4>
                        <Badge 
                          variant={consumable.is_in_stock_simulated ? 'outline' : 'destructive'} 
                          className={cn(
                            "text-[10px] shrink-0",
                            consumable.is_in_stock_simulated && "border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10"
                          )}
                        >
                          {consumable.is_in_stock_simulated ? 'In Stock' : 'Out of Stock'}
                        </Badge>
                      </div>
                      <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Vendor:</span>
                          <span>{consumable.vendor_hint}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Catalog:</span>
                          <span className="font-mono">{consumable.catalog_no}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">Quantity:</span>
                          <span>{consumable.quantity}</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="shrink-0 px-3 py-2 rounded-lg text-center bg-primary/5 border border-primary/20">
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground block">
                        Price
                      </span>
                      <span className="text-lg font-bold text-primary">
                        ${consumable.unit_price.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Equipment Usage */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Wrench className="h-5 w-5" />
              Equipment Usage
            </CardTitle>
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                <span className="text-muted-foreground">
                  {logistics.equipment_usage.filter(e => e.is_available).length} Available
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <span className="text-muted-foreground">
                  {logistics.equipment_usage.filter(e => !e.is_available).length} Unavailable
                </span>
              </div>
            </div>
          </div>
          <CardDescription>
            Lab equipment required for this experiment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logistics.equipment_usage.map((eq, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={cn(
                  "group relative flex items-stretch rounded-xl border overflow-hidden transition-all duration-200 hover:shadow-md",
                  eq.is_available 
                    ? "border-border hover:border-green-500/50" 
                    : "border-red-500/30 bg-red-500/10"
                )}
              >
                {/* Status indicator */}
                <div className={cn(
                  "w-1 shrink-0",
                  eq.is_available ? "bg-green-500" : "bg-red-500"
                )} />
                
                {/* Main content */}
                <div className="flex-1 p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                    {/* Equipment info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-foreground truncate">{eq.equipment}</h4>
                        <Badge 
                          variant={eq.is_available ? 'outline' : 'destructive'} 
                          className={cn(
                            "text-[10px] shrink-0",
                            eq.is_available && "border-green-500/50 text-green-700 dark:text-green-400 bg-green-500/10"
                          )}
                        >
                          {eq.is_available ? 'Available' : 'Unavailable'}
                        </Badge>
                        {eq.booking_required && (
                          <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-700 dark:text-amber-400 bg-amber-500/10 shrink-0">
                            Booking Required
                          </Badge>
                        )}
                      </div>
                      {eq.usage_description && (
                        <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                          {eq.usage_description}
                        </p>
                      )}
                    </div>
                    
                    {/* Price tag */}
                    <div className={cn(
                      "shrink-0 px-4 py-2 rounded-lg text-center min-w-20",
                      eq.unit_price === 0 
                        ? "bg-green-500/10 border border-green-500/30" 
                        : "bg-primary/5 border border-primary/20"
                    )}>
                      <span className="text-[10px] uppercase tracking-wide text-muted-foreground block">
                        {eq.unit_price === 0 ? 'No Cost' : 'Per Use'}
                      </span>
                      <span className={cn(
                        "text-sm font-bold",
                        eq.unit_price === 0 ? "text-green-600" : "text-primary"
                      )}>
                        {eq.unit_price === 0 ? 'Standard Equipment' : `$${eq.unit_price.toLocaleString()}`}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Total equipment cost */}
          {logistics.equipment_usage.some(e => e.unit_price > 0) && (
            <div className="mt-4 pt-4 border-t flex items-center justify-end gap-2">
              <span className="text-sm text-muted-foreground">Total Equipment Cost:</span>
              <span className="text-lg font-bold text-primary">
                ${logistics.equipment_usage.reduce((sum, eq) => sum + (eq.unit_price || 0), 0).toLocaleString()}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Budget Breakdown */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Budget Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <BudgetItem
                label="Reagents"
                value={logistics.budget_breakdown.reagents}
                total={logistics.total_budget}
                color="bg-blue-500"
              />
              {logistics.budget_breakdown.consumables !== undefined && (
                <BudgetItem
                  label="Consumables"
                  value={logistics.budget_breakdown.consumables}
                  total={logistics.total_budget}
                  color="bg-amber-500"
                />
              )}
              <BudgetItem
                label="Labor"
                value={logistics.budget_breakdown.labor}
                total={logistics.total_budget}
                color="bg-green-500"
              />
              <BudgetItem
                label="Equipment"
                value={logistics.budget_breakdown.equipment}
                total={logistics.total_budget}
                color="bg-purple-500"
              />
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Budget</span>
              <span>${logistics.total_budget.toLocaleString()}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Logistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Lead Time</h4>
              <p className="text-2xl font-bold">{logistics.lead_time_days} days</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">
                Alternate Suppliers
              </h4>
              <div className="flex flex-wrap gap-2">
                {logistics.alternate_suppliers.map((supplier, i) => (
                  <Badge key={i} variant="outline">
                    {supplier}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function BudgetItem({
  label,
  value,
  total,
  color,
}: {
  label: string
  value: number
  total: number
  color: string
}) {
  const percentage = (value / total) * 100
  return (
    <div className="space-y-1">
      <div className="flex justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">${value.toLocaleString()}</span>
      </div>
      <div className="h-2 rounded-full bg-muted overflow-hidden">
        <div className={cn('h-full rounded-full', color)} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  )
}

function TimelineTab({ executionPlan }: { executionPlan: ServerExperimentPlan['execution_plan'] }) {
  // Extract actual day numbers from the daily schedule
  const dayNumbers = executionPlan.timeline.map(day => {
    // Handle formats like "Day 1", "Day 28", or just numbers
    const dayStr = String(day.day)
    const match = dayStr.match(/\d+/)
    return match ? parseInt(match[0], 10) : 0
  }).filter(d => d > 0)
  
  const firstDay = dayNumbers.length > 0 ? Math.min(...dayNumbers) : 1
  const lastDay = dayNumbers.length > 0 ? Math.max(...dayNumbers) : 1
  const totalDays = lastDay // Total experiment duration is the last day number
  const midDay = Math.ceil((firstDay + lastDay) / 2)
  
  const colors = [
    'from-blue-500 to-blue-600',
    'from-purple-500 to-purple-600', 
    'from-green-500 to-green-600',
    'from-amber-500 to-amber-600',
    'from-pink-500 to-pink-600',
    'from-cyan-500 to-cyan-600',
  ]
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-8">
      {/* Visual Timeline Header */}
      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Experiment Timeline
          </h3>
          <Badge variant="outline" className="text-sm">
            {totalDays} Days Total
          </Badge>
        </div>
        
        {/* Progress Track */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-2">
          <motion.div 
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 via-purple-500 to-green-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 1.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>Day {firstDay}</span>
          <span>Day {midDay}</span>
          <span>Day {lastDay}</span>
        </div>
      </div>

      {/* Daily Timeline Cards */}
      <Card className="overflow-hidden">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-primary/10">
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Daily Schedule
          </CardTitle>
          <CardDescription>Step-by-step breakdown of experiment activities</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="relative">
            {/* Vertical Line */}
            <div className="absolute left-[3.25rem] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary via-purple-500 to-green-500" />
            
            <div className="divide-y">
              {executionPlan.timeline.map((day, dayIndex) => (
                <motion.div 
                  key={day.day}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: dayIndex * 0.1 }}
                  className="flex gap-4 p-4 hover:bg-muted/50 transition-colors group"
                >
                  {/* Day Badge */}
                  <div className="relative flex flex-col items-center shrink-0">
                    <motion.div 
                      className={cn(
                        "w-14 h-14 rounded-xl flex flex-col items-center justify-center text-white font-bold shadow-lg bg-gradient-to-br",
                        colors[dayIndex % colors.length]
                      )}
                      whileHover={{ scale: 1.05 }}
                      transition={{ type: "spring", stiffness: 400 }}
                    >
                      <span className="text-[10px] uppercase tracking-wide opacity-80">Day</span>
                      <span className="text-xl leading-none">{day.day}</span>
                    </motion.div>
                  </div>
                  
                  {/* Tasks */}
                  <div className="flex-1 space-y-2 py-1">
                    {day.tasks.map((task, i) => (
                      <motion.div 
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: dayIndex * 0.1 + i * 0.05 }}
                        className="flex items-start gap-3 p-2 rounded-lg bg-background border group-hover:border-primary/20 transition-colors"
                      >
                        <div className={cn(
                          "mt-0.5 h-5 w-5 rounded-full flex items-center justify-center text-white text-xs font-medium bg-gradient-to-br",
                          colors[dayIndex % colors.length]
                        )}>
                          {i + 1}
                        </div>
                        <span className="text-sm flex-1">{task}</span>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Milestones and Go/No-Go Points */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <CardTitle className="flex items-center gap-2 text-green-700">
              <CheckCircle2 className="h-5 w-5" />
              Key Milestones
            </CardTitle>
            <CardDescription>Critical checkpoints in your experiment</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {executionPlan.milestones.map((milestone, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-green-500/30 bg-green-500/10 hover:bg-green-500/15 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {i + 1}
                  </div>
                  <span className="text-sm">{milestone}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-amber-500/10 to-orange-500/10">
            <CardTitle className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
              <AlertTriangle className="h-5 w-5" />
              Decision Points
            </CardTitle>
            <CardDescription>Go/No-Go checkpoints requiring evaluation</CardDescription>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-3">
              {executionPlan.go_no_go_points.map((point, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-3 p-3 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/15 transition-colors"
                >
                  <div className="h-6 w-6 rounded-full bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shrink-0">
                    <AlertTriangle className="h-3.5 w-3.5 text-white" />
                  </div>
                  <span className="text-sm">{point}</span>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  )
}

function DataPlanTab({
  dataPlan,
  dataManagement,
}: {
  dataPlan: ServerExperimentPlan['data_plan']
  dataManagement: ServerExperimentPlan['data_management']
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Data Collection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Methods</h4>
              <ul className="space-y-1">
                {dataPlan.data_collection_methods.map((method, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-blue-500" />
                    {method}
                  </li>
                ))}
              </ul>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Data Format</h4>
              <Badge variant="secondary">{dataPlan.data_format}</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis Pipeline
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Steps</h4>
              <ol className="space-y-1">
                {dataPlan.analysis_pipeline.map((step, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <Badge variant="outline" className="text-xs w-6 h-6 justify-center p-0">
                      {i + 1}
                    </Badge>
                    {step}
                  </li>
                ))}
              </ol>
            </div>
            <Separator />
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Statistical Tests</h4>
              <div className="flex flex-wrap gap-2">
                {dataPlan.statistical_tests.map((test, i) => (
                  <Badge key={i} variant="secondary">
                    {test}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Power Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Power Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Effect Size</p>
              <p className="text-lg font-bold">{dataPlan.power_analysis.effect_size}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Power</p>
              <p className="text-lg font-bold">{(dataPlan.power_analysis.power * 100).toFixed(0)}%</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-4 text-center">
              <p className="text-sm text-muted-foreground mb-1">Alpha</p>
              <p className="text-lg font-bold">{dataPlan.power_analysis.alpha}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Data Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">ELN Target Folder</h4>
              <p className="text-sm font-mono bg-muted rounded px-2 py-1">
                {dataManagement.eln_target_folder}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Raw Data Storage</h4>
              <Badge variant="secondary">{dataManagement.raw_data_storage}</Badge>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Audit Trail</h4>
              <Badge variant={dataManagement.audit_trail_enabled ? 'default' : 'destructive'}>
                {dataManagement.audit_trail_enabled ? 'Enabled' : 'Disabled'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function ComplianceTab({ compliance }: { compliance: ServerExperimentPlan['compliance'] }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Safety & Compliance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Biosafety</h4>
              <p className="text-sm">{compliance.biosafety}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Ethical Approval</h4>
              <Badge variant={compliance.ethical_approval_required ? 'destructive' : 'secondary'}>
                {compliance.ethical_approval_required ? 'Required' : 'Not Required'}
              </Badge>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Regulatory Bodies</h4>
            <div className="flex flex-wrap gap-2">
              {compliance.regulatory_bodies.map((body, i) => (
                <Badge key={i} variant="outline">
                  {body}
                </Badge>
              ))}
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Waste Disposal</h4>
            <ul className="space-y-1">
              {compliance.waste_disposal.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function RiskTab({
  riskManagement,
  operationalReadiness,
}: {
  riskManagement: ServerExperimentPlan['risk_management']
  operationalReadiness: ServerExperimentPlan['operational_readiness']
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Operational Readiness */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Operational Readiness
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Required Staff Skills</h4>
            <div className="flex flex-wrap gap-2">
              {operationalReadiness.staff_skills.map((skill, i) => (
                <Badge key={i} variant="secondary">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>
          {operationalReadiness.critical_warnings.length > 0 && (
            <>
              <Separator />
              <div>
                <h4 className="font-medium text-sm text-muted-foreground mb-2">Critical Warnings</h4>
                <div className="space-y-2">
                  {operationalReadiness.critical_warnings.map((warning, i) => (
                    <Alert key={i} variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{warning}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              </div>
            </>
          )}
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Expected Bottlenecks</h4>
            <ul className="space-y-1">
              {operationalReadiness.expected_bottlenecks.map((item, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-amber-500 shrink-0 mt-1.5" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Risk Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Risk Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Critical Warnings</h4>
              <div className="space-y-2">
                {riskManagement.critical_warnings.map((warning, i) => (
                  <div key={i} className="rounded-lg bg-red-500/10 border border-red-500/30 p-3 text-sm text-red-700 dark:text-red-400">
                    {warning}
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Contingency Plans</h4>
              <ul className="space-y-2">
                {riskManagement.contingency_plans.map((plan, i) => (
                  <li key={i} className="text-sm flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                    {plan}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}

function QualityTab({
  qualityAssurance,
  drugSpecs,
  reporting,
}: {
  qualityAssurance: ServerExperimentPlan['quality_assurance']
  drugSpecs: ServerExperimentPlan['drug_candidate_specs']
  reporting: ServerExperimentPlan['reporting']
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Drug Candidate Specs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="h-5 w-5" />
            Drug Candidate Specifications
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Molecular Weight</h4>
              <p className="font-bold">{drugSpecs.molecular_weight} Da</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Purity Requirement</h4>
              <p className="font-bold">{drugSpecs.purity_requirement}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Storage Conditions</h4>
              <p className="font-bold text-sm">{drugSpecs.storage_conditions}</p>
            </div>
            <div className="rounded-lg bg-muted/50 p-3">
              <h4 className="text-xs font-medium text-muted-foreground mb-1">Solubility Profile</h4>
              <p className="font-bold text-sm">{drugSpecs.solubility_profile}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quality Assurance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Quality Assurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Positive Control Expected Range
              </h4>
              <p className="text-sm">{qualityAssurance.positive_control_expected_range}</p>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">
                Negative Control Threshold
              </h4>
              <p className="text-sm">{qualityAssurance.negative_control_threshold}</p>
            </div>
            <div className="md:col-span-2">
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Plate Map Layout</h4>
              <p className="text-sm">{qualityAssurance.plate_map_layout}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Reporting */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileOutput className="h-5 w-5" />
            Reporting
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-2">Deliverables</h4>
              <ul className="space-y-1">
                {reporting.deliverables.map((item, i) => (
                  <li key={i} className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4 text-primary" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-sm text-muted-foreground mb-1">Report Format</h4>
              <Badge variant="secondary">{reporting.report_format}</Badge>
            </div>
          </div>
          <Separator />
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-2">Reproducibility Notes</h4>
            <ul className="space-y-1">
              {reporting.reproducibility_notes.map((note, i) => (
                <li key={i} className="text-sm flex items-start gap-2">
                  <div className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  )
}
