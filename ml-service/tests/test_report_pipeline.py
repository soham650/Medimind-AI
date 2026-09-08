import os
import sys
import io
from PIL import Image

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.predictor import DiseasePredictor
from src.risk_engine import IndependentRiskEngine
from src.report.ai_provider import MockReportProvider
from src.report.report_analyzer import MedicalReportAnalyzer

def make_test_image_bytes():
    img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def test_pipeline_with_symptomatic_report():
    print("[TEST] End-to-End Pipeline: Symptomatic Report -> Phase 1 Prediction...")
    mock_ai = MockReportProvider(scenario="fever_infection")
    analyzer = MedicalReportAnalyzer(ai_provider=mock_ai)

    img_bytes = make_test_image_bytes()
    resp = analyzer.analyze_and_assess(
        file_bytes=img_bytes,
        filename="blood_report.png",
        content_type="image/png"
    )

    assert resp.status == "success"
    assert resp.symptom_mapping_status == "sufficient_mapping"
    assert len(resp.mapped_symptoms) >= 3
    assert len(resp.possible_conditions) >= 1
    assert resp.possible_conditions[0]["probability"] > 0.0
    assert resp.doctor_recommendation.recommended_specialist != ""
    assert resp.risk_assessment["triage_level"] in ["Moderate", "High / Urgent"]

    # Verify medical safety: no medications or prescription keys generated
    resp_dict = resp.model_dump()
    assert "medications" not in resp_dict
    assert "prescriptions" not in resp_dict
    assert "treatment_plan" not in resp_dict
    print("  --> Symptomatic report pipeline PASSED.")

def test_pipeline_with_pure_biochemical_report():
    print("[TEST] End-to-End Pipeline: Pure Biochemical Report -> No Forced Prediction...")
    mock_ai = MockReportProvider(scenario="pure_biochemical_no_symptoms")
    analyzer = MedicalReportAnalyzer(ai_provider=mock_ai)

    img_bytes = make_test_image_bytes()
    resp = analyzer.analyze_and_assess(
        file_bytes=img_bytes,
        filename="lipid_panel.png",
        content_type="image/png"
    )

    assert resp.status == "success"
    assert resp.symptom_mapping_status == "insufficient_symptom_mapping"
    assert len(resp.mapped_symptoms) == 0
    # Crucial rule: zero hallucinated or forced conditions
    assert len(resp.possible_conditions) == 0
    assert resp.doctor_recommendation.recommended_specialist != ""
    print("  --> Pure biochemical report non-forced prediction PASSED.")

def test_pipeline_with_critical_red_flags():
    print("[TEST] End-to-End Pipeline: Critical Red Flag Escalation...")
    mock_ai = MockReportProvider(scenario="red_flag")
    analyzer = MedicalReportAnalyzer(ai_provider=mock_ai)

    img_bytes = make_test_image_bytes()
    resp = analyzer.analyze_and_assess(
        file_bytes=img_bytes,
        filename="cardiac_emergency.png",
        content_type="image/png"
    )

    assert resp.status == "success"
    assert resp.risk_assessment["triage_level"] == "Emergency"
    assert resp.risk_assessment["is_emergency"] is True
    assert any("chest_pain" in rf or "Troponin" in rf for rf in resp.risk_assessment["red_flags"])
    print("  --> Red-flag emergency escalation PASSED.")

if __name__ == "__main__":
    test_pipeline_with_symptomatic_report()
    test_pipeline_with_pure_biochemical_report()
    test_pipeline_with_critical_red_flags()
    print("\nALL REPORT PIPELINE TESTS PASSED.")
