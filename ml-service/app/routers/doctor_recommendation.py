from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.schemas import DoctorRecommendationResponse

router = APIRouter()

# Local rule-based specialist map for 19 diseases
SPECIALIST_MAP = {
    "Common Cold": "General Physician",
    "Influenza": "General Physician",
    "COVID-19": "Pulmonologist",
    "Typhoid": "General Physician",
    "Dengue": "General Physician",
    "Malaria": "General Physician",
    "Chikungunya": "Rheumatologist",
    "Diabetes": "Endocrinologist",
    "Hypertension": "Cardiologist",
    "Coronary Heart Disease": "Cardiologist",
    "Asthma": "Pulmonologist",
    "Pneumonia": "Pulmonologist",
    "Bronchitis": "Pulmonologist",
    "Tuberculosis": "Pulmonologist",
    "Gastritis": "Gastroenterologist",
    "Food Poisoning": "General Physician",
    "Jaundice": "Hepatologist",
    "Allergic Rhinitis": "Allergist / ENT",
    "Migraine": "Neurologist"
}

@router.get("/recommend", response_model=DoctorRecommendationResponse)
def recommend_doctor(disease: str = Query(..., description="The predicted disease name")):
    clean_disease = disease.strip()
    
    # Try to find mapped specialist
    specialist_type = SPECIALIST_MAP.get(clean_disease)
    
    if not specialist_type:
        # Fallback if disease doesn't match exactly
        for key, value in SPECIALIST_MAP.items():
            if clean_disease.lower() in key.lower():
                specialist_type = value
                clean_disease = key
                break
                
    if not specialist_type:
        specialist_type = "General Physician"
        
    return DoctorRecommendationResponse(
        disease=clean_disease,
        specialist_type=specialist_type
    )
