from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client

url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")

supabase: Client = create_client(url, key)

import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)



@app.get("/feedback-history")
async def get_all_feedback():
    try:
        response = supabase.table("feedback_memory") \
            .select("*") \
            .order("created_at", desc=True) \
            .execute()
        
        return {
            "status": "success",
            "count": len(response.data),
            "data": response.data
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    


@app.post("/feedback")
async def save_feedback(data: dict):
    try:
        if not data.get("hypothesis_context") or not data.get("content"):
            return {
                "status": "error", 
                "detail": "Missing required fields: hypothesis_context and content are mandatory."
            }

        response = supabase.table("feedback_memory").insert({
            "category": data.get("category", "general"),
            "feedback_type": data.get("feedback_type", "observation"),
            "content": data.get("content"),
            "hypothesis_context": data.get("hypothesis_context"),
            "entity": data.get("entity"),
            "reference_id": data.get("reference_id"),
            "status": data.get("status", "pending"),
            "priority": data.get("priority", "medium"),
            "confidence": data.get("confidence", "medium"),
            "context": data.get("context", {}),
            "metadata": data.get("metadata", {})
        }).execute()
        
        return {"status": "success", "message": "High-fidelity memory logged."}

    except Exception as e:
        print(f"DATABASE ERROR: {e}")
        return {"status": "error", "detail": str(e)}
    


@app.get("/mock-qc")
async def get_mock_qc(hypothesis: str):
    time.sleep(1)
    return {
        "entity": {
            "name": "Trehalose cryoprotection",
            "type": "scientific_hypothesis",
            "target": "HeLa cells",
            "description": "Trehalose improves post-thaw viability compared to sucrose",
            "identifiers": {
            "cas_number": "99-20-7",
            "pubchem_cid": "7427",
            "other_ids": []
            }
        },
        "novelty_assessment": "unclear",
        "confidence": {
            "score": 0.25,
            "type": "model_confidence",
            "scale": "0-1"
        },
        "summary": "The provided papers establish that trehalose and sucrose are recognized cryoprotectants and that cryopreservation chemistry is an active area of research, but they do not provide direct evidence comparing trehalose versus sucrose for post-thaw viability of HeLa cells. Because the available evidence is broad review-level background rather than cell-line-specific experimental data, the novelty and validity of the hypothesis cannot be confidently determined from these papers alone.",
        "key_claims": [
            {
            "id": "claim_0",
            "type": "background",
            "text": "Trehalose and sucrose are both listed among cryoprotectants used in cryopreservation research.",
            "supporting_references": [
                "ref_0"
            ]
            },
            {
            "id": "claim_1",
            "type": "background",
            "text": "Cryopreservation outcomes depend on multiple damage pathways, and chemical cryoprotectants are used to address these mechanisms.",
            "supporting_references": [
                "ref_1"
            ]
            },
            {
            "id": "claim_2",
            "type": "gap",
            "text": "No provided paper reports a direct experimental comparison of trehalose versus sucrose for post-thaw viability of HeLa cells.",
            "supporting_references": [
                "ref_0",
                "ref_1"
            ]
            },
            {
            "id": "claim_3",
            "type": "conclusion",
            "text": "The hypothesis is not directly supported or contradicted by the provided literature; available evidence is indirect and limited to general cryoprotectant context.",
            "supporting_references": [
                "ref_0",
                "ref_1"
            ]
            }
        ],
        "knowledge_gaps": [
            "Direct experimental data comparing trehalose and sucrose as cryoprotectants in HeLa cells are absent from the provided papers.",
            "Post-thaw viability outcomes for HeLa cells under trehalose versus sucrose treatment are not reported.",
            "Relevant experimental conditions such as concentrations, loading method, freezing rate, thawing protocol, and viability assay are not available in the provided evidence."
        ],
        "references": [
            {
            "id": "ref_0",
            "title": "Antifreeze Proteins: Novel Applications and Navigation towards Their Clinical Application in Cryobanking.",
            "authors": [],
            "year": 2022,
            "journal": "International Journal of Molecular Sciences",
            "doi": "10.3390/ijms23052639",
            "url": "https://doi.org/10.3390/ijms23052639",
            "quality": "medium",
            "study_type": "review"
            },
            {
            "id": "ref_1",
            "title": "Chemical approaches to cryopreservation.",
            "authors": [],
            "year": 2022,
            "journal": "Nature Reviews Chemistry",
            "doi": "10.1038/s41570-022-00407-4",
            "url": "https://doi.org/10.1038/s41570-022-00407-4",
            "quality": "high",
            "study_type": "review"
            }
        ],
        "evidence_links": [
            {
            "claim_id": "claim_0",
            "reference_id": "ref_0",
            "relationship": "supports"
            },
            {
            "claim_id": "claim_1",
            "reference_id": "ref_1",
            "relationship": "partial"
            },
            {
            "claim_id": "claim_2",
            "reference_id": "ref_0",
            "relationship": "partial"
            },
            {
            "claim_id": "claim_2",
            "reference_id": "ref_1",
            "relationship": "partial"
            },
            {
            "claim_id": "claim_3",
            "reference_id": "ref_0",
            "relationship": "partial"
            },
            {
            "claim_id": "claim_3",
            "reference_id": "ref_1",
            "relationship": "partial"
            }
        ],
        "metrics": {
            "num_references": 2,
            "num_supporting_claims": 0,
            "num_contradicting_claims": 0,
            "evidence_coverage_score": 0.15
        },
        "risk_flags": [
            "limited_evidence",
            "high_uncertainty"
        ],
        "metadata": {
            "generated_at": "2026-04-25T22:50:08.923052",
            "method": "EuropePMC multi-query retrieval + GPT-5.5 relevance selection + GPT-5.5 literature QC",
            "source_query": "trehalose sucrose HeLa cryopreservation post-thaw viability | cryoprotectants mammalian cells viability | trehalose cryopreservation viability",
            "pipeline_version": "v3",
            "schema_version": "v3"
        }
}

@app.get("/mock-plan")
async def get_mock_plan():
    time.sleep(1)
    return {
  "experiment_metadata": {
    "title": "Assessing the Effect of Trehalose on Post-Thaw Viability of HeLa Cells",
    "objective": "To investigate whether trehalose enhances the post-thaw viability of cryopreserved HeLa cells.",
    "biosafety_level": "BSL-1"
  },
  "scientific_rationale": {
    "background": "Trehalose is known to have protective effects during cryopreservation across various cell types, but direct studies on HeLa cells are lacking.",
    "hypothesis": "Trehalose improves post-thaw viability of HeLa cells.",
    "primary_endpoint": "Viability percentage of HeLa cells post-thaw.",
    "secondary_endpoints": [
      "Morphological assessment of HeLa cells post-thaw",
      "Glycolytic stress response of HeLa cells post-thaw"
    ],
    "success_criteria": "Statistically significant increase in post-thaw viability of HeLa cells treated with trehalose compared to the control group."
  },
  "experimental_design": {
    "study_type": "in vitro",
    "model_system": "HeLa cells",
    "group_definitions": [
      {
        "group_name": "Trehalose Treatment",
        "description": "HeLa cells treated with trehalose during cryopreservation.",
        "sample_size": 6
      },
      {
        "group_name": "Control",
        "description": "HeLa cells cryopreserved without trehalose treatment.",
        "sample_size": 6
      }
    ],
    "randomization": "Random allocation of cells into treatment and control groups.",
    "blinding": "Single",
    "replicates": {
      "biological": 3,
      "technical": 2
    }
  },
  "controls": {
    "positive_controls": [
      "Cryoprotectant with proven efficacy (e.g., DMSO)"
    ],
    "negative_controls": [
      "HeLa cells without any cryoprotectant"
    ],
    "internal_controls": [
      "Post-thaw viability of untreated HeLa cells"
    ],
    "calibration_procedures": [
      "Calibration of viability assays using known standards"
    ]
  },
  "protocol": [
    {
      "phase": "Preparation and Cryopreservation",
      "dependencies": [
        "Availability of HeLa cells",
        "Purchasing of trehalose"
      ],
      "qc_checks": [
        "Cell viability before freezing",
        "Concentration verification of trehalose"
      ],
      "steps": [
        {
          "step_id": 1,
          "instruction": "Culture HeLa cells to log phase and prepare for cryopreservation.",
          "duration_mins": 120,
          "equipment": [
            "Incubator",
            "Cell culture plates"
          ],
          "consumables": [
            "DMEM medium",
            "FBS"
          ],
          "temp_celsius": 37,
          "expected_output": "Optimally cultured HeLa cells ready for cryopreservation.",
          "failure_modes": [
            "Contamination",
            "Poor cell growth"
          ],
          "troubleshooting": [
            "Check for aseptic technique",
            "Monitor pH of medium"
          ]
        },
        {
          "step_id": 2,
          "instruction": "Prepare trehalose solution at desired concentration.",
          "duration_mins": 30,
          "equipment": [
            "Pipettes",
            "Vortex mixer"
          ],
          "consumables": [
            "Trehalose powder",
            "PBS"
          ],
          "temp_celsius": 25,
          "expected_output": "Homogenous trehalose solution.",
          "failure_modes": [
            "Incomplete dissolution",
            "Incorrect concentration"
          ],
          "troubleshooting": [
            "Increase vortexing time or volume"
          ]
        },
        {
          "step_id": 3,
          "instruction": "Cryopreserve HeLa cells with or without trehalose.",
          "duration_mins": 30,
          "equipment": [
            "Cryopreservation storage unit"
          ],
          "consumables": [
            "Cryovials"
          ],
          "temp_celsius": "Standard freezing protocol (-80\u00b0C initially or in liquid nitrogen)",
          "expected_output": "Cryopreserved HeLa cells for later thawing.",
          "failure_modes": [
            "Improper cooling rate",
            "Vial breakage"
          ],
          "troubleshooting": [
            "Verify cooling rate using data loggers"
          ]
        },
        {
          "step_id": 4,
          "instruction": "Thaw cryopreserved HeLa cells and assess viability.",
          "duration_mins": 15,
          "equipment": [
            "Water bath",
            "Trypan blue exclusion assay"
          ],
          "consumables": [
            "Dulbecco's PBS"
          ],
          "temp_celsius": 37,
          "expected_output": "Viability metric for HeLa cells post-thaw.",
          "failure_modes": [
            "Heat shock",
            "Cell clumping"
          ],
          "troubleshooting": [
            "Optimize thawing time and handling procedures"
          ]
        }
      ]
    }
  ],
  "data_plan": {
    "data_collection_methods": [
      "Cell viability assays",
      "Photomicrography for morphological assessment",
      "Metabolic assays for glycolytic stress response"
    ],
    "data_format": "Percentage viability (%), Images, Metabolic activity readings",
    "analysis_pipeline": [
      "Statistical analysis using t-tests or ANOVA for comparisons"
    ],
    "statistical_tests": [
      "Two-tailed t-test for primary endpoint",
      "ANOVA for secondary endpoints"
    ],
    "power_analysis": {
      "effect_size": "0.5",
      "power": 0.8,
      "alpha": 0.05
    }
  },
  "compliance": {
    "biosafety": "All procedures performed under BSL-1 conditions, adhering to safe handling protocols.",
    "ethical_approval_required": False,
    "regulatory_bodies": [
      "Institutional Biosafety Committee"
    ],
    "waste_disposal": [
      "Standard biological waste disposal procedures"
    ]
  },
  "logistics": {
    "reagents": [
      {
        "name": "Trehalose",
        "vendor_hint": "Sigma-Aldrich",
        "catalog_no": "TBD",
        "quantity": "100 g",
        "unit_price": 50.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "DMSO",
        "vendor_hint": "Sigma-Aldrich",
        "catalog_no": "D8657",
        "quantity": "50 ml",
        "unit_price": 15.0,
        "is_in_stock_simulated": True
      }
    ],
    "consumables": [
      {
        "name": "DMEM medium",
        "vendor_hint": "Gibco",
        "catalog_no": "11965-092",
        "quantity": "500 ml",
        "unit_price": 25.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "FBS",
        "vendor_hint": "Gibco",
        "catalog_no": "10099-141",
        "quantity": "500 ml",
        "unit_price": 100.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Dulbecco's PBS",
        "vendor_hint": "Gibco",
        "catalog_no": "14190-144",
        "quantity": "500 ml",
        "unit_price": 10.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Cryovials",
        "vendor_hint": "VWR",
        "catalog_no": "89041-654",
        "quantity": "50",
        "unit_price": 35.0,
        "is_in_stock_simulated": True
      }
    ],
    "equipment_usage": [
      {
        "equipment": "Incubator",
        "usage_description": "Culturing HeLa cells at 37\u00b0C",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Cryopreservation storage unit",
        "usage_description": "Storing cryopreserved HeLa cells",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Water bath",
        "usage_description": "Thawing cryopreserved cells",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Pipettes",
        "usage_description": "Preparing trehalose solution",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Vortex mixer",
        "usage_description": "Mixing trehalose solution",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Trypan blue exclusion assay",
        "usage_description": "Assessing cell viability",
        "unit_price": 15.0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Photomicrography setup",
        "usage_description": "For morphological assessment",
        "unit_price": 50.0,
        "is_available": False,
        "booking_required": True
      }
    ],
    "equipment_availability": [
      {
        "equipment": "Incubator",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Cryopreservation storage unit",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Water bath",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Pipettes",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Vortex mixer",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Trypan blue exclusion assay",
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Photomicrography setup",
        "is_available": False,
        "booking_required": True
      }
    ],
    "total_budget": 800.0,
    "budget_breakdown": {
      "reagents": 65.0,
      "consumables": 170.0,
      "equipment": 65.0,
      "labor": 500.0
    },
    "lead_time_days": 5,
    "alternate_suppliers": [
      "Thermo Fisher Scientific",
      "VWR"
    ]
  },
  "execution_plan": {
    "timeline": [
      {
        "day": 1,
        "tasks": [
          "Culture HeLa cells to log phase",
          "Prepare trehalose solution",
          "Cryopreserve HeLa cells"
        ]
      },
      {
        "day": 2,
        "tasks": [
          "Thaw cryopreserved HeLa cells",
          "Assess viability"
        ]
      }
    ],
    "milestones": [
      "Completion of cryopreservation",
      "Assessment of post-thaw viability"
    ],
    "go_no_go_points": [
      "Verify cell viability before freezing",
      "Confirm successful thawing process"
    ]
  },
  "operational_readiness": {
    "staff_skills": [
      "Cell culture techniques",
      "Cryopreservation methods",
      "Viability assessment"
    ],
    "critical_warnings": [
      "Contamination during cell culture",
      "Inaccurate trehalose concentration"
    ],
    "expected_bottlenecks": [
      "Availability of photomicrography setup",
      "Time constraints for viability assessment"
    ]
  },
  "risk_management": {
    "critical_warnings": [
      "Failure of cryopreservation",
      "Cell contamination"
    ],
    "expected_bottlenecks": [
      "Limited access to photomicrography setup"
    ],
    "contingency_plans": [
      "Have backup availability for imaging services",
      "Repeat cell culture if contamination occurs"
    ]
  },
  "reporting": {
    "deliverables": [
      "Final report on post-thaw viability",
      "Data analysis results"
    ],
    "report_format": "PDF",
    "reproducibility_notes": [
      "Detailed protocol available for replication",
      "Use of standardized assays"
    ]
  },
  "drug_candidate_specs": {
    "molecular_weight": None,
    "solubility_profile": "Soluble in water",
    "storage_conditions": "Store at room temperature",
    "purity_requirement": "\u2265 98%"
  },
  "quality_assurance": {
    "positive_control_expected_range": "70-90% viability for positive controls",
    "negative_control_threshold": "Less than 20% viability for negative controls",
    "plate_map_layout": "Organized layout for treatment and control groups on cell plates."
  },
  "data_management": {
    "eln_target_folder": "/experiments/trehalose_heLa_cells",
    "raw_data_storage": "/data/raw/experiments/trehalose_heLa_cells",
    "audit_trail_enabled": True
  },
  "metadata": {
    "generated_at": "2026-04-26T01:55:44.415466",
    "method": "Two-stage GPT-5.5 experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation; Supabase feedback memory injected into scientific planning",
    "pipeline_version": "v1",
    "schema_version": "experiment_plan_v1"
  }
}