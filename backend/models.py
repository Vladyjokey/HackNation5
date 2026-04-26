from typing import Optional
from pydantic import BaseModel


class LiteratureReference(BaseModel):
    """
    Represents a single scientific paper retrieved from Europe PMC.
    Used internally for consistent handling of literature data.
    """
    title: str
    year: Optional[int] = None
    url: Optional[str] = None
    abstract: Optional[str] = None