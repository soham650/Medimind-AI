# MediMind AI — Database Architecture & Schema Specification

**Document Status:** VERIFIED & FROZEN BASELINE  
**Database Platform:** Supabase Managed PostgreSQL 15+ (PostgREST API, Supabase Auth, GoTrue)  
**Extensions Active:** `uuid-ossp`, `pgcrypto`  
**Security Standard:** 100% Mandatory Row-Level Security (RLS) on all tables, Strict 4-Role RBAC, Atomic Database Stored Procedures (RPCs) with Row-Level Locks (`FOR UPDATE`)  
**Database Baseline:** Migrations `0001_init_schema.sql` through `0009_production_issue_remediation.sql` (**FROZEN — Migration 0010 MUST NOT be created without explicit architectural authorization**).

---

## 1. Database Platform & Architecture Overview

MediMind AI utilizes a hybrid relational and JSONB PostgreSQL architecture hosted on Supabase.
All client interactions communicate directly with PostgreSQL via the PostgREST REST interface or Supabase Client SDK, protected by PostgreSQL Row-Level Security (RLS). Privileged administrative tasks (such as atomic multi-table booking, prescription generation, and stock decrementing) are strictly routed through atomic database functions (`SECURITY DEFINER` RPCs).

```
┌────────────────────────────────────────────────────────┐
│               Browser / Client Applications            │
│   (Patient, Doctor, Pharmacist, Admin Frontend Pages)  │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT Auth Bearer
                            ▼
┌────────────────────────────────────────────────────────┐
│           Supabase API Gateway (PostgREST)             │
│        Resolves auth.uid() & claims from JWT           │
└─────────────┬────────────────────────────┬─────────────┘
              │ Direct Select / CRUD       │ RPC Execution
              ▼                            ▼
┌───────────────────────────────┐ ┌──────────────────────┐
│  Row-Level Security (RLS)     │ │ Stored Procedures    │
│  - Cross-Patient Isolation    │ │ (SECURITY DEFINER)   │
│  - Doctor Clinical Access     │ │ - Atomic Tx          │
│  - Pharmacy Stock Isolation   │ │ - Concurrency Locks  │
│  - Admin Verification Policy  │ │ - Immutable Auditing │
└─────────────┬─────────────────┘ └──────────┬───────────┘
              │                              │
              ▼                              ▼
┌────────────────────────────────────────────────────────┐
│             PostgreSQL 15+ Tables & Indexes            │
│   Identity | Clinical | Pharmacy | AI Triage | Audit   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Active Canonical Roles

The database enforces strictly **four canonical roles**:
1. `patient` — Healthcare consumer seeking triage, booking appointments, accessing personal health records, and ordering prescribed medications.
2. `doctor` — Licensed physician managing clinical availability, conducting teleconsultations, reviewing patient records, and issuing digital prescriptions.
3. `pharmacist` — Licensed dispensing pharmacy managing drug catalog inventory, batches, and fulfilling patient prescription orders.
4. `admin` — Compliance officer verifying doctor credentials, pharmacy licenses, reviewing immutable audit logs, and monitoring platform telemetry.

> [!CAUTION]
> **No Super Admin:** The application and database explicitly operate on these 4 roles. Legacy references to `super_admin` in raw scripts are deprecated; `is_admin()` checks strictly evaluate for system compliance administration.

---

## 3. Database Migration Baseline (0001–0009)

The production database is built on a cumulative, idempotent set of 9 SQL migrations located in [`supabase/migrations/`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations):

| Migration File | Primary Responsibility |
|---|---|
| [`0001_init_schema.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0001_init_schema.sql) | Baseline identity schema, `profiles`, `user_roles`, `patients`, `doctors`, `appointments`, and basic RLS. |
| [`0002_predictions_table.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0002_predictions_table.sql) | AI symptom prediction storage table and patient correlation schema. |
| [`0003_medimind_backend_schema.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0003_medimind_backend_schema.sql) | Medical records, clinical notes, digital prescriptions, pharmacy inventory, and medication scheduling. |
| [`0004_full_architecture_schema.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0004_full_architecture_schema.sql) | `patient_doctor_access` authorization bridge, immutable audit logs, pharmacy orders, and rating entities. |
| [`0005_production_backend_schema.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0005_production_backend_schema.sql) | Complete production transaction suite: atomic RPCs (`create_appointment_tx`, `create_prescription_tx`, etc.), role checking helper functions, and storage bucket security policies. |
| [`0006_smart_diagnostics_and_abdm_suite.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0006_smart_diagnostics_and_abdm_suite.sql) | Diagnostic lab packages, home sample collection bookings, ABDM 3.0 consent artifacts, and cryptographic audit logs. |
| [`0007_complete_system_architecture_suite.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0007_complete_system_architecture_suite.sql) | Telehealth ambient scribe records (`consultation_sessions`), DSC digital signatures, multi-modal AI clinical findings (`ai_clinical_findings`), and disease guidelines. |
| [`0008_full_product_gap_closure.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0008_full_product_gap_closure.sql) | Rate limiting telemetry, daily AI cost meters, doctor verification logs, pharmacy licensing verification records, and cross-module notification indexing. |
| [`0009_production_issue_remediation.sql`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations/0009_production_issue_remediation.sql) | Fixes constraint collisions, reinforces idempotency, refines RLS policies for public catalogs (`medicines`, `lab_packages`), and hardens doctor slot unicity. |

> [!IMPORTANT]
> **FROZEN BASELINE:** The database baseline is locked. Do not create `0010_*.sql` or run destructive SQL (`DROP SCHEMA public CASCADE`). All new features must align with the existing schema.

---

## 4. Comprehensive Table Catalog

### 4.1 Identity & Practitioner Domain

#### `public.user_roles`
- **Purpose:** System role assignment linking `auth.users` to one of the 4 canonical roles.
- **Primary Key:** `id` (UUID, `DEFAULT gen_random_uuid()`)
- **Important Columns:** `user_id` (UUID, FK -> `auth.users`), `role` (VARCHAR: `patient`, `doctor`, `pharmacist`, `admin`), `created_at` (TIMESTAMPTZ)
- **Foreign Keys:** `user_id` references `auth.users(id) ON DELETE CASCADE`
- **Who can Read:** User reads own role (`user_id = auth.uid()`); Admins read all.
- **Who can Insert/Update/Delete:** Strictly restricted to Admins (`public.is_admin() = true`). Normal users cannot self-elevate.
- **RLS Policies:** `user_roles_select_own`, `user_roles_admin_all`
- **Sensitive Data:** User authorization tier.

#### `public.profiles`
- **Purpose:** Core demographic and contact profile for all users.
- **Primary Key:** `id` (UUID, matches `auth.users.id`)
- **Important Columns:** `first_name`, `last_name`, `email`, `phone`, `role`, `approval_status` (`pending`, `approved`, `rejected`), `avatar_url`, `created_at`, `updated_at`
- **Foreign Keys:** `id` references `auth.users(id) ON DELETE CASCADE`
- **Who can Read:** User reads own profile; Admins read all profiles; Doctors read patient profiles via `patient_doctor_access`.
- **Who can Update:** Users update own profile details; `approval_status` modification is locked to Admins.
- **RLS Policies:** `profiles_read_own`, `profiles_update_own`, `profiles_admin_all`

#### `public.patients`
- **Purpose:** Clinical baseline and demographic information for patients.
- **Primary Key:** `id` (UUID, matches `auth.users.id`)
- **Important Columns:** `date_of_birth`, `gender`, `blood_group`, `height_cm`, `weight_kg`, `abha_id`, `is_smoker`, `emergency_contact_name`, `emergency_contact_phone`, `medical_history` (JSONB)
- **Foreign Keys:** `id` references `profiles(id) ON DELETE CASCADE`
- **Who can Read:** Owning patient (`id = auth.uid()`); treating doctors with active `patient_doctor_access`; Admins.
- **Who can Insert/Update:** Owning patient.
- **Sensitive Data:** Protected Health Information (PHI), blood group, medical history, emergency contacts.

#### `public.doctors`
- **Purpose:** Medical practitioner profile, credentials, and verification status.
- **Primary Key:** `id` (UUID, matches `auth.users.id`)
- **Important Columns:** `medical_license_number`, `specialization`, `qualifications`, `experience_years`, `clinic_hospital_name`, `consultation_fee`, `rating`, `total_reviews`, `verification_status` (`pending`, `approved`, `rejected`), `is_available`
- **Foreign Keys:** `id` references `profiles(id) ON DELETE CASCADE`
- **Who can Read:** Patients and Pharmacists can ONLY view verified doctors (`verification_status = 'approved'`); Doctors can view all colleagues; Admins view all.
- **Who can Update:** Doctor updates own profile (excluding `verification_status`); Admin updates verification status.
- **Sensitive Data:** License number, compliance documentation.

#### `public.doctor_availability`
- **Purpose:** Recurring weekly appointment slot matrix for doctors.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `doctor_id` (UUID, FK), `day_of_week` (INT, 0=Sun .. 6=Sat), `start_time` (TIME), `end_time` (TIME), `slot_duration_minutes` (INT, default 30), `is_active` (BOOL)
- **Foreign Keys:** `doctor_id` references `doctors(id) ON DELETE CASCADE`
- **Constraints:** `UNIQUE (doctor_id, day_of_week, start_time)`
- **Who can Read:** Public / All authenticated users (to render appointment booking calendar).
- **Who can Mutate:** Owning doctor (`doctor_id = auth.uid()`); Admins.

#### `public.doctor_verifications`
- **Purpose:** Audit trail of clinical credential verification by compliance administrators.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `doctor_id` (UUID, FK), `verified_by` (UUID, FK -> `profiles`), `status` (`approved`, `rejected`), `rejection_reason` (TEXT), `verification_date` (TIMESTAMPTZ)
- **Who can Read:** Owning doctor (to review approval/rejection details); Admins.
- **Who can Mutate:** Strictly Admins.

#### `public.pharmacies`
- **Purpose:** Licensed retail pharmacy entity and dispensary location.
- **Primary Key:** `id` (UUID, matches `auth.users.id`)
- **Important Columns:** `pharmacy_name`, `drug_license_number`, `gstin`, `address_line1`, `city`, `state`, `postal_code`, `phone`, `operating_hours`, `verification_status` (`pending`, `approved`, `rejected`), `is_active`
- **Foreign Keys:** `id` references `profiles(id) ON DELETE CASCADE`
- **Who can Read:** Public/Patients view `approved` pharmacies only; Pharmacists view own; Admins view all.
- **Who can Mutate:** Pharmacist modifies contact/hours; Admin controls `verification_status`.

#### `public.pharmacy_verifications`
- **Purpose:** Regulatory verification audit log for retail drug dispensary licenses.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `pharmacy_id`, `verified_by`, `status`, `rejection_reason`, `created_at`
- **Access:** Restricted to owning pharmacist and compliance administrators.

---

### 4.2 Clinical Encounters & Telehealth Domain

#### `public.patient_doctor_access`
- **Purpose:** Cryptographic access bridge granting a doctor temporary permission to read a patient's medical records upon booking an appointment or explicit ABDM consent.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id` (UUID, FK), `doctor_id` (UUID, FK), `is_active` (BOOL), `granted_at` (TIMESTAMPTZ), `expires_at` (TIMESTAMPTZ, default 14 days)
- **Constraints:** `UNIQUE (patient_id, doctor_id)`
- **Who can Read:** Participating patient and doctor; Admins.
- **Who can Mutate:** Managed automatically via `create_appointment_tx` or ABDM consent flow.

#### `public.appointments`
- **Purpose:** Core patient-doctor clinical appointment state machine.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `appointment_reference` (VARCHAR, e.g. `APT-20261001-9921`), `patient_id` (UUID, FK), `doctor_id` (UUID, FK), `appointment_date` (DATE), `time_slot` (TEXT, e.g. `"10:00 - 10:30"`), `consultation_type` (`video`, `in_person`), `status` (`requested`, `confirmed`, `in_progress`, `completed`, `cancelled`, `no_show`), `symptoms_summary` (TEXT), `patient_notes` (TEXT), `cancellation_reason` (TEXT)
- **Constraints:** `UNIQUE (doctor_id, appointment_date, time_slot)` — Hard engine-level anti-double booking invariant.
- **Who can Read:** Participating patient (`patient_id = auth.uid()`), participating doctor (`doctor_id = auth.uid()`), and Admins.
- **Who can Mutate:** Mutated via `create_appointment_tx` or update status by doctor/patient.

#### `public.consultations`
- **Purpose:** Clinical record of an encounter, documenting diagnosis, clinical observations, and follow-ups.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `appointment_id` (UUID, FK), `patient_id` (UUID, FK), `doctor_id` (UUID, FK), `chief_complaint` (TEXT), `doctor_notes` (TEXT), `clinical_summary` (TEXT), `meeting_url` (TEXT), `started_at`, `ended_at`, `follow_up_date` (DATE)
- **Access:** Strictly restricted to participating patient and doctor.

#### `public.consultation_sessions`
- **Purpose:** Ambient AI clinical scribe transcripts, extracted SNOMED entities, and structured SOAP notes.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `consultation_id` (UUID, FK), `transcript_text` (TEXT), `snomed_entities` (JSONB), `soap_subjective`, `soap_objective`, `soap_assessment`, `soap_plan`, `dsc_token` (VARCHAR, clinician cryptographic signature)
- **Access:** Restricted to attending doctor and patient.

#### `public.medical_records`
- **Purpose:** Longitudinal electronic health records (EHR).
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id` (UUID, FK), `doctor_id` (UUID, FK, nullable), `record_type` (`diagnosis`, `lab_report`, `clinical_note`, `discharge_summary`), `title` (TEXT), `description` (TEXT), `file_url` (TEXT), `metadata` (JSONB)
- **Access:** Patient reads own; Doctors read if active `patient_doctor_access` exists.

#### `public.patient_allergies`
- **Purpose:** Documented allergens and reaction severities to prevent adverse drug events during prescribing.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id` (UUID, FK), `allergen_name` (TEXT), `severity` (`Mild`, `Moderate`, `Severe`), `reaction_details` (TEXT)
- **Access:** Patient modifies; treating doctor reads before issuing Rx.

---

### 4.3 AI Diagnostic Intelligence Domain

#### `public.symptom_assessments`
- **Purpose:** Persistent record of Phase 1 ML Random Forest predictions (`symptom-rf-v1`) and independent clinical risk engine triage results.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id` (UUID, FK, nullable for guest triage), `reported_symptoms` (JSONB array), `normalized_vector` (JSONB), `differential_diagnosis` (JSONB array of conditions with confidence), `predicted_condition` (TEXT), `model_confidence` (NUMERIC), `risk_level` (`Low`, `Moderate`, `High`), `red_flags_identified` (JSONB), `recommended_specialist` (TEXT), `disclaimer` (TEXT)
- **Access:** Owning patient reads own assessments; treating doctor reads with patient access.

#### `public.health_reports`
- **Purpose:** Metadata and extracted clinical parameters from medical report uploads (PDF/Images) parsed by Gemini Report Intelligence.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id` (UUID, FK), `file_name` (TEXT), `file_path` (TEXT, Supabase Storage path), `mime_type` (TEXT), `file_size_bytes` (INT), `extracted_parameters` (JSONB), `abnormal_findings` (JSONB), `summary` (TEXT), `risk_level` (`Low`, `Moderate`, `High`), `created_at` (TIMESTAMPTZ)
- **Access:** Owning patient reads/writes; treating doctor reads via access bridge.

#### `public.ai_clinical_findings`
- **Purpose:** Multi-modal predictive alerts (e.g. Sepsis risk, QTc prolongation) presented to clinicians with SHAP attribution weights.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `patient_id`, `doctor_id`, `finding_type`, `severity_score`, `shap_attributions` (JSONB), `clinician_signoff` (BOOL), `signoff_notes`
- **Access:** Attending physician and patient.

#### `public.disease_clinical_guidelines`
- **Purpose:** Standardized clinical guidelines repository mapping conditions to specialties, ESI acuity levels, precautions, and home care protocols.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `condition_name`, `icd10_code`, `recommended_specialty`, `esi_acuity_level`, `clinical_precautions` (JSONB), `home_care_protocol` (JSONB), `red_flag_symptoms` (JSONB)
- **Access:** Publicly readable by all authenticated users.

---

### 4.4 Digital Prescriptions & Pharmacy Fulfillment Domain

#### `public.prescriptions`
- **Purpose:** Legally binding digital medical prescriptions issued exclusively by verified doctors.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `rx_id` (VARCHAR, e.g. `RX-2026-9811`, UNIQUE), `patient_id` (UUID, FK), `doctor_id` (UUID, FK), `appointment_id` (UUID, FK), `diagnosis` (TEXT), `general_advice` (TEXT), `follow_up_date` (DATE), `is_dispensed` (BOOL), `created_at` (TIMESTAMPTZ)
- **Who can Read:** Patient reads own prescriptions; issuing doctor reads own; dispensing pharmacist reads ONLY if attached to an order placed at their dispensary.
- **Who can Insert:** Restricted strictly to verified doctors via `create_prescription_tx`.

#### `public.prescription_items`
- **Purpose:** Itemized medication rows within a prescription.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `prescription_id` (UUID, FK), `medicine_name` (TEXT), `dosage` (TEXT, e.g. `"500mg"`), `frequency` (TEXT, e.g. `"1-0-1 (Twice daily)"`), `duration_days` (INT), `instructions` (TEXT, e.g. `"After food"`)
- **Foreign Keys:** `prescription_id` references `prescriptions(id) ON DELETE CASCADE`
- **Access:** Inherits parent prescription access rules.

#### `public.medicines`
- **Purpose:** Master pharmaceutical reference catalog.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `brand_name` (TEXT), `generic_name` (TEXT), `category` (TEXT), `dosage_form` (`tablet`, `syrup`, `injection`, `capsule`, `ointment`), `strength` (TEXT), `standard_price` (NUMERIC), `prescription_required` (BOOL), `is_active` (BOOL)
- **Access:** Publicly readable by all users; Admins manage catalog items.

#### `public.pharmacy_inventory`
- **Purpose:** Pharmacy-specific stock, unit pricing, batch numbers, and expiry dates.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `pharmacy_id` (UUID, FK), `medicine_id` (UUID, FK), `stock_quantity` (INT), `unit_price` (NUMERIC), `batch_number` (TEXT), `expiry_date` (DATE), `reorder_level` (INT)
- **Constraints:** `UNIQUE (pharmacy_id, medicine_id, batch_number)`
- **Access:** Pharmacist has full CRUD on own stock; Patients/Doctors read available quantities and prices; Other pharmacies CANNOT view competitor pricing or stock.

#### `public.medicine_orders`
- **Purpose:** Order records placed by patients with specific pharmacies for prescription dispensation.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `order_reference` (VARCHAR, e.g. `ORD-20261001-8121`), `patient_id` (UUID, FK), `pharmacy_id` (UUID, FK), `prescription_id` (UUID, FK, nullable), `order_status` (`pending`, `prescription_review`, `confirmed`, `packed`, `out_for_delivery`, `delivered`, `cancelled`), `total_amount` (NUMERIC), `payment_method` (`cod`, `online`), `delivery_address` (TEXT), `cancellation_reason` (TEXT)
- **Access:** Patient views own orders; Dispensing pharmacy views assigned orders; Admins view all.

#### `public.order_items`
- **Purpose:** Itemized medication rows within a medicine order.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `order_id` (UUID, FK), `medicine_id` (UUID, FK), `quantity` (INT), `unit_price` (NUMERIC), `total_price` (NUMERIC)
- **Access:** Inherits parent `medicine_orders` access boundaries.

---

### 4.5 Diagnostics, System Telemetry & Auditing Domain

#### `public.notifications`
- **Purpose:** Real-time in-app alerts and notifications across all 4 roles.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `user_id` (UUID, FK), `title` (TEXT), `message` (TEXT), `type` (`appointment`, `prescription`, `order`, `system`, `alert`), `reference_id` (TEXT), `is_read` (BOOL, default `false`), `created_at` (TIMESTAMPTZ)
- **Access:** Strictly isolated to recipient (`user_id = auth.uid()`).

#### `public.audit_logs`
- **Purpose:** HIPAA/ABDM immutable compliance audit trail recording all privileged clinical actions.
- **Primary Key:** `id` (UUID)
- **Important Columns:** `actor_id` (UUID), `actor_role` (VARCHAR), `action` (TEXT), `entity_type` (TEXT), `entity_id` (TEXT), `ip_address` (TEXT), `details` (JSONB), `created_at` (TIMESTAMPTZ)
- **Access:** Non-modifiable; Readable strictly by compliance administrators (`public.is_admin() = true`).

---

## 5. Entity Relationships in Plain Language

```
       ┌──────────┐
       │auth.users│
       └────┬─────┘
            │ 1:1
     ┌──────┴──────┬─────────────┬─────────────┐
     ▼             ▼             ▼             ▼
┌─────────┐   ┌─────────┐   ┌──────────┐  ┌─────────┐
│ Patient │   │ Doctor  │   │ Pharmacist│ │  Admin  │
└────┬────┘   └────┬────┘   └────┬─────┘  └─────────┘
     │             │             │
     │ 1:N         │ 1:N         │ 1:N
     ▼             ▼             ▼
┌─────────────┐ ┌──────────────┐ ┌──────────────────┐
│Appointments │◄┤ Availability │ │Pharmacy Inventory│
└──────┬──────┘ └──────────────┘ └────────┬─────────┘
       │                                  │
       ▼ 1:1                              │ 1:N
┌─────────────┐                           ▼
│Consultations│                    ┌──────────────┐
└──────┬──────┘                    │Medicine Order│
       │                           └──────▲───────┘
       ▼ 1:1                              │
┌─────────────┐                           │ 1:N
│Prescriptions├───────────────────────────┘
└──────┬──────┘
       │ 1:N
       ▼
┌──────────────────┐
│Prescription Items│
└──────────────────┘
```

1. **A User** registers through Supabase Auth, generating a record in `auth.users`, a corresponding `profiles` entry, and a `user_roles` assignment (`patient`, `doctor`, `pharmacist`, or `admin`).
2. **A Patient** profile extends the user, linking to multiple `appointments`, `medical_records`, `symptom_assessments`, `health_reports`, `prescriptions`, `medicine_orders`, and `notifications`.
3. **A Doctor** profile requires verification by an Administrator. Once approved, the doctor establishes a weekly schedule in `doctor_availability`.
4. **An Appointment** binds a Patient and an approved Doctor to an exact date and 30-minute time slot. The database prevents duplicate bookings for that doctor slot.
5. **The Appointment creation** triggers an automatic 14-day `patient_doctor_access` bridge, enabling the doctor to view the patient's medical history.
6. **A Consultation** documents the clinical encounter, generating a diagnosis, summary notes, and optional ambient scribe SOAP notes in `consultation_sessions`.
7. **A Prescription** can ONLY be generated by the treating doctor. It receives an authenticated `rx_id` and unpacks items into `prescription_items`.
8. **A Pharmacy** stocks catalog medicines in `pharmacy_inventory` with prices, batch numbers, and expiry dates.
9. **A Medicine Order** is created by a Patient selecting an approved Pharmacy and linking a Prescription. The database verifies inventory stock, locks rows, decrements stock atomically, and records `order_items`.
10. **A Notification** is generated automatically across every lifecycle event (booking, confirmation, prescription issuance, order dispatch).

---

## 6. Stored Procedures & Atomic Transactions (RPC Guide)

To maintain absolute data integrity, avoid race conditions, and prevent client-side price or stock tampering, all critical mutations are routed through PostgreSQL `SECURITY DEFINER` functions:

### 6.1 `create_appointment_tx`
- **Purpose:** Atomically books a doctor appointment, checks for conflicting bookings, creates an access bridge, and notifies the doctor.
- **Parameters:**
  - `p_doctor_id` (UUID)
  - `p_appointment_date` (DATE)
  - `p_time_slot` (TEXT, e.g. `"10:00 - 10:30"`)
  - `p_consultation_type` (TEXT: `'video'` or `'in_person'`)
  - `p_symptoms_summary` (TEXT)
  - `p_patient_notes` (TEXT)
- **Returns:** `JSONB` — `{ "success": true, "appointment_id": "...", "reference": "APT-..." }`
- **Who can Call:** Authenticated patients (`auth.uid() IS NOT NULL`).
- **Validation Performed:**
  1. Verifies caller is authenticated.
  2. Verifies appointment date is not in the past (`p_appointment_date >= CURRENT_DATE`).
  3. Verifies doctor exists and is verified (`verification_status = 'approved'`).
  4. Acquires row-level check to ensure slot is not already booked.
- **Tables Mutated:** `appointments` (INSERT), `patient_doctor_access` (INSERT/UPSERT 14-day bridge), `notifications` (INSERT for doctor), `audit_logs` (INSERT).
- **Why Direct Table Mutation is Prohibited:** Direct insertion on `appointments` cannot atomically provision the doctor access bridge or guarantee race-free booking under high concurrent load.

### 6.2 `create_prescription_tx`
- **Purpose:** Issues an official digital prescription with structured line items and dispatches patient alerts.
- **Parameters:**
  - `p_patient_id` (UUID)
  - `p_appointment_id` (UUID)
  - `p_diagnosis` (TEXT)
  - `p_medicines` (JSONB array of `{ medicine_name, dosage, frequency, duration_days, instructions }`)
  - `p_general_advice` (TEXT)
  - `p_follow_up_date` (DATE)
- **Returns:** `JSONB` — `{ "success": true, "prescription_id": "...", "rx_id": "RX-..." }`
- **Who can Call:** Verified doctors (`auth.uid() = doctor_id`).
- **Validation Performed:**
  1. Verifies caller holds active `doctor` role and has `verification_status = 'approved'`.
  2. Verifies appointment exists and caller is the assigned doctor.
  3. Validates non-empty medicines array.
- **Tables Mutated:** `prescriptions` (INSERT), `prescription_items` (INSERT for each line), `notifications` (INSERT for patient), `audit_logs` (INSERT).

### 6.3 `create_medicine_order_tx`
- **Purpose:** Places a medicine dispensation order with an approved pharmacy with server-side inventory verification and stock deduction.
- **Parameters:**
  - `p_pharmacy_id` (UUID)
  - `p_prescription_id` (UUID, nullable)
  - `p_items` (JSONB array of `{ medicine_id, quantity }`)
  - `p_payment_method` (TEXT)
  - `p_delivery_address` (TEXT)
- **Returns:** `JSONB` — `{ "success": true, "order_id": "...", "order_reference": "ORD-...", "total_amount": 1250.00 }`
- **Who can Call:** Authenticated patients.
- **Validation Performed:**
  1. Fetches current unit prices directly from `pharmacy_inventory` (ignores any client-passed price).
  2. Acquires row locks (`SELECT ... FOR UPDATE`) on target inventory records.
  3. Verifies `stock_quantity >= quantity` for all items; aborts transaction if stock is insufficient.
  4. Decrements `stock_quantity` atomically.
- **Tables Mutated:** `pharmacy_inventory` (UPDATE stock), `medicine_orders` (INSERT), `order_items` (INSERT), `notifications` (INSERT for pharmacy).

### 6.4 `pharmacy_fulfill_prescription_tx`
- **Purpose:** Advances delivery lifecycle of an order (`accept`, `pack`, `dispatch`, `deliver`, `cancel`).
- **Parameters:**
  - `p_order_id` (UUID)
  - `p_pharmacy_id` (UUID)
  - `p_action` (TEXT: `'accept'`, `'dispense'`, `'dispatch'`, `'deliver'`, `'cancel'`)
- **Returns:** `JSONB` — `{ "success": true, "new_status": "..." }`
- **Who can Call:** The assigned pharmacy (`pharmacy_id = auth.uid()`).
- **Validation Performed:** Verifies caller owns the order; on `'cancel'`, automatically returns reserved stock quantities to `pharmacy_inventory`.
- **Tables Mutated:** `medicine_orders` (UPDATE status), `pharmacy_inventory` (UPDATE if cancelled), `notifications` (INSERT for patient).

### 6.5 `verify_doctor_tx` & `verify_pharmacy_tx`
- **Purpose:** Approves or rejects healthcare practitioner credentials.
- **Parameters:** `p_id` (UUID), `p_action` (`'approve'` or `'reject'`), `p_reason` (TEXT)
- **Returns:** `JSONB` — `{ "success": true, "status": "approved" }`
- **Who can Call:** Strictly Administrators (`public.is_admin() = true`).
- **Tables Mutated:** `doctors` / `pharmacies` (UPDATE `verification_status`), `doctor_verifications` / `pharmacy_verifications` (INSERT audit log), `notifications` (INSERT for user).

---

## 7. Row-Level Security (RLS) Guide

### 7.1 What is RLS and Why Does MediMind Use It?
PostgreSQL Row-Level Security (RLS) restricts which rows a database query returns or modifies based on the executing user's authenticated identity (`auth.uid()`).
In traditional backends, developers write application-layer filters (`WHERE user_id = req.user.id`). If a developer forgets this `WHERE` clause in a single endpoint, catastrophic cross-patient data exposure (IDOR) occurs.
With RLS enabled on 100% of tables:
1. Even if the frontend runs `SELECT * FROM medical_records;`, PostgreSQL automatically filters rows so the patient receives **only their own records**.
2. A malicious user tampering with an API request cannot read or update another user's prescriptions, appointments, or medical reports.

### 7.2 Helper Functions for Authorization
The database defines standard security helper functions:
```sql
-- Checks if current executing user has the 'admin' role
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = 'admin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Checks if current executing user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.user_roles
        WHERE user_id = auth.uid() AND role = required_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 7.3 Real-World RLS Policies

#### 1. Patient Isolation Example
Patients can only view and update their own clinical baseline:
```sql
CREATE POLICY "patients_select_own" ON public.patients
FOR SELECT USING (
    auth.uid() = id OR
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda
        WHERE pda.patient_id = patients.id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true
          AND (pda.expires_at IS NULL OR pda.expires_at > NOW())
    )
);
```

#### 2. Cross-Pharmacy Stock Protection
A pharmacy can never inspect or alter a competitor's drug stock or wholesale pricing:
```sql
CREATE POLICY "pharmacy_inventory_owner_crud" ON public.pharmacy_inventory
FOR ALL USING (
    pharmacy_id = auth.uid() OR public.is_admin()
);
```

#### 3. Patient Prescription Order Visibility
Prescriptions are visible to pharmacists only if an order has been actively placed at their store:
```sql
CREATE POLICY "prescriptions_read_policy" ON public.prescriptions
FOR SELECT USING (
    patient_id = auth.uid() OR
    doctor_id = auth.uid() OR
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.medicine_orders mo
        WHERE mo.prescription_id = prescriptions.id 
          AND mo.pharmacy_id = auth.uid()
    )
);
```

---

## 8. Supabase Storage Architecture

Sensitive medical attachments are isolated in private Supabase Storage buckets:

| Bucket Name | Privacy Level | Max Size | Allowed MIME Types | Access Rules |
|---|---|---|---|---|
| `medical-documents` | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Patient or Doctor with active bridge. Write: Owning Patient (`{patient_id}/*`). |
| `doctor-documents` | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Doctor or Admin. Write: Owning Doctor (`{doctor_id}/*`). |
| `pharmacy-documents` | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Pharmacy or Admin. Write: Owning Pharmacy (`{pharmacy_id}/*`). |
| `profile-images` | Public | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Read: All. Write: Authenticated User (`{user_id}/*`). |

Storage downloads require time-limited cryptographic signed URLs (`supabase.storage.from('medical-documents').createSignedUrl(path, 300)`) with an expiration of 300 seconds.
