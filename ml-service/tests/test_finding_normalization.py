import os
import sys

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.report.finding_normalizer import FindingNormalizer
from src.report.schemas import ReportFinding, ExtractedSymptom

def test_controlled_symptom_mapping():
    print("[TEST] Controlled finding normalization & mapping...")
    normalizer = FindingNormalizer()

    findings = [
        ReportFinding(name="Hemoglobin", value=13.5, unit="g/dL", status="normal"),
        ReportFinding(name="WBC Count", value=14800, unit="/uL", status="high"),
        ReportFinding(name="Itching", value="Present", status="abnormal")
    ]
    symptoms = [
        ExtractedSymptom(name="shortness of breath", severity="moderate"),
        ExtractedSymptom(name="high fever", severity="severe")
    ]

    records, mapped = normalizer.normalize_findings(findings, symptoms)

    # 1. Verify that Hemoglobin and WBC did NOT hallucinate symptoms
    hb_rec = next(r for r in records if r.original_name == "Hemoglobin")
    assert hb_rec.mapped_symptom is None
    assert hb_rec.is_symptom_compatible is False

    wbc_rec = next(r for r in records if r.original_name == "WBC Count")
    assert wbc_rec.mapped_symptom is None
    assert wbc_rec.is_symptom_compatible is False

    # 2. Verify that explicit clinical symptoms mapped accurately
    assert "breathlessness" in mapped
    assert "high_fever" in mapped
    assert "itching" in mapped
    print(f"  --> Successfully mapped: {mapped}")
    print("  --> Controlled finding normalization PASSED.")

def test_pure_biochemical_unmapped():
    print("[TEST] Pure biochemical panels produce zero hallucinated symptoms...")
    normalizer = FindingNormalizer()

    findings = [
        ReportFinding(name="Total Cholesterol", value=210, unit="mg/dL", status="high"),
        ReportFinding(name="Triglycerides", value=180, unit="mg/dL", status="high"),
        ReportFinding(name="Serum Creatinine", value=1.0, unit="mg/dL", status="normal")
    ]
    records, mapped = normalizer.normalize_findings(findings, [])
    assert len(mapped) == 0, f"Expected 0 mapped symptoms, got {mapped}"
    print("  --> Zero hallucinated symptoms for pure biochemical panel PASSED.")

if __name__ == "__main__":
    test_controlled_symptom_mapping()
    test_pure_biochemical_unmapped()
    print("\nALL FINDING NORMALIZATION TESTS PASSED.")
