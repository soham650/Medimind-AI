# MEDIMIND AI — PHASE 5 DOCTOR RLS & ACCESS SECURITY MATRIX
## Production PostgreSQL Authorization Rules & Boundary Enforcement

**Target Instance:** `smmelvzldriqujaodckf.supabase.co`  
**Database Baseline:** FROZEN through Migration 0009  
**Security Paradigm:** Multi-Tenant Role-Based Access Control (RBAC) with Active Clinical Consent Bridges  

---

## 1. Comprehensive Doctor RLS Policy Matrix

The table below outlines the precise PostgreSQL Row-Level Security (RLS) policies governing the Doctor persona across all domain tables.

| Table Name | SELECT | INSERT | UPDATE | DELETE | Governing Policy / Stored Logic |
| :--- | :---: | :---: | :---: | :---: | :--- |
| **`public.doctors`** | ALL (Approved) / Self | Self (Registration) | Self (`auth.uid() = id`) | NONE | `doctors_public_approved_read` for verified directory; `doctors_manage_own` for personal profile updates. Non-admins cannot alter `is_verified` or `verification_status`. |
| **`public.doctor_verifications`** | Self (`doctor_id = auth.uid()`) | Self (`doctor_id = auth.uid()`) | Self (while `pending`) | NONE | Restricted to owning practitioner and system administrators. Prevents tampering with approved verification statuses. |
| **`public.doctor_availability`** | Public / Authenticated | Self (`doctor_id = auth.uid()`) | Self (`doctor_id = auth.uid()`) | Self (`doctor_id = auth.uid()`) | `doctor_availability_doctor_manage` allows practitioners to dynamically adjust weekly schedules. |
| **`public.appointments`** | Assigned Doctor (`doctor_id = auth.uid()`) | NONE (Patient books via RPC) | Assigned Doctor (`status`, `notes`) | NONE | Doctors can only view appointments assigned to their practitioner UUID. Direct cancellation or completion updates restricted to assigned doctor. |
| **`public.patient_doctor_access`** | Participant (`doctor_id = auth.uid()`) | NONE (Patient grants or Admin) | NONE | NONE | Enforced by Migration 0009 policy `patient_doctor_access_participant_select`. Doctors can inspect only active consent grants where they are the designated practitioner. |
| **`public.consultations`** | Assigned Doctor (`doctor_id = auth.uid()`) | Assigned Doctor (`doctor_id = auth.uid()`) | Assigned Doctor (`doctor_id = auth.uid()`) | NONE | Clinical encounters can only be created and documented by the assigned practitioner for that appointment. |
| **`public.consultation_sessions`** | Participant Doctor | Participant Doctor | Participant Doctor | NONE | Telehealth session tokens bound to the active consultation record. |
| **`public.medical_records`** | Authorized Doctor (via Access Bridge) | Authorized Doctor (`doctor_id = auth.uid()`) | Author Doctor (`doctor_id = auth.uid()`) | NONE | Governed by `medical_records_doctor_select` using `has_patient_doctor_access(patient_id, auth.uid())`. Unauthorized doctors receive 0 rows. |
| **`public.health_reports`** | Authorized Doctor (via Access Bridge) | NONE (Backend / Admin Ingestion) | NONE | NONE | Governed by `health_reports_owner_select` using `has_patient_doctor_access(patient_id, auth.uid())`. Direct doctor writes prohibited. |
| **`public.prescriptions`** | Issuing Doctor (`doctor_id = auth.uid()`) | RPC Only (`create_prescription_tx`) | NONE (Immutable once signed) | NONE | Digital prescriptions cannot be altered post-issuance. Strict cryptographic/audit integrity maintained. |
| **`public.prescription_items`** | Issuing Doctor (`doctor_id = auth.uid()`) | RPC Only (`create_prescription_tx`) | NONE | NONE | Child items inherit prescription RLS authorization. |
| **`public.medication_schedules`** | Authorized Doctor / Patient | Author Doctor / Admin | Author Doctor / Patient (`taken`) | NONE | Patient calendar synchronized upon prescription issuance. |
| **`public.symptom_assessments`** | Authorized Doctor (via Access Bridge) | NONE (Patient / Anonymous only) | NONE | NONE | Evaluated via `has_patient_doctor_access(patient_id, auth.uid())` to expose pre-consultation AI triage to attending doctor. |
| **`public.medicines`** | ALL (Authenticated) | NONE (Admin/Pharmacy) | NONE | NONE | Read-only formulary access for prescription autocomplete. |
| **`public.notifications`** | Self (`user_id = auth.uid()`) | Service / Trigger | Self (`is_read = true`) | NONE | Isolated by `user_id = auth.uid()`. |
| **`public.audit_logs`** | Admin Only | System Trigger / Definer | NONE | NONE | Strict compliance immutability. |

---

## 2. Storage Bucket Isolation Matrix

| Storage Bucket | Privacy Tier | Doctor Read | Doctor Write | Path Restriction | Verification Mechanism |
| :--- | :--- | :---: | :---: | :--- | :--- |
| **`doctor-documents`** | Private | Self Signed URL | Self Upload | `${auth.uid()}/*` | Storage RLS policy enforces `storage.foldername(name)[1] = auth.uid()::text`. Cross-doctor file access blocked. |
| **`medical-documents`** | Private | Signed URL via Access Bridge | Prohibited | `${patient_id}/*` | Accessible only if `has_patient_doctor_access(folder_patient_id, auth.uid())` evaluates to true. |
| **`prescriptions`** | Private | Issuing Doctor Signed URL | RPC Generated | `${patient_id}/${rx_id}.pdf` | Accessible to issuing doctor and patient. |

---

## 3. Transactional Stored Procedure (RPC) Authorization

### `create_prescription_tx`
- **Security Context:** `SECURITY DEFINER` (PostgreSQL privileged context with strict caller validation)
- **Signature:**
  ```sql
  create_prescription_tx(
      p_doctor_id UUID,
      p_patient_id UUID,
      p_appointment_id UUID,
      p_diagnosis TEXT,
      p_advice TEXT,
      p_medicines JSONB
  ) RETURNS JSONB
  ```
- **Access Guardrails Enforced in PL/pgSQL:**
  1. **Caller Identity:** Rejects execution if `auth.uid() IS NULL` (`permission denied`).
  2. **Practitioner Match:** Rejects execution if `auth.uid() != p_doctor_id`.
  3. **Role Verification:** Queries `public.user_roles` to verify caller holds authoritative `'doctor'` or `'admin'` role.
  4. **Active Appointment Link:** Verifies appointment exists, belongs to caller, and targets `p_patient_id`.
  5. **Atomic Execution:** Inserts into `prescriptions`, unrolls `p_medicines` into `prescription_items`, generates unique `rx_number`, creates `medication_schedules`, sends patient notification, and logs audit record. Any error rolls back the entire transaction.

---

## 4. Negative Security Boundaries Tested & Enforced

Empirical automated tests conducted against live Supabase (`scripts/verify_phase5_doctor_platform.js`):

1. **Cross-Doctor Appointment Isolation:**
   - *Test Scenario:* Doctor B attempts to query appointments belonging to Doctor A.
   - *Result:* **0 rows returned**. Doctor B cannot inspect Doctor A's patient queue.
2. **Unauthorized Patient EHR Access:**
   - *Test Scenario:* Doctor A attempts to read medical records or health reports of Patient B without an active entry in `patient_doctor_access`.
   - *Result:* **0 rows returned**. Access bridge evaluation returns `false`.
3. **Revoked Consent Enforcement:**
   - *Test Scenario:* Patient A revokes Doctor A's access (`is_active = false` or `expires_at < now()`).
   - *Result:* Doctor A's subsequent EHR queries immediately return **0 rows**.
4. **Role Escalation Block:**
   - *Test Scenario:* Doctor attempts to mutate `user_roles` to grant themselves `admin`.
   - *Result:* **Rejected with 42501 (RLS violation)**.
5. **Anonymous RPC Abuse:**
   - *Test Scenario:* Unauthenticated request to `create_prescription_tx`.
   - *Result:* **Rejected with 42501 (permission denied)**.
6. **Patient Digital Prescription Forgery:**
   - *Test Scenario:* Patient attempts to sign a digital prescription using `create_prescription_tx`.
   - *Result:* **Rejected with exception**: *"Unauthorized: Only the assigned medical practitioner can sign digital prescriptions"*.
