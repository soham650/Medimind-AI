# MediMind AI — Project Engineering Memory & Architectural Invariants

**Document Status:** PERMANENT PROJECT MEMORY  
**Target Audience:** Future AI coding agents, lead software engineers, and system architects  
**Scope:** Permanent architectural decisions, frozen constraints, and design invariants  
**Rule:** Future agents **MUST** read this document before planning or modifying code.

---

## 1. Project Identity & Purpose

MediMind AI is an AI-powered smart healthcare ecosystem connecting Patients, Licensed Physicians, Retail Pharmacies, and Compliance Administrators into an integrated platform.
- **Core Mission:** Provide reliable, non-diagnostic AI triage, streamlined telehealth encounters, verifiable digital prescribing, and inventory-managed pharmaceutical fulfillment.
- **Domain:** Telehealth, Healthcare Decision Support, Digital Pharmacy, and ABDM/HIPAA Compliance.

---

## 2. Canonical Roles & Identity Invariants

### 2.1 The Four Canonical Roles
MediMind AI operates strictly on **four canonical roles**:
1. `patient`
2. `doctor`
3. `pharmacist`
4. `admin`

### 2.2 Invariant: No Super Admin
- **Decision:** Under no circumstance should a `super_admin` role be introduced or used in the application.
- **Rationale:** Healthcare administrative governance requires distributed, auditable compliance rather than omnipotent "super" accounts. Raw legacy references in early SQL scripts are strictly deprecated. All administrative authorization checks must use `public.is_admin()`, which verifies `role = 'admin'` in `public.user_roles`.

### 2.3 Role Separation & Access Control
- A user account belongs to exactly one active primary role.
- Role checks in React UI (`AuthContext.jsx`) are strictly for navigation affordance.
- **Database authorization via PostgreSQL RLS is the ultimate security boundary.**

---

## 3. Database Architecture & Migration Policy

### 3.1 Frozen Baseline (Migrations 0001–0009)
The database schema baseline is **FROZEN** at migration `0009_production_issue_remediation.sql`.
- **CRITICAL INVARIANT:** **Do NOT create migration 0010.**
- **CRITICAL INVARIANT:** **Never execute destructive database operations** (`DROP SCHEMA public CASCADE`, `TRUNCATE`, etc.).
- Any proposed schema change requires explicit, documented user authorization.
- All new features and bug fixes must adapt to and reuse the existing table structures, columns, and stored procedures established in migrations 0001 through 0009.

### 3.2 Atomic Stored Procedures (`*_tx` Convention)
Multi-table mutations and state changes involving concurrency or financial/stock integrity must be wrapped in PostgreSQL `SECURITY DEFINER` functions:
- `create_appointment_tx` — Anti-double booking slot locks & 14-day access bridge.
- `create_prescription_tx` — Tamper-evident `rx_id` generation & doctor verification checks.
- `create_medicine_order_tx` — Server-side pricing recalculation & row-locked inventory deduction.
- `pharmacy_fulfill_prescription_tx` — Order lifecycle state machine & stock restoration on cancellation.
- `verify_doctor_tx` / `verify_pharmacy_tx` — Administrator credentialing audit logs.

---

## 4. AI & Machine Learning Engineering Invariants

### 4.1 System Decoupling
MediMind strictly isolates:
1. **Machine Learning Classifier (`symptom-rf-v1`):** Statistical pattern matching only (132 binary features -> 41 disease classes).
2. **Deterministic Risk Engine (`risk_engine.py`):** Rule-based evaluation of red flags (`chest_pain`, `breathlessness`), vital signs, and ESI acuity.
3. **Clinical RAG Retriever (`retriever.py`):** Authoritative knowledge extraction from WHO, ICMR, and NICE guidelines.
4. **Generative LLM (Gemini 2.5 Flash Lite):** Plain-language summarization and non-pharmacological precautions.
5. **Clinical Safety Guard (`safety_guard.py`):** Schema enforcement, citation verification, and risk engine precedence.

### 4.2 The Emergency Override Invariant
**Gemini can NEVER override the deterministic Risk Engine.**
If the Risk Engine tags a patient presentation as `Emergency` or `High / Urgent`, any hallucinated or optimistic output from the LLM downgrading the risk is forcibly rewritten by the `ClinicalSafetyGuard`.

### 4.3 Physician Final Authority
- AI outputs are strictly titled *"Preliminary Assessment"* and accompanied by the mandatory clinical disclaimer.
- The AI system **NEVER** issues definitive diagnoses, NEVER prescribes medication dosages, and NEVER instructs patients to alter or discontinue prescription medicines.
- Digital prescriptions can only be created by an authenticated physician holding an `approved` credential status.

### 4.4 Non-Diagnostic Metric Disclaimer
Evaluation metrics (e.g. 97.62% test accuracy on `Testing.csv`) reflect performance against synthetic and benchmark clinical datasets. **They do NOT represent clinical diagnostic accuracy in living patients.**

---

## 5. Security & Privacy Invariants

### 5.1 Zero Secrets in Client Bundles
- `SUPABASE_SERVICE_ROLE_KEY` and `GEMINI_API_KEY` must **NEVER** be committed to Git, loaded into frontend `.env`, or referenced in `frontend/src/`.
- Frontend code may only access `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`.

### 5.2 Zero PHI Logging
- Patient names, emails, medical history, raw lab reports, and consultation notes must never be written to plaintext log files, stdout, or third-party analytics.
- Report files uploaded for analysis are quarantined in temporary storage and deleted immediately upon analysis completion.

### 5.3 Row-Level Security (RLS) Coverage
- 100% of tables in the `public` schema have RLS enabled.
- Anonymous (`anon`) role access is completely denied on private health data.
- Cross-patient, cross-doctor, and cross-pharmacy data isolation is enforced at the PostgreSQL engine level.

---

## 6. Service & Code Conventions

### 6.1 Frontend Conventions
- **Services (`frontend/src/services/`):** All external network requests (Supabase, ML microservice) are encapsulated in dedicated service modules (`auth.service.js`, `appointment.service.js`, `prescription.service.js`, `pharmacy.service.js`, etc.). UI components must never make raw `fetch` calls.
- **State Management:** Global session state is managed via `AuthContext.jsx`. Page-level state utilizes React hooks (`useState`, `useEffect`, `useCallback`).
- **Icons:** Use `lucide-react` icons. Do not introduce alternative icon libraries.
- **Styling:** Vanilla CSS with scoped classes and design tokens defined in `frontend/src/index.css`.

### 6.2 Backend & ML Conventions
- **Pydantic Validation:** All incoming and outgoing request payloads in FastAPI must have corresponding Pydantic schemas in `schemas.py`.
- **Error Handling:** Use standard HTTP status codes (`400` Bad Request, `401` Unauthorized, `403` Forbidden, `404` Not Found, `422` Unprocessable Entity, `500` Internal Error).
- **Prompt Sanitization:** All user-supplied text strings passed to Gemini must be sanitized and isolated in XML tags (`<untrusted_patient_input>`).

---

## 7. Project Phase Status & Constraints

```
Phase 1: ML Symptom Assessment          -> COMPLETE & VERIFIED
Phase 2: Medical Report Intelligence    -> COMPLETE & VERIFIED
Phase 3: Supabase Auth & Storage        -> COMPLETE & VERIFIED
Phase 4: Patient Telehealth Experience  -> COMPLETE & VERIFIED
Phase 5: Doctor Workspace & Rx          -> COMPLETE & VERIFIED
Phase 6: Pharmacy & FEFO Fulfillment    -> COMPLETE & VERIFIED
Phase 7: Admin Governance & Audits      -> COMPLETE & VERIFIED
Phase 8: Clinical RAG & AI Orchestrator -> COMPLETE & VERIFIED
Phase 9: Real-Time Notifications        -> COMPLETE & VERIFIED
---------------------------------------------------------------
Phase 10: IoT Biometrics & Integrations -> ON HOLD (DO NOT START)
```

> [!WARNING]
> **Current Development Priority:**  
> The team is operating strictly on **Phase 1–9 Bug and Regression Audits**. Do NOT begin Phase 10 implementation without an explicit instruction from the user.
