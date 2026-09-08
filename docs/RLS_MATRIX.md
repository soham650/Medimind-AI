# MEDIMIND AI — ROW LEVEL SECURITY (RLS) MATRIX & ACCESS POLICIES

**Security Architecture Standard:** Mandatory Row-Level Security (RLS) enabled on 100% of PostgreSQL tables in the `public` schema.  
**Healthcare Defense-in-Depth:** Zero horizontal privilege escalation; Patient A cannot view Patient B; Doctor A cannot view unauthorized Patient records without active consent or appointment; Pharmacy A cannot view Pharmacy B orders or inventory; non-admin users cannot alter user roles.

---

## 1. Role-Level Security (RLS) Master Matrix

| Table Name | Patient | Doctor | Pharmacist | Admin | Super Admin | Critical Security Condition |
|---|---|---|---|---|---|---|
| **`public.user_roles`** | SELECT (Own) | SELECT (Own) | SELECT (Own) | SELECT (All) | ALL (CRUD) | Non-admins cannot INSERT/UPDATE roles. Prevents self-elevation. |
| **`public.profiles`** | SELECT/UPDATE (Own) | SELECT/UPDATE (Own) | SELECT/UPDATE (Own) | SELECT (All), UPDATE (Approval) | ALL | Users can only mutate their own profile. Approval status locked to Admin. |
| **`public.patients`** | SELECT/UPDATE (Own), INSERT (Own) | SELECT (Authorized via `patient_doctor_access`) | NONE | SELECT (All) | ALL | Doctors can ONLY read patients if an active appointment or explicit ABDM consent exists. |
| **`public.doctors`** | SELECT (Approved Only) | SELECT (All), UPDATE (Own profile) | SELECT (Approved Only) | ALL | ALL | Public/Patients only see `verification_status = 'approved'`. Unapproved doctors hidden. |
| **`public.doctor_verifications`** | NONE | SELECT (Own) | NONE | ALL | ALL | Clinical compliance verification documents and rejection reasons managed by Admins. |
| **`public.doctor_availability`** | SELECT (Public/All) | ALL (Own slots) | SELECT (Public) | ALL | ALL | Doctors manage their own calendar slots; Patients read slots to book. |
| **`public.pharmacies`** | SELECT (Approved Only) | SELECT (Approved Only) | SELECT/UPDATE (Own) | ALL | ALL | Unapproved pharmacies cannot receive orders or appear in dispensary checkout. |
| **`public.pharmacy_verifications`** | NONE | NONE | SELECT (Own) | ALL | ALL | Regulatory drug license verification records isolated to Admins. |
| **`public.patient_doctor_access`** | SELECT (Own granted) | SELECT (Own authorized) | NONE | SELECT (All) | ALL | Bridge table dictating doctor access to patient health records. Expiry enforced. |
| **`public.appointments`** | SELECT/INSERT (Own), UPDATE (Cancel own) | SELECT (Own doctor appts), UPDATE (Status) | NONE | SELECT (All), UPDATE (Admin) | ALL | Unique constraint prevents double booking. Patient A cannot see Patient B appointments. |
| **`public.consultations`** | SELECT (Own sessions) | ALL (Own clinical sessions) | NONE | SELECT (All) | ALL | Clinical notes and diagnosis protected; only participating doctor and patient have access. |
| **`public.consultation_sessions`** | SELECT (Own sessions) | ALL (Own sessions) | NONE | SELECT (All) | ALL | Ambient scribe transcripts and DSC tokens restricted to encounter participants. |
| **`public.prescriptions`** | SELECT (Own Rx) | ALL (Issued by self) | SELECT (If linked to order) | SELECT (All) | ALL | Pharmacists can ONLY view a prescription if attached to an order placed with their pharmacy. |
| **`public.prescription_items`** | SELECT (Own Rx items) | ALL (Issued by self) | SELECT (If linked to order) | SELECT (All) | ALL | Line items inherit parent prescription access control rules. |
| **`public.medicines`** | SELECT (Public) | SELECT (Public) | SELECT (Public) | ALL | ALL | Master pharmaceutical catalog is publicly readable; Admin manages items. |
| **`public.pharmacy_inventory`** | SELECT (Available stock) | SELECT (Available stock) | ALL (Own pharmacy stock) | ALL | ALL | Pharmacy A cannot read or modify Pharmacy B inventory, prices, or batch records. |
| **`public.medicine_orders`** | SELECT/INSERT (Own orders), UPDATE (Cancel) | NONE | SELECT/UPDATE (Fulfill own orders) | SELECT (All) | ALL | Pharmacy A cannot see orders placed with Pharmacy B. Patients only see own orders. |
| **`public.order_items`** | SELECT (Own order items) | NONE | SELECT (Own store order items) | SELECT (All) | ALL | Inherits order access boundaries. |
| **`public.symptom_assessments`** | SELECT/INSERT (Own) | SELECT (Authorized patients) | NONE | SELECT (All) | ALL | AI triage assessments are private health data. Guest assessments tagged with NULL patient_id. |
| **`public.health_reports`** | ALL (Own reports) | SELECT (Authorized patients) | NONE | SELECT (All) | ALL | Metadata for private medical PDF/image documents. Access matches storage policy. |
| **`public.medical_records`** | SELECT (Own records) | SELECT/INSERT (Authorized) | NONE | SELECT (All) | ALL | Longitudinal EHR entries. Insertion permitted only by authorized doctors. |
| **`public.patient_allergies`** | ALL (Own allergies) | SELECT (Authorized patients) | NONE | SELECT (All) | ALL | Patient allergies readable by treating doctor to prevent adverse drug reactions. |
| **`public.medication_schedules`** | ALL (Own doses) | SELECT (Authorized patients) | NONE | SELECT (All) | ALL | Daily pill reminder tracking owned by patient. |
| **`public.lab_packages`** | SELECT (Public) | SELECT (Public) | SELECT (Public) | ALL | ALL | Diagnostic health test catalog publicly readable. |
| **`public.lab_tests`** | SELECT (Public) | SELECT (Public) | SELECT (Public) | ALL | ALL | Individual diagnostic tests catalog publicly readable. |
| **`public.lab_bookings`** | SELECT/INSERT (Own) | SELECT (Authorized patients) | NONE | ALL | ALL | Diagnostic at-home collection bookings isolated to booking patient. |
| **`public.abdm_consents`** | SELECT/UPDATE (Own) | SELECT (Where requester) | NONE | SELECT (All) | ALL | ABDM 3.0 consent artifacts. Patient can Grant, Deny, or Revoke at any time. |
| **`public.abdm_audit_logs`** | SELECT (Own logs) | NONE | NONE | SELECT (All) | ALL | Immutable cryptographic logs of record accesses visible to the affected patient. |
| **`public.ai_clinical_findings`**| SELECT (Own findings) | ALL (Oversight sign-off) | NONE | SELECT (All) | ALL | Multi-modal AI findings requiring clinical oversight sign-off by doctors. |
| **`public.disease_clinical_guidelines`** | SELECT (Public) | SELECT (Public) | SELECT (Public) | ALL | ALL | Diagnostic triage clinical guidelines registry readable by all. |
| **`public.payments`** | SELECT/INSERT (Own) | NONE | NONE | SELECT (All) | ALL | Financial transactions isolated to paying user. |
| **`public.notifications`** | SELECT/UPDATE (Own) | SELECT/UPDATE (Own) | SELECT/UPDATE (Own) | SELECT/UPDATE (Own)| ALL | In-app alerts private to recipient user (`user_id = auth.uid()`). |
| **`public.audit_logs`** | NONE | NONE | NONE | SELECT (All) | ALL | Immutable audit logs restricted strictly to compliance Admins. |
| **`public.rate_limit_events`** | NONE | NONE | NONE | ALL | ALL | Security telemetry and blocked IP events restricted to Admins. |

---

## 2. Core RLS Policy Implementations (SQL Snippets)

### 2.1 Cross-Patient Isolation
```sql
-- Patients can NEVER select another patient's medical records
CREATE POLICY "patients_isolation_select" ON public.patients
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

### 2.2 Cross-Doctor Authorization Bridge
```sql
-- Doctors can only access patient health records if an active authorization bridge exists
CREATE POLICY "medical_records_doctor_isolation" ON public.medical_records
FOR SELECT USING (
    patient_id = auth.uid() OR
    public.is_admin() OR
    EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda
        WHERE pda.patient_id = medical_records.patient_id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true
    )
);
```

### 2.3 Cross-Pharmacy Isolation
```sql
-- Pharmacy A can NEVER select or update orders belonging to Pharmacy B
CREATE POLICY "pharmacy_order_isolation" ON public.medicine_orders
FOR SELECT USING (
    patient_id = auth.uid() OR
    pharmacy_id = auth.uid() OR
    public.is_admin()
);

-- Pharmacy A can NEVER alter Pharmacy B stock
CREATE POLICY "pharmacy_inventory_isolation" ON public.pharmacy_inventory
FOR ALL USING (
    pharmacy_id = auth.uid() OR public.is_admin()
);
```

### 2.4 Prescription Privacy
```sql
-- Pharmacies can ONLY view prescriptions attached to an order placed with their store
CREATE POLICY "prescriptions_pharmacy_access" ON public.prescriptions
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

### 2.5 Role Elevation Protection
```sql
-- Normal users cannot insert or modify user_roles table
CREATE POLICY "user_roles_protection" ON public.user_roles
FOR ALL USING (
    public.is_super_admin()
);
```
