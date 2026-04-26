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
    time.sleep(10)
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
    time.sleep(10)
    return {
        "experiment_metadata": {
            "title": "Effect of Trehalose on Post-Thaw Viability of HeLa Cells",
            "objective": "To evaluate the impact of trehalose on the post-thaw viability of HeLa cells following cryopreservation.",
            "biosafety_level": "BSL-1"
        },
        "scientific_rationale": {
            "background": "Trehalose has been shown to enhance cell viability post-thaw in various cell types, but direct evidence for its efficacy on HeLa cells is lacking.",
            "hypothesis": "Trehalose improves post-thaw viability of HeLa cells.",
            "primary_endpoint": "Post-thaw cell viability rate of HeLa cells.",
            "secondary_endpoints": [
            "Apoptotic cell rate",
            "Cell morphology assessment"
            ],
            "success_criteria": "Post-thaw viability of HeLa cells treated with trehalose is significantly higher than control group."
        },
        "experimental_design": {
            "study_type": "in vitro",
            "model_system": "HeLa cell culture",
            "group_definitions": [
            {
                "group_name": "Control Group",
                "description": "HeLa cells without trehalose treatment.",
                "sample_size": 5
            },
            {
                "group_name": "Trehalose Treatment Group",
                "description": "HeLa cells treated with trehalose before cryopreservation.",
                "sample_size": 5
            }
            ],
            "randomization": "Random assignment of plates to each treatment group.",
            "blinding": "Single",
            "replicates": {
            "biological": 3,
            "technical": 2
            }
        },
        "controls": {
            "positive_controls": [
            "HeLa cells with a known cryoprotectant"
            ],
            "negative_controls": [
            "HeLa cells without treatment"
            ],
            "internal_controls": [
            "Non-frozen HeLa cells"
            ],
            "calibration_procedures": [
            "Calibration of cell viability assay kits."
            ]
        },
        "protocol": [
            {
            "phase": "Cell Preparation",
            "dependencies": [
                "Cell culture facilities, Cryopreservation materials"
            ],
            "qc_checks": [
                "Cell count and viability before freezing"
            ],
            "steps": [
                {
                "step_id": 1,
                "instruction": "Culture HeLa cells to 70-80% confluence.",
                "duration_mins": 48,
                "equipment": [
                    "Incubator",
                    "Cell culture flask"
                ],
                "consumables": [
                    "DMEM media",
                    "FBS",
                    "Penicillin-Streptomycin"
                ],
                "temp_celsius": 37,
                "expected_output": "HeLa cells ready for treatment.",
                "failure_modes": [
                    "Contamination",
                    "Poor growth"
                ],
                "troubleshooting": [
                    "Review aseptic techniques",
                    "Check media quality"
                ]
                },
                {
                "step_id": 2,
                "instruction": "Treat cells with trehalose and incubate.",
                "duration_mins": 30,
                "equipment": [
                    "Incubator"
                ],
                "consumables": [
                    "Trehalose solution"
                ],
                "temp_celsius": 37,
                "expected_output": "HeLa cells treated with trehalose.",
                "failure_modes": [
                    "Inaccurate dosing",
                    "Cell toxicity"
                ],
                "troubleshooting": [
                    "Verify trehalose concentration",
                    "Monitor for cellular stress"
                ]
                },
                {
                "step_id": 3,
                "instruction": "Freeze the cells using a controlled-rate freezer.",
                "duration_mins": 15,
                "equipment": [
                    "Cryopreservation unit"
                ],
                "consumables": [
                    "Cryovials",
                    "Cryopreservation medium"
                ],
                "temp_celsius": -80,
                "expected_output": "Cells frozen in cryovials.",
                "failure_modes": [
                    "Improper cooling rate",
                    "Freezer malfunction"
                ],
                "troubleshooting": [
                    "Follow the freezer's SOP",
                    "Check for power failures"
                ]
                },
                {
                "step_id": 4,
                "instruction": "Thaw frozen cells rapidly in a water bath.",
                "duration_mins": 5,
                "equipment": [
                    "Water bath"
                ],
                "consumables": [
                    "D-PBS",
                    "Trypan blue staining solution"
                ],
                "temp_celsius": 37,
                "expected_output": "Thawed cells ready for viability assessment.",
                "failure_modes": [
                    "Inconsistent thaw rates",
                    "Cell lysis"
                ],
                "troubleshooting": [
                    "Monitor water bath temperature",
                    "Use consistent thawing times"
                ]
                },
                {
                "step_id": 5,
                "instruction": "Perform cell viability assay post-thaw.",
                "duration_mins": 30,
                "equipment": [
                    "Automated cell counter"
                ],
                "consumables": [
                    "Viability assay kit"
                ],
                "temp_celsius": null,
                "expected_output": "Viability results for each group.",
                "failure_modes": [
                    "Assay interference",
                    "Counting errors"
                ],
                "troubleshooting": [
                    "Calibrate equipment",
                    "Run controls in parallel"
                ]
                }
            ]
            }
        ],
        "data_plan": {
            "data_collection_methods": [
            "Flow cytometry",
            "Cell viability assays"
            ],
            "data_format": "CSV",
            "analysis_pipeline": [
            "Statistical software for analysis",
            "Basic data visualization tools"
            ],
            "statistical_tests": [
            "t-test for independent samples"
            ],
            "power_analysis": {
            "effect_size": "0.5",
            "power": 0.8,
            "alpha": 0.05
            }
        },
        "compliance": {
            "biosafety": "This study is conducted at BSL-1; basic laboratory safety procedures followed.",
            "ethical_approval_required": false,
            "regulatory_bodies": [
            "Institutional Review Board"
            ],
            "waste_disposal": [
            "Cell culture waste disposal according to institutional guidelines."
            ]
        },
        "logistics": {
            "reagents": [
            {
                "name": "Trehalose",
                "vendor_hint": "Sigma-Aldrich",
                "catalog_no": "TBD",
                "quantity": "50g",
                "unit_price": 25.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "DMEM media",
                "vendor_hint": "Thermo Fisher",
                "catalog_no": "TBD",
                "quantity": "500ml",
                "unit_price": 20.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Fetal Bovine Serum (FBS)",
                "vendor_hint": "Thermo Fisher",
                "catalog_no": "TBD",
                "quantity": "500ml",
                "unit_price": 30.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Penicillin-Streptomycin",
                "vendor_hint": "Thermo Fisher",
                "catalog_no": "TBD",
                "quantity": "100ml",
                "unit_price": 15.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Cryovials",
                "vendor_hint": "VWR",
                "catalog_no": "TBD",
                "quantity": "100 unit",
                "unit_price": 50.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Cryopreservation medium",
                "vendor_hint": "Sigma-Aldrich",
                "catalog_no": "TBD",
                "quantity": "100ml",
                "unit_price": 40.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "D-PBS",
                "vendor_hint": "Thermo Fisher",
                "catalog_no": "TBD",
                "quantity": "500ml",
                "unit_price": 15.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Trypan blue staining solution",
                "vendor_hint": "Gibco",
                "catalog_no": "TBD",
                "quantity": "100ml",
                "unit_price": 25.0,
                "is_in_stock_simulated": true
            },
            {
                "name": "Viability assay kit",
                "vendor_hint": "Promega",
                "catalog_no": "TBD",
                "quantity": "1 kit",
                "unit_price": 200.0,
                "is_in_stock_simulated": true
            }
            ],
            "equipment_availability": [
            {
                "equipment": "Incubator",
                "is_available": true,
                "booking_required": false
            },
            {
                "equipment": "Cryopreservation unit",
                "is_available": true,
                "booking_required": false
            },
            {
                "equipment": "Water bath",
                "is_available": true,
                "booking_required": false
            },
            {
                "equipment": "Automated cell counter",
                "is_available": true,
                "booking_required": false
            }
            ],
            "total_budget": 2420.0,
            "budget_breakdown": {
            "reagents": 420.0,
            "labor": 1000.0,
            "equipment": 1000.0
            },
            "lead_time_days": 7,
            "alternate_suppliers": [
            "VWR",
            "Fisher Scientific"
            ]
        },
        "execution_plan": {
            "timeline": [
            {
                "day": 1,
                "tasks": [
                "Culture HeLa cells to 70-80% confluence",
                "Treat cells with trehalose",
                "Freeze the cells",
                "Thaw frozen cells",
                "Perform cell viability assay"
                ]
            }
            ],
            "milestones": [
            "Cells cultured successfully",
            "Cells treated with trehalose",
            "Cells successfully frozen",
            "Cells thawed and ready for assay",
            "Viability results obtained"
            ],
            "go_no_go_points": [
            "If cells do not reach confluence, repeat cell culture step",
            "If viability is below threshold in controls, repeat experiment"
            ]
        },
        "operational_readiness": {
            "staff_skills": [
            "Cell culture techniques",
            "Cryopreservation methods",
            "Cell viability assays"
            ],
            "critical_warnings": [
            "Ensure aseptic techniques are maintained",
            "Monitor freezing rates closely"
            ],
            "expected_bottlenecks": [
            "Availability of cell culture materials",
            "Equipment calibration"
            ]
        },
        "risk_management": {
            "critical_warnings": [
            "Potential contamination risks",
            "Inaccurate measurements of reagents"
            ],
            "expected_bottlenecks": [
            "Cell growth rates",
            "Limited number of incubators"
            ],
            "contingency_plans": [
            "Have backup stock of critical reagents",
            "Identify alternative equipment for viability assays"
            ]
        },
        "reporting": {
            "deliverables": [
            "Final report with results",
            "Data analysis summary",
            "Presentation of findings"
            ],
            "report_format": "PDF",
            "reproducibility_notes": [
            "Follow standard protocols",
            "Document all deviations and observations"
            ]
        },
        "drug_candidate_specs": {
            "molecular_weight": null,
            "solubility_profile": "Soluble in water",
            "storage_conditions": "Store at room temperature",
            "purity_requirement": "98% or higher"
        },
        "quality_assurance": {
            "positive_control_expected_range": "70-90% viability",
            "negative_control_threshold": "below 50% viability",
            "plate_map_layout": "Two plates per treatment group, labeled and organized for easy tracking."
        },
        "data_management": {
            "eln_target_folder": "Trehalose_Viability_Study",
            "raw_data_storage": "Local secure drive with backups weekly",
            "audit_trail_enabled": true
        },
        "metadata": {
            "generated_at": "2026-04-26T01:14:21.858480",
            "method": "Two-stage GPT-5.5 experiment planner: Scientific Designer + Lab Operations Manager; deterministic Python budget calculation; Supabase feedback memory injected into scientific planning",
            "pipeline_version": "v1",
            "schema_version": "experiment_plan_v1"
        }
        }