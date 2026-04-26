from typing import List
from datetime import datetime
from backend.models import LiteratureReference
from backend.utils import clamp
from backend.search_clients import BaseSearchClient
from backend.llm_agents import BaseQCAgent

class LiteratureQCPipeline:
    def __init__(self, search_client: BaseSearchClient, agent: BaseQCAgent):
        self.search_client = search_client
        self.agent = agent

    def deduplicate_papers(self, papers: List[LiteratureReference]) -> List[LiteratureReference]:
        seen = set()
        unique = []
        for paper in papers:
            key = (paper.title or "").lower().strip()
            if key and key not in seen:
                seen.add(key)
                unique.append(paper)
        return unique

    def run(self, hypothesis: str):
        # 1. Extract Entities
        entity = self.agent.extract_entity(hypothesis)

        # 2. Build Queries & Retrieve Papers
        queries = self.agent.build_search_queries(hypothesis)
        all_papers = []
        used_queries = []

        for query in queries:
            if not query: 
                continue
            papers = self.search_client.search(query, limit=10)
            if papers:
                used_queries.append(query)
                all_papers.extend(papers)

        all_papers = self.deduplicate_papers(all_papers)[:12]

        if not all_papers:
            return {"error": "No papers found"}

        # 3. Select Relevant Papers
        selected_papers = self.agent.select_relevant_papers(hypothesis, all_papers)

        # 4. Final QC Analysis
        papers_text = "\n\n".join(
            f"Paper index: {i}\nTitle: {p.title}\nYear: {p.year}\nURL: {p.url}\nAbstract: {p.abstract or ''}"
            for i, p in enumerate(selected_papers)
        )
        
        data = self.agent.analyze_hypothesis(hypothesis, papers_text)

        # 5. EXACT ORIGINAL PARSING LOGIC
        confidence = clamp(data.get("confidence", 0.1), 0.0, 1.0, 0.1)

        reference_assessments = {
            item.get("paper_index"): item
            for item in data.get("reference_assessments", [])
        }

        references = []
        for i, p in enumerate(selected_papers):
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
                if isinstance(idx, int) and 0 <= idx < len(selected_papers)
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

        # EXACT ORIGINAL FINAL OUTPUT STRUCTURE
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
                "method": f"{self.search_client.__class__.__name__} multi-query retrieval + {self.agent.__class__.__name__} relevance selection + {self.agent.__class__.__name__} literature QC",
                "source_query": " | ".join(used_queries),
                "pipeline_version": "v3",
                "schema_version": "v3"
            }
        }

        return final_output