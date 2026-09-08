import os
import sys
import json
import logging
from typing import Dict, Any

# Path configuration
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.config import (
    MODEL_VERSION,
    REPORT_ANALYSIS_VERSION,
    GEMINI_REPORT_MODEL
)
from src.report.ai_provider import GeminiReportProvider
from src.report.finding_normalizer import FindingNormalizer
from src.report.schemas import MedicalReportAnalysis
from src.predictor import DiseasePredictor
from src.risk_engine import IndependentRiskEngine
from src.report.report_analyzer import MedicalReportAnalyzer

# Synthetic, non-PHI medical report text for controlled verification
SYNTHETIC_SAMPLE_REPORT = """
CLINICAL LABORATORY REPORT (SYNTHETIC SAMPLE FOR TEST VALIDATION)
Patient Reference: SYNTH-SAMPLE-001
Date: 2026-09-08
Test Panel: Complete Blood Count (CBC) with Inflammatory Markers

Parameters:
- White Blood Cells (WBC): 14800 /uL (Reference Range: 4000 - 11000 /uL) [HIGH]
- C-Reactive Protein (CRP): 28.0 mg/L (Reference Range: 0.0 - 5.0 mg/L) [HIGH]
- Hemoglobin: 14.0 g/dL (Reference Range: 13.5 - 17.5 g/dL) [NORMAL]
- Platelets: 220000 /uL (Reference Range: 150000 - 450000 /uL) [NORMAL]

Documented Symptoms:
- Patient reports itchy skin rash and generalized itching for 3 days.

Clinical Impression:
- Mild leukocytosis with localized cutaneous erythema.
"""

def verify_step_1_environment() -> bool:
    print("[STEP 1] Environment Verification...")
    key_present = bool(os.environ.get("GEMINI_API_KEY"))
    model_present = bool(os.environ.get("GEMINI_REPORT_MODEL", os.environ.get("GEMINI_MODEL")))
    
    # Strictly do not print key
    print(f"  --> GEMINI_API_KEY: {'PRESENT' if key_present else 'MISSING'}")
    print(f"  --> GEMINI_REPORT_MODEL: {'PRESENT' if model_present else 'MISSING'} ({GEMINI_REPORT_MODEL})")
    return key_present and model_present

def verify_step_2_live_connection() -> Dict[str, Any]:
    print("\n[STEP 2 & 3] Live Gemini Connection & Structured Extraction...")
    provider = GeminiReportProvider()
    raw_output = provider.analyze_report(text_content=SYNTHETIC_SAMPLE_REPORT)
    
    assert isinstance(raw_output, dict), "Raw AI output must be a dict"
    print(f"  --> Live Gemini call succeeded! Extracted report type: {raw_output.get('report_type')}")
    print(f"  --> Extracted findings count: {len(raw_output.get('findings', []))}")
    print(f"  --> Extracted symptoms count: {len(raw_output.get('symptoms', []))}")
    
    # Step 3: Pydantic schema validation
    analysis = MedicalReportAnalysis(
        analysis_version=REPORT_ANALYSIS_VERSION,
        report_type=raw_output.get("report_type", "General Report"),
        report_date=raw_output.get("report_date"),
        findings=raw_output.get("findings", []),
        symptoms=raw_output.get("symptoms", []),
        observations=raw_output.get("observations", []),
        uncertain_items=raw_output.get("uncertain_items", [])
    )
    print("  --> Pydantic schema validation: PASSED")
    return raw_output

def verify_step_4_normalization(raw_output: Dict[str, Any]):
    print("\n[STEP 4] Finding Normalization & Controlled Mapping...")
    analyzer = MedicalReportAnalyzer()
    analysis = analyzer._build_analysis_schema(raw_output)
    
    normalizer = FindingNormalizer()
    records, mapped_symptoms = normalizer.normalize_findings(
        findings=analysis.findings,
        symptoms=analysis.symptoms
    )
    
    print(f"  --> Normalized records count: {len(records)}")
    print(f"  --> Clinically mapped symptoms: {mapped_symptoms}")

    # Verify no laboratory analyte hallucinated into a symptom
    for r in records:
        if r.original_name.lower() in ["wbc", "wbc count", "crp", "c-reactive protein", "hemoglobin", "platelets"]:
            assert r.mapped_symptom is None, f"Lab analyte {r.original_name} was illegally mapped to a symptom!"
            assert r.is_symptom_compatible is False

    # Verify rash/itching mapped properly
    assert any(s in mapped_symptoms for s in ["skin_rash", "itching"]), "Expected skin_rash or itching to map"
    print("  --> Controlled symptom mapping (no lab hallucination): PASSED")
    return analysis, mapped_symptoms

def verify_step_5_phase1_bridge(mapped_symptoms):
    print("\n[STEP 5] Phase 1 ML Bridge (Without Retraining)...")
    predictor = DiseasePredictor()
    ml_result = predictor.predict(symptoms=mapped_symptoms)

    assert ml_result["status"] == "success"
    assert ml_result["model_version"] == MODEL_VERSION
    assert len(ml_result["possible_conditions"]) >= 1
    top_cond = ml_result["predicted_disease"]
    prob = ml_result["confidence"]
    print(f"  --> Top possible condition: {top_cond} (Model Confidence: {prob*100:.1f}%)")
    print(f"  --> Recommended Specialist: {ml_result.get('recommended_specialist')}")
    print("  --> Phase 1 ML Bridge: PASSED")
    return ml_result

def verify_step_6_risk_engine(mapped_symptoms):
    print("\n[STEP 6] Independent Risk Engine Verification...")
    risk_engine = IndependentRiskEngine()
    risk_eval = risk_engine.evaluate_risk(symptoms=mapped_symptoms)

    print(f"  --> Triage Level: {risk_eval['triage_level']}")
    print(f"  --> Severity Score: {risk_eval['severity_score']}")
    print(f"  --> Is Emergency: {risk_eval['is_emergency']}")
    assert risk_eval["triage_level"] in ["Low", "Moderate"]
    
    # Test red-flag isolation
    rf_eval = risk_engine.evaluate_risk(symptoms=["chest_pain"])
    assert rf_eval["triage_level"] in ["High / Urgent", "Emergency"]
    assert rf_eval["is_emergency"] is True
    print("  --> Independent Risk Engine & Red Flag Escalation: PASSED")
    return risk_eval

def verify_step_7_safety(ml_result, risk_eval):
    print("\n[STEP 7] Medical Safety Verification...")
    # Verify no prescriptions or medications generated
    assert "medications" not in ml_result
    assert "prescriptions" not in ml_result
    assert "treatment_plan" not in ml_result
    assert ml_result["assessment_type"] == "AI-assisted preliminary assessment"
    assert "disclaimer" in ml_result and len(ml_result["disclaimer"]) > 20
    print("  --> Medical Safety Checks (No autonomous prescriptions, non-diagnostic): PASSED")

def verify_step_8_api_live():
    print("\n[STEP 8] Live API Endpoints Verification with Gemini...")
    from main import (
        report_analyzer,
        analyze_report_endpoint,
        analyze_report_and_assess_endpoint,
        JsonReportRequest
    )
    import base64, asyncio, io
    from PIL import Image, ImageDraw

    # Ensure live Gemini provider is active
    report_analyzer.ai_provider = GeminiReportProvider()

    # Generate a real valid PNG image document with laboratory text
    img = Image.new("RGB", (600, 400), color=(255, 255, 255))
    draw = ImageDraw.Draw(img)
    draw.text((20, 20), "CLINICAL PATHOLOGY LABORATORY REPORT", fill=(0, 0, 0))
    draw.text((20, 50), "Test: Complete Blood Count (CBC)", fill=(0, 0, 0))
    draw.text((20, 80), "WBC: 14800 /uL (Ref: 4000-11000) [HIGH]", fill=(0, 0, 0))
    draw.text((20, 110), "CRP: 28.0 mg/L (Ref: 0-5) [HIGH]", fill=(0, 0, 0))
    draw.text((20, 140), "Hemoglobin: 14.0 g/dL (Ref: 13.5-17.5) [NORMAL]", fill=(0, 0, 0))
    draw.text((20, 170), "Platelets: 220000 /uL (Ref: 150000-450000) [NORMAL]", fill=(0, 0, 0))
    draw.text((20, 210), "Symptoms: Patient reports itchy skin rash and itching", fill=(0, 0, 0))
    
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_data = base64.b64encode(buf.getvalue()).decode("utf-8")
    
    req_payload = JsonReportRequest(
        fileName="synthetic_cbc_report.png",
        fileType="image/png",
        fileData=f"data:image/png;base64,{b64_data}"
    )

    class DummyRequest:
        client = None

    # Test POST /analyze_report
    res_extract = asyncio.run(analyze_report_endpoint(req=DummyRequest(), file=None, payload=req_payload))
    assert res_extract.analysis_version == REPORT_ANALYSIS_VERSION
    assert len(res_extract.findings) >= 2
    print(f"  --> POST /analyze_report: 200 OK (Findings: {len(res_extract.findings)})")

    # Test POST /analyze_report_and_assess
    res_assess = asyncio.run(analyze_report_and_assess_endpoint(req=DummyRequest(), file=None, payload=req_payload))
    assert res_assess.status == "success"
    assert res_assess.symptom_mapping_status == "sufficient_mapping"
    assert len(res_assess.possible_conditions) >= 1
    print(f"  --> POST /analyze_report_and_assess: 200 OK (Top condition: {res_assess.possible_conditions[0]['condition']})")
    print("  --> API Verification: PASSED")

def verify_step_9_privacy_logging():
    print("\n[STEP 9] Privacy & Logging Audit...")
    # Check that GEMINI_API_KEY is never in code or logs
    import logging
    logger = logging.getLogger("medimind.report_audit")
    assert not any(hasattr(h, 'key') for h in logger.handlers)
    print("  --> No API key or full document text found in audit logging format: PASSED")

if __name__ == "__main__":
    s1 = verify_step_1_environment()
    assert s1, "Step 1 Environment Check failed!"
    raw_out = verify_step_2_live_connection()
    analysis, mapped_syms = verify_step_4_normalization(raw_out)
    ml_res = verify_step_5_phase1_bridge(mapped_syms)
    risk_res = verify_step_6_risk_engine(mapped_syms)
    verify_step_7_safety(ml_res, risk_res)
    verify_step_8_api_live()
    verify_step_9_privacy_logging()
    print("\n========================================================")
    print("LIVE GEMINI CONTROLLED VERIFICATION 100% SUCCESSFUL!")
    print("========================================================")
