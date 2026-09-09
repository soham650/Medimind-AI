# MEDIMIND AI — PHASE 7 GAP ANALYSIS & SYSTEM AUDIT
## Production Admin & Super Admin Platform Architecture

**Author:** Principal Software Engineer, Backend Architect & Security Engineer  
**Database State:** PostgreSQL / Supabase live cluster (`smmelvzldriqujaodckf.supabase.co`)  
**Baseline Status:** FROZEN through Migration 0009. Zero new migrations required.  
**Audited Date:** September 9, 2026  

---

### Executive Summary
Phase 7 establishes a unified, database-governed **Admin & Super Admin Governance Platform** for MediMind AI. This audit maps existing database infrastructure (44 public tables, PostgreSQL RLS, security definer stored procedures) against the Phase 7 specifications.

Crucially, **no schema gaps exist in PostgreSQL**. All canonical tables (`profiles`, `user_roles`, `audit_logs`, `notifications`, `doctor_verifications`, `pharmacy_verifications`, `ai_usage_daily`, `rate_limit_events`, `doctors`, `pharmacies`, `patients`, `appointments`, `consultations`, `medicine_orders`) and security definer RPCs (`is_admin()`, `is_super_admin()`, `verify_doctor_tx()`, `verify_pharmacy_tx()`, `admin_verify_entity_tx()`) are deployed and active on the live cluster. The gap is exclusively in **service layer consolidation, missing frontend administration modules, role guard routing, and automated empirical test verification**.

---

### A. Existing Admin Tables in Live Database

| Table Name | Canonical Purpose | Current Columns | Admin Access Level |
|---|---|---|---|
| `public.user_roles` | Authoritative RBAC source | `id, user_id, role, created_at` | Admin/Super Admin SELECT & ALL via `public.is_admin()` |
| `public.profiles` | User profile & approval state | `id, email, full_name, name, role, approval_status, status, avatar_url, phone, ...` | Admin SELECT; UPDATE approval/status |
| `public.audit_logs` | Immutable HIPAA compliance log | `id, actor_id, user_id, actor_role, action, target_entity, target_id, details, metadata, ip_address, created_at` | Admin SELECT only; Append-only (triggers sync dual columns) |
| `public.notifications` | Real-time platform notifications | `id, user_id, title, message, type, notification_type, link, metadata, is_read, created_at` | Admin broadcast & notification logging |
| `public.doctor_verifications` | Doctor credentialing records | `id, doctor_id, reviewed_by, status, rejection_reason, reviewed_at, created_at` | Admin SELECT & ALL (`public.is_admin()`) |
| `public.pharmacy_verifications` | Pharmacy license verifications | `id, pharmacy_id, reviewed_by, status, rejection_reason, reviewed_at, created_at` | Admin SELECT & ALL (`public.is_admin()`) |
| `public.ai_usage_daily` | AI model quota & usage telemetry | `id, usage_date, total_calls, gemini_calls, rf_calls, high_risk_flagged, created_at` | Admin/Super Admin monitoring |
| `public.rate_limit_events` | Security abuse & rate-limit log | `id, ip_address, user_id, endpoint, blocked_at` | Admin/Super Admin security monitoring |
| `public.doctors` | Medical practitioner directory | `id, full_name, specialization, experience_years, verification_status, consultation_fee, ...` | Admin SELECT & ALL (`public.is_admin()`) |
| `public.pharmacies` | Retail dispensary directory | `id, pharmacy_name, license_number, verification_status, address, contact_person, phone, ...` | Admin SELECT & ALL (`public.is_admin()`) |
| `public.patients` | Patient demographic registry | `id, full_name, phone, date_of_birth, gender, blood_group, emergency_contact, ...` | Admin SELECT for account administration |
| `public.appointments` | Scheduled teleconsultations | `id, patient_id, doctor_id, appointment_date, appointment_time, status, ...` | Admin SELECT aggregate metrics |
| `public.consultations` | Clinical consultation sessions | `id, appointment_id, patient_id, doctor_id, diagnosis, notes, status, ...` | Admin SELECT aggregate metrics |
| `public.medicine_orders` | Pharmacy prescription orders | `id, patient_id, pharmacy_id, prescription_id, total_amount, order_status, ...` | Admin SELECT aggregate metrics |

---

### B. Existing Admin RPCs & Functions

1. **`public.is_admin() RETURNS boolean`**
   - **Definition:** `SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin'));`
   - **Security:** `STABLE SECURITY DEFINER`. Authoritative PostgreSQL check for administrative privileges.

2. **`public.is_super_admin() RETURNS boolean`**
   - **Definition:** `SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin');`
   - **Security:** `STABLE SECURITY DEFINER`. Restricts elevated governance (such as modifying admin roles or altering system-wide rules).

3. **`public.verify_doctor_tx(p_doctor_id UUID, p_status TEXT, p_reason TEXT) RETURNS jsonb`**
   - **Security:** `SECURITY DEFINER`, granted strictly to `authenticated`. Rejects any caller where `NOT public.is_admin()`.
   - **Actions:** Updates `doctors.verification_status`, logs to `doctor_verifications`, syncs `profiles.approval_status`, and delivers push notification to practitioner.

4. **`public.verify_pharmacy_tx(p_pharmacy_id UUID, p_status TEXT, p_reason TEXT) RETURNS jsonb`**
   - **Security:** `SECURITY DEFINER`, granted strictly to `authenticated`. Rejects any caller where `NOT public.is_admin()`.
   - **Actions:** Updates `pharmacies.verification_status`, logs to `pharmacy_verifications`, syncs `profiles.approval_status`, and delivers notification to pharmacy.

5. **`public.admin_verify_entity_tx(...) RETURNS jsonb`**
   - **Security:** Migration 0007 transaction supporting multi-entity status governance with audit trail logging.

---

### C. Existing Roles & Hierarchy

- **PostgreSQL Enum Check:**
  `CHECK (role IN ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin'))`
- **Hierarchical Governance:**
  - `super_admin`: Highest platform authority. Can assign roles, manage admins, configure system settings, view all security/audit trails.
  - `admin`: Operational governance. Can verify doctors/pharmacies, suspend/reactivate patients/doctors/pharmacies, view analytics, inspect audit logs, monitor AI usage and rate limits. Cannot promote users to `super_admin` or alter other admins.
  - `doctor`, `pharmacist`, `patient`: Standard platform practitioners and users. Zero administrative rights. Zero self-escalation.

---

### D. Existing Row Level Security (RLS) Model

- **`user_roles`**: SELECT allowed if `auth.uid() = user_id OR public.is_admin()`. ALL mutations restricted to `public.is_admin()`.
- **`profiles`**: SELECT allowed if `auth.uid() = id OR public.is_admin() OR doctor viewing patient`.
- **`audit_logs`**: SELECT allowed exclusively if `public.is_admin()`. Modifications disallowed (no non-superuser UPDATE/DELETE policies).
- **`doctor_verifications`**: SELECT allowed if `auth.uid() = doctor_id OR public.is_admin()`. Mutations restricted to `public.is_admin()`.
- **`pharmacy_verifications`**: SELECT allowed if `auth.uid() = pharmacy_id OR public.is_admin()`. Mutations restricted to `public.is_admin()`.
- **`patients`**: SELECT allowed if `auth.uid() = id OR public.is_admin()`.
- **`doctors`**: SELECT allowed if `verification_status = 'approved' OR auth.uid() = id OR public.is_admin()`.
- **`pharmacies`**: SELECT allowed if `verification_status = 'approved' OR auth.uid() = id OR public.is_admin()`.
- **`medical_records`**: Strict privacy boundary. Accessible only by patient (`auth.uid() = patient_id`) or authorized physician (`patient_doctor_access` active and unexpired). **Admins do NOT have automatic blanket SELECT on clinical EHRs.**

---

### E. Existing Verification Flows

```
[Practitioner Submits License / Docs]
                 ↓
    public.doctors / public.pharmacies (verification_status = 'pending')
    public.profiles (approval_status = 'pending')
                 ↓
[Admin Reviews Application & Uploaded Credentials]
                 ↓
[Admin Invokes verify_doctor_tx / verify_pharmacy_tx]
                 ↓
         ┌───────┴───────┐
     Approved        Rejected (with compliance reason)
         ↓               ↓
    • verification_status = 'approved'/'rejected'
    • profiles.approval_status updated
    • Record inserted into doctor_verifications / pharmacy_verifications
    • Notification sent to applicant
    • ApprovalGateGuard unlocks clinical portal for approved users
```

---

### F. Existing Account Status & Suspension Mechanism

- **Authoritative Fields:**
  - `public.profiles.approval_status`: `'pending'`, `'approved'`, `'suspended'`, `'rejected'`
  - `public.profiles.status`: `'active'`, `'suspended'`, `'inactive'`
- **Enforcement Layer:**
  - Database: RLS checks `approval_status = 'approved'` on directories, while transactional RPCs check authorization.
  - Application: `ApprovalGateGuard` in `App.jsx` immediately intercepts suspended or unapproved practitioners and routes them away from clinical portals to `/pending-approval` or `/unauthorized`.
  - Administrative Action: Server-side update of `profiles.approval_status` and `profiles.status`, accompanied by immutable audit log generation.

---

### G. Existing Audit Logging Mechanism

- Table: `public.audit_logs`
- Trigger: `trg_sync_audit_log_columns` automatically reconciles dual columns:
  - `user_id` $\leftrightarrow$ `actor_id`
  - `user_role` $\leftrightarrow$ `actor_role`
  - `resource_type` $\leftrightarrow$ `target_entity`
  - `resource_id` $\leftrightarrow$ `target_id`
  - `details` $\leftrightarrow$ `metadata`
- Immutability: PostgreSQL RLS permits SELECT to `public.is_admin()`. Non-superusers have 0 UPDATE/DELETE privileges.

---

### H. Existing Notification Mechanism

- Table: `public.notifications`
- Trigger: `trg_sync_notification_columns` synchronizes `type` $\leftrightarrow$ `notification_type`.
- Functionality: Real-time broadcast and targeted alerts for verifications, appointments, order statuses, and administrative announcements.

---

### I. Existing AI Usage & Security Infrastructure

- Table: `public.ai_usage_daily` (aggregates daily Gemini 1.5 Pro calls, Random Forest ML triage calls, and high-risk flags).
- Table: `public.rate_limit_events` (captures blocked IPs, user IDs, and endpoints triggering rate limiter trips).
- Backend Health: ML microservice health endpoint (`http://127.0.0.1:8000/health`) and Supabase connection latency monitoring.

---

### J. Existing Frontend Admin Code

Located in `frontend/src/pages/admin/`:
1. `AdminDashboard.jsx`: Initial metrics dashboard, but relies on deprecated `adminService.js` and lacks complete multi-entity KPI coverage.
2. `DoctorApprovals.jsx`: Doctor verification UI, but directly mutates `profiles` instead of calling `verify_doctor_tx()`.
3. `PharmacyApprovals.jsx`: Pharmacy verification UI, but directly mutates `profiles` instead of calling `verify_pharmacy_tx()`.
4. `UserManagement.jsx`: Multi-role user browsing and status toggling.
5. `AuditLogs.jsx`: Audit event viewer.
6. `SystemSettings.jsx`: Microservice telemetry, AI usage preview, and maintenance toggle.

---

### K. Missing Functionality & Gap Classifications

| Requirement | Current Status | Required Action |
|---|---|---|
| `/admin/dashboard` | Partial / Legacy imports | Revamp with 100% verified DB aggregates (active, suspended, patients, doctors, pharmacies, orders, AI, security events). |
| `/admin/users` | Existing | Enhance with search, role/status filter, audit history modal, and server-side suspension. |
| `/admin/patients` | **Missing** | Create dedicated `PatientManagement.jsx` with administrative view (no raw EHR exposure). |
| `/admin/doctors` | **Missing** | Create dedicated `DoctorManagement.jsx` (directory, stats, status, verification docs, approve/reject/suspend/reactivate). |
| `/admin/pharmacies` | **Missing** | Create dedicated `PharmacyManagement.jsx` (directory, license status, order/stock stats, approve/reject/suspend/reactivate). |
| `/admin/doctor-verification` | Partial (as `DoctorApprovals`) | Rewire to `verify_doctor_tx` RPC with document preview and reason modal. Alias both routes. |
| `/admin/pharmacy-verification` | Partial (as `PharmacyApprovals`) | Rewire to `verify_pharmacy_tx` RPC with license preview and reason modal. Alias both routes. |
| `/admin/roles` | **Missing** | Create dedicated `RoleManagement.jsx` with strict escalation guardrails (admin cannot assign super_admin). |
| `/admin/audit-logs` | Existing | Enhance with filter by action, date range, entity, and secure metadata inspection. |
| `/admin/analytics` | **Missing** | Create dedicated `PlatformAnalytics.jsx` with real SQL-derived aggregates and trend charts. |
| `/admin/ai-usage` | **Missing** | Create dedicated `AIUsageMonitoring.jsx` with daily trends, RF vs Gemini breakdown, rate limits, and zero API key leakage. |
| `/admin/security` | **Missing** | Create dedicated `SecurityMonitoring.jsx` for rate-limit blocks, suspicious role alterations, and suspension tracking. |
| `/admin/notifications` | **Missing** | Create dedicated `NotificationManagement.jsx` for platform-wide alerts and administrative dispatch. |
| `/admin/settings` | Existing | Restructure into 7 tabs: General, Security, AI, Notifications, Platform, Healthcare, Maintenance (zero secrets). |
| `/super-admin/dashboard` | **Missing** | Create dedicated `SuperAdminDashboard.jsx` in `frontend/src/pages/super-admin/` with elevated governance. |
| `admin.service.js` | Partial | Consolidate all admin methods; replace legacy `adminService.js`. |
| `superAdmin.service.js` | **Missing** | Create dedicated elevated service for super admin controls (`promoteAdmin`, `demoteAdmin`, `getPlatformOverview`). |
| App Routing & Navigation | Incomplete | Register all 15 Phase 7 routes in `App.jsx`, update sidebar navigation for Admin and Super Admin. |
| Test Suite | **Missing** | Create comprehensive `scripts/verify_phase7_admin_platform.js` covering all 20+ test categories. |

---

### L. Potential Security Gaps & Remediations

1. **Privilege Escalation:**
   - *Risk:* Admin assigning `super_admin` or user self-escalating role.
   - *Remediation:* Database RLS and service layer enforce that `super_admin` can only be assigned by existing `super_admin`. Users cannot alter `user_roles`.
2. **Medical Privacy Overreach (Least Privilege):**
   - *Risk:* Admins viewing sensitive clinical notes or diagnostic results merely because they are admins.
   - *Remediation:* Admin patient management views strictly administrative metadata (name, registration date, appointment count, order count) — never unrestricted clinical EHRs.
3. **Frontend Secret Leakage:**
   - *Risk:* `service_role` key or `GEMINI_API_KEY` exposed in client bundles.
   - *Remediation:* Frontend relies strictly on `VITE_SUPABASE_ANON_KEY` and user session tokens. Zero service_role or API keys in frontend.
4. **Bypassing Transactional RPCs:**
   - *Risk:* Frontend directly updating `profiles` for verification instead of using `verify_doctor_tx` / `verify_pharmacy_tx`.
   - *Remediation:* Rewire all verification actions to the atomic RPCs which execute audit logging and status synchronization atomically.

---

### M. Required Changes Plan

1. **Service Layer**: Consolidate `admin.service.js` and build `superAdmin.service.js`. Re-export in `adminService.js` for backwards compatibility.
2. **Admin Pages**:
   - Update `AdminDashboard.jsx`, `AuditLogs.jsx`, `SystemSettings.jsx`, `UserManagement.jsx`.
   - Create `PatientManagement.jsx`, `DoctorManagement.jsx`, `PharmacyManagement.jsx`, `RoleManagement.jsx`, `PlatformAnalytics.jsx`, `AIUsageMonitoring.jsx`, `SecurityMonitoring.jsx`, `NotificationManagement.jsx`.
   - Alias / enhance `DoctorApprovals.jsx` $\leftrightarrow$ `DoctorVerification.jsx` and `PharmacyApprovals.jsx` $\leftrightarrow$ `PharmacyVerification.jsx`.
3. **Super Admin**:
   - Create `frontend/src/pages/super-admin/SuperAdminDashboard.jsx`.
4. **Navigation & Routing**:
   - Register all 15 routes in `App.jsx` under `ApprovalGateGuard` with role checks.
   - Update sidebar menu definitions for `admin` and `super_admin`.
5. **Empirical Verification**:
   - Write `scripts/verify_phase7_admin_platform.js` targeting live Supabase.
   - Verify 100% pass rate across all admin security tests and zero regression across Phases 1-6.
