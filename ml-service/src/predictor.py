import os
import json
import joblib
import pickle
import numpy as np
from typing import List, Dict, Any, Optional

from src.config import (
    MODEL_VERSION,
    MODEL_JOBLIB_PATH,
    MODEL_PKL_PATH,
    CLASSES_JSON_PATH,
    DISEASE_INFO_JSON_PATH,
    SPECIALIST_MAPPING,
    STANDARD_DISCLAIMER
)
from src.preprocessor import SymptomPreprocessor
from src.risk_engine import IndependentRiskEngine

class DiseasePredictor:
    def __init__(
        self,
        model_path: str = MODEL_JOBLIB_PATH,
        classes_path: str = CLASSES_JSON_PATH,
        info_path: str = DISEASE_INFO_JSON_PATH
    ):
        self.model_path = model_path
        self.classes_path = classes_path
        self.info_path = info_path

        self.model = None
        self.classes: List[str] = []
        self.disease_info: Dict[str, Any] = {}
        
        self.preprocessor = SymptomPreprocessor()
        self.risk_engine = IndependentRiskEngine()

        self.load_artifacts()

    def load_artifacts(self):
        # 1. Load trained model
        if os.path.exists(self.model_path):
            self.model = joblib.load(self.model_path)
        elif os.path.exists(MODEL_PKL_PATH):
            with open(MODEL_PKL_PATH, "rb") as f:
                self.model = pickle.load(f)
        else:
            print(f"[Predictor] Warning: Model file not found at {self.model_path}")

        # 2. Load classes
        if os.path.exists(self.classes_path):
            with open(self.classes_path, "r") as f:
                self.classes = json.load(f)
        elif self.model is not None and hasattr(self.model, "classes_"):
            self.classes = list(self.model.classes_)

        # 3. Load disease metadata
        if os.path.exists(self.info_path):
            with open(self.info_path, "r") as f:
                self.disease_info = json.load(f)

    def predict(
        self,
        symptoms: List[str],
        vitals: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes AI-assisted preliminary assessment from symptoms list.
        Decoupled from autonomous medication suggestions.
        """
        if self.model is None:
            self.load_artifacts()
            if self.model is None:
                raise RuntimeError("ML model is not loaded. Please ensure training has been performed.")

        # 1. Vectorize user symptoms
        feature_vector, matched, unmatched = self.preprocessor.vectorize_symptoms(symptoms)

        # 2. Run independent risk engine
        risk_evaluation = self.risk_engine.evaluate_risk(symptoms, vitals)

        # Fallback if no symptoms matched
        if not matched:
            return {
                "status": "partial_match",
                "assessment_type": "AI-assisted preliminary assessment",
                "model_version": MODEL_VERSION,
                "predicted_disease": "Inconclusive / Unspecified",
                "confidence": 0.0,
                "possible_conditions": [],
                "matched_symptoms": [],
                "unmatched_symptoms": unmatched,
                "description": "None of the entered symptoms matched the 132 model indicators in our clinical reference dataset.",
                "precautions": [
                    "Consult a general physician for an in-person physical evaluation",
                    "Keep a log of when symptoms occur and their triggers",
                    "Rest and maintain adequate hydration"
                ],
                "recommended_specialist": "General Physician",
                "risk_assessment": risk_evaluation,
                "explanation": {
                    "summary": "No matching symptoms recognized in the clinical dataset. Please consult a physician."
                },
                "disclaimer": STANDARD_DISCLAIMER
            }

        # 3. Model inference: compute probabilities across all 41 classes
        try:
            proba = self.model.predict_proba(feature_vector)[0]
        except Exception as e:
            raise RuntimeError(f"Prediction failed: {e}")

        # Pair classes and probabilities
        class_names = self.classes if self.classes else list(self.model.classes_)
        sorted_probs = sorted(zip(class_names, proba), key=lambda x: x[1], reverse=True)

        top_disease, top_prob = sorted_probs[0]

        # Differential possibilities (top 3)
        top_possible = [
            {"condition": cond, "probability": round(float(p), 4)}
            for cond, p in sorted_probs[:3] if p > 0.01
        ]
        if not top_possible:
            top_possible = [{"condition": top_disease, "probability": round(float(top_prob), 4)}]

        # 4. Fetch condition metadata (description, non-medical precautions, specialist)
        info = self.disease_info.get(top_disease, {})
        description = info.get("description", f"A condition marked by {', '.join(matched[:3])}.")
        precautions = info.get("precautions", [
            "Consult a qualified healthcare provider",
            "Monitor symptoms closely",
            "Maintain proper rest and hydration"
        ])
        
        specialist = (
            info.get("specialist")
            or SPECIALIST_MAPPING.get(top_disease)
            or "General Physician"
        )

        return {
            "status": "success",
            "assessment_type": "AI-assisted preliminary assessment",
            "model_version": MODEL_VERSION,
            "predicted_disease": top_disease,
            "confidence": round(float(top_prob), 4),
            "possible_conditions": top_possible,
            "matched_symptoms": matched,
            "unmatched_symptoms": unmatched,
            "description": description,
            "precautions": precautions,
            "recommended_specialist": specialist,
            "risk_assessment": risk_evaluation,
            "explanation": {
                "summary": f"Symptoms ({', '.join(matched)}) correspond to patterns observed in {top_disease}. {description}"
            },
            "disclaimer": STANDARD_DISCLAIMER
        }
