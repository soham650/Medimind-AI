# MEDIMIND AI — PHASE 7 SECURITY MATRIX & RLS ACCESS CONTROL
## Administrative Governance & Clinical Privacy Boundaries

**Project:** MediMind AI — Phase 7  
**Cluster:** Live PostgreSQL / Supabase (`smmelvzldriqujaodckf.supabase.co`)  
**Security Baseline:** Migration 0009 Frozen  

---

### Security Overview
In MediMind AI, **database-level authorization (PostgreSQL Row Level Security + SECURITY DEFINER RPCs)** is the ultimate security boundary. Frontend role checks, UI conditional rendering, and route guards serve solely as user-experience affordances and are never trusted for authorization.

Healthcare data governance strictly follows **HIPAA/ABDM least-privilege principles**: administrative status does not grant blanket, unrestricted read access to clinical electronic health records (EHRs).

---

### Entity Security & Authorization Matrix

| Entity | Role | SELECT | INSERT | UPDATE | DELETE | Authorized RPCs | Security Boundary & Enforcement |
|---|---|---|---|---|---|---|---|
| **`user_roles`** | `super_admin` | ✅ All | ✅ Any role | ✅ Any role | ✅ Any role | — | Authoritative RBAC. Super Admin can manage all roles. |
| | `admin` | ✅ All | ❌ Cannot add admin/super_admin | ❌ Cannot alter admin/super_admin | ❌ Cannot delete admin/super_admin | — | Admin can only manage non-privileged roles (patient, doctor, pharmacist). |
| | `doctor` | ❌ Own only | ❌ Denied | ❌ Denied | ❌ Denied | — | `auth.uid() = user_id`. Cannot self-escalate. |
| | `pharmacist`| ❌ Own only | ❌ Denied | ❌ Denied | ❌ Denied | — | `auth.uid() = user_id`. Cannot self-escalate. |
| | `patient` | ❌ Own only | ❌ Denied | ❌ Denied | ❌ Denied | — | `auth.uid() = user_id`. Cannot self-escalate. |
| | `anon` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | RLS completely denies anonymous access. |
| **`profiles`** | `super_admin` | ✅ All | ✅ With check | ✅ All | ✅ Soft-delete | — | Can update `approval_status`, `status`, `role`. |
| | `admin` | ✅ All | ❌ Denied | ✅ Status/approval only | ❌ Denied | — | Can suspend/reactivate non-admin accounts. |
| | `doctor` | ❌ Self + patients | ❌ Self on signup | ❌ Self profile | ❌ Denied | — | Can read own profile and assigned patients. |
| | `pharmacist`| ❌ Self | ❌ Self on signup | ❌ Self profile | ❌ Denied | — | Can read and edit own profile. |
| | `patient` | ❌ Self only | ❌ Self on signup | ❌ Self profile | ❌ Denied | — | `auth.uid() = id`. |
| **`audit_logs`** | `super_admin` | ✅ All | ✅ System log | ❌ Immutable | ❌ Immutable | — | Immutable append-only audit trail. Zero deletes. |
| | `admin` | ✅ All | ✅ System log | ❌ Immutable | ❌ Immutable | — | Read compliance logs. No mutations allowed. |
| | `doctor` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | RLS restricts SELECT to `public.is_admin()`. |
| | `pharmacist`| ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | RLS restricts SELECT to `public.is_admin()`. |
| | `patient` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | RLS restricts SELECT to `public.is_admin()`. |
| **`doctor_verifications`** | `super_admin` | ✅ All | ✅ Via RPC | ✅ Via RPC | ❌ Denied | `verify_doctor_tx` | Full credentialing oversight. |
| | `admin` | ✅ All | ✅ Via RPC | ✅ Via RPC | ❌ Denied | `verify_doctor_tx` | Verifies practitioner license via atomic RPC. |
| | `doctor` | ❌ Own records | ❌ Denied | ❌ Denied | ❌ Denied | — | `auth.uid() = doctor_id`. |
| | `others` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | Blocked by RLS. |
| **`pharmacy_verifications`**| `super_admin` | ✅ All | ✅ Via RPC | ✅ Via RPC | ❌ Denied | `verify_pharmacy_tx` | Full pharmacy license oversight. |
| | `admin` | ✅ All | ✅ Via RPC | ✅ Via RPC | ❌ Denied | `verify_pharmacy_tx` | Approves/rejects pharmacy credentials via RPC. |
| | `pharmacist`| ❌ Own records | ❌ Denied | ❌ Denied | ❌ Denied | — | `auth.uid() = pharmacy_id`. |
| | `others` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | Blocked by RLS. |
| **`doctors`** | `admin`/`super`| ✅ All | ❌ Denied | ✅ Directory flags | ❌ Denied | `verify_doctor_tx` | Read unverified + verified practitioners. |
| | `patient` | ✅ Approved only| ❌ Denied | ❌ Denied | ❌ Denied | — | Cannot see pending or rejected doctors. |
| | `doctor` | ✅ Self + approved| ❌ Self on signup | ✅ Self profile | ❌ Denied | — | Can manage own profile and schedule. |
| **`pharmacies`**| `admin`/`super`| ✅ All | ❌ Denied | ✅ Directory flags | ❌ Denied | `verify_pharmacy_tx` | Read unverified + verified dispensaries. |
| | `patient` | ✅ Approved only| ❌ Denied | ❌ Denied | ❌ Denied | — | Cannot see pending or suspended pharmacies. |
| | `pharmacist`| ✅ Self + approved| ❌ Self on signup | ✅ Self profile | ❌ Denied | — | Can manage own dispensary profile. |
| **`patients`** | `admin`/`super`| ✅ All metadata| ❌ Denied | ✅ Account status | ❌ Denied | — | Administrative demographic metadata only. |
| | `doctor` | ✅ Assigned only| ❌ Denied | ❌ Denied | ❌ Denied | — | Authorized via active `patient_doctor_access`. |
| | `patient` | ❌ Self only | ❌ Self on signup | ✅ Self profile | ❌ Denied | — | `auth.uid() = id`. |
| **`medical_records`** (EHR) | `admin`/`super`| ❌ Denied* | ❌ Denied | ❌ Denied | ❌ Denied | — | **Least Privilege**: Admins do not bypass clinical EHR without active clinical consent. |
| | `doctor` | ✅ Consented only| ✅ Care encounter | ❌ Immutable | ❌ Denied | — | Requires active `patient_doctor_access`. |
| | `patient` | ✅ Own records | ✅ Patient upload | ✅ Patient notes | ❌ Denied | — | `auth.uid() = patient_id`. |
| **`appointments`** | `admin`/`super`| ✅ All | ❌ Denied | ✅ Status/override | ❌ Denied | — | Platform operational telemetry & scheduling. |
| | `doctor` | ✅ Assigned only| ❌ Denied | ✅ Encounter status | ❌ Denied | — | `auth.uid() = doctor_id`. |
| | `patient` | ✅ Own only | ✅ Book slot | ✅ Reschedule/cancel| ❌ Denied | `create_appointment_tx` | `auth.uid() = patient_id`. |
| **`consultations`** | `admin`/`super`| ✅ Metadata only| ❌ Denied | ❌ Denied | ❌ Denied | — | Teleconsultation session metrics (no raw notes). |
| | `doctor` | ✅ Assigned only| ✅ Create note | ✅ Update note | ❌ Denied | — | Clinical participant. |
| | `patient` | ✅ Own only | ❌ Denied | ❌ Denied | ❌ Denied | — | Patient participant. |
| **`medicine_orders`** | `admin`/`super`| ✅ All | ❌ Denied | ✅ Admin status | ❌ Denied | — | Marketplace order oversight and fulfillment tally. |
| | `pharmacist`| ✅ Assigned only| ❌ Denied | ✅ Order status | ❌ Denied | `pharmacy_fulfill_prescription_tx` | `auth.uid() = pharmacy_id`. |
| | `patient` | ✅ Own only | ✅ Checkout | ✅ Cancel pending | ❌ Denied | `create_medicine_order_tx` | `auth.uid() = patient_id`. |
| **`ai_usage_daily`** | `admin`/`super`| ✅ All | ❌ System only | ❌ System only | ❌ Denied | — | Token/call metrics for RF and Gemini 1.5 Pro. |
| | `others` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | Non-admin users cannot access AI infrastructure telemetry. |
| **`rate_limit_events`**| `admin`/`super`| ✅ All | ❌ Gateway only | ❌ Gateway only | ❌ Denied | — | IP/user threat monitoring. |
| | `others` | ❌ Denied | ❌ Denied | ❌ Denied | ❌ Denied | — | Blocked by RLS. |
| **`notifications`** | `admin`/`super`| ✅ All (broadcast)| ✅ Broadcast | ✅ Mark read | ❌ Denied | — | Platform announcement and security alert dispatch. |
| | `all users` | ❌ Own only | ❌ Triggered | ✅ Mark own read | ❌ Denied | — | `auth.uid() = user_id`. |

*\* Medical Records Administrative Privacy Rule: Admin platform does not query or display raw clinical encounter notes or diagnostic images in user management or directory lists. Clinical findings are compartmentalized strictly within physician-patient access control contexts.*

---

### Critical Negative Security Invariants

1. **Patient $\rightarrow$ Admin Privilege Escalation Block:**  
   PostgreSQL RLS on `public.user_roles` rejects any INSERT/UPDATE where `auth.uid()` does not satisfy `public.is_admin()`. A patient attempting `UPDATE user_roles SET role = 'admin'` is rejected with `0 rows updated` or RLS policy violation.

2. **Admin $\rightarrow$ Super Admin Self-Promotion Block:**  
   The service layer and database policy enforce that an `admin` cannot grant the `super_admin` role to anyone, including themselves. Only users where `public.is_super_admin()` evaluates to `TRUE` can assign or revoke administrative roles.

3. **Practitioner Self-Verification Block:**  
   `verify_doctor_tx` and `verify_pharmacy_tx` explicitly verify `IF NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized';`. A doctor or pharmacist cannot verify their own license credentials.

4. **Immutable Audit Trail:**  
   No non-superuser role (including admin) possesses `DELETE` or `UPDATE` rights on `public.audit_logs`. All administrative events (`USER_SUSPENDED`, `USER_REACTIVATED`, `DOCTOR_APPROVED`, `DOCTOR_REJECTED`, `PHARMACY_APPROVED`, `PHARMACY_REJECTED`, `ROLE_CHANGED`) are append-only.

5. **Zero Secret Leakage:**  
   The frontend environment never contains `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, or private encryption secrets. All client requests execute under standard `anon` keys with JWT session context.
