# MEDIMIND AI — SUPABASE DDL PRE-FLIGHT VALIDATION REPORT

**Date:** September 8, 2026  
**Auditor:** Antigravity Senior Engineering Team  
**Target Project:** `smmelvzldriqujaodckf.supabase.co` (Verified Active & Reachable)  
**File Audited:** [supabase/complete_database_schema_and_migrations.sql](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/supabase/complete_database_schema_and_migrations.sql)  
**Overall Status:** **BLOCKED (Requires Remediation of Missing Base Tables Before Execution)**

---

## EXECUTIVE SUMMARY

A strict pre-flight audit was performed on `supabase/complete_database_schema_and_migrations.sql` against the active, verified Supabase project `smmelvzldriqujaodckf.supabase.co`.

While the script excels in security architecture—enforcing least-privilege Row-Level Security (RLS), atomic row-locked transactional RPCs, private medical document storage, and strict permissions—it contains **critical dependency blockers** resulting from how migrations 0005–0008 were consolidated without base entity definitions from migrations 0001–0004.

Specifically, the target Supabase database is a clean PostgreSQL instance with **0 existing public tables**. Attempting to execute `complete_database_schema_and_migrations.sql` in its current form will fail immediately with fatal PostgreSQL errors:
1. `public.profiles` does not exist (`REFERENCES public.profiles(id)` fails, and trigger functions updating `public.profiles` fail).
2. `public.orders` does not exist (`ALTER TABLE public.orders` and `CREATE TRIGGER trg_sync_orders_to_medicine_orders ON public.orders` fail).

Because critical blockers were identified, the status is **BLOCKED**. The file must be remediated to include the base table definitions before running DDL in production.

---

## 1. VALIDATION CATEGORY SCOREBOARD

| Validation Category | Audit Result | Key Finding |
|---|---|---|
| **1. Target Project Verification** | **PASS** | Target host `smmelvzldriqujaodckf.supabase.co` is verified online and connected via Service Role. |
| **2. Non-Destructive Safety** | **PASS** | Zero `DROP TABLE` statements; zero blanket `DELETE`; zero `DISABLE RLS`. |
| **3. Schema Dependency & Entity Completeness** | **BLOCKER** | `public.profiles` and `public.orders` are referenced by foreign keys, triggers, and RPCs but never created in the script. |
| **4. Foreign Key Integrity** | **BLOCKER** | Foreign keys targeting `public.profiles(id)` fail because `profiles` is absent. |
| **5. Trigger & Function Binding** | **BLOCKER** | Trigger `trg_sync_orders_to_medicine_orders` binds to `public.orders`, which does not exist. |
| **6. Appointment Anti-Double-Booking** | **WARNING** | Strict table constraint `unique(doctor_id, appointment_date, time_slot)` in 0005 conflicts with soft-delete index `uq_appointment_slot` in 0008. |
| **7. Role Escalation Protection** | **PASS** | `user_roles` strictly restricted to `is_admin()`; `handle_user_signup()` defaults to `patient`. |
| **8. Prescription Authorization** | **PASS** | `create_prescription_tx` enforces verified doctor identity and clinical access relationships. |
| **9. Inventory Concurrency & Price Security** | **PASS** | `create_medicine_order_tx` locks inventory with `FOR UPDATE` and calculates prices server-side. |
| **10. Storage Bucket Policies** | **PASS** | 4 buckets provisioned; private document signed URLs enforced with 300s TTL. |
| **11. Privileged RPC Permissions** | **PASS** | `EXECUTE` revoked from `PUBLIC` and `anon`; granted exclusively to `authenticated`. |
| **12. Function Security & search_path** | **WARNING** | `SECURITY DEFINER` functions lack explicit `SET search_path = public, pg_temp;`. |

---

## 2. DETAILED AUDIT FINDINGS

### 2.1 [BLOCKER] Missing `public.profiles` Table Definition
- **Description:** The consolidated SQL file relies on `public.profiles` across multiple subsystems:
  - In `0008`: Line 1016 (`UPDATE public.profiles SET approval_status = p_status...`) and Line 1071 (`UPDATE public.profiles SET approval_status = p_status...`).
  - In frontend `AuthContext.jsx` and `auth.service.js`: Primary user profile hydration queries `public.profiles`.
- **Root Cause:** `public.profiles` was originally created in migration `0001_init_schema.sql` and modified in `0003` and `0004`. Because `complete_database_schema_and_migrations.sql` only concatenated `0005`, `0006`, `0007`, and `0008`, `public.profiles` was omitted entirely.
- **Impact on Execution:** PostgreSQL will abort execution with:
  ```
  ERROR: relation "public.profiles" does not exist
  ```

### 2.2 [BLOCKER] Missing `public.orders` Table Definition
- **Description:** Migration `0008` implements bidirectional reconciliation between the modern `medicine_orders` table and the legacy `orders` table. It executes:
  ```sql
  ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS medicine_order_id uuid ...;
  CREATE TRIGGER trg_sync_orders_to_medicine_orders
      AFTER INSERT OR UPDATE ON public.orders
      FOR EACH ROW
      EXECUTE FUNCTION public.sync_orders_to_medicine_orders();
  ```
- **Root Cause:** `public.orders` was created in `0004_full_architecture_schema.sql`. Because `0004` was not included in the consolidated file, `public.orders` does not exist on a fresh database.
- **Impact on Execution:** PostgreSQL will abort execution with:
  ```
  ERROR: relation "public.orders" does not exist
  ```

### 2.3 [WARNING] Unique Constraint Conflict on Appointments
- **Description:**
  - Migration `0005` creates `public.appointments` with a hard constraint:
    ```sql
    unique(doctor_id, appointment_date, time_slot)
    ```
  - Migration `0008` attempts to create a conditional partial index:
    ```sql
    CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_slot 
    ON public.appointments (doctor_id, appointment_date, time_slot) 
    WHERE status NOT IN ('cancelled', 'no_show');
    ```
- **Analysis:** If the unconditional `unique(...)` constraint from `0005` is active, PostgreSQL will reject re-booking a slot even if the previous appointment was cancelled or marked no-show. The conditional index in `0008` becomes ineffective because the stricter constraint in `0005` blocks the insert first.
- **Remediation:** Remove the hard `unique(doctor_id, appointment_date, time_slot)` table constraint from `0005` and rely exclusively on the partial unique index `uq_appointment_slot` from `0008`.

### 2.4 [WARNING] Missing `SET search_path` on `SECURITY DEFINER` Functions
- **Description:** Several functions declared with `SECURITY DEFINER` (e.g. `is_admin()`, `current_user_role()`, `handle_user_signup()`, `create_appointment_tx()`) do not set an explicit `search_path`.
- **Best Practice:** Supabase security guidelines recommend:
  ```sql
  SET search_path = public, pg_temp;
  ```
  to eliminate any risk of search_path manipulation by unprivileged callers.

---

## 3. EXACT REMEDIATION SPECIFICATION

To transition `supabase/complete_database_schema_and_migrations.sql` from **BLOCKED** to **READY TO EXECUTE**, the master file must be restructured into a single coherent, dependency-ordered script:

```
Step 1: Extensions (uuid-ossp, pgcrypto)
Step 2: Base Entity: public.profiles (complete schema with approval_status, ABHA, vitals)
Step 3: RBAC Entity: public.user_roles + auth helper functions (is_admin, current_user_role)
Step 4: Clinical Entities: public.patients, public.doctors, public.pharmacies
Step 5: Verification & Governance: doctor_verifications, pharmacy_verifications, patient_doctor_access
Step 6: Clinical Workflow: appointments (with uq_appointment_slot partial index), consultations, medical_records, patient_allergies
Step 7: Pharmacy & Inventory: medicines, pharmacy_inventory, prescriptions, prescription_items
Step 8: Orders & Fulfillment: medicine_orders AND orders (both created) + bidirectional sync triggers
Step 9: Diagnostics & ABDM Suite: lab_packages, lab_tests, lab_bookings, medication_schedules, ai_clinical_findings
Step 10: AI Persistence & Observability: symptom_assessments, health_reports, ai_usage_daily, rate_limit_events
Step 11: System Infrastructure: notifications, audit_logs (with column sync triggers)
Step 12: Row-Level Security: Enable RLS on all tables + add least-privilege policies
Step 13: Atomic Transactional RPCs: create_appointment_tx, create_prescription_tx, create_medicine_order_tx, pharmacy_fulfill_prescription_tx, verify_doctor_tx, verify_pharmacy_tx
Step 14: Strict RPC Permissions: REVOKE FROM PUBLIC, anon; GRANT TO authenticated
```

---

## 4. DDL PRE-FLIGHT STATUS VERDICT

```
==================================================
MEDIMIND AI — DDL PRE-FLIGHT STATUS
==================================================
TARGET SUPABASE HOST:       smmelvzldriqujaodckf.supabase.co (VERIFIED)
SYNTAX & PARSING:           PASS
NON-DESTRUCTIVE SAFETY:     PASS (No Drops / No Deletions)
RLS & STORAGE POLICIES:     PASS (Least Privilege)
TRANSACTIONAL RPCS:         PASS (Row Locked & Secure)
DEPENDENCY & COMPLETENESS:  FAIL (Missing profiles & orders tables)
==================================================
DDL PREFLIGHT STATUS:       BLOCKED
==================================================
```

### Next Action Required:
Do NOT execute `supabase/complete_database_schema_and_migrations.sql` in its current form.  
Remediate the master script by incorporating the base `profiles` and `orders` entity schemas and resolving the appointment unique constraint. Once remediated and validated, the status will advance to **READY TO EXECUTE**.
