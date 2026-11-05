import os
import sys
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure src/ can be imported cleanly
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from src.config import MODEL_VERSION, STANDARD_DISCLAIMER
from src.preprocessor import SymptomPreprocessor
from src.predictor import DiseasePredictor
from src.risk_engine import IndependentRiskEngine

# Initialize FastAPI App
app = FastAPI(
    title="MediMind AI/ML Service",
    description=(
        "Production AI-assisted preliminary assessment microservice. "
        "Implements Random Forest symptom classification (symptom-rf-v1) and an independent clinical risk engine. "
        "Strictly provides non-prescriptive, supportive preliminary evaluations."
    ),
    version="1.0.0"
)

# Enable CORS for frontend compatibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize ML Components
preprocessor = SymptomPreprocessor()
predictor = DiseasePredictor()
risk_engine = IndependentRiskEngine()

# -----------------------------------------------------------------------------
# Request & Response Schemas
# -----------------------------------------------------------------------------
class SymptomPredictionRequest(BaseModel):
    symptoms: List[str] = Field(..., description="List of symptoms reported by the patient", json_schema_extra={"example": ["itching", "skin_rash"]})
    vitals: Optional[Dict[str, Any]] = Field(default=None, description="Optional patient physiological vitals")

class PossibleCondition(BaseModel):
    condition: str
    probability: float

class RiskAssessment(BaseModel):
    triage_level: str
    severity_score: int
    is_emergency: bool
    red_flags: List[str]
    vitals_warnings: List[str]
    triage_timeframe: str
    clinical_recommendation: str

class ExplanationInfo(BaseModel):
    summary: str

class SymptomPredictionResponse(BaseModel):
    status: str
    assessment_type: str = "AI-assisted preliminary assessment"
    model_version: str = MODEL_VERSION
    predicted_disease: str
    confidence: float
    possible_conditions: List[PossibleCondition]
    matched_symptoms: List[str]
    unmatched_symptoms: List[str]
    description: str
    precautions: List[str]
    recommended_specialist: str
    risk_assessment: RiskAssessment
    explanation: ExplanationInfo
    disclaimer: str = STANDARD_DISCLAIMER

class VitalsRiskRequest(BaseModel):
    age: Optional[float] = 30
    bmi: Optional[float] = 22.0
    blood_sugar: Optional[float] = 100
    bp_systolic: Optional[float] = 120
    bp_diastolic: Optional[float] = 80
    smoking: Optional[int] = 0
    symptoms: Optional[List[str]] = Field(default_factory=list)

class VitalsRiskResponse(BaseModel):
    status: str = "success"
    assessment_type: str = "risk assessment"
    triage_level: str
    severity_score: int
    is_emergency: bool
    red_flags: List[str]
    vitals_warnings: List[str]
    triage_timeframe: str
    clinical_recommendation: str
    disclaimer: str = STANDARD_DISCLAIMER

# -----------------------------------------------------------------------------
# API Endpoints
# -----------------------------------------------------------------------------
@app.get("/", tags=["System Monitoring"])
def root():
    return {
        "service": "MediMind AI/ML Service",
        "status": "online",
        "model_version": MODEL_VERSION,
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health", tags=["System Monitoring"])
def health_check():
    return { 
        "status": "healthy",
        "service": "MediMind AI/ML Service",
        "model_version": MODEL_VERSION,
        "features_count": len(preprocessor.symptoms_list),
        "classes_count": len(predictor.classes),
        "risk_engine": "active"
    }

@app.get("/symptoms", response_model=List[str], tags=["Symptom Intake"])
def get_symptoms():
    """
    Returns the canonical 132 symptoms mapped in the trained model.
    """
    return preprocessor.symptoms_list

@app.post("/predict_disease", response_model=SymptomPredictionResponse, tags=["Preliminary Assessment"])
@app.post("/predict", response_model=SymptomPredictionResponse, tags=["Preliminary Assessment"])
def predict_disease(payload: SymptomPredictionRequest):
    """
    Executes an AI-assisted preliminary assessment based on reported patient symptoms.
    Returns the top possible condition, differential probabilities, precautions, 
    specialist routing, and independent clinical risk score.
    """
    if not payload.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No symptoms provided. Please select or describe at least one symptom."
        )

    try:
        result = predictor.predict(
            symptoms=payload.symptoms,
            vitals=payload.vitals
        )
        return SymptomPredictionResponse(**result)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Preliminary assessment failed: {str(e)}"
        )

@app.post("/predict_risk", response_model=VitalsRiskResponse, tags=["Risk Assessment"])
def predict_risk(payload: VitalsRiskRequest):
    """
    Independent clinical risk and triage evaluation from vitals and symptoms.
    Decoupled from ML model confidence.
    """
    vitals_dict = {
        "age": payload.age,
        "bmi": payload.bmi,
        "blood_sugar": payload.blood_sugar,
        "bp_systolic": payload.bp_systolic,
        "bp_diastolic": payload.bp_diastolic,
        "smoking": payload.smoking
    }
    symptoms = payload.symptoms or []
    evaluation = risk_engine.evaluate_risk(symptoms, vitals=vitals_dict)
    
    return VitalsRiskResponse(
        status="success",
        assessment_type="risk assessment",
        triage_level=evaluation["triage_level"],
        severity_score=evaluation["severity_score"],
        is_emergency=evaluation["is_emergency"],
        red_flags=evaluation["red_flags"],
        vitals_warnings=evaluation["vitals_warnings"],
        triage_timeframe=evaluation["triage_timeframe"],
        clinical_recommendation=evaluation["clinical_recommendation"]
    )

@app.get("/bias_metrics", tags=["AI Ethics & Transparency"])
def get_bias_metrics():
    """
    AI Transparency, Fairness & Evaluation Metrics on held-out Testing.csv.
    """
    return {
        "model_version": MODEL_VERSION,
        "algorithm": "Random Forest Classifier (Balanced)",
        "training_samples": 4920,
        "validation_strategy": "5-Fold Stratified Cross-Validation on Training.csv",
        "cv_accuracy_mean": 1.0,
        "cv_accuracy_std": 0.0,
        "held_out_evaluation_dataset": "Testing.csv",
        "held_out_samples": 42,
        "test_accuracy": 0.9762,
        "test_macro_f1": 0.9837,
        "clinical_safety_policies": {
            "autonomous_prescriptions": "Disabled (Prescriptions reserved strictly for licensed physicians)",
            "severity_coupling": "Decoupled (ML probability does not dictate medical triage level)",
            "terminology_standard": "AI-assisted preliminary assessment / possible condition"
        }
    }

# -----------------------------------------------------------------------------
# Phase 2: Medical Report Intelligence Endpoints
# -----------------------------------------------------------------------------
import base64
import uuid
import logging
from fastapi import UploadFile, File, Form, Request
from src.report.schemas import MedicalReportAnalysis, ReportAssessmentResponse
from src.report.report_analyzer import MedicalReportAnalyzer
from src.report.rate_limiter import InMemoryRateLimiter
from src.report.document_parser import FileValidationError
from src.config import REPORT_RATE_LIMIT, DEFAULT_MAX_FILE_SIZE_BYTES

# Structured audit logger (No PHI / report text logged)
logger = logging.getLogger("medimind.report_audit")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] [Req:%(message)s]")

report_analyzer = MedicalReportAnalyzer(
    predictor=predictor,
    risk_engine=risk_engine,
    max_file_size_bytes=DEFAULT_MAX_FILE_SIZE_BYTES
)
rate_limiter = InMemoryRateLimiter(max_requests=REPORT_RATE_LIMIT, window_seconds=60)

class JsonReportRequest(BaseModel):
    fileName: Optional[str] = "report.pdf"
    fileType: Optional[str] = "application/pdf"
    fileData: str = Field(..., description="Base64 data or data URL of the report")
    vitals: Optional[Dict[str, Any]] = None

def _extract_bytes_from_input(
    file: Optional[UploadFile],
    payload: Optional[JsonReportRequest]
) -> tuple[bytes, str, str]:
    """Helper to extract raw bytes, filename, and content_type from either multipart or JSON."""
    if file is not None:
        raw_bytes = file.file.read()
        return raw_bytes, file.filename or "report.pdf", file.content_type or "application/pdf"
    
    if payload is not None and payload.fileData:
        data_str = payload.fileData
        content_type = payload.fileType or "application/pdf"
        if "," in data_str:
            header, data_str = data_str.split(",", 1)
            if ";" in header and ":" in header:
                content_type = header.split(";")[0].split(":")[1]
        try:
            raw_bytes = base64.b64decode(data_str)
        except Exception:
            raise HTTPException(status_code=400, detail="Invalid base64 encoding in fileData.")
        return raw_bytes, payload.fileName or "report.pdf", content_type

    raise HTTPException(status_code=400, detail="No report file or fileData provided.")

def _check_rate_limit(req: Request):
    client_ip = req.client.host if req.client else "unknown_client"
    if not rate_limiter.is_allowed(client_ip):
        logger.warning(f"RATE_LIMIT_EXCEEDED | client_ip={client_ip}")
        raise HTTPException(
            status_code=status.HTTP_429_TOO_MANY_REQUESTS,
            detail="Rate limit exceeded for medical report analysis. Please try again in 1 minute."
        )

@app.post("/analyze_report", response_model=MedicalReportAnalysis, tags=["Medical Report Intelligence (Phase 2)"])
@app.post("/analyze", response_model=MedicalReportAnalysis, tags=["Medical Report Intelligence (Phase 2)"])
async def analyze_report_endpoint(
    req: Request,
    file: Optional[UploadFile] = File(None),
    payload: Optional[JsonReportRequest] = None
):
    """
    Extracts and normalizes structured medical laboratory findings and clinical observations.
    Supports PDF (text/scanned) and Image (PNG/JPG) formats.
    """
    _check_rate_limit(req)
    req_id = str(uuid.uuid4())[:8]

    try:
        # Check if incoming request is JSON body
        if file is None and payload is None:
            try:
                body_json = await req.json()
                payload = JsonReportRequest(**body_json)
            except Exception:
                pass

        raw_bytes, filename, content_type = _extract_bytes_from_input(file, payload)
        logger.info(f"{req_id} | Stage=START_ANALYZE | ext={os.path.splitext(filename)[1]} | size={len(raw_bytes)}B")

        analysis = report_analyzer.analyze_document_bytes(
            file_bytes=raw_bytes,
            filename=filename,
            content_type=content_type
        )
        logger.info(f"{req_id} | Stage=ANALYZE_SUCCESS | findings_count={len(analysis.findings)}")
        return analysis

    except FileValidationError as e:
        logger.warning(f"{req_id} | Stage=VALIDATION_FAILED | reason={str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TimeoutError:
        logger.error(f"{req_id} | Stage=TIMEOUT")
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Report analysis timed out. Please try again.")
    except Exception as e:
        logger.error(f"{req_id} | Stage=INTERNAL_ERROR | err_class={type(e).__name__}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Report analysis failed: {str(e)}")

@app.post("/analyze_report_and_assess", response_model=ReportAssessmentResponse, tags=["Medical Report Intelligence (Phase 2)"])
async def analyze_report_and_assess_endpoint(
    req: Request,
    file: Optional[UploadFile] = File(None),
    payload: Optional[JsonReportRequest] = None
):
    """
    End-to-End Report Intelligence Pipeline:
    Extract Findings -> Controlled Symptom Mapping -> Phase 1 Assessment (if symptoms mapped) ->
    Independent Clinical Risk Evaluation -> Doctor Recommendation.
    """
    _check_rate_limit(req)
    req_id = str(uuid.uuid4())[:8]

    try:
        # Check if incoming request is JSON body
        if file is None and payload is None:
            try:
                body_json = await req.json()
                payload = JsonReportRequest(**body_json)
            except Exception:
                pass

        raw_bytes, filename, content_type = _extract_bytes_from_input(file, payload)
        vitals = payload.vitals if payload else None
        logger.info(f"{req_id} | Stage=START_ASSESS | ext={os.path.splitext(filename)[1]} | size={len(raw_bytes)}B")

        assessment = report_analyzer.analyze_and_assess(
            file_bytes=raw_bytes,
            filename=filename,
            content_type=content_type,
            vitals=vitals
        )
        logger.info(f"{req_id} | Stage=ASSESS_SUCCESS | mapped_symptoms={len(assessment.mapped_symptoms)} | triage={assessment.risk_assessment.get('triage_level')}")
        return assessment

    except FileValidationError as e:
        logger.warning(f"{req_id} | Stage=VALIDATION_FAILED | reason={str(e)}")
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except TimeoutError:
        logger.error(f"{req_id} | Stage=TIMEOUT")
        raise HTTPException(status_code=status.HTTP_504_GATEWAY_TIMEOUT, detail="Report analysis timed out. Please try again.")
    except Exception as e:
        logger.error(f"{req_id} | Stage=INTERNAL_ERROR | err_class={type(e).__name__}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=f"Report assessment failed: {str(e)}")

# -----------------------------------------------------------------------------
# Phase 8: Advanced AI Clinical Intelligence & RAG Endpoints
# -----------------------------------------------------------------------------
from src.orchestrator import (
    ClinicalAssessmentRequest,
    StructuredClinicalAssessment,
    DoctorAssistRequest,
    DoctorAssistResponse,
    ChatAssistRequest,
    ChatAssistResponse,
    MediMindAIOrchestrator
)
from src.rag import ClinicalKnowledgeBase, ClinicalRAGRetriever

rag_kb = ClinicalKnowledgeBase()
rag_retriever = ClinicalRAGRetriever(knowledge_base=rag_kb)
orchestrator = MediMindAIOrchestrator(
    predictor=predictor,
    risk_engine=risk_engine,
    rag_retriever=rag_retriever
)

@app.get("/rag_knowledge", tags=["Clinical RAG Knowledge (Phase 8)"])
def get_rag_knowledge():
    """
    Returns curated, authoritative clinical guidelines with citation metadata.
    """
    return {
        "status": "success",
        "total_guidelines": len(rag_kb.corpus),
        "guidelines": rag_kb.list_all_guidelines()
    }

@app.post(
    "/orchestrate_clinical_assessment",
    response_model=StructuredClinicalAssessment,
    tags=["Clinical Intelligence (Phase 8)"]
)
@app.post(
    "/orchestrate_assessment",
    response_model=StructuredClinicalAssessment,
    tags=["Clinical Intelligence (Phase 8)"]
)
def orchestrate_clinical_assessment_endpoint(payload: ClinicalAssessmentRequest):
    """
    Phase 8 Master Clinical Orchestration Pipeline:
    Patient Symptoms + Vitals + Context + Phase 1 RF + Risk Engine + RAG Guidelines ->
    Structured Clinical Assessment with zero-fabrication citations and uncertainty guardrails.
    """
    if not payload.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No symptoms provided. Please report at least one symptom for assessment."
        )
    try:
        assessment = orchestrator.assess_clinical_presentation(payload)
        return assessment
    except Exception as e:
        logger.error(f"Orchestration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Clinical assessment orchestration failed: {str(e)}"
        )

@app.post(
    "/orchestrate_doctor_assist",
    response_model=DoctorAssistResponse,
    tags=["Clinical Intelligence (Phase 8)"]
)
def orchestrate_doctor_assist_endpoint(payload: DoctorAssistRequest):
    """
    Physician Decision Support Pipeline:
    Synthesizes presentation, abnormal biomarker alerts, ML differentials, and clinical guidelines
    into an objective consultation aid for attending doctors.
    """
    try:
        return orchestrator.orchestrate_doctor_assist(payload)
    except Exception as e:
        logger.error(f"Doctor assist orchestration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Doctor decision support failed: {str(e)}"
        )

@app.post(
    "/orchestrate_chat",
    response_model=ChatAssistResponse,
    tags=["Clinical Intelligence (Phase 8)"]
)
@app.post(
    "/message",
    response_model=ChatAssistResponse,
    tags=["Clinical Intelligence (Phase 8)"]
)
def orchestrate_chat_endpoint(payload: ChatAssistRequest):
    """
    Conversational Healthcare Assistant with prompt-injection defense,
    emergency red-flag prioritization, and clinical guardrails.
    """
    try:
        return orchestrator.orchestrate_chat(payload)
    except Exception as e:
        logger.error(f"Chat orchestration failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Chat assistant failed: {str(e)}"
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=False)


