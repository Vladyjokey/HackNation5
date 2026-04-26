import json
import re
import html

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

def clean_display_text(value):
    if not isinstance(value, str):
        return value

    value = html.unescape(value)

    value = re.sub(r"<sub>(.*?)</sub>", r"\1", value)
    value = re.sub(r"<sup>(.*?)</sup>", r"\1", value)
    value = re.sub(r"<i>(.*?)</i>", r"\1", value)
    value = re.sub(r"<[^>]+>", "", value)

    return value.strip()


def clean_qc_report(qc_report: dict) -> dict:
    for ref in qc_report.get("references", []):
        ref["title"] = clean_display_text(ref.get("title", ""))
        ref["journal"] = clean_display_text(ref.get("journal", ""))

    for claim in qc_report.get("key_claims", []):
        claim["text"] = clean_display_text(claim.get("text", ""))

    qc_report["summary"] = clean_display_text(qc_report.get("summary", ""))

    return qc_report