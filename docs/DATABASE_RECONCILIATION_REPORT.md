# MEDIMIND AI — DATABASE RECONCILIATION REPORT

**Audit Date:** 2026-09-08  
**Scope:** Reconcile migrations `0001_init_schema.sql` through `0007_complete_system_architecture_suite.sql` against `DATABASE_ARCHITECTURE.md`, `PAGE_DATABASE_MATRIX.md`, `DATABASE_QUERY_MAP.md`, `RLS_MATRIX.md`, and the upcoming `0008_full_product_gap_closure.sql`.

---

## 1. Table-by-Table Architectural Audit

| Table Name | Exists in DB? | Duplicate / Conflicted? | Status Fields Valid? | Foreign Keys Valid? | Timestamps Valid? | Audit / Ownership Valid? | Findings & Reconciliation Required |
|---|---|---|---|---|---|---|---|
| **`auth.users`** | Yes (Supabase core) | No | Active | Identity root | Yes | User root | Root auth entity. |
| **`public.user_roles`** | Yes (0005) | No | Role check ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin') | `user_id -> auth.users(id)` | `created_at` | RBAC governance | Ensure `user_roles` is synchronized with `profiles.role`. Only Super Admin can mutate. |
| **`public.profiles`** | Yes (0001-0004) | Overlaps with role tables | `approval_status` ('pending', 'approved', 'rejected') | `id -> auth.users(id)` | `created_at`, `updated_at`, `deleted_at` | `id = auth.uid()` | Reconciled: Acts as 1:1 user profile directory; specialized clinical tables (`patients`, `doctors`, `pharmacies`) reference `auth.users(id)`. |
| **`public.patients`** | Yes (0005, 0006) | No | Gender, Blood group | `id -> auth.users(id)` | `created_at`, `updated_at` | `id = auth.uid()` | Contains clinical baseline & ABDM fields (`abha_number`, `abha_address`, `repository_sync_status`). |
| **`public.doctors`** | Yes (0005) | No | `verification_status` ('pending', 'approved', 'rejected'), `is_available` | `id -> auth.users(id)` | `created_at`, `updated_at` | `id = auth.uid()` | Contains practitioner license number, specialization, clinic affiliation, consultation fee. |
| **`public.doctor_verifications`**| Yes (0005) | No | `status` ('pending', 'approved', 'rejected') | `doctor_id -> doctors(id)`, `reviewed_by -> auth.users(id)` | `created_at`, `reviewed_at` | Admin reviewed | Tracks administrator approval/rejection audit trail with justifications. |
| **`public.doctor_availability`** | Yes (0005) | No | `is_active` | `doctor_id -> doctors(id)` | None | `doctor_id = auth.uid()` | Unique `(doctor_id, day_of_week, start_time)`. Requires `updated_at`. |
| **`public.pharmacies`** | Yes (0005) | No | `verification_status` ('pending', 'approved', 'rejected'), `is_active` | `id -> auth.users(id)` | `created_at`, `updated_at` | `id = auth.uid()` | Unique `drug_license_number`. |
| **`public.pharmacy_verifications`**| Yes (0005)| No | `status` ('pending', 'approved', 'rejected') | `pharmacy_id -> pharmacies(id)`, `reviewed_by -> auth.users(id)` | `created_at`, `reviewed_at` | Admin reviewed | Tracks retail drug license approval/rejection audit trail. |
| **`public.patient_doctor_access`**| Yes (0005)| No | `is_active`, `granted_by` | `patient_id -> patients(id)`, `doctor_id -> doctors(id)` | `created_at`, `expires_at` | Time-bound authorization bridge | Unique `(patient_id, doctor_id)`. Enforces doctor access expiration. |
| **`public.appointments`** | Yes (0001, 0004, 0005)| Conflicted columns across 0001 & 0005 | `status` ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show') | `patient_id -> patients(id)`, `doctor_id -> doctors(id)` | `created_at`, `updated_at` | Participant owned | **RECONCILIATION REQUIRED:** 0001 created table with `clinic_id text`; 0005 defined `doctor_id uuid references doctors(id)`, `appointment_number`, `time_slot`, `consultation_type`, `symptoms_summary`, `cancellation_reason`, and `UNIQUE(doctor_id, appointment_date, time_slot)`. Migration 0008 must ensure all 0005 columns exist on `appointments`. |
| **`public.consultations`** | Yes (0004, 0005) | No | `status` ('ongoing', 'completed') | `appointment_id -> appointments(id)`, `doctor_id -> doctors(id)`, `patient_id -> patients(id)` | `started_at`, `ended_at`, `created_at` | Participant owned | Stores chief complaint, clinical summary, and diagnosis. |
| **`public.consultation_sessions`**| Yes (0006) | Complements `consultations` | `is_concluded` | `appointment_id -> appointments(id)`, `doctor_id -> doctors(id)`, `patient_id -> patients(id)` | `created_at`, `updated_at`, `concluded_at` | Participant owned | Stores ambient scribe transcript, SNOMED entities, SOAP notes, and DSC cryptographic token. |
| **`public.medical_records`** | Yes (0005) | No | `record_type` ('diagnosis', 'lab_report', 'clinical_note', 'discharge_summary') | `patient_id -> patients(id)`, `doctor_id -> doctors(id)`, `consultation_id -> consultations(id)` | `record_date`, `created_at` | Doctor/Patient | Access guarded by active `patient_doctor_access`. |
| **`public.patient_allergies`** | Yes (0005) | No | `severity` ('Mild', 'Moderate', 'Severe') | `patient_id -> patients(id)` | `created_at` | `patient_id = auth.uid()` | Tracks known allergens and clinical reaction notes. |
| **`public.symptom_assessments`** | Yes (0005) | No | `risk_level` ('Low', 'Moderate', 'High') | `patient_id -> auth.users(id)` | `created_at` | `patient_id = auth.uid()` or NULL (Guest) | Stores Phase 1 Random Forest predictions and clinical triage risk evaluations. |
| **`public.health_reports`** | Yes (0005) | No | None | `patient_id -> patients(id)` | `created_at` | `patient_id = auth.uid()` | Stores Phase 2 Gemini Report Intelligence metadata and extracted parameters. |
| **`public.ai_clinical_findings`** | Yes (0006) | No | `oversight_signed`, `acuity_level` | `patient_id -> patients(id)`, `doctor_id -> doctors(id)` | `created_at`, `signed_at` | Doctor oversight | Multi-modal findings queue for early sepsis & cardiac alerts. |
| **`public.disease_clinical_guidelines`** | Yes (0007)| No | `esi_acuity_level` (1-5) | None | `created_at`, `updated_at` | Public registry | Master clinical guidelines for disease triage. |
| **`public.prescriptions`** | Yes (0004, 0005) | Conflicted items storage | None | `doctor_id -> doctors(id)`, `patient_id -> patients(id)`, `consultation_id -> consultations(id)` | `created_at` | Doctor/Patient/Pharmacy | **RECONCILIATION REQUIRED:** 0004 had `medicines jsonb`; 0005 had `prescription_items` relational lines. Migration 0008 will keep `prescription_items` and add `medicines jsonb DEFAULT '[]'::jsonb` to `prescriptions` for dual compatibility. |
| **`public.prescription_items`** | Yes (0005) | No | None | `prescription_id -> prescriptions(id)` | None | Inherited from Rx | Stores itemized lines: name, dosage, frequency, duration, instructions. |
| **`public.medicines`** | Yes (0004, 0005) | No | `requires_prescription` | None | `created_at` | Public catalog | Master pharmaceutical catalog. |
| **`public.pharmacy_inventory`** | Yes (0004, 0005) | No | `is_available` | `pharmacy_id -> pharmacies(id)`, `medicine_id -> medicines(id)` | `updated_at` | Pharmacy owned | Unique `(pharmacy_id, medicine_id)`. Stores unit price, quantity, batch number, expiry date. |
| **`public.medicine_orders`** & **`public.orders`** | Yes (0004 has `orders`, 0005 has `medicine_orders`)| **CRITICAL DISCREPANCY** | `order_status` / `delivery_status` | `patient_id -> patients(id)`, `pharmacy_id -> pharmacies(id)`, `prescription_id -> prescriptions(id)` | `created_at`, `updated_at` | Patient/Pharmacy | **RECONCILIATION REQUIRED:** 0004 created `orders` table; 0005 created `medicine_orders` table; 0007 RPC `pharmacy_fulfill_prescription_tx` queried `public.orders`. Migration 0008 must unify `orders` and `medicine_orders` via sync triggers or view so both table references resolve seamlessly. |
| **`public.order_items`** | Yes (0004, 0005) | No | None | `order_id -> medicine_orders(id) / orders(id)`, `medicine_id -> medicines(id)` | None | Order linked | Order item lines. |
| **`public.payments`** | Yes (0005) | No | `status` ('pending', 'completed', 'failed', 'refunded'), `provider` ('razorpay', 'stripe', 'cash') | `user_id -> auth.users(id)`, `order_id -> medicine_orders(id)`, `appointment_id -> appointments(id)` | `created_at` | `user_id = auth.uid()` | Financial transaction ledger. |
| **`public.notifications`** | Yes (0005, 0007)| Column mismatch across migrations | `is_read` | `user_id -> auth.users(id)` | `created_at` | `user_id = auth.uid()` | **RECONCILIATION REQUIRED:** 0005 used `notification_type` and `link`; 0007 used `type` and `metadata`. Migration 0008 must ensure `notifications` has both column sets (`type`, `notification_type`, `link`, `metadata`). |
| **`public.audit_logs`** | Yes (0004, 0005, 0007)| Column mismatch across migrations | None | `actor_id / user_id -> auth.users(id)` | `created_at` | Compliance Admin | **RECONCILIATION REQUIRED:** 0004 used `(user_id, action, resource_type, details)`; 0005 used `(actor_id, actor_role, action, target_entity, target_id, details)`; 0007 used `(user_id, action, resource_type, resource_id, metadata)`. Migration 0008 will ensure all aliases exist on `audit_logs`. |
| **`public.rate_limit_events`** | Yes (0005) | No | None | `user_id -> auth.users(id)` | `blocked_at` | Admin | Security audit trail for blocked IP requests. |
| **`public.ai_usage_daily`** | Yes (0005) | No | None | `user_id -> auth.users(id)` | None | User/System | Unique `(user_id, usage_date)` tracking API quotas. |
| **`public.lab_packages`** | Yes (0006) | No | `is_active` | None | `created_at` | Public catalog | Diagnostic test packages catalog. |
| **`public.lab_tests`** | Yes (0006) | No | `is_active`, `is_popular` | None | `created_at` | Public catalog | Individual lab tests catalog. |
| **`public.lab_bookings`** | Yes (0006) | No | `status` ('booked', 'technician_assigned', 'out_for_pickup', 'sample_at_lab', 'ai_analysis_ready', 'completed', 'cancelled') | `patient_id -> patients(id)`, `package_id -> lab_packages(id)` | `created_at`, `updated_at` | Patient owned | Lab sample at-home collection bookings. |
| **`public.medication_schedules`**| Yes (0006)| No | `status` ('taken', 'pending', 'skipped') | `patient_id -> patients(id)`, `prescription_id -> prescriptions(id)` | `created_at` | Patient owned | Daily dosage schedule (morning, afternoon, night). |
| **`public.patient_dependents`** | Yes (0006) | No | `access_level` | `primary_patient_id -> patients(id)` | `created_at`, `updated_at` | Family owned | ABDM family health locker dependents. |
| **`public.abdm_consents`** | Yes (0006) | No | `status` ('pending', 'granted', 'revoked', 'expired', 'denied') | `patient_id -> patients(id)`, `requester_doctor_id -> doctors(id)` | `created_at`, `updated_at`, `valid_from`, `valid_until` | Patient/Doctor | ABDM 3.0 consent manager artifacts. |
| **`public.abdm_audit_logs`** | Yes (0006) | No | None | `patient_id -> patients(id)` | `accessed_at` | Patient visible | Immutable cryptographic gateway access records. |

---

## 2. Storage Buckets Reconciliation

| Bucket Name | Target Status | Max Size | Allowed MIME Types | Current State | Required Action in Migration 0008 |
|---|---|---|---|---|---|
| **`medical-documents`** | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Created in 0005 | Verify policies for patient read/insert and authorized doctor read via `patient_doctor_access`. |
| **`doctor-documents`** | Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Missing in `storage.buckets` | Insert bucket + policy: Doctor uploads own (`{doctor_id}/*`), Admin reads all. |
| **`pharmacy-documents`**| Private | 15 MB | `application/pdf`, `image/jpeg`, `image/png` | Missing in `storage.buckets` | Insert bucket + policy: Pharmacy uploads own (`{pharmacy_id}/*`), Admin reads all. |
| **`profile-images`** | Public | 5 MB | `image/jpeg`, `image/png`, `image/webp` | Missing in `storage.buckets` | Insert bucket + policy: Authenticated uploads own (`{user_id}/*`), Public reads all. |

---

## 3. Atomic RPC Functions Reconciliation

| RPC Function Name | Created In | Target Entity | Transactional Guarantees | Permission Audit |
|---|---|---|---|---|
| **`create_appointment_tx`** | 0005 | `appointments`, `patient_doctor_access`, `notifications`, `audit_logs` | Anti-double-booking row lock, validates approved doctor status, auto-grants 14-day access bridge, notifies doctor, logs audit. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`create_prescription_tx`** | 0005 | `prescriptions`, `prescription_items`, `notifications`, `audit_logs` | Verifies doctor authorization, generates unique `rx_id`, inserts header & items atomically, notifies patient, logs audit. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`create_medicine_order_tx`** | 0005 | `medicine_orders`, `order_items`, `pharmacy_inventory`, `notifications` | Calculates server-side verified price, row locks `pharmacy_inventory`, validates stock, decrements stock atomically, notifies pharmacy. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`pharmacy_fulfill_prescription_tx`** | 0007 | `orders` / `medicine_orders`, `medicines`, `notifications` | Updates order state (`confirmed`, `dispensed`, `out_for_delivery`, `delivered`), decrements stock, notifies patient. | **RECONCILE TARGET TABLE:** Ensure function updates `medicine_orders` and `orders`. |
| **`verify_doctor_tx`** | 0005 | `doctors`, `doctor_verifications`, `notifications`, `audit_logs` | Strict Admin check (`is_admin()`), updates status, logs compliance reason, notifies doctor. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`verify_pharmacy_tx`** | 0005 | `pharmacies`, `pharmacy_verifications`, `notifications`, `audit_logs` | Strict Admin check (`is_admin()`), updates status, logs compliance reason, notifies pharmacy. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`admin_verify_entity_tx`** | 0007 | `doctors`, `pharmacies`, `audit_logs`, `notifications` | Dynamic entity verification (`doctor` or `pharmacy`), updates status, notifies entity, logs audit. | Complements 0005 RPCs. |
| **`book_lab_test_tx`** | 0006 | `lab_bookings` | Generates 4-digit pickup OTP, unique booking ref, assigns phlebotomist protocol. | `SECURITY DEFINER`. Grant to `authenticated`. |
| **`recommend_doctors_for_disease`** | 0007 | `disease_clinical_guidelines`, `doctors`, `profiles` | Maps disease to primary specialty, queries approved doctors ordered by rating and experience. | Read-only helper function. Grant to `authenticated`, `anon`. |

---

## 4. Key Reconciliation Action Items for Migration 0008

1. **Unify `orders` and `medicine_orders`:**
   - Add a synchronization trigger or maintain `orders` as a companion/view to `medicine_orders` so calls referencing either table succeed.
2. **Reconcile `appointments` Columns:**
   - Execute `ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.doctors(id);`
   - Ensure `appointment_number`, `time_slot`, `consultation_type`, `symptoms_summary`, `patient_notes`, `cancellation_reason` exist.
   - Ensure unique index `UNIQUE (doctor_id, appointment_date, time_slot)` is enforced.
3. **Reconcile `notifications` Columns:**
   - `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;`
   - `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;`
   - `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_type text;`
   - `ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;`
4. **Reconcile `audit_logs` Columns:**
   - Ensure `user_id`, `actor_id`, `user_role`, `actor_role`, `resource_type`, `target_entity`, `resource_id`, `target_id`, `details`, `metadata` are all present.
5. **Create Storage Buckets & Policies:**
   - `doctor-documents` (private)
   - `pharmacy-documents` (private)
   - `profile-images` (public)
   - Storage RLS policies for each.
6. **Add Missing Composite Indexes:**
   - `idx_pharmacy_inventory_expiry (pharmacy_id, expiry_date)`
   - `idx_medicine_orders_patient_date (patient_id, created_at DESC)`
   - `idx_appointments_patient_date (patient_id, appointment_date DESC)`
