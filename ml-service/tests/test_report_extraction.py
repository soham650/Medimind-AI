import os
import sys
import io
from PIL import Image

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.report.pdf_processor import PDFProcessor
from src.report.image_processor import ImageProcessor
from src.report.ai_provider import MockReportProvider
from src.report.schemas import MedicalReportAnalysis, ReportFinding

def test_image_processor():
    print("[TEST] ImageProcessor metadata and base64 extraction...")
    img = Image.new("RGB", (250, 150), color=(200, 100, 50))
    test_img_path = os.path.join(TEST_DIR, "temp_test_image.png")
    img.save(test_img_path, format="PNG")

    try:
        is_valid, b64_str, meta = ImageProcessor.process_image(test_img_path)
        assert is_valid is True
        assert len(b64_str) > 50
        assert meta["width"] == 250
        assert meta["height"] == 150
        assert meta["format"] == "PNG"
        print("  --> ImageProcessor validation PASSED.")
    finally:
        if os.path.exists(test_img_path):
            os.remove(test_img_path)

def test_mock_ai_provider_structured_output():
    print("[TEST] AI Provider structured output schema...")
    provider = MockReportProvider(scenario="cbc_abnormal")
    res = provider.analyze_report(text_content="Sample CBC Report")
    
    assert "findings" in res
    assert "report_type" in res
    assert len(res["findings"]) >= 3

    # Validate against Pydantic schema
    analysis = MedicalReportAnalysis(
        analysis_version="report-analysis-v1",
        report_type=res["report_type"],
        findings=[ReportFinding(**f) for f in res["findings"]],
        symptoms=[],
        observations=[],
        uncertain_items=[]
    )
    assert analysis.report_type == "Complete Blood Count (CBC)"
    assert len(analysis.findings) >= 3
    print("  --> Mock AI Provider output schema PASSED.")

if __name__ == "__main__":
    test_image_processor()
    test_mock_ai_provider_structured_output()
    print("\nALL REPORT EXTRACTION TESTS PASSED.")
