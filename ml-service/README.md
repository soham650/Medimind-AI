# MediMind ML & Report Intelligence Microservice

Production AI service for MediMind Healthcare platform:
- **Phase 1**: Symptom-based ML Preliminary Assessment (`symptom-rf-v1`)
- **Phase 2**: Medical Report Intelligence & Document Understanding (`report-analysis-v1`)
- **Phase 3**: Supabase Database, Auth & Storage Integration *(Planned / Not Yet Implemented)*

---

## 1. Architecture & Repository Layout

```
ml-service/
├── data/
│   ├── Training.csv            # 4,920 rows, 132 symptom columns + prognosis
│   └── Testing.csv             # 42 rows held-out evaluation dataset
├── models/
│   ├── disease_model.joblib    # Serialized Random Forest model (symptom-rf-v1)
│   ├── disease_model.pkl       # Pickle artifact for legacy/dual compatibility
│   ├── symptoms.json           # Canonical list of 132 symptom features
│   ├── classes.json            # 41 unique disease classes
│   └── disease_info.json       # Clean disease descriptions, precautions, and specialist routing
├── src/
│   ├── __init__.py
│   ├── config.py               # Paths, model versioning, red-flag symptoms, constants
│   ├── preprocessor.py         # Symptom normalization & 132-dim binary vectorization
│   ├── predictor.py            # Phase 1 Random Forest inference pipeline
│   ├── risk_engine.py          # INDEPENDENT clinical risk assessment & triage engine
│   └── report/
│       ├── __init__.py
│       ├── schemas.py          # Pydantic schemas (MedicalReportAnalysis, ReportFinding, etc.)
│       ├── document_parser.py  # File validation, MIME check, UUID storage, auto-cleanup
│       ├── pdf_processor.py    # Digital PDF text extraction & scanned document detection
│       ├── image_processor.py  # Image validation, optimization & base64 encoding
│       ├── ai_provider.py      # ReportAIProvider abstraction (Gemini + Mock providers)
│       ├── finding_extractor.py# Prompt injection defense & schema validation
│       ├── finding_normalizer.py# Controlled clinical mapping to 132 symptoms
│       ├── rate_limiter.py     # In-memory sliding window rate limiter
│       └── report_analyzer.py  # Orchestrator connecting extraction -> normalization -> Phase 1 assessment
├── tests/
│   ├── test_phase1.py          # Phase 1 regression test suite (100% passing)
│   ├── test_report_validation.py # Test file types, sizes, corrupt files
│   ├── test_report_extraction.py # Test PDF text extraction & AI schema parsing
│   ├── test_finding_normalization.py # Test controlled symptom mapping & unmapped findings
│   ├── test_report_pipeline.py # Test end-to-end report intelligence pipeline
│   └── test_phase2_api.py      # Test /analyze_report and /analyze_report_and_assess endpoints
├── main.py                     # Root FastAPI application entrypoint
├── requirements.txt            # Python dependencies
└── README.md                   # This documentation
```

---

## 2. Clinical Safety & Medical Governance Principles

1. **AI-Assisted Preliminary Assessment Only**:
   Outputs are strictly defined as preliminary evaluations and potential conditions. The system **never** issues definitive medical diagnoses.
2. **Zero Autonomous Medication Recommendation**:
   Medication prescriptions, dosages, and pharmaceutical treatment decisions remain strictly within the purview of licensed physicians. The ML service outputs only non-pharmaceutical supportive precautions (e.g., rest, hydration, monitoring) and recommended medical specialists.
3. **Independent Clinical Severity (Decoupled from ML Confidence)**:
   A high-confidence prediction on a benign rash is categorized as **Low Risk**, while the presence of red-flag symptoms or critical lab values (e.g., elevated Troponin, `chest_pain`, `coma`, `altered_sensorium`) immediately escalates the patient to **Urgent / Emergency Triage** regardless of ML probability.
4. **Prompt Injection Defense**:
   All medical document contents are treated strictly as untrusted data. Explicit instructions are embedded in `report-analysis-v1` directing the AI to ignore any commands or override attempts inside uploaded documents.
5. **Data Privacy & Ephemeral Processing**:
   Uploaded reports are quarantined in temporary storage with UUID-based filenames and destroyed immediately upon processing completion. No patient identifiable health information (PHI), report images, or raw document texts are logged or publicly exposed.

---

## 3. Evaluation Metrics (Phase 1 Model: `symptom-rf-v1`)

Model training and validation were performed with strict separation between training and test sets:
- **Cross-Validation**: 5-Fold Stratified Cross-Validation on `Training.csv` only.
- **Held-Out Test Set**: `Testing.csv` (42 unseen clinical samples) reserved solely for final evaluation.

| Metric | Result |
| :--- | :--- |
| **5-Fold CV Mean Accuracy** | `1.0000 (+/- 0.0000)` |
| **Held-Out Testing Accuracy** | `0.9762` (97.62% — 41 / 42 correct) |
| **Precision (Macro)** | `0.9878` |
| **Recall (Macro)** | `0.9878` |
| **F1-Score (Macro)** | `0.9837` |
| **Precision (Weighted)** | `0.9881` |
| **Recall (Weighted)** | `0.9762` |
| **F1-Score (Weighted)** | `0.9762` |

---

## 4. Setup & Running

### Installation
```bash
cd ml-service
python -m venv venv
# On Windows
venv\Scripts\activate
# On Linux/macOS
source venv/bin/activate

pip install -r requirements.txt
```

### Running Automated Tests
```bash
# Run Phase 1 regression test suite
python tests/test_phase1.py

# Run Phase 2 report intelligence test suites
python tests/test_report_validation.py
python tests/test_report_extraction.py
python tests/test_finding_normalization.py
python tests/test_report_pipeline.py
python tests/test_phase2_api.py
```

### Starting the FastAPI Microservice
```bash
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

---

## 5. API Reference & Contracts

### Core & Phase 1 Endpoints
- `GET /health`: Health status, model version (`symptom-rf-v1`), active features and classes.
- `GET /symptoms`: Returns the 132 symptom names for autocomplete and checklist rendering.
- `POST /predict_disease` (Alias: `POST /predict`): Preliminary symptom-based assessment.
- `POST /predict_risk`: Independent physiological vitals risk assessment.
- `GET /bias_metrics`: Transparency and fairness metrics on held-out evaluation data.

### Phase 2 Medical Report Endpoints
- `POST /analyze_report` (Alias: `POST /analyze`):
  Extracts and normalizes structured medical laboratory findings and clinical observations from PDF or image documents.
  Supports both `multipart/form-data` file uploads and base64 JSON requests `{ fileName, fileType, fileData }`.
- `POST /analyze_report_and_assess`:
  End-to-end report assessment: Document extraction -> Finding normalization -> Controlled symptom mapping -> Phase 1 model prediction (if clinical symptoms mapped) -> Independent Risk Engine -> Doctor referral recommendation.

**Sample Response (`/analyze_report_and_assess`):**
```json
{
  "status": "success",
  "assessment_type": "AI-assisted preliminary assessment",
  "analysis_version": "report-analysis-v1",
  "model_version": "symptom-rf-v1",
  "report_analysis": {
    "report_type": "Complete Blood Count (CBC)",
    "report_date": "2026-09-08",
    "findings": [
      {
        "name": "WBC Count",
        "value": 14800,
        "unit": "/uL",
        "reference_range": "4000 - 11000",
        "status": "high",
        "source": "medical_report",
        "extraction_method": "text",
        "page_number": 1,
        "confidence": 1.0
      }
    ],
    "symptoms": [
      {
        "name": "itching",
        "severity": "mild",
        "duration": "4 days"
      }
    ],
    "observations": [],
    "uncertain_items": [],
    "extraction_confidence": 0.95
  },
  "mapped_symptoms": ["itching", "skin_rash"],
  "symptom_mapping_status": "sufficient_mapping",
  "possible_conditions": [
    {
      "condition": "Fungal infection",
      "probability": 0.57
    }
  ],
  "risk_assessment": {
    "triage_level": "Low",
    "severity_score": 4,
    "is_emergency": false,
    "red_flags": [],
    "vitals_warnings": [],
    "triage_timeframe": "Routine home care and monitoring",
    "clinical_recommendation": "Mild localized symptom profile. Practice hydration, rest, and appropriate non-medicinal precautions."
  },
  "doctor_recommendation": {
    "recommended_specialist": "Dermatologist",
    "rationale": "Documented findings correspond to 2 recognized clinical indicators. Evaluation suggests consulting a Dermatologist.",
    "urgency_level": "Low"
  },
  "disclaimer": "AI-assisted preliminary assessment only. This does not constitute a medical diagnosis. Clinical diagnosis, prescription, and treatment decisions remain exclusively with licensed healthcare professionals."
}
```

---

## 6. Supported File Types & Limits

| Format | Extension | Processing Mode |
|---|---|---|
| **Portable Document Format** | `.pdf` | Digital text extraction via `pypdf`; visual document fallback |
| **Portable Network Graphics** | `.png` | Visual document understanding via `Pillow` & Gemini vision |
| **JPEG / JPG Image** | `.jpg`, `.jpeg` | Visual document understanding via `Pillow` & Gemini vision |

- **Maximum Upload Size**: `10 MB` (Configurable via `MAX_REPORT_SIZE_MB`).
- **Rate Limit**: `15 requests / minute` per client (Configurable via `REPORT_RATE_LIMIT`).
