# MEDIMIND AI — FINAL MASTER IMPLEMENTATION PLAN

**Implementation Model:** Sequential Phased Rollout (Phases A through J)  
**Safety Commitment:** Zero destructive database changes, zero alterations to Phase 1 ML model (`symptom-rf-v1`), zero modifications to Phase 2 Gemini Report pipeline, zero exposure of API keys or PHI.

---

## Phase Breakdown & Execution Sequence

```
Phase A: Database Reconciliation
   ↓
Phase B: Supabase Migrations (0008_full_product_gap_closure.sql)
   ↓
Phase C: Row-Level Security (RLS) Verification
   ↓
Phase D: Storage Buckets & Policies
   ↓
Phase E: Atomic RPC Functions & Permissions
   ↓
Phase F: Missing Frontend Page Creation (9 Pages)
   ↓
Phase G: Existing Page Backend & Service Unification
   ↓
Phase H: AI Persistence Integration (Phase 1 & Phase 2)
   ↓
Phase I: End-to-End Application Testing
   ↓
Phase J: Security & RLS Attack Simulation Testing
```

---

## Phase A: Database Reconciliation
- **Objective:** Reconcile column mismatches, duplicate table names (`orders` vs `medicine_orders`), and ensure all referenced foreign keys resolve cleanly.
- **Tasks:**
  1. Add column aliases on `notifications`: ensure both `type`, `notification_type`, `link`, and `metadata` exist.
  2. Add column aliases on `audit_logs`: ensure both `actor_id` / `user_id`, `actor_role` / `user_role`, `target_entity` / `resource_type`, `target_id` / `resource_id`, and `details` / `metadata` exist.
  3. Reconcile `orders` and `medicine_orders`: maintain both so legacy and modern queries resolve without error.
  4. Ensure `appointments` has `doctor_id uuid REFERENCES public.doctors(id)` and the unique slot constraint.

---

## Phase B: Supabase Migrations (`0008_full_product_gap_closure.sql`)
- **Objective:** Create the single non-destructive reconciliation migration file.
- **Tasks:**
  1. Draft `supabase/migrations/0008_full_product_gap_closure.sql`.
  2. Verify all statements use `IF NOT EXISTS` or safe conditional blocks.
  3. Include missing composite performance indexes:
     - `idx_pharmacy_inventory_expiry (pharmacy_id, expiry_date)`
     - `idx_medicine_orders_patient_date (patient_id, created_at DESC)`
     - `idx_appointments_patient_date (patient_id, appointment_date DESC)`
     - `idx_symptom_assessments_patient_date (patient_id, created_at DESC)`

---

## Phase C: Row-Level Security (RLS)
- **Objective:** Verify and apply comprehensive least-privilege security policies across all tables.
- **Tasks:**
  1. Verify RLS is enabled on 100% of tables in `public`.
  2. Confirm cross-patient demographic and report isolation policies.
  3. Confirm `patient_doctor_access` bridge rule on `medical_records`.
  4. Confirm pharmacy order and inventory isolation rules.
  5. Confirm super-admin restriction on `user_roles`.

---

## Phase D: Storage Buckets & Policies
- **Objective:** Provision private Supabase Storage buckets and secure signed-URL access policies.
- **Tasks:**
  1. Ensure `medical-documents` (private, 15MB) exists with signed-URL policies for owning patients and authorized doctors.
  2. Provision `doctor-documents` (private, 15MB) for practitioner credentials with Doctor upload and Admin review policies.
  3. Provision `pharmacy-documents` (private, 15MB) for retail drug licenses with Pharmacy upload and Admin review policies.
  4. Provision `profile-images` (public, 5MB) for user avatars.

---

## Phase E: Atomic RPC Functions & Permissions
- **Objective:** Ensure transactional integrity for all clinical and financial operations.
- **Tasks:**
  1. Review and test `create_appointment_tx` (prevents double booking).
  2. Review and test `create_prescription_tx` (generates authenticated `rx_id`).
  3. Review and test `create_medicine_order_tx` (validates verified prices and decrements inventory).
  4. Review and test `pharmacy_fulfill_prescription_tx` (advances order states and manages inventory cancellation).
  5. Review and test `verify_doctor_tx` and `verify_pharmacy_tx` (restricted to `is_admin()`).
  6. Grant `EXECUTE` permissions to `authenticated` role (minimum privilege).

---

## Phase F: Frontend Missing Page Creation (9 Pages)
- **Objective:** Implement the 9 required pages with production-quality UI, real queries, and complete states (Loading, Empty, Error, Success).
- **Tasks:**
  1. **`frontend/src/pages/patient/PatientOrders.jsx`**: Order history, order items, 5-step delivery stepper.
  2. **`frontend/src/pages/patient/PatientAppointments.jsx`**: Appointments queue, status filter, cancellation, teleconsultation launch.
  3. **`frontend/src/pages/patient/PatientProfile.jsx`**: Demographics, emergency contacts, blood group, ABHA card, allergy registry.
  4. **`frontend/src/pages/doctor/DoctorAvailability.jsx`**: Weekly schedule manager, slot intervals, consultation fee.
  5. **`frontend/src/pages/doctor/DoctorProfile.jsx`**: Clinical credentials, bio, hospital affiliation, license document uploader.
  6. **`frontend/src/pages/pharmacy/BatchManagement.jsx`**: Pharmaceutical lot numbers, near-expiry alerts (< 90 days), stock adjustments.
  7. **`frontend/src/pages/pharmacy/PharmacyProfile.jsx`**: Drug license verification, GSTIN, premises address, document uploader.
  8. **`frontend/src/pages/admin/UserManagement.jsx`**: Multi-role user governance without exposing medical PHI.
  9. **`frontend/src/pages/admin/SystemSettings.jsx`**: ML service uptime monitor, rate-limit events audit (`rate_limit_events`), daily AI telemetry.

---

## Phase G: Existing Page Backend & Service Unification
- **Objective:** Connect existing pages to live backend queries and unify service clients.
- **Tasks:**
  1. Update `frontend/src/App.jsx` to register the 9 new routes and update role-based sidebar menus.
  2. Connect `DoctorDashboard.jsx` to live appointment and inpatient census data via `doctorService.getMissionControlData()`.
  3. Connect `PrescriptionGenerator.jsx` to dynamic patient selection from appointments / authorized patients.
  4. Ensure `PharmacyStore.jsx` navigates to `/patient/orders` upon successful order checkout.

---

## Phase H: AI Persistence Integration (Phase 1 & Phase 2)
- **Objective:** Guarantee that all AI triage assessments and report understandings persist to database.
- **Tasks:**
  1. In `SymptomChecker.jsx`, wire `handleAnalyzeSymptoms` to `aiService.assessSymptoms()` so outputs persist to `symptom_assessments`.
  2. In `SymptomChecker.jsx` Mode 2, wire uploaded lab slips to `reportService.uploadReport()` and `health_reports`.
  3. Ensure all stored records include mandatory non-diagnostic disclaimers and model versions.

---

## Phase I: End-to-End Application Testing
- **Objective:** Validate complete compilation and user flows across all 4 personas.
- **Tasks:**
  1. Run frontend production build: `npm run build` (Validate 0 TypeScript/JSX errors, 0 broken imports).
  2. Run ML test suite: `pytest tests/` (Validate 100% test pass on Phase 1 & 2 models).
  3. Manually trace Patient -> Doctor -> Pharmacy -> Admin flows.

---

## Phase J: Security & RLS Attack Simulation Testing
- **Objective:** Verify zero unauthorized data access.
- **Tasks:**
  1. Test Patient A querying Patient B's data (must return 0 rows).
  2. Test Doctor querying unassigned patient (must return 0 rows).
  3. Test Pharmacy querying unrelated prescription (must return 0 rows).
  4. Test normal user altering `user_roles` (must return permission denied).
  5. Test downloading private storage without signed URL (must return 403 Forbidden).
