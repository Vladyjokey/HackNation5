// API service for interacting with the experiment planner backend

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://hacknation5-production.up.railway.app'
// Helper function to create headers with authentication
const createHeaders = (): Record<string, string> => ({
  'Content-Type': 'application/json',
  // Vite way: Use import.meta.env and prefix with VITE_
  'X-Shared-Secret': import.meta.env.VITE_UI_BACKEND_SECRET || '',
})

export interface ServerExperimentPlan {
  experiment_metadata: {
    title: string
    objective: string
    biosafety_level: 'BSL-1' | 'BSL-2' | 'BSL-3'
  }
  scientific_rationale: {
    background: string
    hypothesis: string
    primary_endpoint: string
    secondary_endpoints: string[]
    success_criteria: string
  }
  experimental_design: {
    study_type: 'in vitro' | 'in vivo' | 'ex vivo'
    model_system: string
    group_definitions: Array<{
      group_name: string
      description: string
      sample_size: number
    }>
    randomization: string
    blinding: 'none' | 'single' | 'double'
    replicates: {
      biological: number
      technical: number
    }
  }
  controls: {
    positive_controls: string[]
    negative_controls: string[]
    internal_controls: string[]
    calibration_procedures: string[]
  }
  protocol: Array<{
    phase: string
    dependencies: string[]
    qc_checks: string[]
    steps: Array<{
      step_id: number
      instruction: string
      duration_mins: number
      equipment: string[]
      consumables: string[]
      temp_celsius?: number
      expected_output: string
      failure_modes: string[]
      troubleshooting: string[]
    }>
  }>
  data_plan: {
    data_collection_methods: string[]
    data_format: string
    analysis_pipeline: string[]
    statistical_tests: string[]
    power_analysis: {
      effect_size: string
      power: number
      alpha: number
    }
  }
  compliance: {
    biosafety: string
    ethical_approval_required: boolean
    regulatory_bodies: string[]
    waste_disposal: string[]
  }
  logistics: {
    reagents: Array<{
      name: string
      vendor_hint: string
      catalog_no: string
      quantity: string
      unit_price: number
      is_in_stock_simulated: boolean
    }>
    consumables: Array<{
      name: string
      vendor_hint: string
      catalog_no: string
      quantity: string
      unit_price: number
      is_in_stock_simulated: boolean
    }>
    equipment_usage: Array<{
      equipment: string
      usage_description: string
      unit_price: number
      is_available: boolean
      booking_required: boolean
    }>
    total_budget: number
    budget_breakdown: {
      reagents: number
      consumables: number
      labor: number
      equipment: number
    }
    lead_time_days: number
    alternate_suppliers: string[]
  }
  execution_plan: {
    timeline: Array<{
      day: number
      tasks: string[]
    }>
    milestones: string[]
    go_no_go_points: string[]
  }
  operational_readiness: {
    staff_skills: string[]
    critical_warnings: string[]
    expected_bottlenecks: string[]
  }
  risk_management: {
    critical_warnings: string[]
    expected_bottlenecks: string[]
    contingency_plans: string[]
  }
  reporting: {
    deliverables: string[]
    report_format: string
    reproducibility_notes: string[]
  }
  drug_candidate_specs: {
    molecular_weight: number
    solubility_profile: string
    storage_conditions: string
    purity_requirement: string
  }
  quality_assurance: {
    positive_control_expected_range: string
    negative_control_threshold: string
    plate_map_layout: string
  }
  data_management: {
    eln_target_folder: string
    raw_data_storage: string
    audit_trail_enabled: boolean
  }
}

// Server Literature QC response interface (raw response from server - v3 schema)
interface ServerLiteratureQCResponse {
  entity: {
    name: string
    type: string
    target: string | null
    description: string | null
    identifiers: {
      cas_number: string | null
      pubchem_cid: number | null
      other_ids: string[]
    }
  }
  novelty_assessment: 'novel' | 'incremental' | 'well_studied' | 'unclear'
  confidence: {
    score: number
    type: 'model_confidence' | 'statistical' | 'heuristic'
    scale: '0-1' | '0-100'
  }
  summary: string
  key_claims: Array<{
    id: string
    type: 'background' | 'evidence' | 'gap' | 'conclusion'
    text: string
    supporting_references: string[]
  }>
  knowledge_gaps: string[]
  references: Array<{
    id: string
    title: string
    authors: string[]
    year: number
    journal: string | null
    doi: string | null
    url: string | null
    quality: 'high' | 'medium' | 'low'
    study_type: 'experimental' | 'review' | 'clinical' | 'computational' | 'unknown'
  }>
  evidence_links: Array<{
    claim_id: string
    reference_id: string
    relationship: 'supports' | 'contradicts' | 'partial'
  }>
  metrics: {
    num_references: number
    num_supporting_claims: number
    num_contradicting_claims: number
    evidence_coverage_score: number
  }
  risk_flags: Array<'low_novelty' | 'limited_evidence' | 'conflicting_results' | 'high_uncertainty'>
  metadata: {
    generated_at: string
    method: string
    source_query: string | null
    pipeline_version: string
    schema_version: string
  }
}

// Normalized Literature QC response interface (what the UI expects)
export interface LiteratureQCResponse {
  novelty_signal: 'not-found' | 'similar-work-exists' | 'exact-match-found'
  references: Array<{
    id: string
    title: string
    authors: string
    journal: string
    year: number
    url: string
    quality: 'high' | 'medium' | 'low'
    study_type: string
  }>
  summary: string
  entity?: {
    name: string
    type: string
    target: string | null
    description: string | null
    identifiers?: {
      cas_number: string | null
      pubchem_cid: number | null
      other_ids: string[]
    }
  }
  confidence?: number
  confidenceType?: string
  key_claims?: Array<{
    id: string
    type: 'background' | 'evidence' | 'gap' | 'conclusion'
    text: string
    supporting_references: string[]
  }>
  knowledge_gaps?: string[]
  evidence_links?: Array<{
    claim_id: string
    reference_id: string
    relationship: 'supports' | 'contradicts' | 'partial'
  }>
  metrics?: {
    num_references: number
    num_supporting_claims: number
    num_contradicting_claims: number
    evidence_coverage_score: number
  }
  risk_flags?: string[]
  metadata?: {
    generated_at: string
    method: string
    pipeline_version: string
    schema_version: string
  }
}

// Map server novelty assessment to UI novelty signal
function mapNoveltyAssessment(assessment: string): 'not-found' | 'similar-work-exists' | 'exact-match-found' {
  switch (assessment.toLowerCase()) {
    case 'novel':
      return 'not-found'
    case 'incremental':
    case 'unclear':
      return 'similar-work-exists'
    case 'well_studied':
    case 'known':
      return 'exact-match-found'
    default:
      return 'similar-work-exists'
  }
}

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public statusText?: string
  ) {
    super(message)
    this.name = 'APIError'
  }
}

// Combined response from generate-full-experiment endpoint
export interface FullExperimentResponse {
  status: 'success' | 'error'
  message?: string
  qc_report: ServerLiteratureQCResponse
  experiment_plan: ServerExperimentPlan
}

// Normalized full experiment response for UI consumption
export interface NormalizedFullExperimentResponse {
  qcReport: LiteratureQCResponse
  experimentPlan: ServerExperimentPlan
}

// Fetch both QC report and experiment plan in a single request
export async function fetchFullExperiment(hypothesis: string): Promise<NormalizedFullExperimentResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 120000) // 2 minute timeout for full pipeline

  try {
    const response = await fetch(`${API_BASE_URL}/generate-full-experiment`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ hypothesis }),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorMessage = response.status === 404 
        ? 'Experiment generation endpoint not found.'
        : response.status === 500
        ? 'Server error during experiment generation. Please try again.'
        : response.status === 503
        ? 'Experiment generation service is temporarily unavailable.'
        : `Experiment generation failed (${response.status}: ${response.statusText})`
      
      throw new APIError(errorMessage, response.status, response.statusText)
    }

    const data: FullExperimentResponse = await response.json()
    
    console.log('[v0] Full experiment response:', JSON.stringify(data, null, 2))
    
    if (data.status === 'error') {
      throw new APIError(data.message || 'Failed to generate experiment')
    }

    const serverQC = data.qc_report
    const serverPlan = data.experiment_plan
    
    console.log('[v0] QC Report structure:', serverQC ? Object.keys(serverQC) : 'null')
    console.log('[v0] Experiment Plan structure:', serverPlan ? Object.keys(serverPlan) : 'null')

    // If the backend returns data in an already-normalized format, pass it through
    // Otherwise normalize it
    try {
      // Check if serverQC has the expected raw format or is already normalized
      const hasRawFormat = serverQC && 'novelty_assessment' in serverQC
      
      if (!hasRawFormat && serverQC && 'novelty_signal' in serverQC) {
        // Already in normalized format, return as-is
        console.log('[v0] QC data is already normalized')
        return {
          qcReport: serverQC as unknown as LiteratureQCResponse,
          experimentPlan: serverPlan,
        }
      }

      // Normalize confidence score to 0-1 scale
      const normalizedConfidence = serverQC?.confidence?.scale === '0-100' 
        ? serverQC.confidence.score / 100 
        : serverQC?.confidence?.score

      // Transform QC response to match UI expected format
      const normalizedQC: LiteratureQCResponse = {
        novelty_signal: serverQC?.novelty_assessment ? mapNoveltyAssessment(serverQC.novelty_assessment) : {
          level: 'moderate',
          label: 'Unknown',
          description: 'Unable to assess novelty',
          percentage: 50,
        },
        summary: serverQC?.summary || 'No summary available',
        references: (serverQC?.references || []).map((ref) => ({
          id: ref.id,
          title: ref.title,
          authors: Array.isArray(ref.authors) ? ref.authors.join(', ') : ref.authors || '',
          journal: ref.journal || 'Unknown Journal',
          year: ref.year,
          url: ref.url || (ref.doi ? `https://doi.org/${ref.doi}` : '#'),
          quality: ref.quality,
          study_type: ref.study_type,
        })),
        entity: serverQC?.entity ? {
          name: serverQC.entity.name,
          type: serverQC.entity.type,
          target: serverQC.entity.target,
          description: serverQC.entity.description,
          identifiers: serverQC.entity.identifiers,
        } : {
          name: 'Unknown',
          type: 'unknown',
          target: '',
          description: '',
          identifiers: {},
        },
        confidence: normalizedConfidence,
        confidenceType: serverQC?.confidence?.type,
        key_claims: serverQC?.key_claims || [],
        knowledge_gaps: serverQC?.knowledge_gaps || [],
        evidence_links: serverQC?.evidence_links || [],
        metrics: serverQC?.metrics,
        risk_flags: serverQC?.risk_flags || [],
        metadata: serverQC?.metadata ? {
          generated_at: serverQC.metadata.generated_at,
          method: serverQC.metadata.method,
          pipeline_version: serverQC.metadata.pipeline_version,
          schema_version: serverQC.metadata.schema_version,
        } : undefined,
      }

      return {
        qcReport: normalizedQC,
        experimentPlan: serverPlan,
      }
    } catch (normalizationError) {
      console.error('[v0] Error normalizing QC data:', normalizationError)
      console.log('[v0] Raw serverQC:', JSON.stringify(serverQC, null, 2))
      throw new APIError(`Failed to process experiment data: ${(normalizationError as Error).message}`)
    }
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new APIError('Request timed out. The server may be under heavy load. Please try again.')
    }
    if (error instanceof TypeError) {
      throw new APIError('Unable to connect to the server. Please check your network connection.')
    }
    throw new APIError(`Unexpected error: ${(error as Error).message}`)
  }
}

export async function fetchExperimentPlan(): Promise<ServerExperimentPlan> {
  try {
    const response = await fetch(`${API_BASE_URL}/generate-full-experiment`, {
      method: 'GET',
      headers: createHeaders(),
    })

    if (!response.ok) {
      throw new APIError(
        `Failed to fetch experiment plan`,
        response.status,
        response.statusText
      )
    }

    const data: ServerExperimentPlan = await response.json()
    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof TypeError) {
      throw new APIError('Unable to connect to the server. Please ensure the API is running.')
    }
    throw new APIError(`Unexpected error: ${(error as Error).message}`)
  }
}

// Fetch literature QC results with hypothesis query parameter
export async function fetchLiteratureQC(hypothesis: string): Promise<LiteratureQCResponse> {
  try {
    const encodedHypothesis = encodeURIComponent(hypothesis)
    const response = await fetch(`${API_BASE_URL}/mock-qc?hypothesis=${encodedHypothesis}`, {
      method: 'GET',
      headers: createHeaders(),
    })

    if (!response.ok) {
      throw new APIError(
        `Failed to fetch literature QC`,
        response.status,
        response.statusText
      )
    }

    const serverData: ServerLiteratureQCResponse = await response.json()
    
    // Normalize confidence score to 0-1 scale
    const normalizedConfidence = serverData.confidence?.scale === '0-100' 
      ? serverData.confidence.score / 100 
      : serverData.confidence?.score

    // Transform server response to match UI expected format
    const normalizedData: LiteratureQCResponse = {
      novelty_signal: mapNoveltyAssessment(serverData.novelty_assessment),
      summary: serverData.summary,
      references: serverData.references.map((ref) => ({
        id: ref.id,
        title: ref.title,
        authors: ref.authors.join(', '),
        journal: ref.journal || 'Unknown Journal',
        year: ref.year,
        url: ref.url || (ref.doi ? `https://doi.org/${ref.doi}` : '#'),
        quality: ref.quality,
        study_type: ref.study_type,
      })),
      entity: {
        name: serverData.entity.name,
        type: serverData.entity.type,
        target: serverData.entity.target,
        description: serverData.entity.description,
        identifiers: serverData.entity.identifiers,
      },
      confidence: normalizedConfidence,
      confidenceType: serverData.confidence?.type,
      key_claims: serverData.key_claims,
      knowledge_gaps: serverData.knowledge_gaps,
      evidence_links: serverData.evidence_links,
      metrics: serverData.metrics,
      risk_flags: serverData.risk_flags,
      metadata: serverData.metadata ? {
        generated_at: serverData.metadata.generated_at,
        method: serverData.metadata.method,
        pipeline_version: serverData.metadata.pipeline_version,
        schema_version: serverData.metadata.schema_version,
      } : undefined,
    }
    
    return normalizedData
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof TypeError) {
      throw new APIError('Unable to connect to the server. Please ensure the API is running.')
    }
    throw new APIError(`Unexpected error: ${(error as Error).message}`)
  }
}

// Fetch literature QC analysis results with hypothesis query parameter
// This endpoint provides detailed literature analysis with evidence classification
export async function fetchLiteratureAnalysis(hypothesis: string): Promise<LiteratureQCResponse> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 60000) // 60 second timeout

  try {
    const encodedHypothesis = encodeURIComponent(hypothesis)
    const response = await fetch(`${API_BASE_URL}/mock-qc?hypothesis=${encodedHypothesis}`, {
      method: 'GET',
      headers: createHeaders(),
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      const errorMessage = response.status === 404 
        ? 'Literature analysis endpoint not found. The server may not support this feature yet.'
        : response.status === 500
        ? 'Server error during analysis. Please try again in a moment.'
        : response.status === 503
        ? 'Analysis service is temporarily unavailable. Please try again later.'
        : `Analysis failed (${response.status}: ${response.statusText})`
      
      throw new APIError(errorMessage, response.status, response.statusText)
    }

    const serverData: ServerLiteratureQCResponse = await response.json()
    
    // Normalize confidence score to 0-1 scale
    const normalizedConfidence = serverData.confidence?.scale === '0-100' 
      ? serverData.confidence.score / 100 
      : serverData.confidence?.score

    // Transform server response to match UI expected format
    const normalizedData: LiteratureQCResponse = {
      novelty_signal: mapNoveltyAssessment(serverData.novelty_assessment),
      summary: serverData.summary,
      references: serverData.references.map((ref) => ({
        id: ref.id,
        title: ref.title,
        authors: ref.authors.join(', '),
        journal: ref.journal || 'Unknown Journal',
        year: ref.year,
        url: ref.url || (ref.doi ? `https://doi.org/${ref.doi}` : '#'),
        quality: ref.quality,
        study_type: ref.study_type,
      })),
      entity: {
        name: serverData.entity.name,
        type: serverData.entity.type,
        target: serverData.entity.target,
        description: serverData.entity.description,
        identifiers: serverData.entity.identifiers,
      },
      confidence: normalizedConfidence,
      confidenceType: serverData.confidence?.type,
      key_claims: serverData.key_claims,
      knowledge_gaps: serverData.knowledge_gaps,
      evidence_links: serverData.evidence_links,
      metrics: serverData.metrics,
      risk_flags: serverData.risk_flags,
      metadata: serverData.metadata ? {
        generated_at: serverData.metadata.generated_at,
        method: serverData.metadata.method,
        pipeline_version: serverData.metadata.pipeline_version,
        schema_version: serverData.metadata.schema_version,
      } : undefined,
    }
    
    return normalizedData
  } catch (error) {
    clearTimeout(timeoutId)
    
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new APIError('Analysis request timed out. The server may be under heavy load. Please try again.')
    }
    if (error instanceof TypeError) {
      throw new APIError('Unable to connect to the analysis server. Please check your network connection and try again.')
    }
    throw new APIError(`Unexpected error during analysis: ${(error as Error).message}`)
  }
}

// Feedback submission interface - matches feedback_memory table schema
export interface FeedbackPayload {
  // Core classification
  category: 'protocol' | 'materials' | 'budget' | 'timeline' | 'validation' | 'general'
  feedback_type: 'correction' | 'suggestion' | 'question' | 'praise' | 'issue'
  
  // Main content
  content: string
  
  // Frequently queried context (top-level for efficient queries)
  hypothesis_context: string  // Original hypothesis from step 1
  entity?: string             // e.g. "protocol", "step", "compound"
  reference_id?: string       // e.g. "step_3", "claim_1"
  
  // Flexible extensions
  context?: {
    experiment_id?: string
    section?: string
    field?: string
    original_value?: string
  }
  metadata?: {
    timestamp: string
    user_agent?: string
  }
  
  // Optional scoring
  priority?: 'low' | 'medium' | 'high'
  confidence?: 'low' | 'medium' | 'high'
}

export interface FeedbackResponse {
  status: 'success' | 'error'
  message?: string
  detail?: string
}

// Submit feedback to the server
export async function submitFeedback(payload: FeedbackPayload): Promise<FeedbackResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}/feedback`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const errorMessage = response.status === 400
        ? 'Invalid feedback data. Please check all required fields.'
        : response.status === 429
        ? 'Too many submissions. Please wait a moment before submitting again.'
        : response.status === 500
        ? 'Server error while processing feedback. Please try again.'
        : `Failed to submit feedback (${response.status})`
      
      throw new APIError(errorMessage, response.status, response.statusText)
    }

    const data: FeedbackResponse = await response.json()
    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }
    if (error instanceof TypeError) {
      throw new APIError('Unable to connect to the server. Please check your connection and try again.')
    }
    throw new APIError(`Failed to submit feedback: ${(error as Error).message}`)
  }
}

// Health check function
export async function checkAPIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${API_BASE_URL}/mock-plan`, {
      method: 'GET',
      headers: createHeaders(),
    })
    return response.ok
  } catch {
    return false
  }
}
