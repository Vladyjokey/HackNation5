import json
import os
import re
import sys
from datetime import datetime
from openai import OpenAI
from dotenv import load_dotenv
from supabase import create_client, Client
from backend.utils import parse_json, clamp

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
load_dotenv()

client = OpenAI()
MODEL_NAME = "gpt-4o-mini"

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY")

supabase: Client | None = None
if SUPABASE_URL and SUPABASE_KEY:
    supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

def get_scientist_memory(
    current_hypothesis: str,
    current_entity: str = None,
    current_ref: str = None
) -> str:
    """
    Method 2: Faceted Retrieval.
    Gathers a prioritized mix of:
    - high-priority global rules
    - hypothesis-specific feedback
    - optional entity/reference-specific corrections
    """

    if supabase is None:
        return "No relevant historical corrections found for this context."

    try:
        all_memories = []

        # 1. Fetch HIGH PRIORITY global rules
        global_rules = (
            supabase.table("feedback_memory")
            .select("*")
            .eq("priority", "high")
            .limit(3)
            .execute()
        )
        all_memories.extend(global_rules.data or [])

        # 2. Fetch feedback specifically for THIS hypothesis
        hyp_feedback = (
            supabase.table("feedback_memory")
            .select("*")
            .eq("hypothesis_context", current_hypothesis)
            .order("created_at", desc=True)
            .limit(5)
            .execute()
        )
        all_memories.extend(hyp_feedback.data or [])

        # 3. Fetch feedback for the specific entity/reference, if provided
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

        # Deduplicate by id
        unique_memories = {
            m["id"]: m for m in all_memories if m.get("id")
        }.values()

        # Limit total memory items to 10
        unique_memories = list(unique_memories)[:10]

        if not unique_memories:
            return "No relevant historical corrections found for this context."

        formatted_prompt = "### RELEVANT SCIENTIFIC MEMORY & CONSTRAINTS\n"
        formatted_prompt += "The following historical feedback must be integrated into your reasoning:\n\n"

        for m in sorted(
            unique_memories,
            key=lambda x: x.get("priority") == "high",
            reverse=True
        ):
            prio_label = "🚨 [CRITICAL]" if m.get("priority") == "high" else "💡 [ADVISORY]"
            category = m.get("category", "general").upper()
            content = m.get("content", "")

            formatted_prompt += f"{prio_label} ({category}): {content}\n"

        return formatted_prompt

    except Exception as e:
        print(f"Error in Faceted Retrieval: {e}")
        return "Memory system offline. Proceed with standard scientific defaults."


def generate_scientific_plan(hypothesis: str, qc_result: dict):
    past_corrections = get_scientist_memory(hypothesis)

    response = client.responses.create(
        model=MODEL_NAME,
        input=f"""
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
        price = clamp(reagent.get("unit_price", 0), 0, 100000, 0)
        reagent["unit_price"] = price
        reagent_total += price

    labor = operations_plan.get("labor_estimate", {})
    labor_hours = clamp(labor.get("hours", 0), 0, 10000, 0)
    hourly_rate = clamp(labor.get("hourly_rate", 0), 0, 10000, 0)
    labor_total = labor_hours * hourly_rate

    equipment_total = clamp(
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
            "method": "Two-stage GPT-5.5 experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation; Supabase feedback memory injected into scientific planning",
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