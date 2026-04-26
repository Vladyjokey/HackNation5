from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
from supabase import create_client, Client
from backend.experiment_planner import execute_pipeline

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
    
@app.post("/generate-full-experiment")
async def generate_full_experiment(hypothesis: str):
    try:
        qc_analysis, plan = execute_pipeline(hypothesis)
        
        return {
            "status": "success",
            "qc_report": qc_analysis,
            "experiment_plan": plan
        }
    except Exception as e:
        return {"status": "error", "message": str(e)}
    


@app.get("/mock-qc")
async def get_mock_qc(hypothesis: str):
    
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
    "title": "Effect of Trehalose on Post-Thaw Viability of HeLa Cells",
    "objective": "To determine the effectiveness of trehalose in enhancing the post-thaw viability of HeLa cells following cryopreservation.",
    "biosafety_level": "BSL-1"
  },
  "scientific_rationale": {
    "background": "Trehalose has been recognized for its potential as a cryoprotectant, improving the viability of various cell types post-thaw.",
    "hypothesis": "Trehalose improves post-thaw viability of HeLa cells compared to control.",
    "primary_endpoint": "Percentage of viable HeLa cells after thawing.",
    "secondary_endpoints": [
      "Cell morphology assessment",
      "Apoptosis rates in thawed cells"
    ],
    "success_criteria": "At least a 20% increase in viable cells in the trehalose group compared to control."
  },
  "experimental_design": {
    "study_type": "in vitro",
    "model_system": "HeLa cells",
    "group_definitions": [
      {
        "group_name": "Trehalose Treatment Group",
        "description": "HeLa cells treated with trehalose prior to cryopreservation.",
        "sample_size": 10
      },
      {
        "group_name": "Control Group",
        "description": "HeLa cells without trehalose treatment before cryopreservation.",
        "sample_size": 10
      }
    ],
    "randomization": "Random assignment of HeLa cells to treatment and control groups.",
    "blinding": "Single",
    "replicates": {
      "biological": 3,
      "technical": 2
    }
  },
  "controls": {
    "positive_controls": [
      "HeLa cells treated with known cryoprotectants"
    ],
    "negative_controls": [
      "HeLa cells not frozen"
    ],
    "internal_controls": [
      "Viability of cells before freezing"
    ],
    "calibration_procedures": [
      "Use of a viability assay kit to calibrate cell counting instruments."
    ]
  },
  "protocol": [
    {
      "phase": "Cell Treatment",
      "dependencies": [
        "Sterile culture conditions",
        "Availability of trehalose and freezing media"
      ],
      "qc_checks": [
        "Cell viability before treatment",
        "Contamination check"
      ],
      "steps": [
        {
          "step_id": 1,
          "instruction": "Culture HeLa cells to 80% confluence.",
          "duration_mins": 48,
          "equipment": [
            "Incubator",
            "Hemocytometer"
          ],
          "consumables": [
            "Culture media",
            "T25 flasks"
          ],
          "temp_celsius": 37,
          "expected_output": "Exponentially growing HeLa cells.",
          "failure_modes": [
            "Contamination",
            "Low confluency"
          ],
          "troubleshooting": [
            "Check for sterile techniques",
            "Adjust media for optimal growth."
          ]
        },
        {
          "step_id": 2,
          "instruction": "Treat HeLa cells with trehalose for 2 hours.",
          "duration_mins": 120,
          "equipment": [
            "Incubator",
            "Pipettes"
          ],
          "consumables": [
            "Trehalose solution",
            "Dulbecco's Modified Eagle Medium (DMEM)"
          ],
          "temp_celsius": 37,
          "expected_output": "Cells exposed to trehalose.",
          "failure_modes": [
            "Insufficient solution volume",
            "Incorrect concentration"
          ],
          "troubleshooting": [
            "Verify solution concentrations",
            "Perform adjustments if necessary."
          ]
        },
        {
          "step_id": 3,
          "instruction": "Freeze cells using a controlled-rate freezer.",
          "duration_mins": 30,
          "equipment": [
            "Controlled-rate freezer"
          ],
          "consumables": [
            "Cryopreservation vials",
            "Freezing media"
          ],
          "temp_celsius": -80,
          "expected_output": "Cells stored at -80 degrees Celsius.",
          "failure_modes": [
            "Freezing errors",
            "Vial breakage"
          ],
          "troubleshooting": [
            "Monitor freezing profile closely",
            "Check vial integrity."
          ]
        },
        {
          "step_id": 4,
          "instruction": "Thaw cells in a 37\u00b0C water bath for viability assessment.",
          "duration_mins": 5,
          "equipment": [
            "Water bath",
            "Centrifuge"
          ],
          "consumables": [
            "Thawing media",
            "Sterile culture plates"
          ],
          "temp_celsius": 37,
          "expected_output": "Thawed cells ready for viability assay.",
          "failure_modes": [
            "Uneven thawing",
            "Cell damage"
          ],
          "troubleshooting": [
            "Thaw quickly but cautiously",
            "Use gentle resuspension techniques."
          ]
        },
        {
          "step_id": 5,
          "instruction": "Perform viability assay using Trypan Blue staining.",
          "duration_mins": 15,
          "equipment": [
            "Hemocytometer",
            "Microscope"
          ],
          "consumables": [
            "Trypan Blue solution"
          ],
          "temp_celsius": None,
          "expected_output": "Quantified cell viability.",
          "failure_modes": [
            "Inaccurate counting",
            "Staining errors"
          ],
          "troubleshooting": [
            "Ensure correct dilution of Trypan Blue",
            "Confirm hemocytometer technique."
          ]
        }
      ]
    }
  ],
  "data_plan": {
    "data_collection_methods": [
      "Flow cytometry for apoptosis",
      "Microscopy for morphology assessments"
    ],
    "data_format": "Spreadsheet for cell counts and morphological data",
    "analysis_pipeline": [
      "Descriptive statistics",
      "ANOVA for primary endpoint"
    ],
    "statistical_tests": [
      "t-test for comparing groups",
      "ANOVA for variance analysis"
    ],
    "power_analysis": {
      "effect_size": "Medium",
      "power": 0.8,
      "alpha": 0.05
    }
  },
  "compliance": {
    "biosafety": "Compliance with BSL-1 regulations.",
    "ethical_approval_required": False,
    "regulatory_bodies": [
      "Institutional Biosafety Committee"
    ],
    "waste_disposal": [
      "Autoclaving liquids and disposing of biological waste according to institutional policies."
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
        "name": "Cryopreservation media",
        "vendor_hint": "Thermo Fisher",
        "catalog_no": "TBD",
        "quantity": "100 mL",
        "unit_price": 35.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Dulbecco's Modified Eagle Medium",
        "vendor_hint": "Gibco",
        "catalog_no": "TBD",
        "quantity": "500 mL",
        "unit_price": 25.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Trypan Blue solution",
        "vendor_hint": "Invitrogen",
        "catalog_no": "TBD",
        "quantity": "10 mL",
        "unit_price": 20.0,
        "is_in_stock_simulated": True
      }
    ],
    "consumables": [
      {
        "name": "Culture media",
        "vendor_hint": "Gibco",
        "catalog_no": "TBD",
        "quantity": "1 L",
        "unit_price": 40.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "T25 flasks",
        "vendor_hint": "Corning",
        "catalog_no": "TBD",
        "quantity": "20",
        "unit_price": 15.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Cryopreservation vials",
        "vendor_hint": "Corning",
        "catalog_no": "TBD",
        "quantity": "50",
        "unit_price": 30.0,
        "is_in_stock_simulated": True
      },
      {
        "name": "Sterile culture plates",
        "vendor_hint": "Corning",
        "catalog_no": "TBD",
        "quantity": "50",
        "unit_price": 25.0,
        "is_in_stock_simulated": True
      }
    ],
    "equipment_usage": [
      {
        "equipment": "Incubator",
        "usage_description": "For culturing HeLa cells.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Hemocytometer",
        "usage_description": "For cell counting viability.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Controlled-rate freezer",
        "usage_description": "For freezing cells.",
        "unit_price": 200.0,
        "is_available": True,
        "booking_required": True
      },
      {
        "equipment": "Water bath",
        "usage_description": "For thawing cells.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Centrifuge",
        "usage_description": "For processing thawed cells.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Microscope",
        "usage_description": "For assessing cell morphology.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      },
      {
        "equipment": "Pipettes",
        "usage_description": "For handling solutions.",
        "unit_price": 0,
        "is_available": True,
        "booking_required": False
      }
    ],
    "total_budget": 740.0,
    "budget_breakdown": {
      "reagents": 130.0,
      "consumables": 110.0,
      "equipment": 200.0,
      "labor": 300.0
    },
    "lead_time_days": 5,
    "alternate_suppliers": [
      "Fisher Scientific",
      "VWR"
    ]
  },
  "execution_plan": {
    "timeline": [
      {
        "day": 1,
        "tasks": [
          "Culture HeLa cells to 80% confluence.",
          "Treat HeLa cells with trehalose."
        ]
      },
      {
        "day": 2,
        "tasks": [
          "Freeze cells using a controlled-rate freezer.",
          "Thaw cells for viability assessment."
        ]
      },
      {
        "day": 3,
        "tasks": [
          "Perform viability assay using Trypan Blue staining."
        ]
      }
    ],
    "milestones": [
      "Completion of cell treatment",
      "Fulfillment of cryopreservation",
      "Acquisition of viability data"
    ],
    "go_no_go_points": [
      "If cell viability before treatment is low, reassess protocols.",
      "If freezing errors occur, repeat the freezing step."
    ]
  },
  "operational_readiness": {
    "staff_skills": [
      "Cell culture",
      "Cryopreservation techniques",
      "Data analysis"
    ],
    "critical_warnings": [
      "Cell contamination risks",
      "Cryopreservation failure"
    ],
    "expected_bottlenecks": [
      "Limited availability of controlled-rate freezer"
    ]
  },
  "risk_management": {
    "critical_warnings": [
      "Potential contamination during cell culture",
      "Equipment malfunction"
    ],
    "expected_bottlenecks": [
      "Limited lab space for concurrent experiments"
    ],
    "contingency_plans": [
      "Reserve time on a second freezer if the primary is booked",
      "Increase microbial monitoring"
    ]
  },
  "reporting": {
    "deliverables": [
      "Final report on cell viability",
      "Data spreadsheets"
    ],
    "report_format": "PDF and Excel",
    "reproducibility_notes": [
      "All reagents and methods will be documented thoroughly."
    ]
  },
  "drug_candidate_specs": {
    "molecular_weight": None,
    "solubility_profile": "Soluble in water at room temperature.",
    "storage_conditions": "Store at room temperature, protect from light.",
    "purity_requirement": "\u2265 98%"
  },
  "quality_assurance": {
    "positive_control_expected_range": "70-90% viability following known cryoprotectants.",
    "negative_control_threshold": "Less than 10% viability for untreated cells post-thaw.",
    "plate_map_layout": "Randomly arranged to prevent bias in readings."
  },
  "data_management": {
    "eln_target_folder": "Project_Trehalose_HeLa_Cells",
    "raw_data_storage": "Secure institutional server with backup protocols.",
    "audit_trail_enabled": True
  },
  "metadata": {
    "generated_at": "2026-04-26T02:32:53.136038",
    "method": "Two-stage experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation; Supabase feedback memory injected into scientific planning",
    "pipeline_version": "v1",
    "schema_version": "experiment_plan_v1"
  }
}