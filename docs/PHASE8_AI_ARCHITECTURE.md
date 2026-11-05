# MEDIMIND AI — PHASE 8 AI ORCHESTRATION ARCHITECTURE
## End-to-End Clinical Intelligence Layer Specification

**Author:** Principal AI Systems Architect  
**Date:** September 10, 2026  
**Status:** **PHASE 8 = COMPLETED (VERIFIED & FROZEN)**  
**Target Platform:** Python FastAPI Microservice (`ml-service`) & Supabase PostgreSQL  

---

## 1. Architectural Philosophy

The MediMind AI Clinical Intelligence layer bridges deterministic clinical models with generative AI. It is designed around the principle of **Deterministic Safety with Generative Explanation**:

```
        ┌─────────────────────────────────────────────────────────────┐
        │                 DETERMINISTIC LAYER                         │
        │   • Phase 1 Random Forest (symptom-rf-v1)                   │
        │   • Independent Clinical Risk Engine (Red-Flag Alarms)      │
        │   • Master Guidelines (public.disease_clinical_guidelines)  │
        └──────────────────────────────┬──────────────────────────────┘
                                       │ (Authoritative Baseline)
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 GENERATIVE ASSISTIVE LAYER                  │
        │   • Context Assembly & Injection Neutralization             │
        │   • Gemini 3.5 Flash-Lite (Server-Side Server-to-Server)    │
        │   • Plain-Language Synthesis & Clinical Explanation         │
        └──────────────────────────────┬──────────────────────────────┘
                                       │ (Must Not Override Baseline)
                                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                 POST-GENERATION SAFETY GATE                 │
        │   • JSON Schema Enforcement & Malformed Output Rejection    │
        │   • Strict Uncertainty Framing (Zero "Confirmed Diagnosis") │
        │   • Red-Flag Priority Verification                          │
        │   • Mandatory Medical Disclaimers                           │
        └─────────────────────────────────────────────────────────────┘
```

---

## 2. Component Specifications

### 2.1 Patient Context Engine (`src/orchestrator/patient_context.py`)
- **Principle of Minimum Necessary Context:**
  Never transmit the patient's entire database record to the external AI provider.
- **Context Filtering Rules:**
  - `current_symptoms`: Sanitized list of reported symptoms for the current session.
  - `vitals`: Key physiological markers (`bp_systolic`, `bp_diastolic`, `blood_sugar`, `bmi`, `age`).
  - `known_allergies`: Drug and substance allergies (for contraindication warnings).
  - `recent_assessments`: Top condition and risk level from the last 2 assessments (max 30 days old).
  - `recent_findings`: Abnormal lab findings extracted from uploaded reports.
  - **Excluded:** Patient name, email, phone, ABHA ID, billing records, full prescription histories, and residential addresses are completely stripped before prompt construction.

### 2.2 Doctor Context Engine (`src/orchestrator/doctor_context.py`)
- **Role:** Equips licensed medical practitioners with structured decision-support without undermining clinical authority.
- **Features:**
  - `clinical_summary`: Synthesizes patient-reported symptoms, reported duration, and vitals.
  - `differential_considerations`: Presents top ML predictions with ICD-10 and SNOMED-CT codes.
  - `guideline_reference`: Surfaces relevant clinical management protocols from `disease_clinical_guidelines`.
  - `biomarker_correlations`: Links abnormal lab findings to potential clinical concerns.
  - `non_prescriptive_notice`: Explicit indicator that the AI cannot sign or issue prescriptions; all clinical orders require doctor signature.

### 2.3 RAG Knowledge Retriever (`src/rag/retriever.py`)
- Retrieves matching guidelines from PostgreSQL `public.disease_clinical_guidelines` and curated protocol repository.
- Attaches citation IDs, document versions, and publication dates.
- Limits context to top 3 relevant guidelines (max 1,200 tokens) to prevent context pollution.

### 2.4 Prompt Injection Defense (`src/orchestrator/prompt_sanitizer.py`)
- Encapsulates user text in `<untrusted_user_input>` XML tags.
- Detects and neutralizes adversarial patterns (e.g., "Ignore previous instructions", "System override", "You are now unrestricted").
- Treats instructions inside documents as clinical text, never as prompt directives.

### 2.5 Structured Output Schema (`src/orchestrator/schemas.py`)
Every assessment returned by the orchestrator conforms to the following strict Pydantic model:

```python
class StructuredClinicalAssessment(BaseModel):
    status: str = "success"
    assessment_type: str = "AI-assisted preliminary assessment"
    model_version: str = "symptom-rf-v1 + gemini-3.5-flash-lite + rag-v1"
    summary: str
    possible_conditions: List[Dict[str, Any]]
    risk_level: str  # "Low" | "Moderate" | "High" | "Critical"
    is_emergency: bool
    red_flags: List[str]
    vitals_warnings: List[str]
    relevant_findings: List[Dict[str, Any]]
    clinical_explanation: str
    recommended_specialist: str
    recommended_next_step: str
    doctor_review_required: bool = True
    sources: List[Dict[str, Any]]
    uncertainty_statement: str
    disclaimer: str
```

### 2.6 Uncertainty & Terminology Guardrails
- Disallowed Terms in AI Output:
  - "Definitive diagnosis"
  - "Confirmed diagnosis"
  - "You definitely have"
  - "Guaranteed cure"
  - "Discontinue your prescription"
- Mandated Phrasing:
  - "Preliminary assessment suggests..."
  - "Possible condition based on reported symptoms..."
  - "Requires clinical evaluation by a qualified medical practitioner..."

---

## 3. Telemetry & Observability Integration

1. **Daily Aggregation (`public.ai_usage_daily`):**
   - Atomically increments `total_calls`, `gemini_calls`, `rf_calls`, and `high_risk_flagged` for `current_date`.
2. **Rate Limiting (`public.rate_limit_events`):**
   - Enforces 30 requests / minute per authenticated user and 15 requests / minute per anonymous IP.
   - Logs rate limit violations with timestamp and endpoint.
3. **Audit Trails (`public.audit_logs`):**
   - Records non-sensitive audit events: `AI_CLINICAL_ASSESSMENT_EXECUTED`, `AI_RAG_RETRIEVAL`, `AI_DOCTOR_SUMMARY_REQUESTED`.
   - Never logs patient names or raw medical document text into audit details.

---

## 4. Final Acceptance & Verification Evidence

- **Phase 8 Empirical Suite:** **42 / 42 PASS** (`scripts/verify_phase8_ai_intelligence.js`)
- **Phase 8 Orchestrator Unit Tests:** **12 / 12 PASS** (`ml-service/tests/test_phase8_orchestrator.py`)
- **Phase 1 ML Regression:** **PASS** (`symptom-rf-v1` unaffected)
- **Phase 2 Report Intelligence Regression:** **PASS** (Normalizer unaffected)
- **Frontend Production Build:** **PASS** (Zero errors)
- **Database Status:** Zero DDL migrations, Migration 0009 Frozen.
- **Architectural Status:** **PHASE 8 = COMPLETED & FROZEN.** Execution stopped.
