from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field
from src.config import STANDARD_DISCLAIMER, MODEL_VERSION

# -----------------------------------------------------------------------------
# Request Schemas
# -----------------------------------------------------------------------------

class ClinicalAssessmentRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of reported patient symptoms", json_schema_extra={"example": ["fever", "chills", "sweating"]})
    vitals: Optional[Dict[str, Any]] = Field(default=None, description="Optional patient physiological vitals (bp_systolic, blood_sugar, etc.)")
    patient_id: Optional[str] = Field(default=None, description="Optional authenticated patient UUID for context retrieval")
    recent_findings: Optional[List[Dict[str, Any]]] = Field(default=None, description="Extracted medical report findings")
    known_allergies: Optional[List[str]] = Field(default=None, description="List of known drug or substance allergies")
    medical_history: Optional[List[str]] = Field(default=None, description="Known past medical conditions or history")
    active_medications: Optional[List[str]] = Field(default=None, description="Active prescriptions or medications")
    lab_findings: Optional[List[Dict[str, Any]]] = Field(default=None, description="Structured lab findings")
    user_query: Optional[str] = Field(default=None, description="Optional patient natural language question or description")
    severity: Optional[str] = Field(default=None, description="Reported symptom severity (e.g. Mild, Moderate, Severe)")
    duration: Optional[str] = Field(default=None, description="Reported symptom duration (e.g. Started today, Past 2-3 days, More than a week)")

class DoctorAssistRequest(BaseModel):
    patient_id: Optional[str] = Field(default=None, description="Patient UUID for clinical history retrieval")
    doctor_id: Optional[str] = Field(default=None, description="Doctor UUID requesting clinical assistance")
    symptoms: Optional[List[str]] = Field(default=None, description="Reported patient symptoms")
    vitals: Optional[Dict[str, Any]] = Field(default=None, description="Patient vital signs")
    report_findings: Optional[List[Dict[str, Any]]] = Field(default=None, description="Structured lab findings from recent reports")
    lab_summary: Optional[List[Dict[str, Any]]] = Field(default=None, description="Structured lab findings summary")
    clinical_notes: Optional[str] = Field(default=None, description="Doctor's preliminary clinical observations")

class ChatAssistRequest(BaseModel):
    message: str = Field(..., description="User message text")
    history: Optional[List[Dict[str, Any]]] = Field(default=None, description="Recent conversation history")
    patient_context: Optional[Dict[str, Any]] = Field(default=None, description="Optional minimum necessary clinical context")
    role: Optional[str] = Field(default="patient", description="User role: patient or doctor")

# -----------------------------------------------------------------------------
# Response Schemas
# -----------------------------------------------------------------------------

class ConditionProbability(BaseModel):
    condition: str
    probability: float
    icd10_code: Optional[str] = None

class ClinicalSourceCitation(BaseModel):
    citation_id: str
    title: str
    source_organization: str
    document_version: str
    publication_date: Optional[str] = None
    icd10_code: Optional[str] = None
    esi_acuity_level: Optional[int] = None

class PatientRecommendationItem(BaseModel):
    title: str
    description: str
    category: str = Field(default="home_care", description="'home_care' | 'monitoring' | 'doctor_consultation' | 'emergency'")
    icon: Optional[str] = None

class StructuredClinicalAssessment(BaseModel):
    status: str = "success"
    assessment_type: str = "AI-assisted preliminary assessment"
    model_version: str = f"{MODEL_VERSION} + gemini-3.5-flash-lite + rag-v1"
    summary: str
    predicted_condition: str
    confidence: float
    possible_conditions: List[ConditionProbability]
    risk_level: str  # "Low" | "Moderate" | "High" | "Critical"
    is_emergency: bool
    red_flags: List[str]
    vitals_warnings: List[str]
    triage_timeframe: str
    clinical_explanation: str
    recommended_specialist: str
    recommended_next_step: str
    non_pharmacological_precautions: List[str]
    recommendations: List[PatientRecommendationItem] = Field(default_factory=list, description="Patient-friendly, context-aware clinical recommendations")
    home_care_guidance: Optional[str] = None
    doctor_review_required: bool = True
    sources: List[ClinicalSourceCitation]
    uncertainty_statement: str
    disclaimer: str = STANDARD_DISCLAIMER

class DoctorAssistResponse(BaseModel):
    status: str = "success"
    assistance_type: str = "Physician Decision Support"
    patient_summary: str
    differential_considerations: List[Dict[str, Any]]
    risk_profile: Dict[str, Any]
    biomarker_alerts: List[Dict[str, Any]]
    recommended_guidelines: List[ClinicalSourceCitation]
    consultation_checklist: List[str]
    non_prescriptive_notice: str = "MediMind AI does not issue prescriptions or definitive diagnoses. Clinical decisions and signed orders remain exclusively with the attending physician."

class ChatAssistResponse(BaseModel):
    status: str = "success"
    reply: str
    risk_level: str
    is_emergency: bool
    red_flags_detected: List[str]
    doctor_consult_advised: bool
    sources: List[ClinicalSourceCitation]
    disclaimer: str = STANDARD_DISCLAIMER
