from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional

# Symptom Checker / Disease Prediction Schemas
class DiseasePredictionRequest(BaseModel):
    symptoms: List[str] = Field(..., example=["itching", "skin_rash", "chills"])

class RecommendationInfo(BaseModel):
    specialist: str
    description: str
    precautions: List[str]
    diets: List[str]

class FeatureContribution(BaseModel):
    symptom: str
    impact: float

class DiseasePredictionResponse(BaseModel):
    disease: str
    probability: float
    reliability: str
    recommendation: RecommendationInfo
    explainability: List[FeatureContribution]

# Doctor Recommendation Schemas
class DoctorRecommendationResponse(BaseModel):
    disease: str
    specialist_type: str

# Chatbot Schemas
class ChatbotRequest(BaseModel):
    message: str
    history: Optional[List[Dict[str, Any]]] = None

class ChatbotResponse(BaseModel):
    sender: str = "bot"
    text: str
    timestamp: str

# Risk Prediction Schemas
class PredictRiskRequest(BaseModel):
    age: int
    bmi: float
    blood_sugar: float
    bp_systolic: float
    bp_diastolic: float
    smoking: int

class PredictRiskResponse(BaseModel):
    heart_disease_risk: float
    diabetes_risk: float
    stroke_risk: float

# Report Analyzer Schemas
class ReportAnalysisRequest(BaseModel):
    fileName: str
    fileType: str
    fileData: str  # base64 data URI

class LabParameter(BaseModel):
    name: str
    value: float
    unit: str
    range: str
    status: str

class ReportAnalysisResponse(BaseModel):
    patientName: str
    reportDate: str
    summary: str
    parameters: List[LabParameter]
