import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  CheckCircle2,
  ClipboardList,
  Package,
  Calendar,
  Loader2,
  AlertCircle,
  ThumbsUp,
  AlertTriangle,
  Lightbulb,
  FileText,
  X,
  Database,
  Shield,
  Award,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { submitFeedback, APIError, type FeedbackPayload } from '../lib/api'
import type { ExperimentPlanData, Feedback } from '../types'

interface ScientistReviewProps {
  plan: ExperimentPlanData
  onFeedbackSubmit: (feedback: Feedback) => void
  feedbackHistory: Feedback[]
}

type Category = 'overview' | 'protocol' | 'materials' | 'timeline' | 'data_plan' | 'compliance' | 'risk' | 'quality'
type FeedbackType = 'correction' | 'suggestion' | 'praise' | 'issue'
type Priority = 'low' | 'medium' | 'high'

const categoryConfig: Record<Category, { icon: typeof ClipboardList; label: string; description: string }> = {
  overview: { icon: FileText, label: 'Overview', description: 'Overall feedback about the experiment' },
  protocol: { icon: ClipboardList, label: 'Protocol', description: 'Feedback on experimental steps' },
  materials: { icon: Package, label: 'Materials', description: 'Feedback on reagents and equipment' },
  timeline: { icon: Calendar, label: 'Timeline', description: 'Feedback on schedule and duration' },
  data_plan: { icon: Database, label: 'Data Plan', description: 'Feedback on data collection and analysis' },
  compliance: { icon: Shield, label: 'Compliance', description: 'Feedback on regulatory requirements' },
  risk: { icon: AlertTriangle, label: 'Risk', description: 'Feedback on risk assessment' },
  quality: { icon: Award, label: 'Quality', description: 'Feedback on quality assurance' },
}

const feedbackTypeConfig: Record<FeedbackType, { 
  icon: typeof AlertCircle
  label: string
  description: string
  color: string
  gradientFrom: string
  gradientTo: string
  ringColor: string
  emoji: string
}> = {
  correction: { 
    icon: AlertCircle, 
    label: 'Correction', 
    description: 'Fix an error or inaccuracy',
    color: 'text-red-600',
    gradientFrom: 'from-red-500',
    gradientTo: 'to-rose-600',
    ringColor: 'ring-red-400',
    emoji: '🔧'
  },
  suggestion: { 
    icon: Lightbulb, 
    label: 'Suggestion', 
    description: 'Propose an improvement',
    color: 'text-blue-600',
    gradientFrom: 'from-blue-500',
    gradientTo: 'to-cyan-500',
    ringColor: 'ring-blue-400',
    emoji: '💡'
  },
  praise: { 
    icon: ThumbsUp, 
    label: 'Praise', 
    description: 'Highlight something great',
    color: 'text-green-600',
    gradientFrom: 'from-green-500',
    gradientTo: 'to-emerald-500',
    ringColor: 'ring-green-400',
    emoji: '⭐'
  },
  issue: { 
    icon: AlertTriangle, 
    label: 'Issue', 
    description: 'Report a problem',
    color: 'text-amber-600',
    gradientFrom: 'from-amber-500',
    gradientTo: 'to-orange-500',
    ringColor: 'ring-amber-400',
    emoji: '⚠️'
  },
}

export function ScientistReview({ plan, onFeedbackSubmit, feedbackHistory }: ScientistReviewProps) {
  // Feedback form state matching the endpoint structure
  const [category, setCategory] = useState<Category>('overview')
  const [feedbackType, setFeedbackType] = useState<FeedbackType>('suggestion')
  const [content, setContent] = useState('')
  
  // Context fields
  const [entity, setEntity] = useState('')
  const [referenceId, setReferenceId] = useState('')
  const [contextSection, setContextSection] = useState('')
  const [contextField, setContextField] = useState('')
  const [contextOriginalValue, setContextOriginalValue] = useState('')
  
  // Metadata fields
  const [priority, setPriority] = useState<Priority>('medium')
  const [confidence, setConfidence] = useState<'low' | 'medium' | 'high'>('medium')
  
  // Form state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitSuccess, setSubmitSuccess] = useState(false)
  
  // Modal state for feedback status
  const [showModal, setShowModal] = useState(false)
  const [modalStatus, setModalStatus] = useState<'success' | 'error'>('success')
  const [modalMessage, setModalMessage] = useState('')
  const [modalFeedbackId, setModalFeedbackId] = useState<string | null>(null)
  
  // Auto-dismiss modal after 4 seconds for success
  useEffect(() => {
    if (showModal && modalStatus === 'success') {
      const timer = setTimeout(() => {
        setShowModal(false)
      }, 4000)
      return () => clearTimeout(timer)
    }
  }, [showModal, modalStatus])

  const handleSubmitFeedback = async () => {
    // Validation
    if (!content.trim()) {
      setSubmitError('Please provide feedback content')
      return
    }

    if (content.trim().length < 10) {
      setSubmitError('Feedback must be at least 10 characters')
      return
    }

    setIsSubmitting(true)
    setSubmitError(null)
    setSubmitSuccess(false)

    // Build payload matching the feedback_memory table schema
    const payload: FeedbackPayload = {
      // Core classification
      category: category,
      feedback_type: feedbackType,
      
      // Main content
      content: content.trim(),
      
      // Top-level context fields for efficient queries
      hypothesis_context: plan.hypothesis, // Original hypothesis from step 1
      entity: entity || category, // e.g. "step", "compound", "protocol"
      reference_id: referenceId || undefined, // e.g. "step_3", "claim_1"
      
      // Flexible context extensions
      context: {
        experiment_id: plan.id,
        section: contextSection || undefined,
        field: contextField || undefined,
        original_value: contextOriginalValue || undefined,
      },
      
      // Metadata
      metadata: {
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
      },
      
      // Scoring
      priority: priority,
      confidence: confidence,
    }

    try {
      const response = await submitFeedback(payload)
      
      // Check for success - backend returns { status: "success", message: "..." }
      if (response.status === 'success') {
        setSubmitSuccess(true)
        
        // Show success modal
        setModalStatus('success')
        setModalMessage(response.message || 'Your feedback has been recorded and will help improve future experiment plans.')
        setModalFeedbackId(null) // Backend doesn't return feedback_id
        setShowModal(true)
        
        // Reset form after successful submission
        setContent('')
        setEntity('')
        setReferenceId('')
        setContextSection('')
        setContextField('')
        setContextOriginalValue('')
        setPriority('medium')
        setConfidence('medium')
        
        // Trigger local feedback handler for UI update
        const localFeedback: Feedback = {
          id: `feedback_${Date.now()}`, // Generate a local ID since backend doesn't return one
          planId: plan.id,
          experimentType: plan.title,
          section: category === 'overview' ? 'protocol' : category,
          rating: 3,
          corrections: [],
          annotations: content,
          timestamp: new Date(),
        }
        onFeedbackSubmit(localFeedback)
      } else if (response.status === 'error') {
        // Backend returned an error response
        throw new Error(response.detail || 'Failed to submit feedback')
      }
    } catch (error) {
      const errorMessage = error instanceof APIError 
        ? error.message 
        : error instanceof Error
        ? error.message
        : 'Failed to submit feedback. Please try again.'
      setSubmitError(errorMessage)
      
      // Show error modal
      setModalStatus('error')
      setModalMessage(errorMessage)
      setModalFeedbackId(null)
      setShowModal(true)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
    setContent('')
    setEntity('')
    setReferenceId('')
    setContextSection('')
    setContextField('')
    setContextOriginalValue('')
    setPriority('medium')
    setConfidence('medium')
    setSubmitError(null)
    setSubmitSuccess(false)
  }

  const FeedbackIcon = feedbackTypeConfig[feedbackType].icon
  const CategoryIcon = categoryConfig[category].icon

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-3xl mx-auto space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Submit Feedback</h2>
        <p className="text-muted-foreground">
          Help improve experiment plans with your expert feedback
        </p>
      </div>

      {/* Plan Info Card with Hypothesis Context */}
      <Card className="bg-muted/30 border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Reviewing: {plan.title}
          </CardTitle>
          <CardDescription className="line-clamp-2">{plan.plainEnglish}</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="p-3 rounded-lg bg-background/50 border">
            <p className="text-xs font-medium text-muted-foreground mb-1">Original Hypothesis</p>
            <p className="text-sm italic text-foreground">&quot;{plan.hypothesis}&quot;</p>
          </div>
        </CardContent>
      </Card>

      {/* Main Feedback Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="h-5 w-5" />
            Feedback Form
          </CardTitle>
          <CardDescription>
            All fields marked with * are required
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Success Message */}
          <AnimatePresence>
            {submitSuccess && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert className="bg-green-500/10 border-green-500/30">
                  <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertTitle className="text-green-700 dark:text-green-300">Feedback Submitted</AlertTitle>
                  <AlertDescription className="text-green-600 dark:text-green-400">
                    Your feedback has been saved successfully. Thank you for your input.
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Message */}
          <AnimatePresence>
            {submitError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
              >
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Error</AlertTitle>
                  <AlertDescription>{submitError}</AlertDescription>
                </Alert>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category Selection */}
          <div className="space-y-3">
            <Label htmlFor="category" className="text-sm font-medium">
              Category <span className="text-destructive">*</span>
            </Label>
            <Select value={category} onValueChange={(v) => setCategory(v as Category)}>
              <SelectTrigger id="category" className="w-full border-2">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {(Object.entries(categoryConfig) as [Category, typeof categoryConfig.general][]).map(
                  ([key, config]) => {
                    const Icon = config.icon
                    return (
                      <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <span>{config.label}</span>
                          <span className="text-xs text-muted-foreground">- {config.description}</span>
                        </div>
                      </SelectItem>
                    )
                  }
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Feedback Type Selection - Interactive Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                What type of feedback? <span className="text-destructive">*</span>
              </Label>
              <motion.span 
                key={feedbackType}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className={cn("text-xs font-medium px-2 py-1 rounded-full", feedbackTypeConfig[feedbackType].color, "bg-opacity-10")}
                style={{ backgroundColor: `currentColor`, opacity: 0.1 }}
              >
                {feedbackTypeConfig[feedbackType].label} selected
              </motion.span>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {(Object.entries(feedbackTypeConfig) as [FeedbackType, typeof feedbackTypeConfig.correction][]).map(
                ([key, config]) => {
                  const Icon = config.icon
                  const isSelected = feedbackType === key
                  return (
                    <motion.button
                      key={key}
                      type="button"
                      onClick={() => setFeedbackType(key)}
                      whileHover={{ scale: 1.02, y: -2 }}
                      whileTap={{ scale: 0.98 }}
                      className={cn(
                        'relative flex flex-col items-center gap-3 p-4 rounded-xl border-2 transition-all duration-300 overflow-hidden group',
                        isSelected
                          ? `border-transparent ring-2 ${config.ringColor} shadow-lg`
                          : 'border-border hover:border-muted-foreground/30 bg-background hover:shadow-md'
                      )}
                    >
                      {/* Background gradient on selection */}
                      <motion.div 
                        className={cn(
                          "absolute inset-0 bg-gradient-to-br opacity-0 transition-opacity duration-300",
                          config.gradientFrom, config.gradientTo
                        )}
                        animate={{ opacity: isSelected ? 0.08 : 0 }}
                      />
                      
                      {/* Animated icon container */}
                      <motion.div
                        animate={isSelected ? { 
                          scale: [1, 1.1, 1],
                        } : {}}
                        transition={{ duration: 0.5, repeat: isSelected ? Infinity : 0, repeatDelay: 2 }}
                        className={cn(
                          "relative w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                          isSelected 
                            ? `bg-gradient-to-br ${config.gradientFrom} ${config.gradientTo} shadow-md` 
                            : "bg-muted group-hover:bg-muted/80"
                        )}
                      >
                        <Icon className={cn(
                          'h-6 w-6 transition-colors duration-300',
                          isSelected ? 'text-white' : 'text-muted-foreground group-hover:text-foreground'
                        )} />
                        
                        {/* Selection checkmark */}
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0, opacity: 0 }}
                              animate={{ scale: 1, opacity: 1 }}
                              exit={{ scale: 0, opacity: 0 }}
                              className="absolute -top-1 -right-1 w-5 h-5 bg-white rounded-full shadow-sm flex items-center justify-center"
                            >
                              <CheckCircle2 className={cn("h-4 w-4", config.color)} />
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </motion.div>
                      
                      {/* Label and description */}
                      <div className="relative z-10 text-center space-y-1">
                        <span className={cn(
                          'text-sm font-semibold transition-colors duration-300',
                          isSelected ? config.color : 'text-foreground'
                        )}>
                          {config.label}
                        </span>
                        <p className={cn(
                          'text-[10px] leading-tight transition-colors duration-300',
                          isSelected ? 'text-muted-foreground' : 'text-muted-foreground/70'
                        )}>
                          {config.description}
                        </p>
                      </div>
                      
                      {/* Bottom accent bar on selection */}
                      <motion.div
                        className={cn(
                          "absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r",
                          config.gradientFrom, config.gradientTo
                        )}
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isSelected ? 1 : 0 }}
                        transition={{ duration: 0.3 }}
                      />
                    </motion.button>
                  )
                }
              )}
            </div>
          </div>

          {/* Content Textarea */}
          <div className="space-y-3">
            <Label htmlFor="content" className="text-sm font-medium">
              Content <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Textarea
                id="content"
                placeholder="Describe your feedback in detail. Be specific about what you observed and any suggested changes..."
                value={content}
                onChange={(e) => {
                  setContent(e.target.value)
                  if (submitError) setSubmitError(null)
                  if (submitSuccess) setSubmitSuccess(false)
                }}
                className="min-h-32 resize-none pr-16 border-2"
                maxLength={1000}
              />
              <div className={cn(
                'absolute bottom-2 right-2 text-xs',
                content.length > 900 ? 'text-amber-500' : 'text-muted-foreground'
              )}>
                {content.length}/1000
              </div>
            </div>
            {content.length > 0 && content.length < 10 && (
              <p className="text-xs text-amber-600">Minimum 10 characters required</p>
            )}
          </div>

          {/* Context Section */}
          <div className="space-y-4 p-4 rounded-lg bg-muted/30 border-2 border-border">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Context (Optional)</Label>
              <span className="text-xs text-muted-foreground">Helps us understand your feedback better</span>
            </div>
            
            {/* Entity and Reference ID - top level for efficient queries */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 p-3 rounded-md bg-background/50 border border-border">
                <Label htmlFor="entity" className="text-xs text-muted-foreground">Entity Type</Label>
                <Input
                  id="entity"
                  placeholder="e.g., step, compound, protocol"
                  value={entity}
                  onChange={(e) => setEntity(e.target.value)}
                  className="h-9 border-2"
                />
              </div>
              <div className="space-y-2 p-3 rounded-md bg-background/50 border border-border">
                <Label htmlFor="referenceId" className="text-xs text-muted-foreground">Reference ID</Label>
                <Input
                  id="referenceId"
                  placeholder="e.g., step_3, claim_1"
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  className="h-9 border-2"
                />
              </div>
            </div>
            
            {/* Additional context fields */}
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2 p-3 rounded-md bg-background/50 border border-border">
                <Label htmlFor="section" className="text-xs text-muted-foreground">Section</Label>
                <Input
                  id="section"
                  placeholder="e.g., Step 3"
                  value={contextSection}
                  onChange={(e) => setContextSection(e.target.value)}
                  className="h-9 border-2"
                />
              </div>
              <div className="space-y-2 p-3 rounded-md bg-background/50 border border-border">
                <Label htmlFor="field" className="text-xs text-muted-foreground">Field</Label>
                <Input
                  id="field"
                  placeholder="e.g., Temperature"
                  value={contextField}
                  onChange={(e) => setContextField(e.target.value)}
                  className="h-9 border-2"
                />
              </div>
              <div className="space-y-2 p-3 rounded-md bg-background/50 border border-border">
                <Label htmlFor="original" className="text-xs text-muted-foreground">Original Value</Label>
                <Input
                  id="original"
                  placeholder="e.g., 37C"
                  value={contextOriginalValue}
                  onChange={(e) => setContextOriginalValue(e.target.value)}
                  className="h-9 border-2"
                />
              </div>
            </div>
          </div>

          {/* Priority and Confidence Selection */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Priority</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as Priority[]).map((p) => (
                  <Button
                    key={p}
                    type="button"
                    variant={priority === p ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setPriority(p)}
                    className={cn(
                      'flex-1 capitalize',
                      priority === p && p === 'low' && 'bg-green-600 hover:bg-green-700 text-white',
                      priority === p && p === 'medium' && 'bg-amber-500 hover:bg-amber-600 text-white',
                      priority === p && p === 'high' && 'bg-red-600 hover:bg-red-700 text-white'
                    )}
                  >
                    {p}
                  </Button>
                ))}
              </div>
            </div>
            
            <div className="space-y-3">
              <Label className="text-sm font-medium">Confidence</Label>
              <div className="flex gap-2">
                {(['low', 'medium', 'high'] as const).map((c) => (
                  <Button
                    key={c}
                    type="button"
                    variant={confidence === c ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setConfidence(c)}
                    className={cn(
                      'flex-1 capitalize',
                      confidence === c && c === 'low' && 'bg-slate-500 hover:bg-slate-600 text-white',
                      confidence === c && c === 'medium' && 'bg-blue-500 hover:bg-blue-600 text-white',
                      confidence === c && c === 'high' && 'bg-cyan-600 hover:bg-cyan-700 text-white'
                    )}
                  >
                    {c}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={resetForm}
              disabled={isSubmitting}
              className="flex-1"
            >
              Clear Form
            </Button>
            <Button 
              onClick={handleSubmitFeedback} 
              disabled={isSubmitting || !content.trim() || content.trim().length < 10}
              className="flex-1"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Feedback
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Previous Feedback */}
      {feedbackHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Previous Feedback</CardTitle>
            <CardDescription>
              {feedbackHistory.length} feedback item{feedbackHistory.length !== 1 ? 's' : ''} submitted
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedbackHistory.slice(-5).reverse().map((feedback) => (
                <div
                  key={feedback.id}
                  className="flex items-start gap-3 p-3 rounded-lg border bg-muted/20"
                >
                  <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{feedback.experimentType}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {feedback.annotations || 'No annotations'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(feedback.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Feedback Status Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="text-center sm:text-center">
            <div className="mx-auto mb-4">
              {modalStatus === 'success' ? (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center"
                >
                  <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="w-16 h-16 rounded-full bg-red-500/15 flex items-center justify-center"
                >
                  <AlertCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
                </motion.div>
              )}
            </div>
            <DialogTitle className={cn(
              "text-xl font-semibold",
              modalStatus === 'success' ? 'text-green-700 dark:text-green-400' : 'text-red-700 dark:text-red-400'
            )}>
              {modalStatus === 'success' ? 'Feedback Submitted Successfully!' : 'Submission Failed'}
            </DialogTitle>
            <DialogDescription className="text-center pt-2">
              {modalMessage}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 pt-4">
            {modalStatus === 'success' && modalFeedbackId && (
              <div className="p-3 rounded-lg bg-muted/50 border text-center">
                <p className="text-xs text-muted-foreground mb-1">Feedback Reference ID</p>
                <p className="text-sm font-mono font-medium">{modalFeedbackId}</p>
              </div>
            )}
            
            {modalStatus === 'success' && (
              <motion.div 
                className="w-full h-1 bg-muted rounded-full overflow-hidden"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
              >
                <motion.div
                  className="h-full bg-green-500"
                  initial={{ width: '100%' }}
                  animate={{ width: '0%' }}
                  transition={{ duration: 4, ease: 'linear' }}
                />
              </motion.div>
            )}
            
            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowModal(false)}
              >
                {modalStatus === 'success' ? 'Close' : 'Dismiss'}
              </Button>
              {modalStatus === 'error' && (
                <Button
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false)
                    setSubmitError(null)
                  }}
                >
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  )
}
