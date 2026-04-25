import requests
from abc import ABC, abstractmethod
from typing import List
from backend.models import LiteratureReference

class BaseSearchClient(ABC):
    @abstractmethod
    def search(self, query: str, limit: int = 10) -> List[LiteratureReference]:
        """Returns a list of LiteratureReferences for a given query."""
        pass

class EuropePMCClient(BaseSearchClient):
    def __init__(self):
        self.url = "https://www.ebi.ac.uk/europepmc/webservices/rest/search"

    def search(self, query: str, limit: int = 10) -> List[LiteratureReference]:
        params = {
            "query": query,
            "format": "json",
            "pageSize": limit,
            "resultType": "core",
        }
        response = requests.get(self.url, params=params, timeout=15)
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