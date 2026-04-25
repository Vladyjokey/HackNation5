from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.cors import CORSMiddleware
import time

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_methods=["*"],
    allow_headers=["*"],
)

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
            "title": "Inhibition of SARS-CoV-2 Main Protease (Mpro) using Compound X-102",
            "objective": "To determine the IC50 of the novel small molecule X-102 against the viral Mpro enzyme.",
            "biosafety_level": "BSL-2"
        },
        "scientific_rationale": {
            "background": "The Mpro enzyme is critical for viral replication. Current inhibitors show rising resistance.",
            "hypothesis": "Compound X-102 binds to the active site with higher affinity than Nirmatrelvir due to a novel fluorinated side chain.",
            "primary_endpoint": "IC50 value calculated from an 8-point dilution curve.",
            "secondary_endpoints": ["Thermal shift stability (delta Tm)", "Cytotoxicity (CC50) in Vero E6 cells"],
            "success_criteria": "IC50 < 50 nM with minimal cytotoxicity (>10 uM CC50)."
        },
        "experimental_design": {
            "study_type": "in vitro",
            "model_system": "Recombinant SARS-CoV-2 Mpro protein (expressed in E. coli)",
            "group_definitions": [
                {"group_name": "Control", "description": "Enzyme + DMSO (no inhibitor)", "sample_size": 8},
                {"group_name": "Treatment", "description": "Enzyme + Compound X-102 (various concentrations)", "sample_size": 48}
            ],
            "randomization": "Plate-based randomization using a randomized block design to account for edge effects.",
            "blinding": "single",
            "replicates": {
                "biological": 3,
                "technical": 3
            }
        },
        "controls": {
            "positive_controls": ["Nirmatrelvir (PF-07321332)"],
            "negative_controls": ["1% DMSO in assay buffer"],
            "internal_controls": ["Z-factor calculation per plate"],
            "calibration_procedures": ["BCA protein assay for enzyme normalization"]
        },
        "protocol": [
            {
                "phase": "Enzyme Preparation",
                "dependencies": ["Reagent delivery"],
                "qc_checks": ["SDS-PAGE for purity check"],
                "steps": [
                    {
                        "step_id": 1,
                        "instruction": "Thaw Mpro enzyme on ice and dilute to 200 nM in assay buffer.",
                        "duration_mins": 30,
                        "equipment": ["Refrigerated Centrifuge", "Pipettes"],
                        "consumables": ["Low-protein binding tubes"],
                        "temp_celsius": 4,
                        "expected_output": "Ready-to-use enzyme stock.",
                        "failure_modes": ["Protein precipitation"],
                        "troubleshooting": ["Check buffer pH and salt concentration."]
                    }
                ]
            },
            {
                "phase": "Assay Execution",
                "dependencies": ["Enzyme Preparation"],
                "qc_checks": ["Z-factor validation (>0.5)"],
                "steps": [
                    {
                        "step_id": 2,
                        "instruction": "Add FRET substrate and monitor fluorescence at Ex/Em 360/460 nm for 60 minutes.",
                        "duration_mins": 60,
                        "equipment": ["BioTek Synergy H1 Plate Reader"],
                        "consumables": ["Black 384-well microplate"],
                        "temp_celsius": 37,
                        "expected_output": "Raw RFU kinetic data.",
                        "failure_modes": ["Low signal-to-noise ratio"],
                        "troubleshooting": ["Increase substrate concentration."]
                    }
                ]
            }
        ],
        "data_plan": {
            "data_collection_methods": ["Automated plate reader export (Excel/CSV)"],
            "data_format": "CSV",
            "analysis_pipeline": ["Data normalization to DMSO", "Non-linear regression (4-parameter logistic curve)"],
            "statistical_tests": ["ANOVA for cross-group comparisons"],
            "power_analysis": {
                "effect_size": "Large (Cohen's d > 0.8)",
                "power": 0.8,
                "alpha": 0.05
            }
        },
        "compliance": {
            "biosafety": "BSL-2 lab certified for recombinant protein work.",
            "ethical_approval_required": False,
            "regulatory_bodies": ["Institutional Biosafety Committee (IBC)"],
            "waste_disposal": ["Autoclave all biological waste; dispose of chemicals in hazardous waste stream."]
        },
        "logistics": {
            "reagents": [
                {
                    "name": "SARS-CoV-2 Mpro Recombinant Protein",
                    "vendor_hint": "R&D Systems",
                    "catalog_no": "10656-CV",
                    "quantity": "50 ug",
                    "unit_price": 450.00,
                    "is_in_stock_simulated": True
                },
                {
                    "name": "Fluorogenic Mpro Substrate",
                    "vendor_hint": "BPS Bioscience",
                    "catalog_no": "79952",
                    "quantity": "1 mg",
                    "unit_price": 320.00,
                    "is_in_stock_simulated": True
                }
            ],
            "equipment_availability": [
                {"equipment": "Plate Reader", "is_available": True, "booking_required": True},
                {"equipment": "-80C Freezer", "is_available": True, "booking_required": False}
            ],
            "total_budget": 1250.00,
            "budget_breakdown": {
                "reagents": 770.00,
                "labor": 400.00,
                "equipment": 80.00
            },
            "lead_time_days": 5,
            "alternate_suppliers": ["Sigma-Aldrich", "MedChemExpress"]
        },
        "execution_plan": {
            "timeline": [
                {"day": 1, "tasks": ["Buffer prep", "Enzyme thawing", "Plate mapping"]},
                {"day": 2, "tasks": ["Running the assay", "Data analysis"]}
            ],
            "milestones": ["Successful Z-factor validation", "IC50 calculation completion"],
            "go_no_go_points": ["Go if Z-factor > 0.6; No-Go if CV of replicates > 20%"]
        },
        "operational_readiness": {
            "staff_skills": ["Enzyme kinetics", "Microplate handling"],
            "critical_warnings": ["Compound X-102 is light sensitive; work in amber tubes."],
            "expected_bottlenecks": ["Availability of the high-throughput plate reader."]
        },
        "risk_management": {
            "critical_warnings": ["Chemical toxicity unknown; handle with double gloves."],
            "expected_bottlenecks": ["Supply chain delay for viral enzyme."],
            "contingency_plans": ["In-house protein expression if vendor delivery fails."]
        },
        "reporting": {
            "deliverables": ["Final IC50 Report", "Raw kinetic data curves", "Plate maps"],
            "report_format": "PDF / ELN Page",
            "reproducibility_notes": ["Ensure batch-to-batch enzyme consistency."]
        },
        "drug_candidate_specs": {
            "molecular_weight": 452.5,
            "solubility_profile": "Soluble in DMSO up to 50 mM; poorly soluble in water.",
            "storage_conditions": "-20C, dry, protected from light",
            "purity_requirement": ">98.5%"
        },
        "quality_assurance": {
            "positive_control_expected_range": "IC50 = 3 - 10 nM",
            "negative_control_threshold": "< 2.0% inhibition",
            "plate_map_layout": "Standard 384-well randomized layout attached."
        },
        "data_management": {
            "eln_target_folder": "/Projects/SARS-CoV-2/Mpro_Inhibitors",
            "raw_data_storage": "Local Secure Server",
            "audit_trail_enabled": True
        }
    }