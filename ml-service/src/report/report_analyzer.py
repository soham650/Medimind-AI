import os
from typing import Optional, Dict, Any

from src.config import STANDARD_DISCLAIMER
from src.predictor import DiseasePredictor
from src.risk_engine import IndependentRiskEngine
from src.report.schemas import (
    MedicalReportAnalysis,
    ReportFinding,
    ExtractedSymptom,
    ReportObservation,
    UncertainFinding,
    DoctorRecommendationInfo,
    ReportAssessmentResponse
)
from src.report.document_parser import SecureReportFile, DEFAULT_MAX_FILE_SIZE_BYTES
from src.report.pdf_processor import PDFProcessor
from src.report.image_processor import ImageProcessor
from src.report.ai_provider import ReportAIProvider, GeminiReportProvider, PROMPT_VERSION
from src.report.finding_normalizer import FindingNormalizer

class MedicalReportAnalyzer:
    """
    Modular orchestrator for Medical Report Intelligence (Phase 2).
    Connects secure document parsing -> AI structured extraction ->
    controlled symptom mapping -> Phase 1 assessment & risk engine.
    """
    def __init__(
        self,
        ai_provider: Optional[ReportAIProvider] = None,
        predictor: Optional[DiseasePredictor] = None,
        risk_engine: Optional[IndependentRiskEngine] = None,
        max_file_size_bytes: int = DEFAULT_MAX_FILE_SIZE_BYTES
    ):
        self.ai_provider = ai_provider or GeminiReportProvider()
        self.predictor = predictor or DiseasePredictor()
        self.risk_engine = risk_engine or IndependentRiskEngine()
        self.normalizer = FindingNormalizer()
        self.max_file_size_bytes = max_file_size_bytes

    def analyze_document_bytes(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None
    ) -> MedicalReportAnalysis:
        """
        Validates, extracts, and structures raw medical document content into MedicalReportAnalysis.
        """
        with SecureReportFile(
            file_bytes=file_bytes,
            original_filename=filename,
            content_type=content_type,
            max_size_bytes=self.max_file_size_bytes
        ) as secure_file:
            
            # 1. Document Extraction Pathway
            if secure_file.is_pdf():
                has_text, full_text, _ = PDFProcessor.process_pdf(secure_file.safe_path)
                if has_text:
                    raw_ai_output = self.ai_provider.analyze_report(text_content=full_text)
                else:
                    # Scanned PDF without machine-readable text
                    raise ValueError(
                        "The uploaded PDF is a scanned document without embedded text. "
                        "Please upload a high-resolution photo/image (JPG/PNG) or an electronically generated PDF."
                    )
            elif secure_file.is_image():
                is_valid, b64_data, meta = ImageProcessor.process_image(secure_file.safe_path)
                if not is_valid:
                    raise ValueError(f"Image could not be validated: {meta.get('error', 'corrupted')}")
                raw_ai_output = self.ai_provider.analyze_report(
                    image_b64=b64_data,
                    mime_type=secure_file.validated_mime
                )
            else:
                raise ValueError(f"Unsupported file format: {secure_file.validated_ext}")

        # 2. Parse AI response into MedicalReportAnalysis
        return self._build_analysis_schema(raw_ai_output)

    def analyze_and_assess(
        self,
        file_bytes: bytes,
        filename: str,
        content_type: Optional[str] = None,
        vitals: Optional[Dict[str, Any]] = None
    ) -> ReportAssessmentResponse:
        """
        Complete Phase 2 Pipeline:
        Document Extraction -> Finding Normalization -> Controlled Symptom Mapping ->
        Phase 1 ML Predictor (if symptoms mapped) -> Independent Risk Engine.
        """
        # Step 1: Extract structured report findings
        report_analysis = self.analyze_document_bytes(file_bytes, filename, content_type)

        # Non-Medical Document Guard: reject non-medical images immediately
        if not report_analysis.is_medical_report:
            rej_reason = report_analysis.rejection_reason or "This is not a medical report. Please upload a clear photo or PDF of a diagnostic lab report or clinical document."
            return ReportAssessmentResponse(
                status="rejected",
                is_medical_report=False,
                rejection_reason=rej_reason,
                assessment_type="Document Rejection",
                analysis_version=PROMPT_VERSION,
                model_version="symptom-rf-v1",
                report_analysis=report_analysis,
                mapped_symptoms=[],
                symptom_mapping_status="rejected_non_medical",
                possible_conditions=[],
                risk_assessment={
                    "is_emergency": False,
                    "triage_level": "Non-Clinical",
                    "red_flags": [],
                    "vitals_warnings": [],
                    "triage_timeframe": "N/A",
                    "clinical_recommendation": rej_reason
                },
                doctor_recommendation=DoctorRecommendationInfo(
                    recommended_specialist="General Physician",
                    rationale=rej_reason,
                    urgency_level="Non-Clinical"
                ),
                recommendations=[],
                disclaimer=STANDARD_DISCLAIMER
            )

        # Step 2: Normalize findings & perform controlled symptom mapping
        normalized_records, mapped_symptoms = self.normalizer.normalize_findings(
            findings=report_analysis.findings,
            symptoms=report_analysis.symptoms
        )

        # Step 3: Run independent risk engine
        risk_eval = self.risk_engine.evaluate_risk(symptoms=mapped_symptoms, vitals=vitals)

        # Also inspect for any critical abnormal lab indicators (e.g. Troponin high, critical glucose)
        for f in report_analysis.findings:
            lower_name = f.name.lower()
            if "troponin" in lower_name and f.status in ["high", "abnormal"]:
                if "critical_cardiac_biomarker" not in risk_eval["red_flags"]:
                    risk_eval["red_flags"].append(f"Elevated {f.name}")
                risk_eval["triage_level"] = "Emergency"
                risk_eval["is_emergency"] = True
                risk_eval["clinical_recommendation"] = (
                    "Critical cardiac biomarker elevation detected on lab report. "
                    "Proceed to the nearest emergency department immediately."
                )

        # Step 4: Conditional Phase 1 ML assessment
        if mapped_symptoms:
            # Symptoms available for Phase 1 Random Forest model
            ml_pred = self.predictor.predict(symptoms=mapped_symptoms, vitals=vitals)
            possible_conditions = ml_pred.get("possible_conditions", [])
            recommended_spec = ml_pred.get("recommended_specialist", "General Physician")
            mapping_status = "sufficient_mapping"
            recommendation_rationale = (
                f"Documented findings correspond to {len(mapped_symptoms)} recognized clinical indicators. "
                f"Evaluation suggests consulting a {recommended_spec}."
            )
        else:
            # Pure biochemical or non-symptomatic report: do NOT force Random Forest prediction!
            possible_conditions = []
            mapping_status = "insufficient_symptom_mapping"
            
            # Infer specialist from report type or abnormal findings
            rep_type_lower = report_analysis.report_type.lower()
            if "cardiac" in rep_type_lower or "lipid" in rep_type_lower:
                recommended_spec = "Cardiologist"
            elif "liver" in rep_type_lower or "hepatic" in rep_type_lower:
                recommended_spec = "Gastroenterologist / Hepatologist"
            elif "renal" in rep_type_lower or "kidney" in rep_type_lower:
                recommended_spec = "Nephrologist"
            elif "blood" in rep_type_lower or "cbc" in rep_type_lower or "hematology" in rep_type_lower:
                recommended_spec = "General Physician / Hematologist"
            elif "thyroid" in rep_type_lower or "endocrine" in rep_type_lower:
                recommended_spec = "Endocrinologist"
            else:
                recommended_spec = "General Physician"

            recommendation_rationale = (
                "The report contains laboratory data without explicit acute symptoms mapped to our dataset. "
                f"Review of the parameters with a {recommended_spec} is recommended."
            )

        doctor_recommendation = DoctorRecommendationInfo(
            recommended_specialist=recommended_spec,
            rationale=recommendation_rationale,
            urgency_level=risk_eval["triage_level"]
        )

        # Synthesize patient-friendly recommendations tailored to report biomarkers
        report_recs = []
        if risk_eval.get("is_emergency"):
            report_recs.append({
                "title": "Immediate Emergency Medical Review",
                "description": "Critical laboratory biomarkers detected. Seek emergency medical evaluation at the nearest hospital or call 108 / 911 immediately.",
                "category": "emergency",
                "icon": "emergency"
            })
            report_recs.append({
                "title": "Bring Diagnostic Report",
                "description": "Carry a physical or digital copy of this lab report directly to the emergency clinical care team.",
                "category": "monitoring",
                "icon": "monitor_heart"
            })
        else:
            report_recs.append({
                "title": f"Review Findings with a {recommended_spec}",
                "description": f"Schedule a clinical consultation with a {recommended_spec} to correlate these laboratory results with your physical health.",
                "category": "doctor_consultation",
                "icon": "medical_services"
            })
            abnormal_findings = [f for f in report_analysis.findings if f.status in ["high", "low", "abnormal"]]
            if abnormal_findings:
                ab_names = ", ".join([f.name for f in abnormal_findings[:2]])
                report_recs.append({
                    "title": "Track Symptoms & Prepare Questions",
                    "description": f"Note down any recent physical sensations or dietary habits related to {ab_names} for your doctor.",
                    "category": "monitoring",
                    "icon": "monitor_heart"
                })
            else:
                report_recs.append({
                    "title": "Maintain Balanced Lifestyle",
                    "description": "Your analyzed parameters reflect optimal reference ranges. Maintain healthy hydration, balanced nutrition, and regular sleep.",
                    "category": "home_care",
                    "icon": "water_drop"
                })
            report_recs.append({
                "title": "Archive in Longitudinal Record",
                "description": "Keep this diagnostic report saved in your medical records for future longitudinal health comparison.",
                "category": "monitoring",
                "icon": "healing"
            })

        return ReportAssessmentResponse(
            status="success",
            is_medical_report=True,
            rejection_reason=None,
            assessment_type="AI-assisted preliminary assessment",
            analysis_version=PROMPT_VERSION,
            model_version="symptom-rf-v1",
            report_analysis=report_analysis,
            mapped_symptoms=mapped_symptoms,
            symptom_mapping_status=mapping_status,
            possible_conditions=possible_conditions,
            risk_assessment=risk_eval,
            doctor_recommendation=doctor_recommendation,
            recommendations=report_recs,
            disclaimer=STANDARD_DISCLAIMER
        )

    def _build_analysis_schema(self, raw: Dict[str, Any]) -> MedicalReportAnalysis:
        """Safely parses raw JSON output into the MedicalReportAnalysis Pydantic schema."""
        findings = []
        for item in raw.get("findings", []):
            try:
                findings.append(ReportFinding(
                    name=str(item.get("name", "Unknown Test")).strip(),
                    value=item.get("value"),
                    unit=item.get("unit"),
                    reference_range=item.get("reference_range"),
                    status=str(item.get("status", "normal")).lower()
                ))
            except Exception:
                continue

        symptoms = []
        for s in raw.get("symptoms", []):
            try:
                symptoms.append(ExtractedSymptom(
                    name=str(s.get("name", "")).strip(),
                    severity=s.get("severity"),
                    duration=s.get("duration")
                ))
            except Exception:
                continue

        observations = []
        for o in raw.get("observations", []):
            try:
                observations.append(ReportObservation(
                    text=str(o.get("text", "")).strip(),
                    category=o.get("category", "General")
                ))
            except Exception:
                continue

        uncertain = []
        for u in raw.get("uncertain_items", []):
            try:
                uncertain.append(UncertainFinding(
                    text=str(u.get("text", "")).strip(),
                    reason=u.get("reason", "Low legibility")
                ))
            except Exception:
                continue

        is_med = bool(raw.get("is_medical_report", True))
        rejection_reason = raw.get("rejection_reason")
        if not is_med and not rejection_reason:
            rejection_reason = "This is not a medical report. Please upload a clear photo or PDF of a diagnostic lab report or clinical document."

        rep_type = raw.get("report_type")
        if not rep_type or not isinstance(rep_type, str):
            rep_type = "General Medical Report"

        return MedicalReportAnalysis(
            analysis_version=PROMPT_VERSION,
            is_medical_report=is_med,
            rejection_reason=rejection_reason,
            report_type=rep_type,
            report_date=raw.get("report_date"),
            findings=findings,
            symptoms=symptoms,
            observations=observations,
            uncertain_items=uncertain,
            extraction_confidence=0.95 if findings else 0.80,
            disclaimer=(
                "AI-extracted laboratory findings for decision support only. "
                "Consult a licensed physician for clinical interpretation."
            )
        )
