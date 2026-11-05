from typing import Dict, Any, List, Optional

class DoctorContextEngine:
    """
    Physician Decision Support Context Engine.
    Structures multi-source clinical information (symptoms, lab findings, ML differentials)
    into an objective consultation aid for attending doctors.
    """

    @classmethod
    def build_doctor_support_packet(
        cls,
        request_or_symptoms: Any = None,
        vitals: Optional[Dict[str, Any]] = None,
        report_findings: Optional[List[Dict[str, Any]]] = None,
        ml_differentials: Optional[List[Dict[str, Any]]] = None,
        risk_profile: Optional[Dict[str, Any]] = None,
        clinical_notes: Optional[str] = None,
        lab_summary: Optional[List[Dict[str, Any]]] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Synthesizes clinician-oriented decision support package.
        Accepts either a DoctorAssistRequest object or individual parameters.
        """
        symptoms = []

        if request_or_symptoms is not None:
            if hasattr(request_or_symptoms, "symptoms"):
                symptoms = request_or_symptoms.symptoms or []
                vitals = vitals or request_or_symptoms.vitals
                clinical_notes = clinical_notes or getattr(request_or_symptoms, "clinical_notes", None)
                lab_summary = lab_summary or getattr(request_or_symptoms, "lab_summary", None) or getattr(request_or_symptoms, "report_findings", None)
            elif isinstance(request_or_symptoms, list):
                symptoms = request_or_symptoms
            elif isinstance(request_or_symptoms, dict):
                symptoms = request_or_symptoms.get("symptoms", [])
                vitals = vitals or request_or_symptoms.get("vitals")
                clinical_notes = clinical_notes or request_or_symptoms.get("clinical_notes")
                lab_summary = lab_summary or request_or_symptoms.get("lab_summary") or request_or_symptoms.get("report_findings")
                ml_differentials = ml_differentials or request_or_symptoms.get("ml_differentials")
                risk_profile = risk_profile or request_or_symptoms.get("risk_profile")

        vitals = vitals or {}
        risk_profile = risk_profile or {}

        # 1. Generate differential considerations if not provided
        if not ml_differentials:
            differentials = []
            try:
                from src.predictor import DiseasePredictor
                pred = DiseasePredictor()
                pred_res = pred.predict(symptoms, vitals)
                differentials = pred_res.get("possible_conditions", [])
            except Exception:
                pass

            if not differentials and symptoms:
                for s in symptoms[:3]:
                    differentials.append({
                        "condition": f"Etiology correlated with {s.replace('_', ' ')}",
                        "probability": 0.75
                    })
            ml_differentials = differentials

        # 2. Summary of presentation
        sym_list = ", ".join(symptoms) if symptoms else "None documented"
        vitals_list = []
        if vitals:
            if vitals.get("bp_systolic") and vitals.get("bp_diastolic"):
                vitals_list.append(f"BP {vitals['bp_systolic']}/{vitals['bp_diastolic']} mmHg")
            if vitals.get("blood_sugar"):
                vitals_list.append(f"Blood Sugar {vitals['blood_sugar']} mg/dL")
            if vitals.get("bmi"):
                vitals_list.append(f"BMI {vitals['bmi']}")

        presentation_summary = f"Patient presents with reported symptoms: {sym_list}."
        if vitals_list:
            presentation_summary += f" Physiological parameters: {', '.join(vitals_list)}."
        if clinical_notes:
            presentation_summary += f" Clinical note context: {clinical_notes.strip()}."

        # 3. Abnormal biomarker alerts
        biomarker_alerts = []
        raw_labs = (lab_summary or []) + (report_findings or [])
        if raw_labs:
            for f in raw_labs:
                status = str(f.get("status") or f.get("flag") or "").lower()
                if any(tag in status for tag in ["high", "low", "abnormal", "critical"]):
                    biomarker_alerts.append({
                        "test": f.get("test") or f.get("name") or f.get("parameter_name") or "Unknown Parameter",
                        "value": f.get("value") or f.get("observed_value"),
                        "unit": f.get("unit") or f.get("standard_unit") or "",
                        "flag": f.get("flag") or f.get("status") or "Abnormal"
                    })

        # 4. Formulate Consultation Checklist
        checklist = [
            "Verify patient identity and confirm reported onset timeline",
            "Perform targeted physical examination corresponding to presenting complaints",
            f"Rule out identified acute red flags: {', '.join(risk_profile.get('red_flags', [])) if risk_profile.get('red_flags') else 'None immediate'}"
        ]

        if biomarker_alerts:
            checklist.append(f"Correlate {len(biomarker_alerts)} abnormal lab markers with current clinical state")

        if risk_profile.get("is_emergency"):
            checklist.insert(0, "EMERGENCY PROTOCOL: Prioritize acute hemodynamic stabilization and immediate ECG / emergency workup")

        return {
            "patient_summary": presentation_summary,
            "differential_considerations": ml_differentials,
            "risk_profile": risk_profile,
            "biomarker_alerts": biomarker_alerts,
            "consultation_checklist": checklist,
            "non_prescriptive_notice": (
                "MediMind AI does not issue prescriptions. "
                "The system provides supportive diagnostic differentials only. "
                "The attending physician retains full responsibility for physical examination, "
                "definitive diagnosis, and prescribing decisions."
            )
        }

    # Alias for backward compatibility
    build_doctor_summary = build_doctor_support_packet
