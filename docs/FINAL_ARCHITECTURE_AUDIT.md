# MEDIMIND AI — FINAL PRE-IMPLEMENTATION ARCHITECTURE AUDIT

**Audit Date:** 2026-09-08  
**Auditor:** Senior Product Engineer + Healthcare UX Architect + Supabase/PostgreSQL Architect + Full-Stack Engineer  
**Status:** **DISCOVERY COMPLETE — READY FOR IMPLEMENTATION**  

---

## 1. Existing Architecture Overview
MediMind AI is organized as a multi-tier healthcare ecosystem:
- **Frontend:** React 18 + Vite SPA, responsive role-based sidebar navigation, dynamic layout, and `ApprovalGateGuard` for medical practitioner and pharmacy credentialing.
- **ML Microservice (`ml-service`):** FastAPI running on port 8000. Phase 1 provides Random Forest symptom prediction (`symptom-rf-v1`, 97.62% test accuracy on held-out `Testing.csv`) with an independent clinical risk engine. Phase 2 provides Medical Report Intelligence using Gemini 3.5 Flash Lite with rate-limited fallback and medical normalization.
- **Database & Storage (Supabase):** PostgreSQL with 7 cumulative migrations (`0001` through `0007`), Row Level Security (RLS), private encrypted storage bucket `medical-documents`, and atomic transactional RPCs.

---

## 2. Database Gaps
- **Orders Table Discrepancy:** Migration 0004 defined `public.orders`, whereas migration 0005 defined `public.medicine_orders`. Some RPCs in 0007 target `orders` while modern services target `medicine_orders`.
- **Appointments Table History:** Migration 0001 defined `appointments` referencing `clinics(id)`. Migrations 0004 and 0005 created `appointments` with `IF NOT EXISTS`, meaning installations with 0001 require explicit column alterations for `doctor_id`, `time_slot`, `consultation_type`, and the unique slot constraint.
- **Audit Logs Field Mismatches:** Discrepancy between `actor_id`/`target_entity` (0005) and `user_id`/`resource_type` (0004, 0007).
- **Notifications Column Mismatch:** 0005 used `notification_type` and `link`; 0007 inserted into `type` and `metadata`.

---

## 3. Query Gaps
- **Doctor Mission Control:** `DoctorDashboard.jsx` was not querying `appointments` or `patient_doctor_access`, relying instead on static initial state.
- **Dynamic Patient Dropdown in Rx Generator:** `PrescriptionGenerator.jsx` hardcoded `patientId: profile.id`, lacking a query to fetch the doctor's authorized patients.
- **Order Tracking:** `PharmacyStore.jsx` placed orders via RPC, but the frontend lacked a query to fetch the patient's order history and delivery stepper.

---

## 4. Missing Pages
Nine pages are genuinely required by the product workflows and are currently absent:
1. **`PatientOrders.jsx`** (`/patient/orders`): Medicine delivery tracking and receipt inspection.
2. **`PatientAppointments.jsx`** (`/patient/appointments`): Clinical appointment history, status filtering, cancellations.
3. **`PatientProfile.jsx`** (`/patient/profile`): Demographics, emergency contact, blood group, allergy registry.
4. **`DoctorAvailability.jsx`** (`/doctor/availability`): Weekly schedule, consultation slot intervals, consultation fee.
5. **`DoctorProfile.jsx`** (`/doctor/profile`): Credentials, bio, clinic affiliation, and license certificate uploader.
6. **`BatchManagement.jsx`** (`/pharmacy/inventory/batches`): Medicine lot numbers, near-expiry alerts (< 90 days), stock count adjustments.
7. **`PharmacyProfile.jsx`** (`/pharmacy/profile`): State drug license verification, GSTIN, premises address, document uploader.
8. **`UserManagement.jsx`** (`/admin/users`): Multi-role user governance without exposing medical PHI.
9. **`SystemSettings.jsx`** (`/admin/settings`): AI service health check, rate limit audit log, daily AI usage.

---

## 5. Missing Tables
- All primary business tables exist across migrations 0001-0007. No new core domain tables are missing.
- Only non-destructive column reconciliations and missing companion views/indexes are required.

---

## 6. Missing Columns
- `appointments`: ensure `doctor_id uuid REFERENCES public.doctors(id)`, `appointment_number`, `time_slot`, `consultation_type`, `symptoms_summary`, `patient_notes`, `cancellation_reason` exist.
- `prescriptions`: ensure `medicines jsonb DEFAULT '[]'::jsonb` exists alongside `prescription_items`.
- `notifications`: ensure both `notification_type`/`link` and `type`/`metadata` exist.
- `audit_logs`: ensure both `actor_id`/`actor_role`/`target_entity`/`target_id`/`details` and `user_id`/`user_role`/`resource_type`/`resource_id`/`metadata` exist.

---

## 7. Missing Indexes
- `idx_pharmacy_inventory_expiry (pharmacy_id, expiry_date)`
- `idx_medicine_orders_patient_date (patient_id, created_at DESC)`
- `idx_appointments_patient_date (patient_id, appointment_date DESC)`
- `idx_symptom_assessments_patient_date (patient_id, created_at DESC)`

---

## 8. Missing RPCs
- Existing RPCs (`create_appointment_tx`, `create_prescription_tx`, `create_medicine_order_tx`, `pharmacy_fulfill_prescription_tx`, `verify_doctor_tx`, `verify_pharmacy_tx`) cover all required transactional operations.
- `pharmacy_fulfill_prescription_tx` requires a patch to ensure it updates `medicine_orders` and `orders` concurrently.

---

## 9. RLS Gaps
- Storage bucket RLS policies for `doctor-documents` and `pharmacy-documents` are missing.
- RLS policies must strictly enforce `patient_doctor_access` expiration so expired consults revoke record access.

---

## 10. Storage Gaps
- Bucket `doctor-documents` (private, 15MB) not yet created in `storage.buckets`.
- Bucket `pharmacy-documents` (private, 15MB) not yet created in `storage.buckets`.
- Bucket `profile-images` (public, 5MB) not yet created in `storage.buckets`.

---

## 11. Security Risks & Mitigations
- **Double Booking:** Enforced by PostgreSQL unique constraint and transactional row lock in `create_appointment_tx`.
- **Client-Side Pricing Tampering:** Enforced by calculating order totals entirely on the server within `create_medicine_order_tx`.
- **Horizontal Privilege Escalation:** Enforced by RLS rules checking `auth.uid() = id` or active `patient_doctor_access`.
- **Autonomous Prescriptions:** Hard blocked; prescriptions can only be created by an authenticated user with `role = 'doctor'` and `verification_status = 'approved'`.

---

## 12. Patient Workflow Gaps
- After ordering on `/pharmacy`, patient could not track order status or delivery progress -> Closed by creating `PatientOrders.jsx`.
- Patient could not view complete past appointment notes or cancel upcoming appointments -> Closed by creating `PatientAppointments.jsx`.
- Patient could not update emergency contacts or manage allergies -> Closed by creating `PatientProfile.jsx`.

---

## 13. Doctor Workflow Gaps
- Doctor could not set active working days, hours, or fees -> Closed by creating `DoctorAvailability.jsx`.
- Doctor could not submit credentials or view license verification status -> Closed by creating `DoctorProfile.jsx`.
- Doctor could not select real patients in `PrescriptionGenerator.jsx` -> Closed by wiring authorized patient dropdown.

---

## 14. Pharmacy Workflow Gaps
- Pharmacy could not track lot numbers, batch arrivals, or near-expiry medicines -> Closed by creating `BatchManagement.jsx`.
- Pharmacy could not manage premises address or submit license documents -> Closed by creating `PharmacyProfile.jsx`.

---

## 15. Admin Workflow Gaps
- Admin could not view user accounts across roles -> Closed by creating `UserManagement.jsx` (privacy-safe, no PHI).
- Admin could not monitor ML service uptime or inspect rate limit violations -> Closed by creating `SystemSettings.jsx`.

---

## 16. AI Persistence Gaps
- Phase 1 symptom triage predictions were not automatically writing to `symptom_assessments` in `SymptomChecker.jsx` -> Resolved by connecting `handleAnalyzeSymptoms` to `aiService.assessSymptoms()`.
- Phase 2 lab slip upload in `SymptomChecker.jsx` was not uploading files to `medical-documents` -> Resolved by wiring to `reportService.uploadReport()`.

---

## 17. Required Implementation Order
1. Non-destructive migration `0008_full_product_gap_closure.sql`.
2. Implement 3 missing Patient pages (`PatientOrders.jsx`, `PatientAppointments.jsx`, `PatientProfile.jsx`).
3. Implement 2 missing Doctor pages (`DoctorAvailability.jsx`, `DoctorProfile.jsx`).
4. Implement 2 missing Pharmacy pages (`BatchManagement.jsx`, `PharmacyProfile.jsx`).
5. Implement 2 missing Admin pages (`UserManagement.jsx`, `SystemSettings.jsx`).
6. Register all 9 new routes and update role menus in `frontend/src/App.jsx`.
7. Hydrate existing pages (`DoctorDashboard.jsx`, `PrescriptionGenerator.jsx`, `SymptomChecker.jsx`).
8. Run frontend build and test suites.

---

## 18. Files That Will Be Modified
- `frontend/src/App.jsx` (Add 9 new routes, update sidebar navigation menus).
- `frontend/src/pages/SymptomChecker.jsx` (Wire prediction persistence to `symptom_assessments`).
- `frontend/src/pages/doctor/DoctorDashboard.jsx` (Hydrate ward census from database).
- `frontend/src/pages/doctor/PrescriptionGenerator.jsx` (Add dynamic patient dropdown).
- `frontend/src/pages/patient/PharmacyStore.jsx` (Navigate to `/patient/orders` on checkout).

---

## 19. Files That Will Be Created
1. `supabase/migrations/0008_full_product_gap_closure.sql`
2. `frontend/src/pages/patient/PatientOrders.jsx`
3. `frontend/src/pages/patient/PatientAppointments.jsx`
4. `frontend/src/pages/patient/PatientProfile.jsx`
5. `frontend/src/pages/doctor/DoctorAvailability.jsx`
6. `frontend/src/pages/doctor/DoctorProfile.jsx`
7. `frontend/src/pages/pharmacy/BatchManagement.jsx`
8. `frontend/src/pages/pharmacy/PharmacyProfile.jsx`
9. `frontend/src/pages/admin/UserManagement.jsx`
10. `frontend/src/pages/admin/SystemSettings.jsx`

---

## 20. Risks and Assumptions
- **Risk:** Existing databases might have legacy records in `appointments` without `doctor_id`.  
  *Mitigation:* Migration 0008 uses `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` with safe defaults, avoiding destructive operations.
- **Risk:** Pharmacists fulfilling orders might trigger errors if `orders` vs `medicine_orders` are desynchronized.  
  *Mitigation:* Migration 0008 ensures both table names resolve to the identical data structure via triggers/views.
- **Assumption:** Testing mode in `AuthContext.jsx` remains active for instant multi-role verification while supporting live Supabase Auth logins.
