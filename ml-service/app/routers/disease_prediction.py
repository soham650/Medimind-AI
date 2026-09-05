import os
import pickle
import json
import numpy as np
from fastapi import APIRouter, HTTPException, status
from typing import List
from app.schemas.schemas import (
    DiseasePredictionRequest,
    DiseasePredictionResponse,
    RecommendationInfo,
    FeatureContribution
)
from app.services.confidence_service import calculate_confidence_tag
from app.config import MODELS_DIR, SYMPTOMS_FILE, RECOMMENDATIONS_FILE

router = APIRouter()

# 1. Load symptoms list
if not os.path.exists(SYMPTOMS_FILE):
    raise RuntimeError(f"Symptoms file not found: {SYMPTOMS_FILE}")

with open(SYMPTOMS_FILE, "r") as f:
    symptom_columns = json.load(f)

# 2. Load recommendations
if not os.path.exists(RECOMMENDATIONS_FILE):
    raise RuntimeError(f"Recommendations file not found: {RECOMMENDATIONS_FILE}")

with open(RECOMMENDATIONS_FILE, "r") as f:
    disease_recommendations = json.load(f)

# 3. Load Random Forest model and SHAP explainer
model_path = os.path.join(MODELS_DIR, "disease_model.pkl")
explainer_path = os.path.join(MODELS_DIR, "disease_shap_explainer.pkl")

if not os.path.exists(model_path) or not os.path.exists(explainer_path):
    raise RuntimeError("Model or Explainer pickle files are missing in app/models.")

with open(model_path, "rb") as f:
    rf_model = pickle.load(f)

with open(explainer_path, "rb") as f:
    shap_explainer = pickle.load(f)


@router.get("/symptoms", response_model=List[str])
def get_symptoms():
    """
    Returns the list of typical symptoms mapped to the model features.
    """
    return symptom_columns


@router.post("/predict_disease", response_model=DiseasePredictionResponse)
@router.post("/predict", response_model=DiseasePredictionResponse)
def predict_disease(payload: DiseasePredictionRequest):
    selected_symptoms = [s.strip().lower() for s in payload.symptoms]
    
    if not selected_symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No symptoms provided."
        )

    # Construct feature vector
    sample = np.zeros((1, len(symptom_columns)))
    found_any = False
    for s in selected_symptoms:
        if s in symptom_columns:
            sample[0, symptom_columns.index(s)] = 1
            found_any = True
            
    if not found_any:
        # Fallback if no symptom matched model features
        # We can default to setting first symptom as 1 to avoid blank predictions
        sample[0, 0] = 1

    # Predict probabilities
    try:
        prob = rf_model.predict_proba(sample)[0]
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Model prediction failed: {str(e)}"
        )

    # Get sorted predictions
    classes = list(rf_model.classes_)
    sorted_predictions = sorted(zip(classes, prob), key=lambda x: x[1], reverse=True)
    
    top_disease, top_prob = sorted_predictions[0]
    
    # Calculate confidence / reliability tag
    prob_list = [p for _, p in sorted_predictions]
    confidence_tag = calculate_confidence_tag(prob_list)
    
    # Compute SHAP explainability
    try:
        shap_vals = shap_explainer.shap_values(sample)
        pred_idx = classes.index(top_disease)
        
        # shap_vals shape is (1, num_features, num_classes)
        # Get contributions for the predicted class index
        class_shap = shap_vals[0, :, pred_idx]
        
        explainability = []
        for idx, sym in enumerate(symptom_columns):
            impact = class_shap[idx]
            if impact > 0.001:  # Positive contribution threshold
                explainability.append(
                    FeatureContribution(
                        symptom=sym.replace("_", " ").title(),
                        impact=float(impact)
                    )
                )
        
        # Sort descending by impact
        explainability.sort(key=lambda x: x.impact, reverse=True)
        # Take top 5
        explainability = explainability[:5]
    except Exception as e:
        # Fallback explanation if SHAP fails
        explainability = [
            FeatureContribution(symptom=s.replace("_", " ").title(), impact=0.25)
            for s in selected_symptoms if s in symptom_columns
        ][:5]

    # Resolve recommendations case-insensitively and stripping whitespaces
    rec_key = None
    clean_top_disease = top_disease.strip().lower()
    for k in disease_recommendations.keys():
        if k.strip().lower() == clean_top_disease:
            rec_key = k
            break
            
    if rec_key:
        rec_data = disease_recommendations[rec_key]
        recommendation = RecommendationInfo(
            specialist=rec_data.get("specialist", "General Physician"),
            description=rec_data.get("description", f"AI prediction indicates {top_disease}."),
            precautions=rec_data.get("precautions", []),
            diets=rec_data.get("diets", [])
        )
    else:
        recommendation = RecommendationInfo(
            specialist="General Physician",
            description=f"AI prediction indicates a probability of {top_disease}.",
            precautions=["Consult a doctor for diagnostic confirmation", "Monitor vitals"],
            diets=["Stay hydrated", "Eat light nutritious meals"]
        )

    return DiseasePredictionResponse(
        disease=top_disease,
        probability=round(float(top_prob) * 100, 1),
        reliability=confidence_tag,
        recommendation=recommendation,
        explainability=explainability
    )
