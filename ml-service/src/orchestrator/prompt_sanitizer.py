import re
import html
from typing import Tuple, List

ADVERSARIAL_PATTERNS = [
    r"ignore\s+(all\s+)?(previous|prior)\s+(instructions|directives|rules)",
    r"disregard\s+(all\s+)?(previous|prior)\s+(instructions|rules)",
    r"system\s+override",
    r"you\s+are\s+now\s+(unrestricted|in\s+developer\s+mode|dan)",
    r"jailbreak",
    r"act\s+as\s+an?\s+(unrestricted|unlicensed|real)\s+(doctor|physician)",
    r"bypass\s+(safety|clinical|guardrails)",
    r"prescribe\s+(me\s+)?([a-z0-9\s]+)\s+(immediately|now|dose)",
    r"give\s+me\s+a\s+prescription",
    r"format\s+as\s+a\s+doctor'?s\s+prescription",
    r"forget\s+(all\s+)?your\s+instructions"
]

COMPILED_PATTERNS = [re.compile(p, re.IGNORECASE) for p in ADVERSARIAL_PATTERNS]

class PromptSanitizer:
    """
    Defensive sanitizer for clinical input strings.
    Prevents prompt injection, command smuggling, and directive subversion.
    """

    @classmethod
    def detect_injection(cls, text: str) -> Tuple[bool, List[str]]:
        """
        Scans input for known adversarial patterns.
        Returns: (has_injection, matched_patterns)
        """
        if not text:
            return False, []

        matches = []
        for pattern in COMPILED_PATTERNS:
            if pattern.search(text):
                matches.append(pattern.pattern)

        return len(matches) > 0, matches

    @classmethod
    def sanitize_text(cls, text: str, max_chars: int = 2000) -> str:
        """
        Sanitizes raw text, strips control characters, escapes HTML/XML tags,
        and truncates to maximum allowed length.
        """
        if not text:
            return ""

        # Truncate
        cleaned = text[:max_chars].strip()

        # Remove null bytes and non-printable control characters (except newline, tab)
        cleaned = "".join(ch for ch in cleaned if ch == "\n" or ch == "\t" or ch >= " ")

        # HTML escape to prevent XML/HTML tag breaking
        cleaned = html.escape(cleaned, quote=False)

        return cleaned

    # Alias for backward compatibility
    sanitize_input = sanitize_text

    @classmethod
    def wrap_user_input(cls, content: str) -> str:
        """
        Encapsulates untrusted user text into XML patient input tags.
        """
        sanitized = cls.sanitize_text(content)
        return f"<untrusted_patient_input>\n  {sanitized}\n</untrusted_patient_input>"

    @classmethod
    def wrap_as_untrusted_data(cls, tag_name: str, content: str) -> str:
        """
        Safely encapsulates untrusted user data into XML-style data boundaries.
        """
        sanitized = cls.sanitize_text(content)
        return f"<{tag_name}>\n  {sanitized}\n</{tag_name}>"
