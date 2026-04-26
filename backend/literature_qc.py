import sys
import os
from dotenv import load_dotenv

# Add project root to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.search_clients import EuropePMCClient
from backend.llm_agents import OpenAIQCAgent
from backend.pipeline import LiteratureQCPipeline

load_dotenv()

search_client = EuropePMCClient()
qc_agent = OpenAIQCAgent()

def quality_control_check(hypothesis: str) -> dict:
    pipeline = LiteratureQCPipeline(
        search_client=search_client,
        agent=qc_agent
    )
    return pipeline.run(hypothesis)