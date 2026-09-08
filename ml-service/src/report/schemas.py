from typing import List, Optional, Dict, Any, Union
from pydantic import BaseModel, Field

class ReportFinding(BaseModel):
    name: str = Field(..., description="Name of the laboratory analyte or clinical test")
    value: Optional[Union[float, str]] = Field(default=None, description="Quantitative or qualitative observed value")
    unit: Optional[str] = Field(default=None, description="Measurement unit (e.g. mg/dL, g/dL, /uL)")
    reference_range: Optional[str] = Field(default=None, description="Laboratory biological reference interval")
    status: str = Field(default="normal", description="Flag: 'normal', 'high', 'low', 'abnormal', 'inconclusive'")
    source: str = Field(default="medical_report", description="Data provenance source")
    extraction_method: str = Field(default="text", description="Method: 'text', 'ocr', 'vision'")
    page_number: Optional[int] = Field(default=1, description="Source document page number")
    confidence: Optional[float] = Field(default=1.0, description="Extraction confidence score")

class ExtractedSymptom(BaseModel):
    name: str = Field(..., description="Explicitly documented clinical symptom")
    severity: Optional[str] = Field(default=None, description="Documented severity modifier")
    duration: Optional[str] = Field(default=None, description="Documented duration if mentioned")
    source: str = Field(default="medical_report", description="Data provenance source")
    extraction_method: str = Field(default="text", description="Method: 'text', 'ocr', 'vision'")
    page_number: Optional[int] = Field(default=1, description="Document page number")
    confidence: Optional[float] = Field(default=1.0, description="Extraction confidence score")

class ReportObservation(BaseModel):
    text: str = Field(..., description="Summary clinical comment or narrative finding")
    category: Optional[str] = Field(default="General", description="Clinical category")
    source: str = Field(default="medical_report", description="Data provenance source")

class UncertainFinding(BaseModel):
    text: str = Field(..., description="Text or value that could not be reliably extracted")
    reason: Optional[str] = Field(default="Illegible or low contrast", description="Reason for uncertainty")

class MedicalReportAnalysis(BaseModel):
    analysis_version: str = Field(default="report-analysis-v1", description="Prompt and extraction pipeline version")
    report_type: str = Field(default="General Medical Report", description="Identified report category")
    report_date: Optional[str] = Field(default=None, description="Report date if documented")
    findings: List[ReportFinding] = Field(default_factory=list, description="Structured quantitative lab findings")
    symptoms: List[ExtractedSymptom] = Field(default_factory=list, description="Documented clinical symptoms")
    observations: List[ReportObservation] = Field(default_factory=list, description="Clinical impressions and comments")
    uncertain_items: List[UncertainFinding] = Field(default_factory=list, description="Uncertain or low-legibility items")
    extraction_confidence: float = Field(default=1.0, description="Overall extraction reliability score")
    disclaimer: str = Field(
        default="AI-extracted report findings for reference only. Consult a healthcare provider for verification.",
        description="Clinical extraction safety disclaimer"
    )

class NormalizedFinding(BaseModel):
    original_name: str
    canonical_name: str
    mapped_symptom: Optional[str] = None
    status: str
    is_symptom_compatible: bool = False

class DoctorRecommendationInfo(BaseModel):
    recommended_specialist: str
    rationale: str
    urgency_level: str

class ReportAssessmentResponse(BaseModel):
    status: str = "success"
    assessment_type: str = "AI-assisted preliminary assessment"
    analysis_version: str = "report-analysis-v1"
    model_version: str = "symptom-rf-v1"
    report_analysis: MedicalReportAnalysis
    mapped_symptoms: List[str] = Field(default_factory=list, description="Findings mapped to 132 MediMind symptoms")
    symptom_mapping_status: str = Field(
        ...,
        description="'sufficient_mapping' if mapped symptoms exist, 'insufficient_symptom_mapping' if non-symptomatic panel"
    )
    possible_conditions: List[Dict[str, Any]] = Field(default_factory=list, description="Top potential conditions from Phase 1 model")
    risk_assessment: Dict[str, Any] = Field(..., description="Independent clinical risk assessment")
    doctor_recommendation: DoctorRecommendationInfo = Field(..., description="Doctor referral recommendation")
    disclaimer: str = Field(..., description="Mandatory medical legal disclaimer")
