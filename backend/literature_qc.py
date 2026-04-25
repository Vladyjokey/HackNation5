import requests
import json
import re
from typing import List
from datetime import datetime
from dotenv import load_dotenv
from openai import OpenAI

from backend.models import LiteratureReference

load_dotenv()
client = OpenAI()

EUROPE_PMC_URL = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"
MODEL_NAME = "gpt-5.5"


def parse_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError(f"Could not parse JSON from model output:\n{text}")
        return json.loads(match.group())


def clean_query(query: str) -> str:
    return query.strip().replace('"', "").replace("'", "")


def clamp(value, minimum, maximum, default):
    try:
        value = float(value)
    except Exception:
        value = default
    return max(minimum, min(maximum, value))


def deduplicate_papers(papers: List[LiteratureReference]) -> List[LiteratureReference]:
    seen = set()
    unique = []

    for paper in papers:
        key = (paper.title or "").lower().strip()
        if key and key not in seen:
            seen.add(key)
            unique.append(paper)

    return unique


def extract_entity(hypothesis: str):
    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
Extract structured scientific entity information.

Return STRICT JSON:
{{
  "name": "...",
  "type": "scientific_hypothesis",
  "target": "...",
  "description": "...",
  "identifiers": {{
    "cas_number": null,
    "pubchem_cid": null,
    "other_ids": []
  }}
}}

Rules:
- target = organism, cell line, biological system, material, or measured target
- description = measured outcome or expected effect
- do not return null unless impossible
- keep values short and precise

Hypothesis:
{hypothesis}
"""
    )
    return parse_json(response.output_text)


def build_search_queries(hypothesis: str):
    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
Create literature search queries for Europe PMC.

Return STRICT JSON:
{{
  "exact_query": "...",
  "broad_query": "...",
  "concept_query": "..."
}}

Rules:
- exact_query: 4–8 keywords, includes intervention, system, outcome
- broad_query: 3–5 broader biomedical keywords
- concept_query: 2–4 core concept keywords
- no quotes
- no full sentences

Hypothesis:
{hypothesis}
"""
    )

    data = parse_json(response.output_text)

    return [
        clean_query(data.get("exact_query", "")),
        clean_query(data.get("broad_query", "")),
        clean_query(data.get("concept_query", "")),
    ]


def search_europe_pmc(query: str, limit: int = 10) -> List[LiteratureReference]:
    params = {
        "query": query,
        "format": "json",
        "pageSize": limit,
        "resultType": "core",
    }

    response = requests.get(EUROPE_PMC_URL, params=params, timeout=15)

    if response.status_code != 200:
        return []

    results = response.json().get("resultList", {}).get("result", [])
    papers = []

    for paper in results:
        year = None
        if paper.get("pubYear"):
            try:
                year = int(paper["pubYear"])
            except Exception:
                pass

        url = None
        if paper.get("doi"):
            url = f"https://doi.org/{paper['doi']}"
        elif paper.get("pmid"):
            url = f"https://pubmed.ncbi.nlm.nih.gov/{paper['pmid']}/"

        papers.append(
            LiteratureReference(
                title=paper.get("title", "Untitled"),
                year=year,
                url=url,
                abstract=paper.get("abstractText"),
            )
        )

    return papers


def retrieve_papers(hypothesis: str):
    queries = build_search_queries(hypothesis)

    all_papers = []
    used_queries = []

    for query in queries:
        if not query:
            continue

        papers = search_europe_pmc(query, limit=10)
        if papers:
            used_queries.append(query)
            all_papers.extend(papers)

    all_papers = deduplicate_papers(all_papers)

    return all_papers[:12], used_queries


def select_relevant_papers(hypothesis: str, papers: List[LiteratureReference]):
    papers_text = "\n\n".join(
        f"Paper index: {i}\nTitle: {p.title}\nYear: {p.year}\nAbstract: {p.abstract or ''}"
        for i, p in enumerate(papers)
    )

    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
You are selecting papers for a literature QC system.

Return STRICT JSON:
{{
  "selected_indices": [0, 1, 2],
  "reasoning": "..."
}}

Rules:
- Select up to 6 most relevant papers.
- Prefer papers that directly mention the intervention, system, outcome, or method.
- Include broad review papers only if no direct experimental papers exist.
- Do not select irrelevant papers.
- selected_indices must use paper indices only.

Hypothesis:
{hypothesis}

Candidate papers:
{papers_text}
"""
    )

    data = parse_json(response.output_text)
    selected = []

    for idx in data.get("selected_indices", []):
        if isinstance(idx, int) and 0 <= idx < len(papers):
            selected.append(papers[idx])

    return selected if selected else papers[:6]


def run_literature_qc(hypothesis: str):
    entity = extract_entity(hypothesis)

    papers, used_queries = retrieve_papers(hypothesis)

    if not papers:
        return {"error": "No papers found"}

    papers = select_relevant_papers(hypothesis, papers)

    papers_text = "\n\n".join(
        f"Paper index: {i}\nTitle: {p.title}\nYear: {p.year}\nURL: {p.url}\nAbstract: {p.abstract or ''}"
        for i, p in enumerate(papers)
    )

    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
You are a scientific literature QC agent.

Analyze the hypothesis using ONLY the provided papers.

Return STRICT JSON:
{{
  "novelty_assessment": "novel | incremental | well_studied | unclear",
  "confidence": 0.0,
  "summary": "...",
  "claims": [
    {{
      "type": "background | evidence | gap | conclusion",
      "text": "...",
      "supporting_refs": [0],
      "relationships": ["supports"]
    }}
  ],
  "knowledge_gaps": ["..."],
  "reference_assessments": [
    {{
      "paper_index": 0,
      "quality": "high | medium | low",
      "study_type": "experimental | review | clinical | computational | unknown",
      "journal": null,
      "doi": null
    }}
  ],
  "metrics": {{
    "num_supporting_claims": 0,
    "num_contradicting_claims": 0,
    "evidence_coverage_score": 0.0
  }},
  "risk_flags": [
    "low_novelty | limited_evidence | conflicting_results | high_uncertainty"
  ]
}}

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
{papers_text}
"""
    )

    data = parse_json(response.output_text)

    confidence = clamp(data.get("confidence", 0.1), 0.0, 1.0, 0.1)

    reference_assessments = {
        item.get("paper_index"): item
        for item in data.get("reference_assessments", [])
    }

    references = []
    for i, p in enumerate(papers):
        assessment = reference_assessments.get(i, {})

        references.append({
            "id": f"ref_{i}",
            "title": p.title,
            "authors": [],
            "year": p.year,
            "journal": assessment.get("journal"),
            "doi": assessment.get("doi"),
            "url": p.url,
            "quality": assessment.get("quality", "unknown"),
            "study_type": assessment.get("study_type", "unknown")
        })

    claims = []
    evidence_links = []

    for i, claim in enumerate(data.get("claims", [])):
        claim_id = f"claim_{i}"
        supporting_refs = claim.get("supporting_refs", [])
        relationships = claim.get("relationships", [])

        valid_refs = [
            idx for idx in supporting_refs
            if isinstance(idx, int) and 0 <= idx < len(papers)
        ]

        claims.append({
            "id": claim_id,
            "type": claim.get("type", "evidence"),
            "text": claim.get("text", ""),
            "supporting_references": [f"ref_{idx}" for idx in valid_refs]
        })

        for position, idx in enumerate(valid_refs):
            relationship = relationships[position] if position < len(relationships) else "supports"
            if relationship not in ["supports", "contradicts", "partial"]:
                relationship = "supports"

            evidence_links.append({
                "claim_id": claim_id,
                "reference_id": f"ref_{idx}",
                "relationship": relationship
            })

    metrics = data.get("metrics", {})
    evidence_coverage = clamp(metrics.get("evidence_coverage_score", 0.0), 0.0, 1.0, 0.0)

    risk_flags = data.get("risk_flags", [])
    allowed_flags = {"low_novelty", "limited_evidence", "conflicting_results", "high_uncertainty"}
    risk_flags = [flag for flag in risk_flags if flag in allowed_flags]

    final_output = {
        "entity": entity,

        "novelty_assessment": data.get("novelty_assessment", "unclear"),

        "confidence": {
            "score": confidence,
            "type": "model_confidence",
            "scale": "0-1"
        },

        "summary": data.get("summary", ""),

        "key_claims": claims,

        "knowledge_gaps": data.get("knowledge_gaps", []),

        "references": references,

        "evidence_links": evidence_links,

        "metrics": {
            "num_references": len(references),
            "num_supporting_claims": int(metrics.get("num_supporting_claims", 0)),
            "num_contradicting_claims": int(metrics.get("num_contradicting_claims", 0)),
            "evidence_coverage_score": evidence_coverage
        },

        "risk_flags": risk_flags,

        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "method": "EuropePMC multi-query retrieval + GPT-5.5 relevance selection + GPT-5.5 literature QC",
            "source_query": " | ".join(used_queries),
            "pipeline_version": "v3",
            "schema_version": "v3"
        }
    }

    return final_output


if __name__ == "__main__":
    result = run_literature_qc(
        "DMSO is used as a cryoprotectant for mammalian cell cryopreservation"
    )
    print(json.dumps(result, indent=2))