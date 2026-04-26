import json
import os
import re
import sys
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

client = OpenAI()
MODEL_NAME = "gpt-5.5"


def parse_json(text: str):
    try:
        return json.loads(text)
    except Exception:
        match = re.search(r"\{.*\}", text, re.DOTALL)
        if not match:
            raise ValueError(f"Failed to parse JSON:\n{text}")
        return json.loads(match.group())


def clamp_number(value, minimum, maximum, default):
    try:
        value = float(value)
    except Exception:
        value = default

    return max(minimum, min(maximum, value))


def generate_scientific_plan(hypothesis: str, qc_result: dict):
    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
You are a senior experimental scientist.

Design a scientifically valid experiment.

Use the QC results to guide decisions:
- Avoid unsupported assumptions
- Address knowledge gaps explicitly
- Keep the protocol safe, practical, and planning-level
- Do not include unsafe biological optimization or pathogen work

Return STRICT JSON:
{{
  "experiment_metadata": {{
    "title": "...",
    "objective": "...",
    "biosafety_level": "BSL-1 | BSL-2 | BSL-3 | BSL-4 | other"
  }},
  "scientific_rationale": {{
    "background": "...",
    "hypothesis": "...",
    "primary_endpoint": "...",
    "secondary_endpoints": ["..."],
    "success_criteria": "..."
  }},
  "experimental_design": {{
    "study_type": "in vitro | in vivo | ex vivo | computational | other",
    "model_system": "...",
    "group_definitions": [
      {{
        "group_name": "...",
        "description": "...",
        "sample_size": 0
      }}
    ],
    "randomization": "...",
    "blinding": "none | single | double",
    "replicates": {{
      "biological": 0,
      "technical": 0
    }}
  }},
  "controls": {{
    "positive_controls": ["..."],
    "negative_controls": ["..."],
    "internal_controls": ["..."],
    "calibration_procedures": ["..."]
  }},
  "protocol": [
    {{
      "phase": "...",
      "dependencies": ["..."],
      "qc_checks": ["..."],
      "steps": [
        {{
          "step_id": 1,
          "instruction": "...",
          "duration_mins": 0,
          "equipment": ["..."],
          "consumables": ["..."],
          "temp_celsius": null,
          "expected_output": "...",
          "failure_modes": ["..."],
          "troubleshooting": ["..."]
        }}
      ]
    }}
  ],
  "data_plan": {{
    "data_collection_methods": ["..."],
    "data_format": "...",
    "analysis_pipeline": ["..."],
    "statistical_tests": ["..."],
    "power_analysis": {{
      "effect_size": "...",
      "power": 0.8,
      "alpha": 0.05
    }}
  }},
  "compliance": {{
    "biosafety": "...",
    "ethical_approval_required": false,
    "regulatory_bodies": ["..."],
    "waste_disposal": ["..."]
  }},
  "quality_assurance": {{
    "positive_control_expected_range": "...",
    "negative_control_threshold": "...",
    "plate_map_layout": "..."
  }},
  "data_management": {{
    "eln_target_folder": "...",
    "raw_data_storage": "...",
    "audit_trail_enabled": true
  }}
}}

Rules:
- Be realistic and scientifically correct
- Sample sizes must be reasonable, usually >=3
- Protocol must be step-by-step but not unsafe
- Align design with QC evidence and gaps
- If evidence is weak, design as a pilot study
- Return only JSON

Hypothesis:
{hypothesis}

QC Results:
{json.dumps(qc_result, indent=2)}
"""
    )

    return parse_json(response.output_text)


def generate_operations_plan(scientific_plan: dict):
    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
You are a lab operations manager.

Your job is to turn the scientific plan into an operationally realistic execution plan.

Return STRICT JSON:
{{
  "logistics": {{
    "reagents": [
      {{
        "name": "...",
        "vendor_hint": "...",
        "catalog_no": "...",
        "quantity": "...",
        "unit_price": 0,
        "is_in_stock_simulated": true
      }}
    ],
    "equipment_availability": [
      {{
        "equipment": "...",
        "is_available": true,
        "booking_required": false
      }}
    ],
    "lead_time_days": 0,
    "alternate_suppliers": ["..."]
  }},
  "execution_plan": {{
    "timeline": [
      {{
        "day": 1,
        "tasks": ["..."]
      }}
    ],
    "milestones": ["..."],
    "go_no_go_points": ["..."]
  }},
  "operational_readiness": {{
    "staff_skills": ["..."],
    "critical_warnings": ["..."],
    "expected_bottlenecks": ["..."]
  }},
  "risk_management": {{
    "critical_warnings": ["..."],
    "expected_bottlenecks": ["..."],
    "contingency_plans": ["..."]
  }},
  "reporting": {{
    "deliverables": ["..."],
    "report_format": "...",
    "reproducibility_notes": ["..."]
  }},
  "drug_candidate_specs": {{
    "molecular_weight": null,
    "solubility_profile": "...",
    "storage_conditions": "...",
    "purity_requirement": "..."
  }},
  "labor_estimate": {{
    "hours": 0,
    "hourly_rate": 0
  }},
  "equipment_cost_estimate": 0
}}

Rules:
- Do NOT calculate total_budget.
- Only provide line-item unit prices.
- Python will calculate budget totals.
- Use realistic approximate prices.
- If catalog number is uncertain, use "TBD".
- Return only JSON.

Scientific Plan:
{json.dumps(scientific_plan, indent=2)}
"""
    )

    return parse_json(response.output_text)


def calculate_budget(operations_plan: dict):
    logistics = operations_plan.get("logistics", {})
    reagents = logistics.get("reagents", [])

    reagent_total = 0.0
    for reagent in reagents:
        price = clamp_number(reagent.get("unit_price", 0), 0, 100000, 0)
        reagent["unit_price"] = price
        reagent_total += price

    labor = operations_plan.get("labor_estimate", {})
    labor_hours = clamp_number(labor.get("hours", 0), 0, 10000, 0)
    hourly_rate = clamp_number(labor.get("hourly_rate", 0), 0, 10000, 0)
    labor_total = labor_hours * hourly_rate

    equipment_total = clamp_number(
        operations_plan.get("equipment_cost_estimate", 0),
        0,
        100000,
        0
    )

    total_budget = reagent_total + labor_total + equipment_total

    logistics["budget_breakdown"] = {
        "reagents": round(reagent_total, 2),
        "labor": round(labor_total, 2),
        "equipment": round(equipment_total, 2)
    }

    logistics["total_budget"] = round(total_budget, 2)

    operations_plan["logistics"] = logistics

    return operations_plan


def merge_full_experiment_plan(scientific_plan: dict, operations_plan: dict):
    logistics = operations_plan.get("logistics", {})

    return {
        "experiment_metadata": scientific_plan.get("experiment_metadata", {}),
        "scientific_rationale": scientific_plan.get("scientific_rationale", {}),
        "experimental_design": scientific_plan.get("experimental_design", {}),
        "controls": scientific_plan.get("controls", {}),
        "protocol": scientific_plan.get("protocol", []),
        "data_plan": scientific_plan.get("data_plan", {}),
        "compliance": scientific_plan.get("compliance", {}),

        "logistics": {
            "reagents": logistics.get("reagents", []),
            "equipment_availability": logistics.get("equipment_availability", []),
            "total_budget": logistics.get("total_budget", 0),
            "budget_breakdown": logistics.get("budget_breakdown", {
                "reagents": 0,
                "labor": 0,
                "equipment": 0
            }),
            "lead_time_days": logistics.get("lead_time_days", 0),
            "alternate_suppliers": logistics.get("alternate_suppliers", [])
        },

        "execution_plan": operations_plan.get("execution_plan", {}),
        "operational_readiness": operations_plan.get("operational_readiness", {}),
        "risk_management": operations_plan.get("risk_management", {}),
        "reporting": operations_plan.get("reporting", {}),

        "drug_candidate_specs": operations_plan.get("drug_candidate_specs", {}),

        "quality_assurance": scientific_plan.get("quality_assurance", {}),
        "data_management": scientific_plan.get("data_management", {}),

        "metadata": {
            "generated_at": datetime.utcnow().isoformat(),
            "method": "Two-stage GPT-5.5 experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation",
            "pipeline_version": "v1",
            "schema_version": "experiment_plan_v1"
        }
    }


def generate_experiment_plan(hypothesis: str, qc_result: dict):
    scientific_plan = generate_scientific_plan(hypothesis, qc_result)
    operations_plan = generate_operations_plan(scientific_plan)
    operations_plan = calculate_budget(operations_plan)

    return merge_full_experiment_plan(scientific_plan, operations_plan)


if __name__ == "__main__":
    from backend.literature_qc import quality_control_check

    hypothesis = "Trehalose improves post-thaw viability of HeLa cells"
    qc_result = quality_control_check(hypothesis)
    experiment_plan = generate_experiment_plan(hypothesis, qc_result)

    print(json.dumps(experiment_plan, indent=2))