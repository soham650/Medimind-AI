import os
import pickle
from fastapi import APIRouter, HTTPException, status
from app.schemas.schemas import PredictRiskRequest, PredictRiskResponse
from app.config import MODELS_DIR

router = APIRouter()

# Load the dictionary of risk models
models_path = os.path.join(MODELS_DIR, "risk_models.pkl")
if not os.path.exists(models_path):
    raise RuntimeError(f"Risk models pickle file not found: {models_path}")

with open(models_path, "rb") as f:
    risk_models = pickle.load(f)


@router.post("/predict_risk", response_model=PredictRiskResponse)
def predict_risk(payload: PredictRiskRequest):
    try:
        # Features ordered exactly as they were during training:
        # ["age", "bmi", "blood_sugar", "bp_systolic", "bp_diastolic", "smoking"]
        features = [[
            payload.age,
            payload.bmi,
            payload.blood_sugar,
            payload.bp_systolic,
            payload.bp_diastolic,
            payload.smoking
        ]]
        
        # Predict each target
        heart_risk = float(risk_models["heart_disease_risk"].predict(features)[0])
        diabetes_risk = float(risk_models["diabetes_risk"].predict(features)[0])
        stroke_risk = float(risk_models["stroke_risk"].predict(features)[0])
        
        return PredictRiskResponse(
            heart_disease_risk=round(heart_risk, 2),
            diabetes_risk=round(diabetes_risk, 2),
            stroke_risk=round(stroke_risk, 2)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Risk prediction execution failed: {str(e)}"
        )
