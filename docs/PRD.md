# MediMind AI — Product Requirements Document (PRD)

> **Document Status:** IMPLEMENTED & EMPIRICALLY VERIFIED  
> **Last Verified:** September 30, 2026  
> **Current Baseline:** Phase 1–9 Complete | Database Baseline Frozen (0001–0009)  
> **Target Audience:** Product Managers, Software Engineers, Clinical Advisors, QA Testers

---

## 1. PRODUCT VISION & PURPOSE

### 1.1 Non-Technical Overview
Healthcare systems worldwide suffer from fragmented patient journeys: symptom triage happens on generic web searches without clinical safeguards; appointments are plagued by double-booking and schedule friction; prescriptions remain paper-based and prone to tampering; pharmacy dispensing lacks real-time batch expiration safeguards; and medical records are scattered across disconnected clinics.

**MediMind AI** is an intelligent, integrated healthcare ecosystem designed to unite patients, verified healthcare providers, accredited pharmacies, and administrative compliance officers on a single, secure, digital platform. 

### 1.2 Core Pillars
1. **Clinical Safety Supremacy:** AI models assist but **never** autonomously diagnose or prescribe. A licensed human practitioner remains the final medical authority.
2. **Deterministic Triage Protection:** A hardcoded, clinical-rule-based Risk Engine always takes precedence over statistical AI probabilities when red-flag symptoms or life-threatening vitals are detected.
3. **Zero-Trust Role Isolation:** Strict PostgreSQL Row-Level Security (RLS) guarantees that patients, doctors, pharmacists, and administrators only access the minimum necessary data required for their clinical duty.
4. **End-to-End Pharmacy Traceability:** Automated First-Expiry-First-Out (FEFO) dispensing ensures patients receive the freshest, safest medications while reducing dispensary wastage.

---

## 2. GOALS & NON-GOALS

### 2.1 Goals
- Provide rapid, preliminary AI symptom assessment based on 132 standardized symptoms and patient vitals.
- Enable seamless, conflict-free doctor discovery and appointment booking.
- Facilitate zero-setup, P2P encrypted browser-native WebRTC teleconsultations.
- Support tamper-resistant, digitally signed electronic prescriptions (Rx).
- Automate pharmacy prescription review, FEFO batch allocation, and order fulfillment.
- Maintain comprehensive audit trails for regulatory compliance (ABDM and HIPAA awareness).
- Support multi-channel communication (In-App, Email, SMS, WhatsApp, Web Push).

### 2.2 Non-Goals
- **Autonomous Diagnosis:** MediMind AI will **never** declare a definitive clinical diagnosis without human physician review.
- **Autonomous Prescription Generation:** The AI will **never** generate, approve, or transmit a prescription directly to a patient or pharmacy.
- **Dosage Speculation:** The AI will **never** suggest specific drug dosages, titration schedules, or instructions to stop/start critical prescription medications.
- **Open-Web Scraping for Triage:** The system will **never** use unverified internet forums or uncontrolled web crawls for clinical knowledge.
- **Super Admin Persona:** There is no active "Super Admin" role with unrestricted access to private patient medical records.

---

## 3. USER ROLES & ACCESS MATRIX

The system strictly enforces **four canonical roles**:

```
                  ┌─────────────────────────────────────────┐
                  │          MediMind AI Platform           │
                  └────────────────────┬────────────────────┘
                                       │
         ┌─────────────────┬───────────┴───────────┬─────────────────┐
         ▼                 ▼                       ▼                 ▼
  ┌─────────────┐   ┌─────────────┐         ┌─────────────┐   ┌─────────────┐
  │   PATIENT   │   │   DOCTOR    │         │  PHARMACIST │   │    ADMIN    │
  └─────────────┘   └─────────────┘         └─────────────┘   └─────────────┘
```

| Dimension | Patient (`patient`) | Doctor (`doctor`) | Pharmacist (`pharmacist`) | Admin (`admin`) |
| :--- | :--- | :--- | :--- | :--- |
| **Primary Goal** | Symptom triage, booking, records, medicine ordering | Queue management, clinical consultation, digital Rx | Prescription verification, inventory, FEFO dispatch | Platform compliance, verification, audit, analytics |
| **Self-Registration** | Yes (Public sign-up) | Yes (Requires license credential) | Yes (Requires drug license & store) | No (Administrative provisioning only) |
| **Verification Gate** | Approved on creation | Verified by Admin (`approved`) | Verified by Admin (`approved`) | System Operator |
| **Medical Record Access**| Own records only (`auth.uid() = id`) | Authorized patients only (active consult) | Prescription items only (assigned orders) | **Zero raw PHI access** (Aggregated metadata only) |
| **Prescribing Rights** | None | Full clinical prescribing authority | None (Fulfillment only) | None |
| **Primary Dashboard** | `/patient/dashboard` | `/doctor/dashboard` | `/pharmacy/dashboard` | `/admin/dashboard` |

---

## 4. COMPLETE PERSONA WORKFLOWS

### 4.1 Patient Complete Workflow

```
[1. Registration & Auth]
   │ Patient registers at /register -> auto-confirmed in Auth & public.patients -> redirects to /patient/dashboard
   ▼
[2. AI Symptom Triage & Report Analysis]
   │ Patient visits /symptom-checker -> enters symptoms & vitals -> calls ml-service /api/predict
   │ Patient uploads lab report at /reports -> calls ml-service /api/reports/analyze -> extracts biomarkers
   ▼
[3. Clinical Risk & Possible Conditions]
   │ Deterministic RiskEngine calculates severity (0-100) & triage category (Emergency/Urgent/Routine)
   │ ML Random Forest predicts probable condition distribution (41 classes)
   ▼
[4. Doctor Discovery & Recommendation]
   │ System recommends specialist (e.g., Cardiologist) -> Patient navigates to /doctors
   │ Patient reviews doctor qualifications, ratings, consultation fee, and available OPD slots
   ▼
[5. Appointment Booking]
   │ Patient selects slot -> calls create_appointment_tx RPC -> atomic anti-double-booking check
   │ Generates appointment_number (APT-YYYYMMDD-XXXX) -> provisions patient_doctor_access
   ▼
[6. Video / In-Clinic Consultation]
   │ At appointment time, patient enters /patient/consultation/:appointmentId
   │ Browser establishes WebRTC P2P media stream with Doctor -> live messaging & audio/video
   ▼
[7. Digital Prescription & Order Placement]
   │ Doctor issues prescription -> Patient receives notification -> views Rx at /prescriptions
   │ Patient clicks "Order Medicines" -> items added to cart at /pharmacy
   ▼
[8. Checkout & Pharmacy Dispatch]
   │ Patient places order -> calls create_medicine_order_tx RPC -> order created in medicine_orders
   │ Pharmacy reviews, packs via FEFO, and marks dispatched
   ▼
[9. Delivery Tracking & History]
   │ Patient tracks real-time progress at /patient/orders -> delivery stepper updates to 'delivered'
```

### 4.2 Doctor Complete Workflow

```
[1. Practitioner Registration]
   │ Doctor signs up with Medical License #, specialization, and clinic affiliation
   │ System provisions record in public.doctors with verification_status = 'approved' (in dev)
   ▼
[2. Availability & Schedule Setup]
   │ Doctor navigates to /doctor/availability -> configures weekly OPD slots & consultation fee
   │ Writes to public.doctor_availability
   ▼
[3. Patient Queue Management]
   │ Doctor logs into /doctor/dashboard -> inspects today's patient queue at /doctor/appointments
   │ Views scheduled, in-progress, and completed consultations
   ▼
[4. Accessing Patient Clinical Context]
   │ Doctor opens /doctor/records -> queries public.patient_doctor_access
   │ Examines patient vitals history, past lab reports, and AI triage summaries
   ▼
[5. Teleconsultation Room]
   │ Doctor launches /doctor/consultation/:appointmentId -> browser-native WebRTC session connects
   │ Inspects real-time AI differential insights (strictly supportive) at /doctor/ai-insights
   ▼
[6. Digital Prescription Issuance]
   │ Doctor opens /doctor/prescribe -> selects authorized patient -> enters drug, dosage, frequency
   │ Submits via create_prescription_tx RPC -> writes to public.prescriptions & prescription_items
   │ System automatically dispatches notification to patient and audit log
```

### 4.3 Pharmacy Complete Workflow

```
[1. Dispensary Registration]
   │ Pharmacist registers pharmacy name, drug retail license number (Form 20/21), and address
   │ System provisions record in public.pharmacies
   ▼
[2. Medicine Catalog & Inventory Ingestion]
   │ Pharmacist visits /pharmacy/inventory -> adds drug items with batch #, expiry date, stock
   │ Writes to public.pharmacy_inventory and batch records
   ▼
[3. Prescription Order Intake]
   │ Patient orders are routed to dispensary -> pharmacist views live queue at /pharmacy/orders
   │ Reviews digital Rx authenticity and doctor license attribution
   ▼
[4. FEFO Allocation & Fulfillment]
   │ Pharmacist clicks "Fulfill Order" -> executes pharmacy_fulfill_prescription_tx RPC
   │ Database automatically allocates inventory from earliest expiring batch (FEFO)
   │ Stock quantity decrements atomically; order status transitions to 'packed'
   ▼
[5. Dispatch & Tracking Updates]
   │ Pharmacist dispatches order with tracking courier details -> status transitions to 'dispatched'
   │ Patient receives instant notification via multi-channel router
```

### 4.4 Admin Complete Workflow

```
[1. Secure Operator Sign-In]
   │ Admin signs in with system credentials at /login -> redirected to /admin/dashboard
   │ User role validated via public.user_roles (role = 'admin')
   ▼
[2. Practitioner Verification Gate]
   │ Admin visits /admin/doctor-approvals and /admin/pharmacy-approvals
   │ Reviews uploaded medical council and pharmacy drug licenses
   │ Executes verify_doctor_tx or verify_pharmacy_tx RPC -> approves or rejects with reason
   ▼
[3. Multi-Role User Governance]
   │ Admin inspects /admin/users -> views platform accounts, roles, and status (active/suspended)
   │ Zero PHI exposure: names, roles, and timestamps visible; clinical records strictly hidden
   ▼
[4. Platform & AI Usage Monitoring]
   │ Admin monitors system health at /admin/ai-usage and /admin/analytics
   │ Inspects daily Gemini API calls, token consumption, rate-limiting alarms, and latency
   ▼
[5. Security Auditing & System Settings]
   │ Admin reviews tamper-evident log stream at /admin/audit-logs
   │ Audits administrative actions, verification events, and role updates
```

---

## 5. BUSINESS & CLINICAL SAFETY RULES

1. **Rule of Human Authority:** No AI assessment is clinically binding. The disclaimer must be prominently displayed across all triage screens: *"AI-assisted preliminary assessment. Not a final clinical diagnosis. Consult a licensed physician."*
2. **Rule of Emergency Supremacy:** If the Risk Engine detects emergency red flags (e.g., chest pain with diaphoresis, severe hypotension, severe respiratory distress), all standard UI recommendations are superseded by an immediate red alert advising emergency department transfer.
3. **Anti-Double Booking Invariant:** No doctor can be booked for the same date and time slot more than once. Enforced by PostgreSQL unique index `uq_appointment_slot`.
4. **FEFO Inventory Allocation:** Dispensary inventory deduction must always allocate stock from the earliest valid expiration date that is at least 30 days in the future.
5. **Prescription Immutability:** Once a prescription is issued and finalized, its clinical medication items cannot be altered by either the patient or pharmacy.
6. **Administrative PHI Blindness:** System administrators cannot inspect raw patient symptoms, medical reports, or consultation transcripts. Their oversight is restricted to system health, licensing verification, and operational metrics.

---

## 6. FUNCTIONAL REQUIREMENTS

### 6.1 Authentication & Profile Management
- **FR-AUTH-01:** Support self-registration for Patients, Doctors, and Pharmacies.
- **FR-AUTH-02:** Email auto-confirmation via dev server auth bridge to eliminate onboarding friction.
- **FR-AUTH-03:** Four distinct role portals with automatic redirection to persona dashboard.
- **FR-AUTH-04:** 1-Click quick login presets for evaluation and rapid QA.

### 6.2 Patient Clinical Triage
- **FR-TRI-01:** Multi-select intake of 132 standardized symptoms.
- **FR-TRI-02:** Quantitative vital input (Systolic BP, Diastolic BP, Blood Sugar, BMI, Age, Smoking).
- **FR-TRI-03:** Synchronous integration with FastAPI ML service returning top condition predictions with confidence scores.
- **FR-TRI-04:** Independent risk scoring assigning Severity Score (0–100) and Triage Level (Emergency, High, Medium, Low).
- **FR-TRI-05:** Automated matching with clinical specialists based on suspected etiology.

### 6.3 Lab Report Analysis
- **FR-REP-01:** Upload handling for clinical lab slips (PDF, PNG, JPEG) up to 10MB.
- **FR-REP-02:** Text extraction via PDFPlumber and Gemini Vision OCR.
- **FR-REP-03:** Biomarker normalization into standard clinical units (e.g., mg/dL, g/dL, %).
- **FR-REP-04:** Direct linking between abnormal lab findings and the symptom risk engine.

### 6.4 Telemedicine & WebRTC
- **FR-TEL-01:** Pure browser-native WebRTC peer-to-peer connection for live teleconsultations.
- **FR-TEL-02:** Signaling via authenticated Supabase Realtime channels.
- **FR-TEL-03:** Audio mute, video toggle, and text chat side panel.

### 6.5 Pharmacy & Prescription
- **FR-PHM-01:** Digital Rx creation with structured drug name, dosage, frequency, and duration.
- **FR-PHM-02:** Inventory tracking with batch numbers and expiry tracking.
- **FR-PHM-03:** Order status lifecycle: `pending` -> `prescription_review` -> `confirmed` -> `packed` -> `dispatched` -> `delivered`.

---

## 7. NON-FUNCTIONAL REQUIREMENTS

- **Performance:** Symptom triage response time < 800ms; ML inference execution < 150ms.
- **Security:** 100% of public database tables protected by Row-Level Security (RLS).
- **Zero Secret Leakage:** No `service_role` keys or AI Studio API keys in frontend bundles.
- **Reliability:** Dual-table compatibility triggers (`orders` <-> `medicine_orders`) ensuring zero database sync drift.
- **Browser Compatibility:** Google Chrome, Mozilla Firefox, Microsoft Edge, Safari (ES2022+ standards).
- **Accessibility:** High-contrast text compliance, ARIA landmark semantics, keyboard navigable forms.

---

## 8. CURRENT IMPLEMENTATION STATUS & ROADMAP

| Phase | Description | Status | Verification Evidence |
| :--- | :--- | :--- | :--- |
| **Phase 1** | Machine Learning Symptom Classifier & Risk Engine | **COMPLETED** | `ml-service/tests/test_phase1.py` (97.62% test accuracy) |
| **Phase 2** | Medical Report Parser & Biomarker Normalizer | **COMPLETED** | `ml-service/tests/test_report_pipeline.py` |
| **Phase 3** | Core Database Schema & Authentication Baseline | **COMPLETED** | `supabase/migrations/0001` to `0007` |
| **Phase 4** | Patient Experience & OPD Booking | **COMPLETED** | `scripts/verify_phase4_patient_experience.js` |
| **Phase 5** | Doctor Clinical Platform & Digital Rx | **COMPLETED** | `scripts/verify_phase5_doctor_platform.js` |
| **Phase 6** | Pharmacy Dispensary & FEFO Inventory Platform | **COMPLETED** | `scripts/verify_phase6_pharmacy_platform.js` |
| **Phase 7** | Administrative Governance & Licensing Verification | **COMPLETED** | `scripts/verify_phase7_admin_platform.js` |
| **Phase 8** | Integrated Clinical AI Orchestrator & RAG Knowledge | **COMPLETED** | `scripts/verify_phase8_ai_intelligence.js` |
| **Phase 9** | Multi-Channel Notifications & Communication Platform| **COMPLETED** | `scripts/verify_phase9_notification_platform.js` |
| **Phase 10**| Mobile App Packaging & Advanced ABDM M2/M3 Integration| **PLANNED** | Awaiting Phase 1–9 stabilization sign-off |
