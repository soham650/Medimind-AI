import re
from typing import Dict, Any, List, Optional

class PatientContextEngine:
    """
    Patient Clinical Context Builder.
    Enforces the Principle of Minimum Necessary Protected Health Information (PHI).
    Never transmits full patient demographic or administrative databases to AI providers.
    """

    @classmethod
    def build_minimal_context(
        cls,
        symptoms_or_req: Any = None,
        vitals: Optional[Dict[str, Any]] = None,
        known_allergies: Optional[List[str]] = None,
        recent_findings: Optional[List[Dict[str, Any]]] = None,
        previous_assessments: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Extracts only clinically relevant context for assessment, scrubbing PII.
        Accepts either a ClinicalAssessmentRequest object or explicit parameters.
        """
        symptoms = []
        medical_history = []
        active_medications = []
        lab_findings = []
        severity = None
        duration = None
        user_query = None

        if symptoms_or_req is not None:
            if hasattr(symptoms_or_req, "symptoms"):
                symptoms = symptoms_or_req.symptoms or []
                vitals = vitals or symptoms_or_req.vitals
                known_allergies = known_allergies or getattr(symptoms_or_req, "known_allergies", None)
                recent_findings = recent_findings or getattr(symptoms_or_req, "recent_findings", None)
                medical_history = getattr(symptoms_or_req, "medical_history", None) or []
                active_medications = getattr(symptoms_or_req, "active_medications", None) or []
                lab_findings = getattr(symptoms_or_req, "lab_findings", None) or []
                severity = getattr(symptoms_or_req, "severity", None)
                duration = getattr(symptoms_or_req, "duration", None)
                user_query = getattr(symptoms_or_req, "user_query", None)
            elif isinstance(symptoms_or_req, list):
                symptoms = symptoms_or_req
            elif isinstance(symptoms_or_req, dict):
                symptoms = symptoms_or_req.get("symptoms", [])
                vitals = vitals or symptoms_or_req.get("vitals")
                known_allergies = known_allergies or symptoms_or_req.get("known_allergies")
                recent_findings = recent_findings or symptoms_or_req.get("recent_findings")
                medical_history = symptoms_or_req.get("medical_history", [])
                active_medications = symptoms_or_req.get("active_medications", [])
                lab_findings = symptoms_or_req.get("lab_findings", [])
                severity = symptoms_or_req.get("severity")
                duration = symptoms_or_req.get("duration")
                user_query = symptoms_or_req.get("user_query")

        # Fallbacks from kwargs
        severity = severity or kwargs.get("severity")
        duration = duration or kwargs.get("duration")
        user_query = user_query or kwargs.get("user_query")

        # 1. Clean symptoms
        clean_symptoms = [str(s).strip().lower() for s in (symptoms or []) if str(s).strip()]

        # 2. Extract strictly relevant vitals (excluding ssn, id, address, phone)
        sanitized_vitals = {}
        if vitals and isinstance(vitals, dict):
            for key in ["age", "bmi", "blood_sugar", "bp_systolic", "bp_diastolic", "smoking"]:
                val = vitals.get(key)
                if val is not None:
                    try:
                        sanitized_vitals[key] = float(val) if key != "smoking" else int(val)
                    except (ValueError, TypeError):
                        pass

        # 3. Clean allergies
        clean_allergies = [
            str(a).strip().title() for a in (known_allergies or []) if str(a).strip()
        ]

        # 4. Filter recent lab findings (combining lab_findings and recent_findings)
        curated_findings = []
        raw_labs = (lab_findings or []) + (recent_findings or [])
        if raw_labs and isinstance(raw_labs, list):
            for f in raw_labs[:5]:
                if isinstance(f, dict):
                    name = f.get("name") or f.get("parameter_name") or f.get("test") or f.get("parameter")
                    val = f.get("value") or f.get("observed_value")
                    unit = f.get("unit") or f.get("standard_unit") or ""
                    status = f.get("status") or f.get("flag") or "Normal"
                    if name and val is not None:
                        curated_findings.append({
                            "parameter": str(name).strip(),
                            "value": str(val).strip(),
                            "unit": str(unit).strip(),
                            "status": str(status).strip()
                        })

        # 5. Clean medical history
        curated_history = [str(h).strip() for h in (medical_history or []) if str(h).strip()]

        # 6. Clean active medications
        curated_medications = [str(m).strip() for m in (active_medications or []) if str(m).strip()]

        # 7. Summarize previous assessments (max 2)
        curated_prev = []
        if previous_assessments and isinstance(previous_assessments, list):
            for pa in previous_assessments[:2]:
                if isinstance(pa, dict):
                    cond = pa.get("predicted_disease") or pa.get("predicted_condition")
                    risk = pa.get("risk_level") or "Moderate"
                    date = pa.get("created_at") or pa.get("date") or "Recent"
                    if cond:
                        curated_prev.append({
                            "condition": str(cond),
                            "risk_level": str(risk),
                            "date": str(date)[:10]
                        })

        # Fallback history if previous_assessments not passed but medical_history is
        if not curated_prev and curated_history:
            curated_prev = [{"condition": h, "risk_level": "Documented History", "date": "Chronic"} for h in curated_history]

        # Scrub PII from free-text user_query
        scrubbed_query = None
        if user_query:
            q = str(user_query).strip()
            q = re.sub(r'\b\d{3}-\d{2}-\d{4}\b', '[REDACTED_SSN]', q)
            q = re.sub(r'\b\d+\s+[A-Za-z0-9\s,.-]+?\b(Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way)\b', '[REDACTED_ADDRESS]', q, flags=re.IGNORECASE)
            q = re.sub(r'\b(\+\d{1,3}[- ]?)?\(?\d{3}\)?[- ]?\d{3}[- ]?\d{4}\b', '[REDACTED_PHONE]', q)
            scrubbed_query = q

        return {
            "symptoms": clean_symptoms,
            "current_symptoms": clean_symptoms,
            "vitals": sanitized_vitals,
            "severity": str(severity).strip() if severity else None,
            "duration": str(duration).strip() if duration else None,
            "user_query": scrubbed_query,
            "known_allergies": clean_allergies,
            "allergies": clean_allergies,
            "relevant_lab_findings": curated_findings,
            "lab_findings": curated_findings,
            "recent_clinical_history": curated_prev,
            "relevant_history": curated_history if curated_history else [p["condition"] for p in curated_prev],
            "active_medications": curated_medications
        }

    @classmethod
    def format_as_prompt_block(cls, context: Dict[str, Any]) -> str:
        """Formats the minimal context into structured XML for prompt inclusion."""
        lines = ["<patient_context>"]
        
        # Symptoms
        symptoms = context.get("symptoms") or context.get("current_symptoms", [])
        lines.append(f"  <current_symptoms>{', '.join(symptoms) if symptoms else 'None reported'}</current_symptoms>")
        
        # Severity & Duration
        if context.get("severity"):
            lines.append(f"  <symptom_severity>{context['severity']}</symptom_severity>")
        if context.get("duration"):
            lines.append(f"  <symptom_duration>{context['duration']}</symptom_duration>")

        # Vitals
        vitals = context.get("vitals", {})
        if vitals:
            vitals_str = ", ".join(f"{k}: {v}" for k, v in vitals.items())
            lines.append(f"  <vitals>{vitals_str}</vitals>")
        else:
            lines.append("  <vitals>Not provided</vitals>")

        # Allergies
        allergies = context.get("known_allergies") or context.get("allergies", [])
        lines.append(f"  <allergies>{', '.join(allergies) if allergies else 'None documented'}</allergies>")

        # Lab findings
        findings = context.get("lab_findings") or context.get("relevant_lab_findings", [])
        if findings:
            find_str = "; ".join(f"{f['parameter']}={f['value']} {f['unit']} ({f['status']})" for f in findings)
            lines.append(f"  <recent_findings>{find_str}</recent_findings>")

        # History
        history = context.get("recent_clinical_history", [])
        if history:
            hist_str = "; ".join(f"{h['condition']} ({h['risk_level']}, {h['date']})" for h in history)
            lines.append(f"  <previous_assessments>{hist_str}</previous_assessments>")

        lines.append("</patient_context>")
        return "\n".join(lines)
