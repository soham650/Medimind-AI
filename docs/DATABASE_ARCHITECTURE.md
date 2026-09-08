# MEDIMIND AI — PRODUCTION DATABASE & TRANSACTION ARCHITECTURE

**Database System:** Supabase PostgreSQL 15+  
**Extensions Active:** `uuid-ossp`, `pgcrypto`  
**Security Model:** Mandatory RLS, Strict 5-Tier RBAC, Private Storage Buckets with Signed URLs, Atomic Stored Procedures (RPCs) with Row-Level Locks  

---

## 1. System Entity Relational Overview

The MediMind AI database schema is architected into 5 core operational domains:
1. **User Identity & Practitioner Credentialing:** `auth.users`, `user_roles`, `profiles`, `patients`, `doctors`, `doctor_verifications`, `doctor_availability`, `pharmacies`, `pharmacy_verifications`.
2. **Clinical Encounters & Doctor Access:** `patient_doctor_access`, `appointments`, `consultations`, `consultation_sessions`, `medical_records`, `patient_allergies`, `disease_clinical_guidelines`.
3. **AI Diagnostic Intelligence & Telemetry:** `symptom_assessments`, `health_reports`, `ai_clinical_findings`, `ai_usage_daily`, `rate_limit_events`, `chat_history`.
4. **Digital Prescriptions & Medicine Dispensation:** `prescriptions`, `prescription_items`, `medication_schedules`, `medicines`, `pharmacy_inventory`, `medicine_orders`, `order_items`.
5. **Diagnostics, Finance & Compliance:** `lab_packages`, `lab_tests`, `lab_bookings`, `payments`, `notifications`, `audit_logs`, `abdm_consents`, `abdm_audit_logs`, `patient_dependents`.

---

## 2. Core Entity Definitions

### 2.1 Identity & Practitioner Domain
- **`user_roles`**: System authorization tier. Roles: `patient`, `doctor`, `pharmacist`, `admin`, `super_admin`. Protected by RLS so normal users cannot self-elevate.
- **`patients`**: Extends `auth.users` 1:1. Clinical baseline (BP, blood sugar, BMI, ABHA ID, smoker flag, emergency contacts).
- **`doctors`**: Extends `auth.users` 1:1. Professional metadata (license number, specialization, qualifications, clinic affiliation, consultation fee, rating, verification status: `pending`, `approved`, `rejected`).
- **`doctor_availability`**: Weekly schedule matrix (`day_of_week` 0-6, `start_time`, `end_time`, `slot_duration_minutes`, `is_active`). Unique constraint on `(doctor_id, day_of_week, start_time)`.
- **`doctor_verifications`**: Regulatory compliance log tracking administrator approval/rejection with timestamps, reviewer ID, and clinical justification.
- **`pharmacies`**: Retail drug dispensaries. State drug license number, GSTIN, premises address, verification status.
- **`pharmacy_verifications`**: Licensing compliance log for pharmacy credentialing.
- **`patient_doctor_access`**: Dynamic security bridge granting an approved doctor read access to a patient's medical records upon booking an appointment or explicit ABDM consent, with timestamped expiration (`expires_at`).

### 2.2 Clinical Encounters & Telehealth
- **`appointments`**: Central appointment state machine: `requested` -> `confirmed` -> `in_progress` -> `completed` -> `cancelled` -> `no_show`.
  - **Critical Constraint:** `UNIQUE (doctor_id, appointment_date, time_slot)` prevents double booking at the database engine level.
- **`consultations`**: Clinical diagnosis, chief complaint, doctor clinical summary, follow-up date, and meeting URL.
- **`consultation_sessions`**: Teleconsultation encounter records including ambient clinical scribe speech transcripts, extracted SNOMED entities, structured SOAP notes (Subjective, Objective, Assessment, Plan), and cryptographic DSC clinician signature token.
- **`medical_records`**: Longitudinal electronic health records (EHR) categorized into `diagnosis`, `lab_report`, `clinical_note`, `discharge_summary`.
- **`patient_allergies`**: Allergens and reaction severities (`Mild`, `Moderate`, `Severe`) to alert doctors during prescription generation.

### 2.3 AI Intelligence & Report Understanding
- **`symptom_assessments`**: Persistent record of Phase 1 ML Random Forest predictions (`symptom-rf-v1`) and independent clinical risk engine triage assessments. Includes reported symptoms, normalized features, differential conditions array, risk level (`Low`, `Moderate`, `High`), and mandatory non-diagnostic disclaimers.
- **`health_reports`**: Metadata for patient medical reports analyzed by Phase 2 Gemini Report Intelligence. Stores private storage path, MIME type, file size, extracted lab parameters, and normalized biomarker observations.
- **`ai_clinical_findings`**: Multi-modal predictive intelligence queue for clinicians (e.g. Early Sepsis detection, QTc prolongation, respiratory distress) with SHAP attribution weights and clinician sign-off.
- **`disease_clinical_guidelines`**: Standardized disease guidelines mapping clinical conditions to specialties, ESI acuity levels, precautions, home care protocols, and red flags.

### 2.4 Digital Prescriptions & Pharmacy Fulfillment
- **`prescriptions`**: Digitally signed medical prescriptions issued strictly by verified doctors. Unique authenticated `rx_id` (e.g. `RX-2026-8812`), doctor ID, patient ID, diagnosis, general advice, follow-up date.
- **`prescription_items`**: Line items for prescribed medicines (name, dosage, frequency, duration, instructions).
- **`medicines`**: Master pharmaceutical catalog (brand name, generic name, category, dosage form, strength, standard price, Rx requirement flag).
- **`pharmacy_inventory`**: Per-pharmacy drug stock, retail unit price, batch number, expiry date, and reorder thresholds.
- **`medicine_orders`**: Patient prescription orders placed with approved pharmacies. Delivery state machine: `pending` -> `prescription_review` -> `confirmed` -> `packed` -> `out_for_delivery` -> `delivered` -> `cancelled`.
- **`order_items`**: Itemized lines for medicine orders with verified server-side unit prices and totals.

---

## 3. Atomic Database Transactions (RPC Architecture)

To ensure clinical safety, prevent race conditions, avoid double booking, and stop client-side tampering of prices or stock, all sensitive mutations are encapsulated in atomic PostgreSQL functions (`SECURITY DEFINER`):

### 3.1 `create_appointment_tx`
```sql
CREATE OR REPLACE FUNCTION public.create_appointment_tx(
    p_doctor_id uuid,
    p_appointment_date date,
    p_time_slot text,
    p_consultation_type text,
    p_symptoms_summary text,
    p_patient_notes text
) RETURNS jsonb;
```
- **Guarantees:**
  1. Verifies patient authentication (`auth.uid() IS NOT NULL`).
  2. Confirms target doctor has `verification_status = 'approved'`.
  3. Rejects appointment dates in the past.
  4. Acquires row lock and checks for overlapping bookings in the same slot.
  5. Inserts appointment with generated unique reference (`APT-YYYYMMDD-XXXX`).
  6. Automatically establishes `patient_doctor_access` bridge for 14 days.
  7. Dispatches real-time notification to doctor.
  8. Commits HIPAA immutable audit log.

### 3.2 `create_prescription_tx`
```sql
CREATE OR REPLACE FUNCTION public.create_prescription_tx(
    p_patient_id uuid,
    p_appointment_id uuid,
    p_diagnosis text,
    p_medicines jsonb,
    p_general_advice text,
    p_follow_up_date date
) RETURNS jsonb;
```
- **Guarantees:**
  1. Only authenticated, verified doctors can issue prescriptions (`auth.uid() = doctor_id`).
  2. Generates authenticated tamper-evident `rx_id` (`RX-YYYY-XXXX`).
  3. Atomically inserts prescription header and unpacks line items into `prescription_items`.
  4. Dispatches notification to patient with link to review Rx or order medicines.
  5. Commits immutable audit log.

### 3.3 `create_medicine_order_tx`
```sql
CREATE OR REPLACE FUNCTION public.create_medicine_order_tx(
    p_pharmacy_id uuid,
    p_prescription_id uuid,
    p_items jsonb,
    p_payment_method text,
    p_delivery_address text
) RETURNS jsonb;
```
- **Guarantees:**
  1. Re-calculates and enforces verified server-side pricing from `pharmacy_inventory` (ignores client-supplied totals).
  2. Acquires row lock (`FOR UPDATE`) on requested medicines in `pharmacy_inventory`.
  3. Verifies stock availability; raises error if stock is insufficient.
  4. Atomically decrements `pharmacy_inventory.stock_quantity`.
  5. Inserts `medicine_orders` and `order_items`.
  6. Dispatches notification to dispensing pharmacy.

### 3.4 `pharmacy_fulfill_prescription_tx`
```sql
CREATE OR REPLACE FUNCTION public.pharmacy_fulfill_prescription_tx(
    p_order_id uuid,
    p_pharmacy_id uuid,
    p_action text -- 'accept', 'dispense', 'dispatch', 'deliver', 'cancel'
) RETURNS jsonb;
```
- **Guarantees:**
  1. Verifies caller is the designated pharmacy (`pharmacy_id = auth.uid()`).
  2. Advances order delivery state according to lifecycle rules.
  3. On cancellation, automatically restores inventory quantities.
  4. Sends delivery status update notification to patient.

### 3.5 `verify_doctor_tx` and `verify_pharmacy_tx`
- **Guarantees:**
  1. Strictly restricted to administrators (`public.is_admin() = true`).
  2. Updates `verification_status` to `approved` or `rejected`.
  3. Inserts verification history log with reviewer ID and compliance justification.
  4. Pushes credential status notification to practitioner.

---

## 4. Supabase Storage Architecture

All sensitive medical files are stored in private Supabase Storage buckets with strict access policies:

| Bucket Name | Privacy | Max Size | Allowed MIME Types | Access Rules |
|---|---|---|---|---|
| **`medical-documents`** | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Patient or treating Doctor via `patient_doctor_access`. Write: Owning Patient (`{patient_id}/*`). |
| **`doctor-documents`** | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Doctor or Admin. Write: Owning Doctor (`{doctor_id}/*`). |
| **`pharmacy-documents`**| Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Read: Owning Pharmacy or Admin. Write: Owning Pharmacy (`{pharmacy_id}/*`). |
| **`profile-images`** | Public / Authenticated | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Read: Public. Write: Authenticated user (`{user_id}/*`). |

Storage downloads use short-lived cryptographic signed URLs (`supabase.storage.createSignedUrl(path, 300)`).

---

## 5. Performance Indexing Strategy

```sql
-- 1. Identity & Profiles
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_patients_abha_id ON public.patients (abha_id);
CREATE INDEX IF NOT EXISTS idx_doctors_verification_status ON public.doctors (verification_status, is_available);
CREATE INDEX IF NOT EXISTS idx_pharmacies_verification_status ON public.pharmacies (verification_status);

-- 2. Appointments & Consultations
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments (patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments (doctor_id, appointment_date);
CREATE INDEX IF NOT EXISTS idx_consultations_appointment_id ON public.consultations (appointment_id);
CREATE INDEX IF NOT EXISTS idx_patient_doctor_access_lookup ON public.patient_doctor_access (doctor_id, patient_id, is_active);

-- 3. Prescriptions & Orders
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_rx_id ON public.prescriptions (rx_id);
CREATE INDEX IF NOT EXISTS idx_prescription_items_rx_id ON public.prescription_items (prescription_id);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_id ON public.medicine_orders (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_pharmacy_status ON public.medicine_orders (pharmacy_id, order_status);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items (order_id);

-- 4. Inventory & Safety
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_pharmacy ON public.pharmacy_inventory (pharmacy_id, medicine_id);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON public.pharmacy_inventory (pharmacy_id, expiry_date);

-- 5. AI Telemetry & Audit
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_patient ON public.symptom_assessments (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_patient ON public.health_reports (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_created ON public.audit_logs (action, created_at DESC);
```

---

## 6. Healthcare Safety & Regulatory Guardrails

1. **Non-Diagnostic AI Language:** All symptom assessments, machine learning outputs, and report parsing results are explicitly stamped with:
   - `assessment_type`: `"AI-assisted preliminary assessment"`
   - Mandatory disclaimer: *"MediMind AI provides preliminary clinical decision support and does not constitute a definitive medical diagnosis. Treat all outputs as guidance and consult a licensed physician."*
2. **Physician-Exclusive Prescriptions:** Under no circumstance can AI models or patients generate prescriptions. Prescriptions require an authenticated `doctor_id` holding an `approved` credentialing status.
3. **Decoupled Risk Severity:** Machine learning prediction confidence (e.g. 95% probability of Acute Bacterial Sinusitis) is decoupled from clinical urgency (ESI-4 routine care), preventing false emergency dispatch.
