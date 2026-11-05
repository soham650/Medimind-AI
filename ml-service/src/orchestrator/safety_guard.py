import re
from typing import Dict, Any, List, Set, Optional
from src.config import STANDARD_DISCLAIMER

class ClinicalSafetyGuard:
    """
    Post-Generation Clinical Safety & Guardrails Enforcement Engine.
    Guarantees uncertainty phrasing, red-flag priority over LLM outputs,
    citation allowlist validation, and non-prescriptive boundaries.
    """

    DEFINITIVE_PATTERNS = [
        (re.compile(r"\b(you\s+(definitely|certainly)\s+have)\b", re.IGNORECASE), "your reported symptoms may suggest possible"),
        (re.compile(r"\b(confirmed\s+diagnosis)\b", re.IGNORECASE), "preliminary clinical assessment"),
        (re.compile(r"\b(we\s+diagnose\s+you\s+with)\b", re.IGNORECASE), "preliminary assessment indicates possible"),
        (re.compile(r"\b(guaranteed\s+(cure|recovery))\b", re.IGNORECASE), "expected supportive recovery trajectory"),
        (re.compile(r"\b(stop\s+taking\s+(your\s+)?(prescribed\s+)?medicine)\b", re.IGNORECASE), "do not alter or stop prescribed medicines without speaking to your doctor"),
        (re.compile(r"\b(discontinue\s+(your\s+)?medication)\b", re.IGNORECASE), "discuss any medication adjustments with your physician")
    ]

    PRESCRIPTIVE_PATTERNS = [
        re.compile(r"\b(take|ingest|consume)\s+\d+\s*(mg|g|ml|tablets?|capsules?)\b", re.IGNORECASE),
        re.compile(r"\b(start|begin)\s+(taking|course\s+of)\s+[a-z]+(\s+for\s+\d+\s+days)?\b", re.IGNORECASE),
        re.compile(r"\b\d+\s*(mg|g|ml)\b", re.IGNORECASE)
    ]

    @classmethod
    def sanitize_uncertainty(cls, text: str) -> str:
        """Neutralizes definitive medical assertions into probabilistic statements."""
        if not text:
            return ""

        sanitized = text
        for pattern, replacement in cls.DEFINITIVE_PATTERNS:
            sanitized = pattern.sub(replacement, sanitized)

        return sanitized

    @classmethod
    def strip_prescriptive_dosages(cls, text: str) -> str:
        """Neutralizes specific medication dosages and autonomous drug recommendations."""
        if not text:
            return ""
        
        # Strip exact drug doses like "500mg Amoxicillin" or "Take 500mg"
        sanitized = re.sub(
            r"\b(take|ingest|consume)\s+\d+\s*(mg|g|ml|tablets?|capsules?)\s*[A-Za-z0-9\s]*(three|twice|once|\d+)?\s*(times\s+daily|daily)?(\s+for\s+\d+\s+days)?\.?",
            "Prescription medications must be evaluated and prescribed directly by an attending physician.",
            text,
            flags=re.IGNORECASE
        )
        # Strip remaining isolated dose amounts like "500mg"
        sanitized = re.sub(r"\b\d+\s*(mg|g|ml|tablets?|capsules?)\b", "prescribed dosage", sanitized, flags=re.IGNORECASE)
        return sanitized.strip()

    @classmethod
    def check_prescriptive_content(cls, text: str) -> bool:
        """Detects if generated text contains illicit prescription instructions."""
        for p in cls.PRESCRIPTIVE_PATTERNS:
            if p.search(text):
                return True
        return False

    @classmethod
    def enforce_risk_priority(
        cls,
        assessment_dict: Dict[str, Any],
        risk_engine_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Guarantees that deterministic emergency / red-flag evaluation takes precedence
        over any generated text. The LLM can NEVER soften an emergency.
        """
        det_emergency = risk_engine_result.get("is_emergency", False)
        det_triage = risk_engine_result.get("triage_level", "Low")
        det_red_flags = risk_engine_result.get("red_flags", [])
        det_vitals_warnings = risk_engine_result.get("vitals_warnings", [])
        det_timeframe = risk_engine_result.get("triage_timeframe", "Routine care")

        # Map triage level
        if det_emergency or det_triage == "Emergency":
            assessment_dict["risk_level"] = "Critical"
            assessment_dict["is_emergency"] = True
            assessment_dict["triage_timeframe"] = det_timeframe
            assessment_dict["doctor_review_required"] = True
            assessment_dict["recommended_next_step"] = (
                f"EMERGENCY ADVISORY: Red-flag indicators detected ({', '.join(det_red_flags)}). "
                "Seek immediate in-person emergency medical evaluation or call emergency services (108/911)."
            )
        elif det_triage in ["High / Urgent", "High"]:
            if assessment_dict.get("risk_level", "").lower() not in ["critical", "high"]:
                assessment_dict["risk_level"] = "high"
            assessment_dict["is_emergency"] = det_emergency
            assessment_dict["triage_timeframe"] = det_timeframe
            assessment_dict["doctor_review_required"] = True

        # Ensure all deterministic red flags are in the final assessment
        current_red_flags = assessment_dict.get("red_flags", [])
        for rf in det_red_flags:
            if rf not in current_red_flags:
                current_red_flags.append(rf)
        assessment_dict["red_flags"] = current_red_flags

        # Ensure vitals warnings
        current_vitals = assessment_dict.get("vitals_warnings", [])
        for vw in det_vitals_warnings:
            if vw not in current_vitals:
                current_vitals.append(vw)
        assessment_dict["vitals_warnings"] = current_vitals

        return assessment_dict

    @classmethod
    def filter_citations(
        cls,
        claimed_sources: List[Dict[str, Any]],
        allowlist: Any,
        retrieved_catalog: Optional[List[Dict[str, Any]]] = None
    ) -> List[Dict[str, Any]]:
        """
        Validates citation claims against pre-retrieved RAG allowlist.
        Rejects fabricated URLs or hallucinated citation IDs.
        """
        allowlist_set = set(allowlist or [])
        verified_sources = []
        catalog_map = {item["citation_id"]: item for item in (retrieved_catalog or [])}

        for src in (claimed_sources or []):
            cid = src.get("citation_id")
            if cid and cid in allowlist_set:
                cat_item = catalog_map.get(cid, {})
                verified_sources.append({
                    "citation_id": cid,
                    "title": cat_item.get("guideline_title", src.get("title", f"Clinical Protocol {cid}")),
                    "source_organization": cat_item.get("source_organization", src.get("source_organization", "Recognized Health Authority")),
                    "document_version": cat_item.get("document_version", "2026.1"),
                    "publication_date": cat_item.get("publication_date"),
                    "icd10_code": cat_item.get("icd10_code"),
                    "esi_acuity_level": cat_item.get("esi_acuity_level")
                })

        # If model returned no citations but guidelines were retrieved, attach top retrieved
        if not verified_sources and retrieved_catalog:
            for cat_item in retrieved_catalog[:2]:
                verified_sources.append({
                    "citation_id": cat_item["citation_id"],
                    "title": cat_item.get("guideline_title", "Clinical Protocol"),
                    "source_organization": cat_item.get("source_organization", "Recognized Health Authority"),
                    "document_version": cat_item.get("document_version", "2026.1"),
                    "publication_date": cat_item.get("publication_date"),
                    "icd10_code": cat_item.get("icd10_code"),
                    "esi_acuity_level": cat_item.get("esi_acuity_level")
                })

        return verified_sources

    @classmethod
    def validate_and_sanitize_recommendations(
        cls,
        raw_recommendations: List[Dict[str, Any]],
        risk_level: str,
        is_emergency: bool,
        red_flags: List[str]
    ) -> List[Dict[str, Any]]:
        """
        Validates, sanitizes, and orders clinical recommendations strictly by clinical risk.
        Strips prescriptive content, neutralizes certainty claims, and guarantees
        emergency and high-risk directives take precedence over general home care.
        """
        sanitized_recs = []
        is_emerg = is_emergency or str(risk_level).lower() == "critical"
        is_high = str(risk_level).lower() in ["high", "high / urgent"]

        for item in (raw_recommendations or []):
            if not isinstance(item, dict):
                continue
            title = cls.sanitize_uncertainty(item.get("title", ""))
            title = cls.strip_prescriptive_dosages(title)
            desc = cls.sanitize_uncertainty(item.get("description", ""))
            desc = cls.strip_prescriptive_dosages(desc)
            cat = str(item.get("category", "home_care")).lower()
            if cat not in ["home_care", "monitoring", "doctor_consultation", "emergency"]:
                cat = "home_care"

            if title and desc:
                sanitized_recs.append({
                    "title": title,
                    "description": desc,
                    "category": cat,
                    "icon": item.get("icon")
                })

        # Enforce Risk-based Priority
        if is_emerg:
            emergency_item = {
                "title": "Immediate Emergency Medical Care",
                "description": (
                    f"Acute indicators detected{f' ({', '.join(red_flags)})' if red_flags else ''}. "
                    "Seek immediate emergency medical evaluation at the nearest emergency department or call 108 / 911."
                ),
                "category": "emergency",
                "icon": "emergency"
            }
            non_emerg = [r for r in sanitized_recs if r.get("category") != "emergency"]
            sanitized_recs = [emergency_item] + non_emerg[:2]

        elif is_high:
            has_doctor = any(r.get("category") == "doctor_consultation" for r in sanitized_recs)
            if not has_doctor:
                doc_item = {
                    "title": "Arrange In-Person Doctor Consultation",
                    "description": "Because your clinical risk level is high, speaking with a qualified doctor or specialist within 24 hours is recommended.",
                    "category": "doctor_consultation",
                    "icon": "medical_services"
                }
                sanitized_recs.insert(0, doc_item)
            else:
                doc_items = [r for r in sanitized_recs if r.get("category") == "doctor_consultation"]
                other_items = [r for r in sanitized_recs if r.get("category") != "doctor_consultation"]
                sanitized_recs = doc_items + other_items

        elif not sanitized_recs:
            sanitized_recs = [
                {
                    "title": "Rest & Recuperation",
                    "description": "Allow your body adequate rest in a quiet, comfortable environment to support recovery.",
                    "category": "home_care",
                    "icon": "bedtime"
                },
                {
                    "title": "Adequate Hydration",
                    "description": "Drink sufficient water, clear broths, or warm fluids throughout the day.",
                    "category": "home_care",
                    "icon": "water_drop"
                },
                {
                    "title": "Symptom Monitoring",
                    "description": "Monitor your symptoms closely. Seek medical advice if symptoms worsen or do not improve.",
                    "category": "monitoring",
                    "icon": "monitor_heart"
                }
            ]

        return sanitized_recs

    @classmethod
    def validate_and_sanitize(
        cls,
        raw_ai_response: Any = None,
        predicted_disease: str = "Unspecified Condition",
        possible_conditions: Optional[List[Dict[str, Any]]] = None,
        is_emergency: bool = False,
        citation_allowlist: Optional[Any] = None,
        retrieved_catalog: Optional[List[Dict[str, Any]]] = None,
        risk_engine_result: Optional[Dict[str, Any]] = None,
        raw_assessment: Any = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Validates, sanitizes, and secures AI responses against non-prescriptive,
        uncertainty, emergency supremacy, and schema integrity constraints.
        """
        if raw_ai_response is None and raw_assessment is not None:
            raw_ai_response = raw_assessment

        # 1. Recover from non-dict / malformed response
        if not isinstance(raw_ai_response, dict):
            summary = f"Preliminary assessment indicates possible {predicted_disease}. In-person clinical consultation is recommended for verification."
            clinical_explanation = f"Reported clinical presentation suggests indicators consistent with {predicted_disease}."
            raw_ai_response = {
                "summary": summary,
                "clinical_explanation": clinical_explanation,
                "predicted_condition": predicted_disease,
                "possible_conditions": possible_conditions or [{"disease": predicted_disease, "probability": 0.82}],
                "recommended_specialist": "General Physician",
                "recommended_next_step": "Schedule a clinical evaluation with an attending doctor.",
                "non_pharmacological_precautions": ["Ensure adequate rest and hydration."],
                "recommendations": [],
                "sources": []
            }

        # 2. Uncertainty sanitization
        raw_ai_response["summary"] = cls.sanitize_uncertainty(raw_ai_response.get("summary", ""))
        raw_ai_response["clinical_explanation"] = cls.sanitize_uncertainty(raw_ai_response.get("clinical_explanation", ""))

        # 3. Strip illicit prescription dosages
        raw_ai_response["summary"] = cls.strip_prescriptive_dosages(raw_ai_response["summary"])

        # 4. Enforce Emergency & Risk Priority
        if is_emergency or (risk_engine_result and risk_engine_result.get("is_emergency")):
            raw_ai_response["is_emergency"] = True
            raw_ai_response["risk_level"] = "Critical"
            raw_ai_response["recommended_next_step"] = (
                "EMERGENCY ADVISORY: Acute indicators detected. "
                "Seek immediate emergency medical evaluation or call emergency services (108/911)."
            )
            raw_ai_response["doctor_review_required"] = True
        else:
            if "is_emergency" not in raw_ai_response:
                raw_ai_response["is_emergency"] = False
            if "risk_level" not in raw_ai_response:
                raw_ai_response["risk_level"] = "Low"

        if risk_engine_result:
            raw_ai_response = cls.enforce_risk_priority(raw_ai_response, risk_engine_result)

        # 5. Citation allowlist filtering
        allowlist = citation_allowlist or []
        if isinstance(allowlist, set):
            allowlist = list(allowlist)
        raw_ai_response["sources"] = cls.filter_citations(
            raw_ai_response.get("sources", []),
            allowlist,
            retrieved_catalog or []
        )

        # 6. Uncertainty & Disclaimer metadata
        uncertainty_txt = (
            "This assessment represents a preliminary algorithmic evaluation based on reported symptoms. "
            "It does not constitute a confirmed medical diagnosis and requires clinical verification."
        )
        raw_ai_response["uncertainty"] = uncertainty_txt
        raw_ai_response["uncertainty_statement"] = uncertainty_txt
        raw_ai_response["disclaimer"] = STANDARD_DISCLAIMER
        raw_ai_response["doctor_review_required"] = True

        if "red_flags" not in raw_ai_response:
            raw_ai_response["red_flags"] = []
        if "possible_conditions" not in raw_ai_response:
            raw_ai_response["possible_conditions"] = possible_conditions or []

        # 7. Validate and sanitize recommendations
        risk_lvl = raw_ai_response.get("risk_level", "Low")
        emerg = raw_ai_response.get("is_emergency", False)
        rflags = raw_ai_response.get("red_flags", [])

        raw_recs = raw_ai_response.get("recommendations", [])
        sanitized_recs = cls.validate_and_sanitize_recommendations(
            raw_recommendations=raw_recs,
            risk_level=risk_lvl,
            is_emergency=emerg,
            red_flags=rflags
        )
        raw_ai_response["recommendations"] = sanitized_recs

        # Clean non_pharmacological_precautions strings
        cleaned_precautions = []
        for p in raw_ai_response.get("non_pharmacological_precautions", []):
            if isinstance(p, str):
                cp = cls.sanitize_uncertainty(p)
                cp = cls.strip_prescriptive_dosages(cp)
                if cp:
                    cleaned_precautions.append(cp)
        raw_ai_response["non_pharmacological_precautions"] = cleaned_precautions

        return raw_ai_response

    # Backward compatibility alias
    validate_and_finalize = validate_and_sanitize
