import os
import sys
import io
import base64
from PIL import Image

TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.report.ai_provider import MockReportProvider
from src.report.report_analyzer import MedicalReportAnalyzer
from src.report.rate_limiter import InMemoryRateLimiter
from main import (
    report_analyzer,
    analyze_report_endpoint,
    analyze_report_and_assess_endpoint,
    JsonReportRequest
)

def make_test_image_b64() -> str:
    img = Image.new("RGB", (80, 80), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return base64.b64encode(buf.getvalue()).decode("utf-8")

def test_analyze_report_endpoint():
    print("[TEST] API Endpoint: POST /analyze_report...")
    # Inject MockReportProvider for deterministic test
    report_analyzer.ai_provider = MockReportProvider(scenario="cbc_abnormal")

    b64_data = make_test_image_b64()
    req_payload = JsonReportRequest(
        fileName="lab_slip.png",
        fileType="image/png",
        fileData=f"data:image/png;base64,{b64_data}"
    )

    class DummyRequest:
        client = None

    import asyncio
    res = asyncio.run(analyze_report_endpoint(req=DummyRequest(), file=None, payload=req_payload))
    assert res.report_type == "Complete Blood Count (CBC)"
    assert len(res.findings) >= 3
    print("  --> /analyze_report PASSED.")

def test_analyze_report_and_assess_endpoint():
    print("[TEST] API Endpoint: POST /analyze_report_and_assess...")
    report_analyzer.ai_provider = MockReportProvider(scenario="fever_infection")

    b64_data = make_test_image_b64()
    req_payload = JsonReportRequest(
        fileName="blood_report.png",
        fileType="image/png",
        fileData=f"data:image/png;base64,{b64_data}"
    )

    class DummyRequest:
        client = None

    import asyncio
    res = asyncio.run(analyze_report_and_assess_endpoint(req=DummyRequest(), file=None, payload=req_payload))
    assert res.status == "success"
    assert res.symptom_mapping_status == "sufficient_mapping"
    assert len(res.possible_conditions) >= 1
    assert res.doctor_recommendation.recommended_specialist != ""
    print("  --> /analyze_report_and_assess PASSED.")

def test_rate_limiter():
    print("[TEST] Rate Limiter sliding window protection...")
    limiter = InMemoryRateLimiter(max_requests=3, window_seconds=60)
    client_ip = "192.168.1.100"

    assert limiter.is_allowed(client_ip) is True
    assert limiter.is_allowed(client_ip) is True
    assert limiter.is_allowed(client_ip) is True
    assert limiter.is_allowed(client_ip) is False  # 4th request blocked
    print("  --> Rate limiter PASSED.")

if __name__ == "__main__":
    test_analyze_report_endpoint()
    test_analyze_report_and_assess_endpoint()
    test_rate_limiter()
    print("\nALL PHASE 2 API TESTS PASSED.")
