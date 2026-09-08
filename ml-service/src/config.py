import os
from pathlib import Path

# Base paths
SRC_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(SRC_DIR)

# Auto-load .env file if variables are not yet in environment
env_path = Path(BASE_DIR) / ".env"
if env_path.exists():
    with open(env_path, "r", encoding="utf-8") as f:
        for line in f:
            line = line.strip()
            if line and not line.startswith("#") and "=" in line:
                k, v = line.split("=", 1)
                os.environ.setdefault(k.strip(), v.strip())

DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")

TRAINING_CSV = os.path.join(DATA_DIR, "Training.csv")
TESTING_CSV = os.path.join(DATA_DIR, "Testing.csv")

SYMPTOM_SEVERITY_CSV = os.path.join(RAW_DATA_DIR, "Symptom-severity.csv")
DESCRIPTION_CSV = os.path.join(RAW_DATA_DIR, "description.csv")
PRECAUTIONS_CSV = os.path.join(RAW_DATA_DIR, "precautions_df.csv")

# Model Artifacts
MODEL_VERSION = "symptom-rf-v1"
MODEL_JOBLIB_PATH = os.path.join(MODELS_DIR, "disease_model.joblib")
MODEL_PKL_PATH = os.path.join(MODELS_DIR, "disease_model.pkl")
SYMPTOMS_JSON_PATH = os.path.join(MODELS_DIR, "symptoms.json")
CLASSES_JSON_PATH = os.path.join(MODELS_DIR, "classes.json")
DISEASE_INFO_JSON_PATH = os.path.join(MODELS_DIR, "disease_info.json")

# Phase 2 Report Intelligence Configuration
REPORT_ANALYSIS_VERSION = "report-analysis-v1"
MAX_REPORT_SIZE_MB = int(os.environ.get("MAX_REPORT_SIZE_MB", "10"))
DEFAULT_MAX_FILE_SIZE_BYTES = MAX_REPORT_SIZE_MB * 1024 * 1024
REPORT_TEMP_DIR = os.environ.get("REPORT_TEMP_DIR", os.path.join(BASE_DIR, "temp_reports"))
REPORT_ANALYSIS_TIMEOUT_SECONDS = int(os.environ.get("REPORT_ANALYSIS_TIMEOUT_SECONDS", "25"))
REPORT_RATE_LIMIT = int(os.environ.get("REPORT_RATE_LIMIT", "15"))
GEMINI_REPORT_MODEL = os.environ.get("GEMINI_REPORT_MODEL", os.environ.get("GEMINI_MODEL", "gemini-3.5-flash-lite"))


# Red-flag clinical emergency symptoms that trigger high/urgent triage regardless of model confidence
RED_FLAG_SYMPTOMS = {
    "chest_pain",
    "breathlessness",
    "coma",
    "stomach_bleeding",
    "altered_sensorium",
    "blood_in_sputum",
    "loss_of_balance",
    "unsteadiness",
    "weakness_of_one_body_side",
    "slurred_speech",
    "palpitations",
    "acute_liver_failure"
}

# Standard specialist routing dictionary based on condition category
SPECIALIST_MAPPING = {
    "Fungal infection": "Dermatologist",
    "Allergy": "Allergist / Immunologist",
    "GERD": "Gastroenterologist",
    "Chronic cholestasis": "Hepatologist / Gastroenterologist",
    "Drug Reaction": "Allergist / Dermatologist",
    "Peptic ulcer diseae": "Gastroenterologist",
    "AIDS": "Infectious Disease Specialist",
    "Diabetes": "Endocrinologist",
    "Gastroenteritis": "General Physician / Gastroenterologist",
    "Bronchial Asthma": "Pulmonologist",
    "Hypertension": "Cardiologist",
    "Migraine": "Neurologist",
    "Cervical spondylosis": "Orthopedic Specialist / Neurologist",
    "Paralysis (brain hemorrhage)": "Neurologist / Emergency Medicine",
    "Jaundice": "Hepatologist / Gastroenterologist",
    "Malaria": "Infectious Disease Specialist / General Physician",
    "Chicken pox": "Pediatrician / General Physician",
    "Dengue": "Infectious Disease Specialist / General Physician",
    "Typhoid": "General Physician / Infectious Disease Specialist",
    "hepatitis A": "Hepatologist / Gastroenterologist",
    "Hepatitis B": "Hepatologist",
    "Hepatitis C": "Hepatologist",
    "Hepatitis D": "Hepatologist",
    "Hepatitis E": "Hepatologist",
    "Alcoholic hepatitis": "Hepatologist / Addiction Specialist",
    "Tuberculosis": "Pulmonologist / Infectious Disease Specialist",
    "Common Cold": "General Physician",
    "Pneumonia": "Pulmonologist",
    "Dimorphic hemmorhoids(piles)": "General Surgeon / Proctologist",
    "Heart attack": "Cardiologist / Emergency Medicine",
    "Varicose veins": "Vascular Surgeon",
    "Hypothyroidism": "Endocrinologist",
    "Hyperthyroidism": "Endocrinologist",
    "Hypoglycemia": "Endocrinologist / General Physician",
    "Osteoarthristis": "Orthopedic Specialist / Rheumatologist",
    "Arthritis": "Rheumatologist",
    "(vertigo) Paroymsal  Positional Vertigo": "ENT Specialist / Neurologist",
    "Acne": "Dermatologist",
    "Urinary tract infection": "Urologist / Nephrologist",
    "Psoriasis": "Dermatologist",
    "Impetigo": "Dermatologist / Pediatrician"
}

STANDARD_DISCLAIMER = (
    "AI-assisted preliminary assessment only. This does not constitute a medical diagnosis. "
    "Clinical diagnosis, prescription, and treatment decisions remain exclusively with licensed healthcare professionals."
)
