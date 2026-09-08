import os
from typing import Tuple, List, Dict, Any
from pypdf import PdfReader

class PDFProcessor:
    """
    Extracts text from digital PDFs and detects whether OCR / visual inspection is needed.
    """
    @staticmethod
    def process_pdf(pdf_path: str) -> Tuple[bool, str, List[Dict[str, Any]]]:
        """
        Reads a PDF file.
        Returns:
            has_selectable_text: bool
            full_text: str
            page_records: List[Dict] with page_number and text
        """
        if not os.path.exists(pdf_path):
            raise FileNotFoundError("PDF file does not exist.")

        reader = PdfReader(pdf_path)
        page_records = []
        combined_text = []

        for idx, page in enumerate(reader.pages):
            try:
                page_text = page.extract_text() or ""
            except Exception:
                page_text = ""

            clean_text = page_text.strip()
            if clean_text:
                combined_text.append(clean_text)
                page_records.append({
                    "page_number": idx + 1,
                    "text": clean_text
                })

        full_text = "\n\n".join(combined_text).strip()
        
        # Determine if machine-readable text is sufficient (e.g. > 50 characters)
        alphanumeric_count = sum(1 for c in full_text if c.isalnum())
        has_selectable_text = alphanumeric_count >= 50

        return has_selectable_text, full_text, page_records
