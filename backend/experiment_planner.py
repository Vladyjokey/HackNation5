import json
import os
import sys
from datetime import datetime
from typing import Any, Dict, List

from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from pydantic import BaseModel

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

from backend.utils import parse_json, clamp


client = OpenAI()
MODEL_NAME = "gpt-4o-mini"

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)


class ExperimentPlanSchema(BaseModel):
    experiment_metadata: Dict[str, Any]
    scientific_rationale: Dict[str, Any]
    experimental_design: Dict[str, Any]
    controls: Dict[str, Any]
    protocol: List[Dict[str, Any]]
    data_plan: Dict[str, Any]
    compliance: Dict[str, Any]
    logistics: Dict[str, Any]
    execution_plan: Dict[str, Any]
    operational_readiness: Dict[str, Any]
    risk_management: Dict[str, Any]
    reporting: Dict[str, Any]
    drug_candidate_specs: Dict[str, Any]
    quality_assurance: Dict[str, Any]
    data_management: Dict[str, Any]
    metadata: Dict[str, Any]


SCIENTIFIC_REQUIRED_KEYS = [
    "experiment_metadata",
    "scientific_rationale",
    "experimental_design",
    "controls",
    "protocol",
    "data_plan",
    "compliance",
    "quality_assurance",
    "data_management",
]

OPERATIONS_REQUIRED_KEYS = [
    "logistics",
    "execution_plan",
    "operational_readiness",
    "risk_management",
    "reporting",
    "drug_candidate_specs",
    "labor_estimate",
]


def ensure_list(value):
    if isinstance(value, list):
        return value
    if value is None:
        return []
    return [value]


def ensure_dict(value):
    if isinstance(value, dict):
        return value
    return {}


def retry_llm_json(prompt: str, max_retries: int = 2) -> dict:
    last_error = None

    for _ in range(max_retries + 1):
        response = client.responses.create(
            model=MODEL_NAME,
            input=prompt
        )

        try:
            return parse_json(response.output_text)
        except Exception as e:
            last_error = e
            prompt += f"""

Your previous response failed JSON parsing.

Error:
{str(e)}

Return ONLY valid JSON. Do not include markdown.
"""

    raise ValueError(f"Failed to get valid JSON after retries: {last_error}")


def enforce_scientific_plan_schema(plan: dict) -> dict:
    for key in SCIENTIFIC_REQUIRED_KEYS:
        if key not in plan:
            plan[key] = [] if key == "protocol" else {}

    plan["experiment_metadata"] = ensure_dict(plan.get("experiment_metadata"))
    plan["scientific_rationale"] = ensure_dict(plan.get("scientific_rationale"))
    plan["experimental_design"] = ensure_dict(plan.get("experimental_design"))
    plan["controls"] = ensure_dict(plan.get("controls"))
    plan["data_plan"] = ensure_dict(plan.get("data_plan"))
    plan["compliance"] = ensure_dict(plan.get("compliance"))
    plan["quality_assurance"] = ensure_dict(plan.get("quality_assurance"))
    plan["data_management"] = ensure_dict(plan.get("data_management"))

    protocol = plan.get("protocol", [])

    if isinstance(protocol, str):
        protocol = [protocol]

    if isinstance(protocol, dict):
        protocol = [protocol]

    if not isinstance(protocol, list):
        protocol = []

    fixed_protocol = []

    for phase_index, phase in enumerate(protocol):
        if isinstance(phase, str):
            fixed_protocol.append({
                "phase": f"Phase {phase_index + 1}",
                "dependencies": [],
                "qc_checks": [],
                "steps": [
                    {
                        "step_id": 1,
                        "instruction": phase,
                        "duration_mins": 0,
                        "equipment": [],
                        "consumables": [],
                        "temp_celsius": None,
                        "expected_output": "",
                        "failure_modes": [],
                        "troubleshooting": []
                    }
                ]
            })
            continue

        if not isinstance(phase, dict):
            continue

        phase.setdefault("phase", f"Phase {phase_index + 1}")
        phase["dependencies"] = ensure_list(phase.get("dependencies"))
        phase["qc_checks"] = ensure_list(phase.get("qc_checks"))

        steps = phase.get("steps", [])

        if isinstance(steps, str):
            steps = [steps]

        if isinstance(steps, dict):
            steps = [steps]

        if not isinstance(steps, list):
            steps = []

        fixed_steps = []

        for step_index, step in enumerate(steps):
            if isinstance(step, str):
                step = {"instruction": step}

            if not isinstance(step, dict):
                continue

            fixed_steps.append({
                "step_id": int(step.get("step_id", step_index + 1)),
                "instruction": str(step.get("instruction", "")),
                "duration_mins": int(step.get("duration_mins", 0) or 0),
                "equipment": ensure_list(step.get("equipment")),
                "consumables": ensure_list(step.get("consumables")),
                "temp_celsius": step.get("temp_celsius", None),
                "expected_output": str(step.get("expected_output", "")),
                "failure_modes": ensure_list(step.get("failure_modes")),
                "troubleshooting": ensure_list(step.get("troubleshooting")),
            })

        phase["steps"] = fixed_steps
        fixed_protocol.append(phase)

    plan["protocol"] = fixed_protocol
    return plan


def enforce_operations_plan_schema(plan: dict) -> dict:
    for key in OPERATIONS_REQUIRED_KEYS:
        if key not in plan:
            plan[key] = {}

    logistics = ensure_dict(plan.get("logistics"))

    logistics["reagents"] = ensure_list(logistics.get("reagents"))
    logistics["consumables"] = ensure_list(logistics.get("consumables"))
    logistics["equipment_usage"] = ensure_list(logistics.get("equipment_usage"))
    logistics["lead_time_days"] = int(logistics.get("lead_time_days", 0) or 0)
    logistics["alternate_suppliers"] = ensure_list(logistics.get("alternate_suppliers"))

    fixed_reagents = []
    for reagent in logistics["reagents"]:
        if not isinstance(reagent, dict):
            continue

        fixed_reagents.append({
            "name": str(reagent.get("name", "")),
            "vendor_hint": str(reagent.get("vendor_hint", "")),
            "catalog_no": str(reagent.get("catalog_no", "TBD")),
            "quantity": str(reagent.get("quantity", "")),
            "unit_price": clamp(reagent.get("unit_price", 0), 0, 100000, 0),
            "is_in_stock_simulated": bool(reagent.get("is_in_stock_simulated", True)),
        })

    logistics["reagents"] = fixed_reagents

    fixed_consumables = []
    for consumable in logistics["consumables"]:
        if not isinstance(consumable, dict):
            continue

        fixed_consumables.append({
            "name": str(consumable.get("name", "")),
            "vendor_hint": str(consumable.get("vendor_hint", "")),
            "catalog_no": str(consumable.get("catalog_no", "TBD")),
            "quantity": str(consumable.get("quantity", "")),
            "unit_price": clamp(consumable.get("unit_price", 0), 0, 100000, 0),
            "is_in_stock_simulated": bool(consumable.get("is_in_stock_simulated", True)),
        })

    logistics["consumables"] = fixed_consumables

    fixed_equipment_usage = []
    for equipment in logistics["equipment_usage"]:
        if not isinstance(equipment, dict):
            continue

        fixed_equipment_usage.append({
            "equipment": str(equipment.get("equipment", "")),
            "usage_description": str(equipment.get("usage_description", "")),
            "unit_price": clamp(equipment.get("unit_price", 0), 0, 100000, 0),
            "is_available": bool(equipment.get("is_available", True)),
            "booking_required": bool(equipment.get("booking_required", False)),
        })

    logistics["equipment_usage"] = fixed_equipment_usage

    plan["logistics"] = logistics
    plan["execution_plan"] = ensure_dict(plan.get("execution_plan"))
    plan["operational_readiness"] = ensure_dict(plan.get("operational_readiness"))
    plan["risk_management"] = ensure_dict(plan.get("risk_management"))
    plan["reporting"] = ensure_dict(plan.get("reporting"))
    plan["drug_candidate_specs"] = ensure_dict(plan.get("drug_candidate_specs"))
    plan["labor_estimate"] = ensure_dict(plan.get("labor_estimate"))

    return plan


def validate_final_plan(plan: dict) -> dict:
    ExperimentPlanSchema(**plan)
    return plan


def get_scientist_memory(
    current_hypothesis: str,
    current_entity: str = None,
    current_ref: str = None
) -> str:
    if supabase is None:
        return "No relevant historical corrections found for this context."

    try:
        all_memories = []

        global_rules = (
            supabase.table("feedback_memory")
            .select("*")
            .eq("priority", "high")
            .limit(3)
            .execute()
        )
        all_memories.extend(global_rules.data or [])

        hyp_feedback = (
            supabase.table("feedback_memory")
            .select("*")
            .eq("hypothesis_context", current_hypothesis)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        all_memories.extend(hyp_feedback.data or [])

        if current_entity and current_ref:
            entity_feedback = (
                supabase.table("feedback_memory")
                .select("*")
                .eq("entity", current_entity)
                .eq("reference_id", current_ref)
                .limit(3)
                .execute()
            )
            all_memories.extend(entity_feedback.data or [])

        unique_memories = {
            m["id"]: m for m in all_memories if m.get("id")
        }.values()

        unique_memories = list(unique_memories)[:10]

        if not unique_memories:
            return "No relevant historical corrections found for this context."

        formatted_prompt = "### RELEVANT SCIENTIFIC MEMORY & CONSTRAINTS\n"
        formatted_prompt += "The following historical feedback must be integrated into your reasoning:\n\n"

        for memory in sorted(
            unique_memories,
            key=lambda x: x.get("priority") == "high",
            reverse=True
        ):
            prio_label = "🚨 [CRITICAL]" if memory.get("priority") == "high" else "💡 [ADVISORY]"
            category = memory.get("category", "general").upper()
            content = memory.get("content", "")

            formatted_prompt += f"{prio_label} ({category}): {content}\n"

        return formatted_prompt

    except Exception as e:
        print(f"Error in Faceted Retrieval: {e}")
        return "Memory system offline. Proceed with standard scientific defaults."


def generate_scientific_plan(hypothesis: str, qc_result: dict):
    past_corrections = get_scientist_memory(hypothesis)

    prompt = f"""
You are a senior experimental scientist.

Design a scientifically valid experiment.

Use the QC results and past human feedback to guide decisions:
- Avoid unsupported assumptions
- Address knowledge gaps explicitly
- Keep the protocol safe, practical, and planning-level
- Do not include unsafe biological optimization or pathogen work
- If past human feedback conflicts with your default assumptions, follow the feedback strictly

Previous Lead Scientist Feedback:
{past_corrections}

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
- Apply relevant past scientist corrections
- If evidence is weak, design as a pilot study
- Return only JSON
- Do not rename schema fields
- Do not omit schema fields

Hypothesis:
{hypothesis}

QC Results:
{json.dumps(qc_result, indent=2)}
"""

    data = retry_llm_json(prompt)
    return enforce_scientific_plan_schema(data)


def generate_operations_plan(scientific_plan: dict):
    prompt = f"""
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
    "consumables": [
      {{
        "name": "...",
        "vendor_hint": "...",
        "catalog_no": "...",
        "quantity": "...",
        "unit_price": 0,
        "is_in_stock_simulated": true
      }}
    ],
    "equipment_usage": [
      {{
        "equipment": "...",
        "usage_description": "...",
        "unit_price": 0,
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
  }}
}}

Rules:
- Do NOT calculate total_budget.
- Python will calculate all budget totals.
- Every reagent must have its own unit_price.
- Every consumable must have its own unit_price.
- Every equipment_usage item must have its own unit_price.
- Do NOT return equipment_availability.
- Do NOT return one big equipment_cost_estimate.
- Do NOT invent a flat 1000 equipment cost.
- If standard lab equipment is already available, set its equipment_usage unit_price to 0.
- Use nonzero equipment_usage prices only for paid rentals, booking fees, service fees, or new equipment purchases.
- Labor estimate should be itemized using hours and hourly_rate.
- Use realistic approximate prices.
- If catalog number is uncertain, use "TBD".
- Return only JSON.
- Do not rename schema fields.
- Do not omit schema fields.

Scientific Plan:
{json.dumps(scientific_plan, indent=2)}
"""

    data = retry_llm_json(prompt)
    return enforce_operations_plan_schema(data)


def calculate_budget(operations_plan: dict):
    logistics = operations_plan.get("logistics", {})

    reagents = logistics.get("reagents", [])
    consumables = logistics.get("consumables", [])
    equipment_usage = logistics.get("equipment_usage", [])

    reagent_total = 0.0
    for reagent in reagents:
        price = clamp(reagent.get("unit_price", 0), 0, 100000, 0)
        reagent["unit_price"] = price
        reagent_total += price

    consumables_total = 0.0
    for consumable in consumables:
        price = clamp(consumable.get("unit_price", 0), 0, 100000, 0)
        consumable["unit_price"] = price
        consumables_total += price

    equipment_total = 0.0
    for equipment in equipment_usage:
        price = clamp(equipment.get("unit_price", 0), 0, 100000, 0)
        equipment["unit_price"] = price
        equipment_total += price

    labor = operations_plan.get("labor_estimate", {})
    labor_hours = clamp(labor.get("hours", 0), 0, 10000, 0)
    hourly_rate = clamp(labor.get("hourly_rate", 0), 0, 10000, 0)
    labor_total = labor_hours * hourly_rate

    total_budget = reagent_total + consumables_total + equipment_total + labor_total

    logistics["budget_breakdown"] = {
        "reagents": round(reagent_total, 2),
        "consumables": round(consumables_total, 2),
        "equipment": round(equipment_total, 2),
        "labor": round(labor_total, 2)
    }

    logistics["total_budget"] = round(total_budget, 2)
    operations_plan["logistics"] = logistics

    return operations_plan


def merge_full_experiment_plan(scientific_plan: dict, operations_plan: dict):
    logistics = operations_plan.get("logistics", {})

    final_output = {
        "experiment_metadata": scientific_plan.get("experiment_metadata", {}),
        "scientific_rationale": scientific_plan.get("scientific_rationale", {}),
        "experimental_design": scientific_plan.get("experimental_design", {}),
        "controls": scientific_plan.get("controls", {}),
        "protocol": scientific_plan.get("protocol", []),
        "data_plan": scientific_plan.get("data_plan", {}),
        "compliance": scientific_plan.get("compliance", {}),

        "logistics": {
            "reagents": logistics.get("reagents", []),
            "consumables": logistics.get("consumables", []),
            "equipment_usage": logistics.get("equipment_usage", []),
            "total_budget": logistics.get("total_budget", 0),
            "budget_breakdown": logistics.get("budget_breakdown", {
                "reagents": 0,
                "consumables": 0,
                "equipment": 0,
                "labor": 0
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
            "method": "Two-stage experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation; Supabase feedback memory injected into scientific planning",
            "pipeline_version": "v1",
            "schema_version": "experiment_plan_v1"
        }
    }

    return validate_final_plan(final_output)


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