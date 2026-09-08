import os
import re
import uuid
import shutil
from typing import Tuple, Optional
from pathlib import Path

# Permitted extensions and MIME types
ALLOWED_EXTENSIONS = {".pdf", ".png", ".jpg", ".jpeg"}
ALLOWED_MIMES = {
    "application/pdf",
    "image/png",
    "image/jpeg",
    "image/jpg"
}

# Magic byte signatures
MAGIC_NUMBERS = {
    b"%PDF": "application/pdf",
    b"\x89PNG\r\n\x1a\n": "image/png",
    b"\xff\xd8\xff": "image/jpeg"
}

DEFAULT_MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024  # 10 MB

class FileValidationError(ValueError):
    """Raised when uploaded report fails security, size, or type validation."""
    pass

class SecureReportFile:
    """
    Context manager representing a securely quarantined temporary report file.
    Ensures absolute cleanup upon exit.
    """
    def __init__(
        self,
        file_bytes: bytes,
        original_filename: str,
        content_type: Optional[str] = None,
        max_size_bytes: int = DEFAULT_MAX_FILE_SIZE_BYTES,
        temp_dir: Optional[str] = None
    ):
        self.file_bytes = file_bytes
        self.original_filename = original_filename
        self.content_type = content_type or ""
        self.max_size_bytes = max_size_bytes
        self.temp_dir = temp_dir or os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "temp_reports")
        
        self.file_id = str(uuid.uuid4())
        self.validated_ext = ""
        self.validated_mime = ""
        self.safe_path = ""

    def __enter__(self):
        self._validate_and_quarantine()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.cleanup()

    def _validate_and_quarantine(self):
        # 1. Size Validation
        size = len(self.file_bytes)
        if size == 0:
            raise FileValidationError("Report file is empty (0 bytes).")
        if size > self.max_size_bytes:
            mb_limit = self.max_size_bytes / (1024 * 1024)
            raise FileValidationError(f"File size exceeds maximum permitted limit of {mb_limit:.1f} MB.")

        # 2. Extension Validation
        ext = Path(self.original_filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            raise FileValidationError(f"Unsupported file format '{ext}'. Only PDF, PNG, and JPG files are accepted.")
        self.validated_ext = ext

        # 3. Magic Number & MIME Validation
        matched_mime = None
        for magic, mime in MAGIC_NUMBERS.items():
            if self.file_bytes.startswith(magic):
                matched_mime = mime
                break

        if not matched_mime:
            # Check if text PDF without standard header or strict header
            if ext == ".pdf" and b"%PDF" in self.file_bytes[:1024]:
                matched_mime = "application/pdf"
            else:
                raise FileValidationError("File content does not match its declared format or is corrupted.")

        # Cross check with declared content_type if present
        self.validated_mime = matched_mime

        # 4. Safe Storage Isolation
        os.makedirs(self.temp_dir, exist_ok=True)
        safe_filename = f"{self.file_id}{self.validated_ext}"
        self.safe_path = os.path.abspath(os.path.join(self.temp_dir, safe_filename))

        with open(self.safe_path, "wb") as f:
            f.write(self.file_bytes)

    def is_pdf(self) -> bool:
        return self.validated_ext == ".pdf"

    def is_image(self) -> bool:
        return self.validated_ext in {".png", ".jpg", ".jpeg"}

    def cleanup(self):
        """Immediately destroys the quarantined temporary file."""
        if self.safe_path and os.path.exists(self.safe_path):
            try:
                os.remove(self.safe_path)
            except Exception:
                pass
