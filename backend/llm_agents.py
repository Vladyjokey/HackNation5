from abc import ABC, abstractmethod
from typing import List, Optional

from pydantic import BaseModel, Field
from openai import OpenAI

from backend.models import LiteratureReference
from backend.utils import clean_query


# ==========================================
# 0. MODEL CHOICE
# ==========================================

FAST_MODEL = "gpt-4o-mini"
STRONG_MODEL = "gpt-4o"

# Lightweight QC tasks
QC_ENTITY_MODEL = FAST_MODEL
QC_QUERY_MODEL = FAST_MODEL
QC_PAPER_SELECTION_MODEL = FAST_MODEL

# Deeper reasoning tasks
QC_ANALYSIS_MODEL = STRONG_MODEL
SCIENTIST_MODEL = STRONG_MODEL

# Usually okay with cheaper/faster model
OPERATIONS_MODEL = FAST_MODEL
VALIDATION_MODEL = FAST_MODEL


# ==========================================
# 1. PYDANTIC SCHEMAS FOR STRUCTURED OUTPUT
# ==========================================

class IdentifiersModel(BaseModel):
    cas_number: Optional[str] = None
    pubchem_cid: Optional[str] = None
    other_ids: List[str] = Field(default_factory=list)


class EntityModel(BaseModel):
    name: str
    type: str
    target: str
    description: str
    identifiers: IdentifiersModel


class SearchQueriesModel(BaseModel):
    exact_query: str
    broad_query: str
    concept_query: str


class PaperSelectionModel(BaseModel):
    selected_indices: List[int]
    reasoning: str


class ClaimModel(BaseModel):
    type: str  # background | evidence | gap | conclusion
    text: str
    supporting_refs: List[int]
    relationships: List[str]  # supports | contradicts | partial


class ReferenceAssessmentModel(BaseModel):
    paper_index: int
    quality: str  # high | medium | low
    study_type: str  # experimental | review | clinical | computational | unknown
    journal: Optional[str] = None
    doi: Optional[str] = None


class MetricsModel(BaseModel):
    num_supporting_claims: int
    num_contradicting_claims: int
    evidence_coverage_score: float


class QCAnalysisModel(BaseModel):
    novelty_assessment: str  # novel | incremental | well_studied | unclear
    confidence: float
    summary: str
    claims: List[ClaimModel]
    knowledge_gaps: List[str]
    reference_assessments: List[ReferenceAssessmentModel]
    metrics: MetricsModel
    risk_flags: List[str]  # low_novelty | limited_evidence | conflicting_results | high_uncertainty


# ==========================================
# 2. LLM AGENTS
# ==========================================

class BaseQCAgent(ABC):
    @abstractmethod
    def extract_entity(self, hypothesis: str) -> dict:
        pass

    @abstractmethod
    def build_search_queries(self, hypothesis: str) -> List[str]:
        pass

    @abstractmethod
    def select_relevant_papers(
        self,
        hypothesis: str,
        papers: List[LiteratureReference]
    ) -> List[LiteratureReference]:
        pass

    @abstractmethod
    def analyze_hypothesis(self, hypothesis: str, papers_text: str) -> dict:
        pass


class OpenAIQCAgent(BaseQCAgent):
    def __init__(
        self,
        entity_model: str = QC_ENTITY_MODEL,
        query_model: str = QC_QUERY_MODEL,
        paper_selection_model: str = QC_PAPER_SELECTION_MODEL,
        analysis_model: str = QC_ANALYSIS_MODEL,
    ):
        self.client = OpenAI()
        self.entity_model = entity_model
        self.query_model = query_model
        self.paper_selection_model = paper_selection_model
        self.analysis_model = analysis_model

    def extract_entity(self, hypothesis: str) -> dict:
        response = self.client.responses.parse(
            model=self.entity_model,
            text_format=EntityModel,
            input=f"""Extract structured scientific entity information.

Rules:
- target = organism, cell line, biological system, material, or measured target
- description = measured outcome or expected effect
- keep values short and precise

Hypothesis:
{hypothesis}"""
        )

        return response.output_parsed.model_dump()

    def build_search_queries(self, hypothesis: str) -> List[str]:
        response = self.client.responses.parse(
            model=self.query_model,
            text_format=SearchQueriesModel,
            input=f"""Create literature search queries for Europe PMC.

Rules:
- exact_query: 4–8 keywords, includes intervention, system, outcome
- broad_query: 3–5 broader biomedical keywords
- concept_query: 2–4 core concept keywords
- no quotes, no full sentences

Hypothesis:
{hypothesis}"""
        )

        data = response.output_parsed

        return [
            clean_query(data.exact_query),
            clean_query(data.broad_query),
            clean_query(data.concept_query),
        ]

    def select_relevant_papers(
        self,
        hypothesis: str,
        papers: List[LiteratureReference]
    ) -> List[LiteratureReference]:
        papers_text = "\n\n".join(
            f"Paper index: {i}\nTitle: {p.title}\nYear: {p.year}\nAbstract: {p.abstract or ''}"
            for i, p in enumerate(papers)
        )

        response = self.client.responses.parse(
            model=self.paper_selection_model,
            text_format=PaperSelectionModel,
            input=f"""You are selecting papers for a literature QC system.

Rules:
- Select up to 6 most relevant papers.
- Prefer papers that directly mention the intervention, system, outcome, or method.
- selected_indices must use paper indices only.

Hypothesis:
{hypothesis}

Candidate papers:
{papers_text}"""
        )

        data = response.output_parsed.model_dump()

        selected = []
        for idx in data.get("selected_indices", []):
            if isinstance(idx, int) and 0 <= idx < len(papers):
                selected.append(papers[idx])

        return selected if selected else papers[:6]

    def analyze_hypothesis(self, hypothesis: str, papers_text: str) -> dict:
        response = self.client.responses.parse(
            model=self.analysis_model,
            text_format=QCAnalysisModel,
            input=f"""You are a scientific literature QC agent. Analyze the hypothesis using ONLY the provided papers.

Novelty rules:
- well_studied: the core scientific relationship is well established in the provided papers, even if not every detail matches.
- incremental: related work exists, but the exact setup, system, comparison, or outcome differs.
- novel: little to no directly related prior work appears in the provided papers.
- unclear: retrieved evidence is too weak, mixed, or indirect to judge.

Evidence rules:
- confidence must be a number from 0 to 1
- evidence_coverage_score must be a number from 0 to 1
- supporting_refs must use paper indices only
- relationships must match supporting_refs by position
- use "partial" when evidence is related but not direct
- use "contradicts" only if a paper clearly opposes the hypothesis
- do not invent papers or facts
- if papers are only broad reviews, do not overclaim well_studied

Hypothesis:
{hypothesis}

Papers:
{papers_text}"""
        )

        return response.output_parsed.model_dump()