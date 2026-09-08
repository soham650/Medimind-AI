import os
import sys
import json
import joblib
import pandas as pd
import numpy as np

# Path configuration
TEST_DIR = os.path.dirname(os.path.abspath(__file__))
SERVICE_DIR = os.path.dirname(TEST_DIR)
if SERVICE_DIR not in sys.path:
    sys.path.insert(0, SERVICE_DIR)

from src.config import (
    TRAINING_CSV,
    TESTING_CSV,
    MODEL_JOBLIB_PATH,
    MODEL_PKL_PATH,
    SYMPTOMS_JSON_PATH,
    CLASSES_JSON_PATH,
    DISEASE_INFO_JSON_PATH
)
from src.preprocessor import SymptomPreprocessor
from src.risk_engine import IndependentRiskEngine
from src.predictor import DiseasePredictor
from main import (
    health_check,
    get_symptoms,
    predict_disease,
    predict_risk,
    get_bias_metrics,
    SymptomPredictionRequest,
    VitalsRiskRequest
)

def test_1_dataset_integrity():
    print("[TEST 1] Verifying Dataset Integrity...")
    assert os.path.exists(TRAINING_CSV), f"Training CSV missing: {TRAINING_CSV}"
    assert os.path.exists(TESTING_CSV), f"Testing CSV missing: {TESTING_CSV}"

    df_train = pd.read_csv(TRAINING_CSV)
    df_test = pd.read_csv(TESTING_CSV)

    # Check rows and columns
    assert len(df_train) == 4920, f"Unexpected train row count: {len(df_train)}"
    assert len(df_test) == 42, f"Unexpected test row count: {len(df_test)}"
    assert "prognosis" in df_train.columns, "prognosis column missing in train"
    assert "prognosis" in df_test.columns, "prognosis column missing in test"

    # Verify 41 classes
    train_classes = set(df_train['prognosis'].str.strip().unique())
    test_classes = set(df_test['prognosis'].str.strip().unique())
    assert len(train_classes) == 41, f"Expected 41 classes, got {len(train_classes)}"
    assert test_classes.issubset(train_classes), "Test classes must be a subset of train classes"
    print("  --> Dataset integrity PASSED (4920 train rows, 42 test rows, 41 classes).")

def test_2_model_loading_and_artifacts():
    print("[TEST 2] Verifying Model Artifacts...")
    assert os.path.exists(MODEL_JOBLIB_PATH), "disease_model.joblib missing"
    assert os.path.exists(MODEL_PKL_PATH), "disease_model.pkl missing"
    assert os.path.exists(SYMPTOMS_JSON_PATH), "symptoms.json missing"
    assert os.path.exists(CLASSES_JSON_PATH), "classes.json missing"
    assert os.path.exists(DISEASE_INFO_JSON_PATH), "disease_info.json missing"

    model = joblib.load(MODEL_JOBLIB_PATH)
    assert hasattr(model, "predict_proba"), "Model must implement predict_proba"

    with open(SYMPTOMS_JSON_PATH, "r") as f:
        symptoms = json.load(f)
    assert len(symptoms) == 132, f"Expected 132 features, got {len(symptoms)}"

    with open(CLASSES_JSON_PATH, "r") as f:
        classes = json.load(f)
    assert len(classes) == 41, f"Expected 41 classes, got {len(classes)}"

    with open(DISEASE_INFO_JSON_PATH, "r") as f:
        info = json.load(f)
    assert len(info) == 41, f"Expected 41 condition info entries, got {len(info)}"
    # Verify no medication fields in disease_info
    for cond, d_info in info.items():
        assert "medications" not in d_info, f"Violation: medications found in {cond}"
        assert "precautions" in d_info, f"Precautions missing in {cond}"

    print("  --> Model artifacts and safety schema PASSED.")

def test_3_feature_vectorization():
    print("[TEST 3] Verifying 132-Feature Vectorization & Preprocessing...")
    prep = SymptomPreprocessor()
    vector, matched, unmatched = prep.vectorize_symptoms(["itching", "skin_rash", "nodal_skin_eruptions"])
    assert vector.shape == (1, 132), f"Expected shape (1, 132), got {vector.shape}"
    assert vector.sum() == 3, f"Expected 3 active features, got {vector.sum()}"
    assert "itching" in matched
    assert "skin_rash" in matched
    assert "nodal_skin_eruptions" in matched

    # Test synonym mapping & normalization
    vec2, matched2, _ = prep.vectorize_symptoms(["spotting urination", "fever", "diarrhea"])
    assert "spotting_ urination" in matched2
    assert "high_fever" in matched2
    assert "diarrhoea" in matched2
    print("  --> Symptom vectorization & synonym normalization PASSED.")

def test_4_prediction_pipeline():
    print("[TEST 4] Verifying Prediction Pipeline & Clinical Terminology...")
    predictor = DiseasePredictor()
    res = predictor.predict(["itching", "skin_rash", "nodal_skin_eruptions"])
    
    assert res["status"] == "success"
    assert res["assessment_type"] == "AI-assisted preliminary assessment"
    assert res["model_version"] == "symptom-rf-v1"
    assert res["predicted_disease"] == "Fungal infection"
    assert res["confidence"] > 0.5, f"Confidence too low: {res['confidence']}"
    assert len(res["possible_conditions"]) >= 1
    assert "Fungal infection" in [c["condition"] for c in res["possible_conditions"]]
    assert "precautions" in res and len(res["precautions"]) > 0
    assert "recommended_specialist" in res
    assert "disclaimer" in res
    # Verify no autonomous medications
    assert "medications" not in res
    print("  --> Prediction pipeline & terminology PASSED (Fungal infection correctly identified).")

def test_5_independent_risk_engine_and_red_flags():
    print("[TEST 5] Verifying Independent Risk Engine & Red-Flag Escalation...")
    risk_eng = IndependentRiskEngine()

    # Case A: Mild symptoms (High confidence, Low clinical severity)
    eval_mild = risk_eng.evaluate_risk(["itching", "skin_rash"])
    assert eval_mild["triage_level"] == "Low", f"Expected Low, got {eval_mild['triage_level']}"
    assert eval_mild["is_emergency"] is False

    # Case B: Red-flag symptom (chest pain) -> Must escalate to High/Emergency regardless of confidence
    eval_emergency = risk_eng.evaluate_risk(["chest_pain", "mild_fever"])
    assert eval_emergency["triage_level"] in ["High / Urgent", "Emergency"], f"Red flag not escalated: {eval_emergency['triage_level']}"
    assert "chest_pain" in eval_emergency["red_flags"]

    # Case C: Coma / Altered Sensorium -> Immediate Emergency
    eval_critical = risk_eng.evaluate_risk(["coma", "high_fever"])
    assert eval_critical["triage_level"] == "Emergency"
    assert eval_critical["is_emergency"] is True

    print("  --> Risk engine independence & red-flag escalation PASSED.")

def test_6_api_endpoints_and_frontend_compatibility():
    print("[TEST 6] Verifying API Endpoints & Frontend Contract Compatibility...")
    
    # 1. GET /health
    data_health = health_check()
    assert data_health["status"] == "healthy"
    assert data_health["model_version"] == "symptom-rf-v1"
    assert data_health["features_count"] == 132
    assert data_health["classes_count"] == 41

    # 2. GET /symptoms
    symptoms = get_symptoms()
    assert isinstance(symptoms, list)
    assert len(symptoms) == 132
    assert "itching" in symptoms

    # 3. POST /predict_disease (matching mlApi.predictDisease)
    req_malaria = SymptomPredictionRequest(
        symptoms=["shivering", "chills", "high_fever", "sweating", "headache", "nausea", "muscle_pain"]
    )
    res_pred = predict_disease(req_malaria)
    assert res_pred.status == "success"
    assert res_pred.predicted_disease == "Malaria"
    assert res_pred.confidence >= 0.70
    assert hasattr(res_pred, "explanation") and res_pred.explanation.summary
    assert hasattr(res_pred, "risk_assessment")
    assert hasattr(res_pred, "precautions")
    # Verify no medications attribute
    assert not hasattr(res_pred, "medications")

    # 4. POST /predict alias with GI symptoms
    req_gerd = SymptomPredictionRequest(
        symptoms=["stomach_pain", "acidity", "ulcers_on_tongue", "vomiting"]
    )
    res_gerd = predict_disease(req_gerd)
    assert res_gerd.status == "success"
    assert res_gerd.predicted_disease == "GERD"

    # 5. POST /predict_risk (matching mlApi.predictRisk)
    req_risk = VitalsRiskRequest(
        age=45,
        bmi=28.5,
        blood_sugar=190,
        bp_systolic=150,
        bp_diastolic=95,
        smoking=1,
        symptoms=["fatigue"]
    )
    res_risk = predict_risk(req_risk)
    assert res_risk.status == "success"
    assert res_risk.assessment_type == "risk assessment"
    assert res_risk.triage_level in ["Moderate", "High / Urgent"]

    # 6. GET /bias_metrics (matching mlApi.getBiasMetrics)
    bias_json = get_bias_metrics()
    assert bias_json["test_accuracy"] == 0.9762
    assert bias_json["model_version"] == "symptom-rf-v1"

    print("  --> API endpoints and frontend compatibility PASSED.")

if __name__ == "__main__":
    test_1_dataset_integrity()
    test_2_model_loading_and_artifacts()
    test_3_feature_vectorization()
    test_4_prediction_pipeline()
    test_5_independent_risk_engine_and_red_flags()
    test_6_api_endpoints_and_frontend_compatibility()
    print("\nALL AUTOMATED TESTS COMPLETED WITH 100% SUCCESS.")
