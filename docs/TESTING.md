# MediMind AI — Comprehensive Testing & Quality Assurance Guide

**Document Status:** VERIFIED TEST MATRIX (Phases 1–9)  
**Testing Scope:** Unit Tests, Integration Tests, Database & RLS Audits, ML Regression, E2E Workflows  
**Test Harness Locations:** [`ml-service/tests/`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/ml-service/tests), [`scripts/`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/scripts)

---

## 1. Testing Philosophy & Strategy

In a healthcare intelligence application, software bugs can directly impact patient safety, practitioner licensing compliance, and data privacy. MediMind AI enforces a rigorous multi-tier testing strategy:

```
┌────────────────────────────────────────────────────────┐
│  Tier 5: End-to-End Clinical Workflows                 │
│  - Patient booking -> Consultation -> Rx -> Dispense   │
├────────────────────────────────────────────────────────┤
│  Tier 4: Automated Verification Scripts                │
│  - Scripts 1-9 testing live DB & RLS boundaries        │
├────────────────────────────────────────────────────────┤
│  Tier 3: AI & Machine Learning Test Suites             │
│  - 5-Fold cross-val, held-out evaluation, RAG checks   │
├────────────────────────────────────────────────────────┤
│  Tier 2: Backend Integration & Stored Procedures (RPC) │
│  - Atomic transactions, concurrency lock tests         │
├────────────────────────────────────────────────────────┤
│  Tier 1: Unit Tests & Frontend Bundle Compilation      │
│  - Document parsing, preprocessors, Vite build checks  │
└────────────────────────────────────────────────────────┘
```

---

## 2. Test Execution Quick Reference

| Test Suite / Phase | Command | Execution Scope |
|---|---|---|
| **Frontend Production Build** | `cd frontend && npm run build` | Compiles full React bundle; catches JSX/syntax errors. |
| **Phase 1 ML Regression** | `cd ml-service && pytest tests/test_phase1.py` | Validates Random Forest inference, accuracy, 132 features. |
| **Phase 2 Document Pipeline** | `cd ml-service && pytest tests/test_report_*.py` | Tests PDF parsing, MIME checking, finding normalization. |
| **Phase 8 AI Orchestrator** | `cd ml-service && pytest tests/test_phase8_orchestrator.py` | Tests RAG retriever, safety guard, injection defense. |
| **All ML Python Tests** | `cd ml-service && pytest tests/` | Runs entire Python test suite (unit + integration). |
| **Auth & RBAC Verification** | `node scripts/verify_auth_and_rbac.js` | Verifies 4 roles, password hashing, JWT claims. |
| **Patient Workflow (Phase 4)** | `node scripts/verify_phase4_patient_experience.js` | Triage, appointments, EHR records, doctors list. |
| **Doctor Workflow (Phase 5)** | `node scripts/verify_phase5_doctor_platform.js` | Availability matrix, patient access, Rx creation. |
| **Pharmacy Workflow (Phase 6)** | `node scripts/verify_phase6_pharmacy_platform.js` | Inventory catalog, FEFO stock decrements, order states. |
| **Admin Governance (Phase 7)** | `node scripts/verify_phase7_admin_platform.js` | Doctor verification, pharmacy licensing, audit logs. |
| **AI Intelligence (Phase 8)** | `node scripts/verify_phase8_ai_intelligence.js` | End-to-end RAG citations, risk engine, prompt safety. |
| **Notifications (Phase 9)** | `node scripts/verify_phase9_notification_platform.js` | In-app alerts, unread counts, cross-role dispatches. |
| **WebRTC Telehealth** | `node scripts/verify_webrtc_consultation.js` | Session room tokens, DSC signatures, peer signaling. |

---

## 3. Test Suites by Phase (Phases 1–9)

### Phase 1: Symptom Classification & Risk Engine
- **Files:** `ml-service/tests/test_phase1.py`
- **Focus:**
  1. Verifies 132-dimensional binary feature vectorization.
  2. Assesses Random Forest model predictions against 41 disease classes.
  3. Evaluates Independent Risk Engine triage levels (`Emergency`, `High / Urgent`, `Moderate`, `Low`).
  4. Verifies red-flag detection (e.g. `chest_pain` immediately triggers emergency advice).

### Phase 2: Medical Report Document Intelligence
- **Files:**
  - `tests/test_report_validation.py` — Verifies rejection of corrupt files, non-PDF/images, and files > 15MB.
  - `tests/test_report_extraction.py` — Tests PyMuPDF digital text extraction and scanned OCR fallback.
  - `tests/test_finding_normalization.py` — Tests conversion of raw lab parameters to canonical symptoms.
  - `tests/test_report_pipeline.py` — Tests end-to-end extraction -> normalization -> ML triage.

### Phase 3 & 4: Patient Identity & Telehealth Booking
- **Script:** `scripts/verify_phase4_patient_experience.js`
- **Focus:**
  1. Patient profile registration and ABHA demographic persistence.
  2. Doctor search filtering by specialty, consultation fee, and rating.
  3. Slot booking via `create_appointment_tx` and verifying unique slot constraint.
  4. Confirming 14-day `patient_doctor_access` bridge provisioning.

### Phase 5: Doctor Clinical Encounters & Prescribing
- **Script:** `scripts/verify_phase5_doctor_platform.js`
- **Focus:**
  1. Weekly availability schedule configuration in `doctor_availability`.
  2. Patient medical history access verification under active bridge.
  3. Digital prescription issuance via `create_prescription_tx`.
  4. Ambient scribe SOAP note capture in `consultation_sessions`.

### Phase 6: Pharmacy Inventory & Dispensation
- **Script:** `scripts/verify_phase6_pharmacy_platform.js`
- **Focus:**
  1. Drug catalog search and pharmacy-specific stock tracking in `pharmacy_inventory`.
  2. Atomic stock decrements via `create_medicine_order_tx`.
  3. First-Expired-First-Out (FEFO) batch allocation.
  4. Order lifecycle advancement (`accept` -> `dispense` -> `dispatch` -> `deliver`).

### Phase 7: Administrative Governance & Audit Logs
- **Script:** `scripts/verify_phase7_admin_platform.js`
- **Focus:**
  1. Practitioner credential approval/rejection via `verify_doctor_tx`.
  2. Pharmacy licensing approval/rejection via `verify_pharmacy_tx`.
  3. Read-only verification of HIPAA `audit_logs` (ensures zero deletions permitted).
  4. Daily AI cost tracking and rate limiting event telemetry.

### Phase 8: Multi-Modal AI & Clinical RAG
- **Files:** `tests/test_phase8_orchestrator.py` & `scripts/verify_phase8_ai_intelligence.js`
- **Focus:**
  1. Retrieval accuracy of WHO/ICMR clinical guidelines in `ClinicalRAGRetriever`.
  2. Strict verification of `citation_id` provenance (zero hallucinated citations).
  3. Prompt injection neutralization using XML quarantine tags.
  4. Risk Engine precedence over LLM generative responses.

### Phase 9: Real-Time Cross-Role Notifications
- **Script:** `scripts/verify_phase9_notification_platform.js`
- **Focus:**
  1. Real-time alert dispatches for appointment requests, confirmations, and cancellations.
  2. Patient notification upon prescription issuance.
  3. Pharmacy order placement and dispatch alerts.
  4. User notification isolation (User A cannot read User B alerts).

---

## 4. Test Account Provisioning & Governance

### 4.1 Canonical Pre-Provisioned Accounts
The system contains pre-configured evaluation accounts:

```
Patient:    patient@medimind.ai   / Patient@123   -> /patient/dashboard
Doctor:     doctor@medimind.ai    / Doctor@123    -> /doctor/dashboard
Pharmacy:   pharmacy@medimind.ai  / Pharmacy@123  -> /pharmacy/dashboard
Admin:      admin@medimind.ai     / Admin@123     -> /admin/dashboard
```

### 4.2 Creating New Test Accounts
To create a new test user:
1. Navigate to `http://localhost:3000/register`.
2. Select the target role tab (**Patient**, **Doctor**, or **Pharmacy**).
3. Fill in required details and click **Create Account**.
4. The local dev server automatically executes `supabaseAdmin.auth.admin.createUser({ email_confirm: true })`, bypassing email delays and saving the record to PostgreSQL.

> [!CAUTION]
> **Never Change Real User Roles From Frontend:**  
> The client UI has zero authority to elevate roles. Attempting to modify `user_roles` via browser DevTools will be rejected by PostgreSQL RLS. Only privileged administrative scripts or server-side plugins utilizing `SUPABASE_SERVICE_ROLE_KEY` can provision roles.

---

## 5. End-to-End Workflow Verification Guide

Follow this sequential walkthrough to verify the complete multi-role platform lifecycle:

### Step 1: Patient Triage & Appointment Booking
1. Log in as **Patient** (`patient@medimind.ai`).
2. Navigate to **Symptom Checker** (`/patient/symptoms`). Select `headache`, `fever`, `fatigue`.
3. Submit for assessment: verify Random Forest returns differential conditions with specialist routing.
4. Click **Find Doctors** (`/patient/doctors`). Select Dr. Sarah Jenkins.
5. Choose an available slot and click **Book Appointment**.
6. Verify appointment appears under `/patient/appointments` with status `requested` or `confirmed`.

### Step 2: Doctor Clinical Consultation & Prescription
1. Log out and sign in as **Doctor** (`doctor@medimind.ai`).
2. Open **Appointments** (`/doctor/appointments`). Locate the newly booked appointment.
3. Click **Start Consultation** (`/doctor/consultations/:id`).
4. Review patient medical history (verified accessible via `patient_doctor_access`).
5. Open **Prescription Generator** (`/doctor/prescriptions/new`).
6. Enter diagnosis (*"Acute Viral Bronchitis"*), add Paracetamol 500mg (1-0-1, 5 days), and click **Issue Digital Prescription**.
7. Verify generated `rx_id` (e.g. `RX-2026-XXXX`).

### Step 3: Patient Order Placement
1. Log out and sign in as **Patient** (`patient@medimind.ai`).
2. Navigate to **Prescriptions** (`/patient/prescriptions`). Locate the issued prescription.
3. Click **Order Medicines**.
4. Select *Apollo Care Pharmacy* and input delivery address.
5. Click **Confirm Order**. Verify database decrements inventory stock.

### Step 4: Pharmacy Order Fulfillment
1. Log out and sign in as **Pharmacist** (`pharmacy@medimind.ai`).
2. Open **Orders Dashboard** (`/pharmacy/orders`).
3. Locate the new order. Click **Review & Accept**.
4. Advance lifecycle: **Pack Items** -> **Dispatch Order** -> **Mark Delivered**.
5. Check **Inventory** (`/pharmacy/inventory`): confirm stock quantities reflect the dispensed medication.

### Step 5: Administrative Compliance & Audit
1. Log out and sign in as **Admin** (`admin@medimind.ai`).
2. Open **Practitioner Verifications** (`/admin/doctors`). Review pending doctor licenses.
3. Open **Audit Logs** (`/admin/audit`).
4. Confirm every preceding action (Appointment booking, Prescription issuance, Order fulfillment) is recorded with timestamp, actor ID, and action name.
