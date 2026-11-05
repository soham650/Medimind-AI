# MediMind AI — Phase 8 Visual Architecture & SVG Walkthrough

## 1. End-to-End Clinical Intelligence Architecture

```mermaid
flowchart TD
    subgraph UI ["Client Layer (Patient / Doctor)"]
        A1[Symptom Checklist & Intake]
        A2[Lab Report Upload]
        A3[Doctor Clinical Console]
    end

    subgraph SEC ["Security & Boundary Layer"]
        B1[Prompt Sanitizer & Adversarial Filter]
        B2[Patient Context Engine - PII Scrubbing]
        B3[Doctor Context Engine - Differentials & Alerts]
    end

    subgraph CORE ["Synthesis & Inference Engines"]
        C1[Phase 1 Random Forest Classifier<br/>symptom-rf-v1]
        C2[Deterministic Clinical Risk Engine<br/>Emergency Red Flags & Vitals]
        C3[Controlled Clinical RAG Engine<br/>Curated WHO / ICMR Corpus]
    end

    subgraph LLM ["Server-Side LLM Provider"]
        D1[Gemini 3.5 Flash-Lite<br/>FastAPI Server Backend]
    end

    subgraph GUARD ["Clinical Safety Guardrails"]
        E1[Emergency Red-Flag Supremacy Invariant]
        E2[Probabilistic Uncertainty Enforcement]
        E3[Autonomous Drug Dosage Stripping]
        E4[Strict Citation Allowlist Filtering]
    end

    subgraph OUT ["Secure Clinical Delivery"]
        F1[Structured Clinical Assessment<br/>Pydantic Schema Validation]
        F2[Audit Logging & Usage Telemetry<br/>ai_usage_daily & audit_logs]
    end

    UI --> SEC
    SEC --> CORE
    CORE --> LLM
    LLM --> GUARD
    GUARD --> OUT
    OUT --> UI
```

---

## 2. Emergency Red-Flag Supremacy & Safety Priority

```mermaid
flowchart LR
    A[Patient Input] --> B{Deterministic Risk Engine}
    B -- Emergency Detected --> C[Lock Risk Level to Critical]
    B -- No Emergency --> D[Synthesize with Random Forest & RAG]
    C --> E[Emergency Advisory: 108 / 911]
    D --> F[Gemini Generation]
    F --> G{Safety Guardrail Review}
    G -- Contains Hallucinated Rx --> H[Strip Prescriptive Dosages]
    G -- Contains Fabricated Citations --> I[Filter to Retrieved Allowlist]
    G -- Complies with Protocols --> J[Deliver Structured Output]
    H --> J
    I --> J
    E --> J
```

---

## 3. Provenance-Tracked RAG Knowledge Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Patient / Physician
    participant API as FastAPI Orchestrator
    participant RAG as Clinical RAG Retriever
    participant KB as Curated Clinical Corpus
    participant LLM as Server-Side Gemini Provider
    participant Guard as Safety Guardrails

    User->>API: Submit presentation (Symptoms, Vitals, Labs)
    API->>RAG: Query guidelines (predicted condition, emergency flag)
    RAG->>KB: Fetch guidelines (WHO, ICMR, NICE)
    KB-->>RAG: Return guidelines + Provenance Metadata
    RAG-->>API: Format `<retrieved_clinical_knowledge>` XML + Citation Allowlist
    API->>LLM: Pass bounded context & system prompt
    LLM-->>API: Return generated candidate JSON
    API->>Guard: Validate schema, uncertainty, red flags, citations
    Guard-->>API: Final sanitized & verified clinical assessment
    API-->>User: Structured Clinical Response with Verified Citations
```
