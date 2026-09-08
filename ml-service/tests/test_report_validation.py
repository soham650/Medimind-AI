import os
import sys
import io
from PIL import Image

# Path configuration
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.report.document_parser import SecureReportFile, FileValidationError

def create_dummy_pdf_bytes(text: str = "Patient Lab Report: Hemoglobin 14.2 g/dL") -> bytes:
    from pypdf import PdfWriter
    writer = PdfWriter()
    writer.add_blank_page(width=200, height=200)
    buf = io.BytesIO()
    writer.write(buf)
    return buf.getvalue()

def create_dummy_image_bytes(fmt: str = "PNG") -> bytes:
    img = Image.new("RGB", (100, 100), color=(255, 255, 255))
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()

def test_valid_pdf_validation():
    print("[TEST] Valid PDF validation...")
    pdf_bytes = create_dummy_pdf_bytes()
    with SecureReportFile(pdf_bytes, "test_report.pdf", "application/pdf") as f:
        assert f.is_pdf() is True
        assert f.is_image() is False
        assert os.path.exists(f.safe_path)
    # Verify auto-cleanup
    assert not os.path.exists(f.safe_path)
    print("  --> Valid PDF PASSED.")

def test_valid_images_validation():
    print("[TEST] Valid Image validation (PNG & JPG)...")
    png_bytes = create_dummy_image_bytes("PNG")
    with SecureReportFile(png_bytes, "scan.png", "image/png") as f:
        assert f.is_image() is True
        assert f.is_pdf() is False
        assert os.path.exists(f.safe_path)
    assert not os.path.exists(f.safe_path)

    jpg_bytes = create_dummy_image_bytes("JPEG")
    with SecureReportFile(jpg_bytes, "photo.jpg", "image/jpeg") as f:
        assert f.is_image() is True
        assert os.path.exists(f.safe_path)
    assert not os.path.exists(f.safe_path)
    print("  --> Valid Image PASSED.")

def test_unsupported_extensions():
    print("[TEST] Rejecting unsupported extensions...")
    try:
        with SecureReportFile(b"fake binary", "malicious.exe", "application/x-msdownload"):
            assert False, "Should have raised FileValidationError"
    except FileValidationError as e:
        assert "Unsupported file format" in str(e)

    try:
        with SecureReportFile(b"plain text", "notes.txt", "text/plain"):
            assert False, "Should have raised FileValidationError"
    except FileValidationError as e:
        assert "Unsupported file format" in str(e)
    print("  --> Unsupported extensions rejected PASSED.")

def test_oversized_file():
    print("[TEST] Rejecting oversized files...")
    dummy_large = b"%PDF" + b"0" * 1024
    try:
        # Limit to 500 bytes for testing limit
        with SecureReportFile(dummy_large, "large.pdf", "application/pdf", max_size_bytes=500):
            assert False, "Should have raised FileValidationError"
    except FileValidationError as e:
        assert "maximum permitted limit" in str(e)
    print("  --> Oversized files rejected PASSED.")

def test_empty_and_corrupt_files():
    print("[TEST] Rejecting empty and corrupt files...")
    try:
        with SecureReportFile(b"", "empty.pdf", "application/pdf"):
            assert False, "Should have raised FileValidationError"
    except FileValidationError as e:
        assert "empty" in str(e)

    try:
        with SecureReportFile(b"not a valid pdf or image header", "corrupt.pdf", "application/pdf"):
            assert False, "Should have raised FileValidationError"
    except FileValidationError as e:
        assert "corrupted" in str(e) or "format" in str(e)
    print("  --> Empty and corrupt files rejected PASSED.")

if __name__ == "__main__":
    test_valid_pdf_validation()
    test_valid_images_validation()
    test_unsupported_extensions()
    test_oversized_file()
    test_empty_and_corrupt_files()
    print("\nALL REPORT VALIDATION TESTS PASSED.")
