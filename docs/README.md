# MediMind AI — Project Documentation

> **Document Status:** IMPLEMENTED & EMPIRICALLY VERIFIED  
> **Last Verified:** September 30, 2026  
> **Current Project Baseline:** Phase 1–9 Complete | Database Baseline Frozen (0001–0009)  
> **Active Production Roles:** `patient`, `doctor`, `pharmacist`, `admin` (Strictly 4 Roles — Zero Super Admin)

---

## 1. READ THIS FIRST — NEW DEVELOPER ONBOARDING

Welcome to **MediMind AI**! This documentation suite is designed so that any new software engineer, DevOps specialist, clinical QA tester, or AI pair programming agent can onboard and contribute to the repository without requiring manual knowledge transfer from the original authors.

### The 13-Step Reading Sequence
Follow this sequential reading order to build a complete mental model of the product and engineering invariants:

1. **[docs/README.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/README.md)** *(You are here)*: Master project orientation, architecture snapshot, technology stack, directory layout, file-by-file map, and feature traceability.
2. **[docs/PRD.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/PRD.md)**: Product requirements, user journeys, business rules, regulatory safety boundaries, and functional scope across all 4 personas.
3. **[docs/ARCHITECTURE.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/ARCHITECTURE.md)**: End-to-end technical system architecture, data flow pipelines, and 12 Mermaid sequence/system diagrams.
4. **[docs/DATABASE.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/DATABASE.md)**: Supabase PostgreSQL schema, frozen baseline migrations (0001–0009), table dictionaries, Row-Level Security (RLS) policies, and transactional RPCs.
5. **[docs/AI_ML.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/AI_ML.md)**: Machine learning pipeline (`symptom-rf-v1`), deterministic Clinical Risk Engine, Gemini 3.5 Flash Lite integration, clinical RAG guidelines, and report parser.
6. **[docs/SECURITY.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/SECURITY.md)**: Defense-in-depth security model, zero-trust RLS, PHI minimization, secret boundaries, and credential safeguards.
7. **[docs/DESIGN.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/DESIGN.md)**: Design system tokens, typography, component behaviors, accessibility, and inventory of all 42 frontend routes.
8. **[docs/DEVELOPMENT.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/DEVELOPMENT.md)**: Zero-to-hero local setup guide, environment variable contracts, dependency management, and service orchestration.
9. **[docs/TESTING.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/TESTING.md)**: Regression suites for Phases 1–9, empirical test runner commands, unit test harnesses, and end-to-end persona testing.
10. **[docs/TASKS.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/TASKS.md)**: Central issue tracker, prioritized defects (P0–P3), Phase 1–9 audit tasks, and active engineering backlog.
11. **[docs/MEMORY.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/MEMORY.md)**: Permanent architectural decisions, historical rationale, frozen baselines, naming conventions, and immutable rules.
12. **[docs/TROUBLESHOOTING.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/TROUBLESHOOTING.md)**: Field-tested resolutions for local dev conflicts, auth locks, Supabase errors, port collisions, and ML service exceptions.
13. **[docs/GLOSSARY.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/GLOSSARY.md)**: Comprehensive terminology dictionary linking industry standards to MediMind-specific code components.

---

## 2. WHAT IS MEDIMIND AI?

**MediMind AI** is an enterprise-grade, AI-assisted healthcare ecosystem bridging patients, licensed medical doctors, accredited pharmacies, and healthcare administrators. 

### Core Capabilities:
- **Intelligent Patient Triage:** Combines symptom checklists, vital metrics, and lab report biomarker extraction with a deterministic 41-class Random Forest model (`symptom-rf-v1`) and an independent Clinical Risk Engine.
- **Provider Discovery & Live OPD:** Enables patients to search verified doctors by specialty/rating, book non-conflicting appointment slots, and conduct peer-to-peer WebRTC video consultations with live chat.
- **Digital EHR & Clinical Prescriptions:** Allows licensed doctors to examine patient history, receive AI-suggested differential insights (strictly assistive), and generate signed, tamper-resistant digital prescriptions (Rx).
- **First-Expiry-First-Out (FEFO) Pharmacy Fulfillment:** Provides accredited pharmacies with real-time prescription review, automated inventory batch deduction based on expiration dates, and order state tracking.
- **Administrative Governance & Compliance:** Centralizes practitioner verification, pharmacy drug licensing checks, audit logs, AI telemetry monitoring, and role governance without exposing raw medical PHI.
- **Multi-Channel Communications:** Delivers PHI-safe notifications across In-App feeds, Email, SMS, WhatsApp, and Web Push with deterministic idempotency and bounded exponential backoff retries.

---

## 3. PROJECT SNAPSHOT

| Dimension | Specification | Implementation Detail |
| :--- | :--- | :--- |
| **Domain** | Digital Healthcare & Telemedicine | ABDM & HIPAA-aware clinical workflows |
| **Application Type** | Multi-Tenant Single Page App (SPA) + Microservices | React 18 frontend + Python FastAPI ML service |
| **Frontend Framework** | React 18.3.1 + Vite 5.4.21 | Vanilla CSS + Tailwind tokens, Lucide icons, Recharts |
| **Backend / ML Service** | Python 3.10+ / FastAPI 1.0.0 | Uvicorn server, Pydantic v2 schemas, Scikit-Learn |
| **Primary Database** | Supabase Managed PostgreSQL 15 | Row-Level Security (RLS) on 100% of public tables |
| **Database Baseline** | Migrations 0001 through 0009 | **STRICTLY FROZEN** — Zero DDL modifications |
| **Authentication** | Supabase Auth + Vite Server Auth Bridge | Auto-confirming registration, session hydration, JWT |
| **Active Roles** | `patient`, `doctor`, `pharmacist`, `admin` | Exactly 4 canonical roles (Zero Super Admin) |
| **AI Orchestration** | Gemini 3.5 Flash Lite + RAG Engine | Assistive summary, prompt injection defense, guardrails |
| **ML Symptom Classifier** | Random Forest Classifier (`symptom-rf-v1`) | 132 binary symptom features, 41 condition classes |
| **File Storage** | Supabase Storage Buckets | `medical-documents`, `doctor-documents`, `pharmacy-documents` |
| **Video Teleconsultation** | Browser-Native WebRTC (SRTP/DTLS) | Supabase Realtime channel signaling, STUN fallback |
| **Communication Platform** | Multi-Channel Router (`channelRouter.js`) | In-App, Email, SMS, WhatsApp, Web Push abstractions |

---

## 4. TECHNOLOGY STACK REFERENCE

### 4.1 Frontend Layer
- **React (v18.3.1):** Core UI component library. Powers persona dashboards and stateful interfaces.
  - *Where:* `frontend/src/`
  - *Key Files:* `frontend/src/App.jsx`, `frontend/src/main.jsx`
  - *Connection:* Consumes `frontend/src/services/` and `frontend/src/context/AuthContext.jsx`.
- **Vite (v5.4.21):** Bundler and development server. Includes custom connect middleware for privileged admin auth provisioning.
  - *Where:* `frontend/vite.config.js`, `frontend/vite-auth-plugin.js`
- **React Router DOM (v6.23.0):** Client-side routing engine enforcing role-based route protection.
  - *Key Files:* `frontend/src/components/auth/RoleProtectedRoute.jsx`
- **Supabase JS Client (v2.110.2):** Primary client library for PostgreSQL data access, realtime listeners, and authentication.
  - *Key Files:* `frontend/src/lib/supabaseClient.js`
- **Lucide React (v0.378.0):** Standardized clinical and navigational iconography.
- **Recharts (v2.12.7):** Responsive SVG charting for analytics and vital telemetry.

### 4.2 Machine Learning & AI Microservice
- **FastAPI (v1.0.0+):** High-performance Python async REST microservice running on port 8000.
  - *Where:* `ml-service/main.py`, `ml-service/src/`
- **Scikit-Learn (v1.3.0+):** Trained Random Forest classifier (`symptom-rf-v1`) for preliminary symptom assessment.
  - *Key Files:* `ml-service/src/predictor.py`, `ml-service/models/symptom_model.joblib`
- **Google GenAI / Gemini 3.5 Flash Lite:** Clinical narrative summarization, lab report OCR interpretation, and patient explanation.
  - *Key Files:* `ml-service/src/orchestrator/orchestrator.py`, `ml-service/src/report/ai_provider.py`
- **Pydantic (v2.0+):** Strict schema definition and request/response validation.
  - *Key Files:* `ml-service/src/orchestrator/schemas.py`, `ml-service/src/report/schemas.py`
- **PDFPlumber / PyPDF / Pillow:** Document parsing and OCR extraction for uploaded clinical lab slips.
  - *Key Files:* `ml-service/src/report/pdf_processor.py`, `ml-service/src/report/image_processor.py`

### 4.3 Database & Infrastructure
- **PostgreSQL 15 (Supabase):** Relational store with ACID guarantees, partial indexes, and transactional RPCs.
- **PostgreSQL pgvector:** Vector similarity search supporting authoritative clinical guideline retrieval.
- **Docker Compose:** Multi-container specification linking frontend and ML microservice.
  - *Key Files:* `docker-compose.yml`, `frontend/Dockerfile`, `ml-service/Dockerfile`

---

## 5. REPOSITORY MAP

```
medimind/
├── .agent/
│   └── rules/
│       └── development.rule          <-- 40 mandatory rules for AI coding agents
├── docs/                             <-- Master self-documenting project system
│   ├── README.md                     <-- Master developer entry point
│   ├── PRD.md                        <-- Product Requirements Document
│   ├── ARCHITECTURE.md               <-- Technical architecture & Mermaid flows
│   ├── DESIGN.md                     <-- Design system & page inventory
│   ├── DATABASE.md                   <-- PostgreSQL schema, RLS, RPC catalog
│   ├── AI_ML.md                      <-- ML pipeline, risk engine, RAG, reports
│   ├── SECURITY.md                   <-- Defense-in-depth security model
│   ├── DEVELOPMENT.md                <-- Local dev setup & environment config
│   ├── TESTING.md                    <-- Regression test guide & test accounts
│   ├── TASKS.md                      <-- Active task backlog & priority matrix
│   ├── MEMORY.md                     <-- Architectural decisions & project memory
│   ├── TROUBLESHOOTING.md            <-- Real debugging guide for common errors
│   └── GLOSSARY.md                   <-- Terminology dictionary
├── frontend/
│   ├── src/
│   │   ├── components/               <-- Reusable UI components & auth guards
│   │   │   ├── auth/                 <-- RoleProtectedRoute, SessionLoader
│   │   │   ├── common/               <-- Buttons, Badges, Modals, StatCards
│   │   │   └── navigation/           <-- RoleBasedNavbar, Sidebar
│   │   ├── context/
│   │   │   └── AuthContext.jsx       <-- Central session, user, and role context
│   │   ├── hooks/                    <-- Custom hooks (useRoleAccess, useDebounce)
│   │   ├── lib/
│   │   │   └── supabaseClient.js     <-- Initialized Supabase singleton
│   │   ├── pages/
│   │   │   ├── admin/                <-- 15 Admin governance screens
│   │   │   ├── auth/                 <-- Login, Register, Forgot/Reset Password
│   │   │   ├── doctor/               <-- 10 Doctor clinical screens
│   │   │   ├── patient/              <-- 12 Patient health hub screens
│   │   │   └── pharmacy/             <-- 9 Pharmacy dispensary screens
│   │   ├── services/                 <-- Client API & Supabase services
│   │   │   ├── auth.service.js       <-- Primary authentication client
│   │   │   ├── communication/        <-- Multi-channel router & providers
│   │   │   ├── webrtc/               <-- WebRTC video consultation engine
│   │   │   └── *.service.js          <-- Domain services (patient, doctor, etc.)
│   │   ├── types/
│   │   │   └── database.js           <-- Role constants and enum maps
│   │   ├── App.jsx                   <-- Master router & layout assembler
│   │   └── main.jsx                  <-- DOM root mount
│   ├── public/                       <-- Static assets & background images
│   ├── package.json                  <-- Frontend dependencies
│   ├── vite.config.js                <-- Bundler & proxy configuration
│   └── vite-auth-plugin.js           <-- Privileged auth middleware plugin
├── ml-service/
│   ├── app/                          <-- FastAPI router configurations
│   ├── data/
│   │   ├── processed/                <-- Cleaned feature matrices
│   │   └── raw/                      <-- Training.csv and Testing.csv
│   ├── models/
│   │   └── symptom_model.joblib      <-- Serialized Random Forest artifact
│   ├── src/
│   │   ├── config.py                 <-- Service constants & disclaimers
│   │   ├── orchestrator/             <-- Integrated clinical AI orchestrator
│   │   ├── predictor.py              <-- Scikit-Learn inference engine
│   │   ├── preprocessor.py           <-- 132-symptom one-hot vectorizer
│   │   ├── rag/                      <-- Clinical knowledge base & retriever
│   │   ├── report/                   <-- Lab report parser & biomarker normalizer
│   │   └── risk_engine.py            <-- Independent deterministic triage logic
│   ├── tests/                        <-- Python pytest test suites
│   ├── Dockerfile                    <-- Container specification for ML service
│   ├── main.py                       <-- FastAPI application root
│   └── requirements.txt              <-- Python dependencies
├── scripts/                          <-- Empirical verification scripts (Phases 1–9)
├── supabase/
│   ├── migrations/                   <-- FROZEN SQL migrations 0001–0009
│   ├── complete_database_schema...   <-- Consolidated reference schema
│   └── seed.sql                      <-- Sample development fixtures
├── docker-compose.yml                <-- Multi-container development orchestration
└── package.json                      <-- Workspace root configuration
```

---

## 6. FILE-BY-FILE PROJECT MAP (CRITICAL FILES)

| File Path | Primary Responsibility | Reads / Consumes | Writes / Modifies | Security Context |
| :--- | :--- | :--- | :--- | :--- |
| `frontend/src/App.jsx` | Master routing, layout orchestration, global navigation guard | `AuthContext`, `RoleProtectedRoute` | Browser history / URL | Renders persona navigation strictly based on canonical role |
| `frontend/src/context/AuthContext.jsx` | User authentication state, role hydration, real-time notifications | `supabase.auth`, `user_roles`, `profiles` | React Context state | Normalizes role to 4 canonical types; prevents state spoofing |
| `frontend/src/services/auth.service.js` | Supabase Auth login, session recovery, auto-confirmation, demo sign-in | `supabase.auth`, `/api/auth/*` | Supabase Auth sessions | Handles email auto-confirmation to prevent unconfirmed lockouts |
| `frontend/vite-auth-plugin.js` | Dev server privileged auth endpoint (creates confirmed users & DB records) | `/api/auth/register`, service key | `profiles`, `user_roles`, role tables | Uses service role key server-side only; never bundled in client |
| `frontend/src/components/auth/RoleProtectedRoute.jsx` | Route guard blocking unauthenticated and cross-persona direct URL navigation | `AuthContext` | Navigation redirects | Redirects unauthorized users to their canonical dashboard |
| `frontend/src/pages/auth/Login.jsx` | 4-role switcher login UI with 1-click evaluation access | `AuthContext.login`, `loginDemo` | Session state | Pre-fills role presets and handles credential recovery |
| `frontend/src/pages/auth/Register.jsx` | Self-service registration for Patients, Doctors, and Pharmacies | `/api/auth/register` | `profiles`, `patients`, `doctors`, `pharmacies` | Automatically marks approved in dev for immediate module access |
| `frontend/src/services/patient.service.js` | Patient appointment booking, orders, health records, symptom logs | `appointments`, `prescriptions`, `orders` | Transactional RPCs | Restricts queries to `auth.uid() = patient_id` |
| `frontend/src/services/doctor.service.js` | Doctor queue management, consultation note recording, digital Rx issuance | `appointments`, `patients`, `doctors` | `prescriptions`, `consultations` | Requires `verification_status = 'approved'` and active consent |
| `frontend/src/services/pharmacy.service.js` | Prescription verification, inventory batch deduction (FEFO), order dispatch | `prescriptions`, `pharmacy_inventory` | `medicine_orders`, inventory batches | Restricts fulfillment to assigned dispensary |
| `frontend/src/services/admin.service.js` | Compliance auditing, practitioner approval/rejection, user governance | `profiles`, `audit_logs`, `doctors` | Verification status columns | Executes via administrative RPCs; zero raw medical record leakage |
| `frontend/src/services/communication/channelRouter.js` | Dispatching notifications across multi-channel providers (In-app, Email, SMS) | Notification templates, user preferences | `notifications` table, external APIs | Applies idempotency caching and strict PHI-sanitization |
| `frontend/src/services/webrtc/WebRTCVideoProvider.js` | P2P encrypted teleconsultation video/audio connection | Supabase Realtime signaling, STUN | WebRTC MediaStreams | Pure P2P encryption; zero audio/video traffic touches server |
| `ml-service/main.py` | FastAPI application exposing prediction, report analysis, and health endpoints | Incoming HTTP requests | JSON response payloads | Implements CORS, rate-limiting, and error mapping |
| `ml-service/src/predictor.py` | Runs Scikit-Learn Random Forest inference on 132-symptom vectors | `models/symptom_model.joblib` | Probabilistic condition list | Validates input bounds; never provides definitive diagnoses |
| `ml-service/src/risk_engine.py` | Independent deterministic triage logic evaluating emergency red flags | Patient age, vitals (BP, sugar, BMI) | Severity score (0–100), Triage level | Hardcoded safety rules that override any LLM or ML prediction |
| `ml-service/src/orchestrator/orchestrator.py` | Coordinates RAG retrieval, Gemini generation, and safety guardrails | Patient intake, clinical RAG guidelines | Structured AI response | Enforces clinical disclaimer and strips speculative drug dosages |
| `ml-service/src/report/report_analyzer.py` | Extracts lab findings from uploaded documents and normalizes biomarkers | PDF/Image bytes, Gemini Vision/Flash | Structured findings JSON | Converts unstructured lab text into standard clinical units |

---

## 7. FEATURE TRACEABILITY MATRIX

| Business Feature | Frontend Screen | Primary Service | Backend / ML Component | Database Table / RPC | Empirical Test File |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Authentication & RBAC** | `pages/auth/Login.jsx` | `auth.service.js` | Vite Auth Plugin / Supabase Auth | `public.user_roles`, `public.profiles` | `scripts/verify_auth_and_rbac.js` |
| **Symptom Triage (ML)** | `pages/SymptomChecker.jsx` | `triageService.js` | `ml-service/src/predictor.py` | `public.symptom_assessments` | `scripts/verify_symptom_and_report_checker.js` |
| **Clinical Risk Assessment** | `pages/SymptomChecker.jsx` | `triageService.js` | `ml-service/src/risk_engine.py` | `public.symptom_assessments` | `ml-service/tests/test_phase1.py` |
| **Lab Report Intelligence** | `pages/ReportAnalyzer.jsx` | `report.service.js` | `ml-service/src/report/` | `public.health_reports` | `ml-service/tests/test_report_pipeline.py` |
| **Doctor Discovery & Booking**| `pages/patient/DoctorSearch.jsx`| `appointment.service.js` | None (Direct Supabase) | `create_appointment_tx` RPC | `scripts/verify_phase4_patient_experience.js` |
| **Live WebRTC Teleconsult** | `pages/doctor/ConsultationRoom.jsx`| `WebRTCVideoProvider.js` | Supabase Realtime Signaling | `public.consultations` | `scripts/verify_webrtc_consultation.js` |
| **Digital Prescription (Rx)** | `pages/doctor/PrescriptionGenerator.jsx`| `prescription.service.js`| None (Direct Supabase) | `create_prescription_tx` RPC | `scripts/verify_phase5_doctor_platform.js` |
| **FEFO Pharmacy Fulfillment** | `pages/pharmacy/OrderProcessing.jsx`| `pharmacy.service.js` | None (Direct Supabase) | `pharmacy_fulfill_prescription_tx` | `scripts/verify_phase6_pharmacy_platform.js` |
| **Practitioner Accreditation** | `pages/admin/DoctorApprovals.jsx` | `admin.service.js` | None (Direct Supabase) | `verify_doctor_tx` RPC | `scripts/verify_phase7_admin_platform.js` |
| **Clinical AI Telemetry** | `pages/doctor/AiInsights.jsx` | `ai.service.js` | `ml-service/src/orchestrator/` | `public.symptom_assessments` | `scripts/verify_phase8_ai_intelligence.js` |
| **Multi-Channel Alerts** | `pages/patient/PatientNotifications.jsx`| `notification.service.js`| `services/communication/` | `public.notifications` | `scripts/verify_phase9_notification_platform.js` |

---

## 8. REQUEST TRACEABILITY & ERROR FLOWS

### Example: Booking a Doctor Appointment

```
[Patient UI: DoctorSearch.jsx]
       │
       │ 1. Patient clicks "Book Slot (10:00 AM)"
       ▼
[Service: appointment.service.js]
       │ Validates slot format and user session
       │ 2. Calls supabase.rpc('create_appointment_tx', { p_doctor_id, p_appointment_date, p_time_slot })
       ▼
[Database: create_appointment_tx RPC]
       ├── Checks: Is doctor verified (verification_status = 'approved')?
       ├── Checks: Is slot already reserved in uq_appointment_slot index?
       │
       ├── [FAILURE PATH]: Slot is already reserved
       │       └── Database raises EXCEPTION 'Slot already booked'
       │       └── Returns error JSON { success: false, message: 'Slot unavailable' }
       │       └── UI displays red alert: "This slot was just booked by another patient."
       │
       └── [SUCCESS PATH]: Slot is available
               ├── Generates sequence appointment_number (APT-YYYYMMDD-XXXX)
               ├── Inserts row into public.appointments (status = 'confirmed')
               ├── Provisions access row in public.patient_doctor_access
               ├── Inserts notification into public.notifications for Doctor
               └── Returns { success: true, appointment_id: 'uuid', appointment_number: '...' }
                       ▼
[Frontend Response Handling]
       │ UI receives success response
       │ 3. Navigates patient to /patient/appointments
       │ 4. Toast displays: "Appointment APT-20260930-0012 confirmed!"
```

---

## 9. CURRENT PROJECT PHASE & STATUS

- **Current Completed Phase:** **PHASE 9 — PRODUCTION NOTIFICATION & COMMUNICATION PLATFORM**
- **Active Development Priority:** **PHASE 1–9 BUG AUDIT, REGRESSION TESTING, AND SELF-DOCUMENTATION**
- **Phase 10 Status:** **NOT STARTED** (Awaiting explicit instruction).
- **Database Migration Baseline:** **0001 through 0009 FROZEN**. No new migration (0010) is permitted.

---

## 10. PRE-DEVELOPMENT CHECKLIST FOR ENGINEERS

Before writing any new code in this repository, check off each item:

- [ ] I have read [docs/README.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/README.md) and understand the 4 canonical roles (`patient`, `doctor`, `pharmacist`, `admin`).
- [ ] I have verified that I will **never** introduce `super_admin`.
- [ ] I have inspected [.agent/rules/development.rule](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/.agent/rules/development.rule) and agree to follow all 40 engineering rules.
- [ ] I have checked [docs/DATABASE.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/DATABASE.md) and confirmed that database migrations 0001–0009 are frozen.
- [ ] I have verified that no private API keys or `SUPABASE_SERVICE_ROLE_KEY` will ever be placed in the frontend bundle.
- [ ] I have checked [docs/TASKS.md](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/TASKS.md) to ensure my work aligns with active P0/P1 priorities.
- [ ] I understand that AI features are strictly **assistive** and the human doctor remains the final clinical authority.
