import os

APP_DIR = os.path.dirname(os.path.abspath(__file__))
BASE_DIR = os.path.dirname(APP_DIR)

DATA_DIR = os.path.join(BASE_DIR, "data")
RAW_DATA_DIR = os.path.join(DATA_DIR, "raw")
PROCESSED_DATA_DIR = os.path.join(DATA_DIR, "processed")
MODELS_DIR = os.path.join(APP_DIR, "models")

SYMPTOMS_FILE = os.path.join(PROCESSED_DATA_DIR, "symptoms.json")
RECOMMENDATIONS_FILE = os.path.join(PROCESSED_DATA_DIR, "disease_recommendations.json")
BIAS_FILE = os.path.join(PROCESSED_DATA_DIR, "bias_metrics.json")
