# MediMind AI — Security, Authorization & Privacy Engineering Guide

**Document Status:** VERIFIED PRODUCTION SPECIFICATION  
**Security Standard:** HIPAA Compliance, ABDM 3.0 Alignment, Zero Trust Architecture  
**Primary Security Boundary:** PostgreSQL 15+ Row-Level Security (RLS) & `SECURITY DEFINER` RPCs  
**Active Canonical Roles:** `patient`, `doctor`, `pharmacist`, `admin` (**Strictly 4 roles; No active Super Admin**)  
**Key References:** [`supabase/migrations/`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/migrations), [`docs/RLS_MATRIX.md`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/docs/RLS_MATRIX.md)

---

## 1. Core Security Philosophy

> [!IMPORTANT]
> **Database Authorization is the Ultimate Security Boundary:**  
> Frontend role checks, UI tab hiding, and React Router guards serve exclusively as user-experience conveniences. They are NEVER trusted as security barriers. Every data query and mutation must be independently authorized and validated at the database engine level via PostgreSQL Row-Level Security (RLS) or atomic stored procedures (`SECURITY DEFINER` RPCs).

```
┌────────────────────────────────────────────────────────┐
│             Untrusted Browser Client (React)           │
│   (Role-based navigation, conditional UI rendering)    │
└───────────────────────────┬────────────────────────────┘
                            │ HTTPS / JWT Bearer Token
                            ▼
┌────────────────────────────────────────────────────────┐
│           Supabase API Gateway (PostgREST)             │
│        Extracts auth.uid() & cryptographically         │
│               validates JWT signature                  │
└───────────────────────────┬────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────┐
│      PostgreSQL 15+ Engine (FINAL SECURITY BARRIER)    │
│  ├── 1. RLS Policies: Filters every SELECT/UPDATE      │
│  ├── 2. RPC Stored Procedures: Row locks & validation  │
│  ├── 3. Foreign Key Constraints & Unique Slot Checks   │
│  └── 4. Immutable Audit Logs: Append-only compliance   │
└────────────────────────────────────────────────────────┘
```

---

## 2. Authentication & Identity Management

### 2.1 Supabase Auth & JWTs
- **Protocol:** OpenID Connect / OAuth 2.0 compatible GoTrue engine.
- **Session Tokens:** Short-lived JSON Web Tokens (JWT) signed using HMAC-SHA256.
- **Refresh Tokens:** Managed automatically by `@supabase/supabase-js` stored in secure browser local storage, with automatic refresh rotation.
- **Claims:** JWT headers contain standard claims (`sub` = `user_id`, `email`, `role`). PostgreSQL resolves `auth.uid()` from the token's `sub` claim.

### 2.2 Privileged Auth Bridge (Development / Evaluator Lifecycle)
In production, Supabase Auth sends email confirmation links. For local development and demo testing, [`frontend/vite-auth-plugin.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/vite-auth-plugin.js) provides a secure local endpoint invoking `supabaseAdmin.auth.admin.createUser({ email_confirm: true })`. This ensures demo users and new registrations persist directly into PostgreSQL without getting stalled by unconfirmed email state.

---

## 3. Four Canonical Roles & Strict RBAC

MediMind enforces strictly **four canonical roles**:

| Role Name | Scope & Authority | Allowed Data Boundaries |
|---|---|---|
| **`patient`** | Healthcare consumer | Reads and mutates own baseline, appointments, medical records, symptom assessments, and orders. Zero access to other patients. |
| **`doctor`** | Licensed medical physician | Reads own appointments, consults assigned patients, accesses records via `patient_doctor_access`, issues digital prescriptions. |
| **`pharmacist`** | Licensed retail dispensary | Manages dispensary inventory stock/pricing, reviews orders placed with own pharmacy, dispenses verified medications. |
| **`admin`** | Platform compliance officer | Reviews doctor credentials, verifies pharmacy licenses, monitors audit logs and system telemetry. **Zero direct access to clinical encounter EHR notes.** |

> [!CAUTION]
> **Deprecation of Super Admin:**  
> The system strictly operates on the 4 roles above. Historical references to `super_admin` in raw scripts are deprecated. System administration checks evaluate `public.is_admin()`, which maps to `role = 'admin'` in `public.user_roles`.

---

## 4. Threat Matrix & Defensive Countermeasures

| Security Mechanism | Threat Addressed | Defensive Implementation | Key Files / Entities | Verification Method |
|---|---|---|---|---|
| **Horizontal Privilege Escalation (IDOR)** | Patient A requests Patient B's lab reports or prescriptions. | RLS enforces `auth.uid() = patient_id` on all personal health tables. | `public.patients`, `public.medical_records`, `public.prescriptions` | Querying records with forged `patient_id` returns 0 rows. |
| **Vertical Privilege Escalation** | Patient alters role in `user_roles` to become an `admin`. | RLS on `user_roles` denies INSERT/UPDATE to non-admins. Helper function `public.is_admin()` verifies authorization in PostgreSQL. | `public.user_roles`, `0005_production_backend_schema.sql` | Executing `UPDATE user_roles SET role = 'admin'` as patient fails with policy violation. |
| **Double Booking Race Conditions** | Two patients book the exact same doctor time slot concurrently. | Database unique constraint `UNIQUE (doctor_id, appointment_date, time_slot)` + `SECURITY DEFINER` RPC lock. | `public.appointments`, `create_appointment_tx` | Concurrent booking simulation fails with slot collision exception. |
| **Doctor Impersonation & Fake Rx** | Fraudulent user issues prescription drugs. | `create_prescription_tx` verifies `auth.uid() = doctor_id` AND `verification_status = 'approved'` before writing. | `public.prescriptions`, `public.prescription_items` | Non-doctor caller receives SQL exception `"Only verified physicians can issue prescriptions"`. |
| **Pharmacy Stock & Price Tampering** | Patient alters drug price in browser checkout payload. | `create_medicine_order_tx` re-reads canonical unit prices directly from `pharmacy_inventory` and computes total server-side. | `public.medicine_orders`, `create_medicine_order_tx` | Tampered price payloads in client request are completely overwritten by server pricing. |
| **Competitor Pharmacy Espionage** | Pharmacy A inspects wholesale cost and stock levels of Pharmacy B. | RLS policy `pharmacy_inventory_owner_crud` isolates inventory modifications strictly to `pharmacy_id = auth.uid()`. | `public.pharmacy_inventory` | Query from Pharmacy A to view Pharmacy B stock returns empty set. |
| **Administrative Medical Snooping** | Non-clinical administrator browses private patient medical notes. | **Least Privilege**: `medical_records` and `consultation_sessions` deny SELECT to Admins unless explicit ABDM clinical consent is active. | `public.medical_records`, `public.consultation_sessions` | Admin account running `SELECT * FROM consultation_sessions` returns 0 records. |
| **Prompt Injection Attacks** | Malicious report text instructs Gemini to issue narcotic prescriptions. | `PromptSanitizer` isolates user text within `<untrusted_patient_input>` tags; safety guard strips illegal medication advice. | `ml-service/src/orchestrator/prompt_sanitizer.py`, `safety_guard.py` | Automated adversarial test payloads are sanitized; emergency rules remain intact. |
| **PHI Leakage in System Logs** | Medical diagnoses and patient names leaking into telemetry logs. | Zero PHI logging rule; report files quarantined with random UUID names and destroyed immediately after processing. | `ml-service/src/report/document_parser.py` | Log inspection verifies zero patient names, emails, or lab values written to stdout/files. |
| **Private Document Hijacking** | Direct URL guessing for uploaded medical PDFs. | Private Supabase Storage buckets with strict RLS; downloads require time-limited cryptographic signed URLs (300s TTL). | Supabase Storage `medical-documents` | Direct HTTP GET to raw storage URL returns 403 Forbidden. |

---

## 5. Row-Level Security (RLS) Implementation Details

### 5.1 Patient-Doctor Dynamic Access Bridge
A treating doctor cannot browse arbitrary patient files. Access is dynamically provisioned only when an appointment is booked or explicit ABDM consent is granted:
```sql
-- RLS Policy on medical_records
CREATE POLICY "medical_records_select_authorized" ON public.medical_records
FOR SELECT USING (
    -- Patient reads own records
    patient_id = auth.uid() OR
    -- Treating doctor reads if valid, unexpired bridge exists
    EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda
        WHERE pda.patient_id = medical_records.patient_id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true
          AND (pda.expires_at IS NULL OR pda.expires_at > NOW())
    )
);
```

### 5.2 Pharmacy Isolation Policies
```sql
-- Pharmacists can only update orders assigned to their store
CREATE POLICY "pharmacy_order_fulfillment_update" ON public.medicine_orders
FOR UPDATE USING (
    pharmacy_id = auth.uid() OR public.is_admin()
);

-- Pharmacists can only manage their own inventory
CREATE POLICY "pharmacy_inventory_crud" ON public.pharmacy_inventory
FOR ALL USING (
    pharmacy_id = auth.uid() OR public.is_admin()
);
```

---

## 6. Secret Management & Frontend Isolation

MediMind strictly adheres to key segregation:

| Secret / Key | Permitted Environment | Never Allowed In | Purpose |
|---|---|---|---|
| `VITE_SUPABASE_ANON_KEY` | Frontend (`frontend/.env`), Vite bundles | Production backend with admin privileges | Public API client key; requests bound to RLS policies. |
| `SUPABASE_SERVICE_ROLE_KEY` | Backend (`ml-service/.env`), Vite local dev plugin | **Frontend client bundle (`src/`)** | Bypasses RLS; reserved strictly for server-side provisioning and migrations. |
| `GEMINI_API_KEY` | Backend (`ml-service/.env`) | **Frontend client bundle (`src/`)** | Generative AI quota; must never be exposed to browser network tabs. |
| `DATABASE_URL` | Migration runner, Supabase CLI | Frontend repositories | Direct PostgreSQL connection string. |

> [!CAUTION]
> **Audit Rule:**  
> Never commit actual secret keys to Git. Frontend code must NEVER import `process.env.SUPABASE_SERVICE_ROLE_KEY` or `process.env.GEMINI_API_KEY`. Any occurrence in frontend source code is considered a P0 security regression.

---

## 7. Storage Security & Cryptographic URLs

1. **Bucket Privacy:** The `medical-documents`, `doctor-documents`, and `pharmacy-documents` buckets are marked `public = false`.
2. **Path Convention:** Files are quarantined into user-isolated paths:
   - Patient reports: `{patient_id}/{uuid}.pdf`
   - Doctor credentials: `{doctor_id}/{uuid}.pdf`
   - Pharmacy licenses: `{pharmacy_id}/{uuid}.pdf`
3. **Signed URLs:** To view or download a document, the application requests a signed URL with a maximum time-to-live (TTL) of **300 seconds** (5 minutes):
   ```javascript
   const { data, error } = await supabase.storage
     .from('medical-documents')
     .createSignedUrl(filePath, 300);
   ```

---

## 8. Telehealth & WebRTC Security

Video consultations between patients and doctors are secured through peer-to-peer encryption:
1. **Meeting URL Generation:** Generated dynamically during consultation initiation and stored in `public.consultations.meeting_url`.
2. **Access Control:** The meeting room URL is only accessible to the assigned patient and doctor.
3. **Media Encryption:** All audio and video streams utilize standard WebRTC DTLS-SRTP (Datagram Transport Layer Security / Secure Real-time Transport Protocol) providing end-to-end encryption.
4. **Signaling State:** Encounter metadata (start time, end time, session status) is recorded in `consultations` for audit trail compliance.

---

## 9. Immutable Compliance Auditing (`audit_logs`)

All privileged operations automatically log an immutable record to `public.audit_logs`:
- **Captured Telemetry:** `actor_id`, `actor_role`, `action`, `entity_type`, `entity_id`, `ip_address`, `details`, `created_at`.
- **Zero Deletions:** PostgreSQL RLS explicitly forbids `UPDATE` or `DELETE` on `audit_logs` for all users, including administrators. The audit log is strictly append-only.
- **Audited Events:**
  - Practitioner credential verification or rejection (`verify_doctor_tx`, `verify_pharmacy_tx`)
  - Appointment bookings and cancellations
  - Prescription issuance (`create_prescription_tx`)
  - Medicine order status transitions
  - ABDM consent grant, denial, or revocation
