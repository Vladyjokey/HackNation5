import json
import re

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