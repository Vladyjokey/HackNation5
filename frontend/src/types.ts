export type Stage = 'input' | 'literature-qc' | 'experiment-plan' | 'review'

export type NoveltySignal = 'not-found' | 'similar-work-exists' | 'exact-match-found'

export interface Reference {
  title: string
  authors: string
  journal: string
  year: number
  url: string
  relevanceScore: number
}

export interface LiteratureResult {
  noveltySignal: NoveltySignal
  references: Reference[]
  summary: string
}

export interface ProtocolStep {
  id: string
  stepNumber: number
  title: string
  description: string
  duration: string
  criticalNotes?: string
  equipment?: string[]
}

export interface Material {
  id: string
  name: string
  catalogNumber: string
  supplier: string
  quantity: string
  unitPrice: number
  totalPrice: number
  category: 'reagent' | 'consumable' | 'equipment' | 'other'
}

export interface BudgetCategory {
  name: string
  items: Material[]
  subtotal: number
}

export interface TimelinePhase {
  id: string
  name: string
  duration: string
  startWeek: number
  endWeek: number
  dependencies: string[]
  milestones: string[]
}

export interface ValidationCriteria {
  id: string
  metric: string
  targetValue: string
  method: string
  successThreshold: string
}

export interface ExperimentPlanData {
  id: string
  title: string
  hypothesis: string
  plainEnglish: string
  protocol: ProtocolStep[]
  materials: Material[]
  budget: {
    categories: BudgetCategory[]
    total: number
    currency: string
  }
  timeline: {
    totalDuration: string
    phases: TimelinePhase[]
  }
  validation: ValidationCriteria[]
  safetyConsiderations: string[]
  expectedOutcomes: string[]
}

export interface FeedbackItem {
  field: string
  originalValue: string
  correctedValue: string
  reason: string
}

export interface Feedback {
  id: string
  planId: string
  experimentType: string
  section: 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation'
  rating: 1 | 2 | 3 | 4 | 5
  corrections: FeedbackItem[]
  annotations: string
  timestamp: Date
}

export interface AppState {
  stage: Stage
  hypothesis: string
  isLoading: boolean
  literatureResult: LiteratureResult | null
  experimentPlan: ExperimentPlanData | null
  feedbackHistory: Feedback[]
}
