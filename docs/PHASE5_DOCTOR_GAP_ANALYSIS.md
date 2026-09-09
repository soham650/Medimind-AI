# MEDIMIND AI — PHASE 5 DOCTOR PLATFORM GAP ANALYSIS

**Date:** September 9, 2026  
**Phase:** Phase 5 — Production Doctor Platform  
**Database Baseline:** Live Supabase PostgreSQL Verified through Migration 0009 (FROZEN)  
**Security Baseline:** Zero Service-Role Exposure, Strict Authenticated Session RLS, Transactional RPCs  

---

## 1. Executive Summary

Phase 5 transitions the doctor experience from partially mock-hydrated and fragmented interfaces into an end-to-end **Production Doctor Platform**. Every clinical action—from availability scheduling, appointment triage, telehealth consultation, clinical notes authoring, AI-assisted telemetry review, digital prescription issuance via `create_prescription_tx`, to longitudinal EHR review—must be strictly bound to the authenticated doctor session (`auth.uid()`) and governed by verified PostgreSQL Row-Level Security (`patient_doctor_access`) and Migration 0009 baseline RPCs.

---

## 2. Inventory of Existing Doctor Pages & Components 

| Page Component | Route(s) | Current State | Gaps / Mock Data Found | Required Phase 5 Enhancement |
|---|---|---|---|---|
| `frontend/src/pages/doctor/DoctorDashboard.jsx` | `/doctor/dashboard` | Complex UI with Recharts and mission control panels. | Hardcoded ward census patients (`Rajesh Kumar`, `Ananya Sharma`, `Vikram Das`), static roundings (`Samuel Richards`), and multiplied synthetic metric counts (`* 12 + 10`). | Purge all synthetic census arrays and multipliers. Hydrate strictly with real Supabase queries: today's schedule, upcoming appointments, pending reviews, real patient clinical relationships, high-risk AI alerts, and verified metrics. |
| `frontend/src/pages/doctor/DoctorProfile.jsx` | `/doctor/profile` | Clinical profile editor with license, specialty, bio, and document uploader. | Functional, but lacks document preview via signed URLs, rejection reason display, and clear separation of read-only admin verification status. | Add signed URL generation for private `doctor-documents` storage bucket, display verification history/rejection reasons, and enforce immutable verification status. |
| `frontend/src/pages/doctor/DoctorAvailability.jsx` | `/doctor/availability`, `/doctor/schedule` | Weekly availability slot configuration (Mon-Sun). | Form maps days to integer `0..6`, but lacks overlap validation and vacation/break period management. | Add schedule validation preventing overlapping slots, ensure atomic replacement in `doctor_availability`, and sync fee updates to `doctors`. |
| `frontend/src/pages/doctor/DoctorAppointments.jsx` | `/doctor/appointments` | Basic appointment queue table. | No filtering by date, status, or consultation type. Missing actions for "Start Consultation", "Mark Completed", "Mark No-Show", or "Cancel" with recorded reason. | Implement tabbed filtering (Today, Upcoming, Completed, Cancelled, No-Show, In-Progress), date pickers, direct link to `/doctor/consultation/:appointmentId`, and status change modal with audit logging. |
| `frontend/src/pages/doctor/ConsultationRoom.jsx` | `/doctor/consultation/:appointmentId` | Telehealth room with SOAP note editor, DSC clinician signing, and simulated video call. | Hardcoded patient `Priya Nair`, fake WebRTC video stream ("HD 60 FPS Simulated"), hardcoded vitals. | Replace with dynamic patient resolution from `appointmentId`. Replace fake video with clean `VideoConsultationProvider` abstraction (`PENDING_INTEGRATION`). Connect Left/Main patient summary and Right doctor workspace with real persistence to `consultations` and `medical_records`. |
| `frontend/src/pages/doctor/DoctorHealthRecords.jsx` | `/doctor/records`, `/doctor/patients/:patientId` | Longitudinal EHR viewer with trend graphs. | Hardcoded patient `Rahul Sharma (32M, O+)` and hardcoded static lipid panel data. | Remove hardcoded identity. Implement dynamic patient resolution via URL param or patient selector. Enforce `patient_doctor_access` validation. Display real medical records, symptom assessments, lab reports, and allergies. |
| `frontend/src/pages/doctor/PrescriptionGenerator.jsx` | `/doctor/prescribe` | Digital Rx creation pad with item lines. | Imports legacy `prescriptionService.js` that performs unsafe raw frontend `insert()` into `prescriptions` instead of transactional RPC `create_prescription_tx`. | Wire strictly to `create_prescription_tx` RPC with full itemized medication lines (`prescription_items`), and support auto-populating `medication_schedules`. |
| `frontend/src/pages/doctor/AiInsights.jsx` | `/doctor/ai-insights` | Predictive telemetry panel with SHAP feature explanations. | Hardcoded case `Rajesh Kumar`, hardcoded metrics (`42`, `06`), claims "autonomous triage". | Hydrate with real `symptom_assessments` and `ai_clinical_findings` for authorized patients. Enforce clinical guardrail banners: "AI-assisted clinical insight", "Not a diagnosis", "Doctor review required". |
| *Missing Dedicated Page* | `/doctor/analytics` | Currently redirected to generic `/analytics`. | No doctor-specific performance and clinical volume analytics. | Create dedicated `/doctor/analytics` with real database aggregates (consultations, completion rates, no-show rate, patient count, prescriptions count, consultation types). |

---

## 3. Detailed Workflow Gap Analysis Matrix

### A. Doctor Authentication & Session
- **Existing Page/Component:** `frontend/src/context/AuthContext.jsx`, `frontend/src/pages/auth/Login.jsx`, `frontend/src/pages/auth/PendingApproval.jsx`
- **Existing Service:** `frontend/src/services/auth.service.js`, `frontend/src/services/doctor.service.js`
- **Existing Table:** `profiles`, `doctors`, `user_roles`
- **Existing RLS:** `doctors_select` (approved doctors public, unapproved self-view), `doctors_update_self`
- **Gaps / Issues:** Admin Approval Gate must cleanly block pending doctors from clinical workflows while allowing profile editing and document upload.
- **Required Test:** Doctor Auth & role check; unapproved doctor redirected to `/pending-approval`.

### B. Doctor Dashboard & Real Aggregates
- **Existing Page/Component:** `frontend/src/pages/doctor/DoctorDashboard.jsx`
- **Existing Service:** `doctor.service.js` (`getMissionControlData`)
- **Existing Supabase Queries:**
  - `SELECT * FROM appointments WHERE doctor_id = auth.uid() AND appointment_date = CURRENT_DATE`
  - `SELECT * FROM appointments WHERE doctor_id = auth.uid() AND status = 'requested'`
  - `SELECT * FROM patient_doctor_access WHERE doctor_id = auth.uid() AND is_active = true`
  - `SELECT * FROM symptom_assessments WHERE patient_id IN (...) AND risk_level = 'High'`
  - `SELECT * FROM prescriptions WHERE doctor_id = auth.uid()`
  - `SELECT COUNT(*) FROM notifications WHERE user_id = auth.uid() AND is_read = false`
- **Gaps / Issues:** Service currently uses artificial fallback constants (`activeInpatientsCount: 128`, `criticalAlertsCount: 3`, `pendingLabReportsCount: 14`).
- **Remedy:** Replace with exact SQL count aggregates and graceful empty states ("0 appointments scheduled today").

### C. Doctor Profile & Verification Management
- **Existing Page/Component:** `frontend/src/pages/doctor/DoctorProfile.jsx`
- **Existing Service:** `doctor.service.js` (`getDoctorProfile`, `updateDoctorProfile`, `uploadDoctorDocument`)
- **Existing Tables:** `doctors`, `doctor_verifications`
- **Storage Bucket:** `doctor-documents` (Private)
- **Gaps / Issues:** Uploaded documents are saved in private bucket, but the doctor cannot view them via signed URLs. Rejection reasons from admin reviews are not rendered.
- **Remedy:** Fetch submissions from `doctor_verifications`, generate signed URLs (3600s TTL) for uploaded PDFs/images, and display admin review status/feedback.

### D. Doctor Availability & Scheduling
- **Existing Page/Component:** `frontend/src/pages/doctor/DoctorAvailability.jsx`
- **Existing Service:** `doctor.service.js` (`getDoctorSchedule`, `saveDoctorSchedule`)
- **Existing Table:** `doctor_availability` (Columns: `id`, `doctor_id`, `day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `is_active`)
- **Gaps / Issues:** Need front-end validation ensuring `start_time < end_time` and no overlapping slots within the same day.
- **Remedy:** Add validation logic in `DoctorAvailability.jsx` and ensure atomic transaction replacement.

### E. Appointment Management & Lifecycle
- **Existing Page/Component:** `frontend/src/pages/doctor/DoctorAppointments.jsx`
- **Existing Service:** `appointment.service.js` (`getDoctorAppointments`, `updateStatus`)
- **Existing Table:** `appointments`
- **Status State Machine:** `'requested'` → `'confirmed'` / `'scheduled'` → `'in_progress'` → `'completed'` | `'cancelled'` | `'no_show'`
- **Gaps / Issues:** Doctor cannot filter by status or date. Status updates do not prompt for cancellation reasons.
- **Remedy:** Build comprehensive filtering (status pills, date selector, consultation type), add quick actions ("Start Encounter", "Mark Completed", "Mark No-Show", "Cancel"), and record reasons in `cancellation_reason`.

### F. Patient Clinical Access & Privacy Protection (RLS)
- **Existing Table:** `patient_doctor_access`
- **RLS Function:** `public.has_patient_doctor_access(p_patient_id UUID, p_doctor_id UUID)`
- **Core Security Rule:** A doctor can ONLY query and view records for patients who have an active row in `patient_doctor_access` OR an authorized appointment with that doctor.
- **Gaps / Issues:** `DoctorHealthRecords.jsx` was hardcoded to "Rahul Sharma". It did not check `patient_doctor_access`.
- **Remedy:** Make `DoctorHealthRecords.jsx` dynamic. When accessing a patient, verify `patient_doctor_access`. If access is not granted, render an "Access Denied: No active clinical relationship" state.

### G. Consultation Workflow & Clinical Notes
- **Existing Page/Component:** `frontend/src/pages/doctor/ConsultationRoom.jsx`
- **Existing Service:** `consultation.service.js` (`recordConsultation`, `getByAppointment`)
- **Existing Tables:** `consultations`, `consultation_sessions`, `appointments`, `medical_records`
- **Gaps / Issues:**
  - Hardcoded patient info.
  - Fake simulated video stream pretending to be a real WebRTC call.
  - Doctor notes did not automatically create an auditable `medical_records` entry.
- **Remedy:**
  - Hydrate patient summary on the left: demographic, reported symptoms, allergies, medical history, AI preliminary assessment, uploaded reports.
  - Clinician workspace on the right: clinical notes, observations, assessment, diagnosis, treatment plan, follow-up instructions.
  - Enforce rule: AI preliminary suggestions NEVER auto-fill confirmed clinician diagnosis without explicit doctor action.
  - Replace fake video with clean `VideoConsultationProvider` abstraction displaying: `"Video consultation integration pending"`.
  - Save encounter into `consultations` and `medical_records` (`record_type: 'clinical_note'`).

### H. Digital Prescription Issuance
- **Existing Page/Component:** `frontend/src/pages/doctor/PrescriptionGenerator.jsx`
- **Existing Service:** `prescription.service.js`
- **Existing RPC:** `create_prescription_tx(p_doctor_id, p_patient_id, p_consultation_id, p_diagnosis, p_notes, p_items)`
- **Existing Tables:** `prescriptions`, `prescription_items`
- **Gaps / Issues:**
  - `prescriptionService.js` was doing raw `supabase.from('prescriptions').insert()`, completely bypassing transactional integrity.
  - `prescription.service.js` passed incorrect parameter names (`p_appointment_id` instead of `p_consultation_id`, missing `p_doctor_id`).
- **Remedy:** Standardize on `prescription.service.js` calling `create_prescription_tx` with exact parameter mapping:
  ```json
  {
    "p_doctor_id": "auth.uid()",
    "p_patient_id": "patientId",
    "p_consultation_id": "appointmentId or null",
    "p_diagnosis": "diagnosis",
    "p_notes": "generalAdvice",
    "p_items": [{ "name": "...", "dosage": "...", "frequency": "...", "duration_days": 7, "instructions": "..." }]
  }
  ```

### I. Medication Schedule Generation
- **Existing Table:** `medication_schedules` (Columns: `patient_id`, `prescription_id`, `medicine_name`, `dosage`, `time_of_day`, `scheduled_time`, `instructions`, `status`)
- **Gaps / Issues:** Prescriptions created by doctors did not give the option to automatically populate the patient's daily medication intake schedule.
- **Remedy:** Add option in `PrescriptionGenerator` to generate daily schedules for prescribed items in `medication_schedules`.

### J. AI Clinical Insights & Safety Guardrails
- **Existing Page/Component:** `frontend/src/pages/doctor/AiInsights.jsx`
- **Existing Service:** `ai.service.js`
- **Existing Tables:** `ai_clinical_findings`, `symptom_assessments`, `health_reports`
- **Gaps / Issues:**
  - Static mockup data (`Rajesh Kumar`, hardcoded metrics).
  - Dangerous claim of "autonomous triage telemetry".
- **Remedy:**
  - Filter real findings and assessments for patients with active doctor access.
  - Embed mandatory clinical safety labels:
    - `"AI-assisted clinical insight"`
    - `"Not a definitive diagnosis"`
    - `"Doctor review required"`
  - Emphasize assistive nature: AI provides probability, possible conditions, and risk markers; clinician makes all final diagnostic and treatment determinations.

### K. Doctor Analytics
- **Existing Page/Component:** Missing dedicated page.
- **Route:** `/doctor/analytics`
- **Required Metrics from Real Supabase Queries:**
  - Total Consultations Count (`appointments` where status = 'completed')
  - Active / Scheduled Appointments Count
  - Cancelled Appointments Count
  - No-Show Count
  - Unique Patients Treated Count (`COUNT(DISTINCT patient_id)`)
  - Prescriptions Issued Count (`COUNT(*) FROM prescriptions`)
  - Consultation Type Breakdown (Video vs. In-Person)
  - Monthly Volume Trend
- **Gaps / Issues:** Must NOT invent financial revenue from frontend or fake success rates. Only aggregate real database rows.

---

## 4. Frozen Database Schema Baseline Audit

| Table / Procedure / Bucket | Status in Migration 0009 | Gaps Identified? | Database Change Required? |
|---|---|---|---|
| `doctors` | Verified | None. Has `id`, `full_name`, `specialization`, `qualification`, `license_number`, `consultation_fee`, `rating`, `clinic_name`, `verification_status`, `is_available`. | NO |
| `doctor_availability` | Verified | None. Has `doctor_id`, `day_of_week` (int 0..6), `start_time`, `end_time`, `slot_duration_minutes`, `is_active`. | NO |
| `doctor_verifications` | Verified | None. Has `doctor_id`, `submitted_documents` (jsonb), `status`, `rejection_reason`. | NO |
| `patient_doctor_access` | Verified | None. Has `patient_id`, `doctor_id`, `is_active`, `expires_at`. Helper `has_patient_doctor_access` verified. | NO |
| `appointments` | Verified | None. Has `doctor_id`, `patient_id`, `appointment_date`, `time_slot`, `consultation_type`, `status`, `symptoms_summary`, `patient_notes`, `cancellation_reason`. | NO |
| `consultations` | Verified | None. Has `appointment_id`, `doctor_id`, `patient_id`, `chief_complaint`, `clinical_summary`, `diagnosis`. | NO |
| `consultation_sessions` | Verified | None. Has `appointment_id`, `doctor_id`, `patient_id`, `soap_notes`, `dsc_signed_token`. | NO |
| `medical_records` | Verified | None. Has `patient_id`, `doctor_id`, `consultation_id`, `record_type`, `title`, `clinical_summary`, `structured_data`. | NO |
| `prescriptions` | Verified | None. Has `doctor_id`, `patient_id`, `rx_id`, `diagnosis`, `notes`, `medicines`. | NO |
| `prescription_items` | Verified | None. Has `prescription_id`, `medicine_name`, `dosage`, `frequency`, `duration_days`, `instructions`. | NO |
| `medication_schedules` | Verified | None. Has `patient_id`, `prescription_id`, `medicine_name`, `dosage`, `time_of_day`, `scheduled_time`, `instructions`, `status`. | NO |
| `ai_clinical_findings` | Verified | None. Has `patient_id`, `doctor_id`, `finding_type`, `acuity_level`, `probability_pct`, `clinical_tier`, `biomarker_correlations`. | NO |
| `create_prescription_tx` | Verified | Stored procedure verified. Signature: `(p_doctor_id, p_patient_id, p_consultation_id, p_diagnosis, p_notes, p_items)`. | NO |
| `doctor-documents` Bucket | Verified | Private Supabase Storage bucket for physician credentials. | NO |

**Conclusion on Database:** Migration 0009 is completely sufficient for all Phase 5 requirements. **ZERO database migrations are required.**

---

## 5. Security & RLS Abuse Test Plan

Phase 5 will implement and empirically verify the following RLS isolation boundaries:

1. **Doctor A Profile Access:** Doctor A can SELECT and UPDATE own profile in `doctors`.
2. **Doctor Cross-Mutation Block:** Doctor A CANNOT update Doctor B's profile, availability, or appointments.
3. **Authorized Patient Access:** Doctor A can SELECT patient data (demographics, records, reports) ONLY when an active relationship exists in `patient_doctor_access`.
4. **Unauthorized Patient Access:** Doctor A query for Patient B (no access link) returns 0 rows.
5. **Revoked Access Block:** If `is_active` is set to `false` in `patient_doctor_access`, Doctor A is immediately blocked from viewing Patient A's records.
6. **Cross-Doctor Appointment Isolation:** Doctor A cannot select or mutate Doctor B's appointments.
7. **Cross-Doctor Prescription Isolation:** Doctor A cannot select another doctor's prescriptions unless authorized.
8. **Doctor Cannot Mutate Roles:** Doctor A cannot update `user_roles` or approve themselves.
9. **Doctor Cannot Execute Admin RPCs:** Doctor A calling `admin_approve_doctor_tx` is rejected with `Unauthorized`.
10. **Anonymous Privilege Abuse:** Anonymous user calling `create_prescription_tx` is rejected with `permission denied`.
11. **Patient Prescription Abuse:** Patient calling `create_prescription_tx` is rejected with `Unauthorized`.
12. **Zero Frontend Service-Role Key:** Frontend codebase contains zero instances of `service_role`.
13. **Zero Hardcoded UUIDs:** Doctor pages contain zero hardcoded user UUIDs or fake patient names.

---

## 6. Implementation Action Plan

1. **Service Layer Refactoring:**
   - Standardize `doctor.service.js`: Purge synthetic inpatient multipliers and fake constants; add real aggregates.
   - Fix `prescription.service.js`: Align parameter names with `create_prescription_tx(p_doctor_id, p_patient_id, p_consultation_id, p_diagnosis, p_notes, p_items)`.
   - Update `appointment.service.js`: Add doctor queue query with joined patient vitals, status updater, and cancellation reason.
   - Update `consultation.service.js`: Support consultation recording into `consultations` and `medical_records`.
2. **Page Implementations:**
   - `DoctorDashboard.jsx`: Real mission control with live appointments, pending reviews, high-risk AI alerts, and real counts.
   - `DoctorProfile.jsx`: Profile attributes, document uploads to private `doctor-documents`, signed URL view, and verification status display.
   - `DoctorAvailability.jsx`: Weekly schedule slot editor with validation and consultation fee updates.
   - `DoctorAppointments.jsx`: Queue with tabs (Today, Upcoming, Completed, Cancelled, No-Show), filters, and action modals.
   - `ConsultationRoom.jsx`: 2-column clinical workspace with real patient summary, clinical notes/diagnosis editor, DSC signing, and `VideoConsultationProvider` abstraction (`PENDING_INTEGRATION`).
   - `DoctorHealthRecords.jsx`: Longitudinal EHR with dynamic patient resolution and `patient_doctor_access` validation.
   - `PrescriptionGenerator.jsx`: Digital Rx pad connected to `create_prescription_tx` and `medication_schedules`.
   - `AiInsights.jsx`: Assistive AI telemetry with mandatory clinical guardrails ("Not a diagnosis", "Doctor review required").
   - `DoctorAnalytics.jsx`: Dedicated analytics page with real database aggregates.
   - `App.jsx`: Route wiring for `/doctor/analytics` and `/doctor/patients/:patientId`.
3. **Verification & Regression:**
   - Create `scripts/verify_phase5_doctor_platform.js` targeting all 29 verification categories.
   - Run Phase 4 regression test (`verify_phase4_patient_experience.js`).
   - Run Migration 0009 regression test (`verify_remediation_0009.js`).
   - Run ML regression test (`pytest ml-service/tests`).
   - Run production frontend build (`npm run build`).
   - Produce `docs/PHASE5_DOCTOR_IMPLEMENTATION_REPORT.md`.
