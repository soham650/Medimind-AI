# MEDIMIND AI — PHASE 5 DOCTOR PLATFORM QUERY MAP
## Production Supabase Database Integration & Operational Trace

**Target Instance:** `smmelvzldriqujaodckf.supabase.co`  
**Database Baseline:** FROZEN through Migration 0009  
**Identity Source:** Authoritative Supabase Auth Session (`auth.uid()`)  

---

## Overview

The MediMind AI Production Doctor Platform consists of 9 fully responsive, dynamic pages built with React and Tailwind CSS, communicating directly with the live Supabase PostgreSQL backend without mock or synthetic data.

All data access strictly adheres to Row Level Security (RLS) policies, transactional stored procedures (RPCs), and active patient-doctor access bridges (`public.patient_doctor_access`).

---

## 1. Doctor Dashboard (`/doctor/dashboard`)
- **Component:** [`frontend/src/pages/doctor/DoctorDashboard.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorDashboard.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.doctors` | `SELECT` | `.from('doctors').select('*').eq('id', doctorId).single()` | `id = auth.uid()` | Fetch practitioner profile, specialization, verification status, and ratings. |
| `public.appointments` | `SELECT` | `.from('appointments').select('*, patients:patient_id(*)').eq('doctor_id', doctorId).gte('appointment_date', today).order('appointment_date')` | `doctor_id = auth.uid()`, `appointment_date >= CURRENT_DATE` | Real-time queue of upcoming patient consultations. |
| `public.prescriptions` | `SELECT` | `.from('prescriptions').select('id, count').eq('doctor_id', doctorId)` | `doctor_id = auth.uid()` | Practice KPI aggregate metrics. |
| `public.patient_doctor_access` | `SELECT` | `.from('patient_doctor_access').select('patient_id, count').eq('doctor_id', doctorId).eq('is_active', true)` | `doctor_id = auth.uid()`, `is_active = true` | Active patient count. |
| `public.notifications` | `SELECT` | `.from('notifications').select('*').eq('user_id', doctorId).order('created_at', { ascending: false }).limit(5)` | `user_id = auth.uid()` | Real-time clinical alerts, booking notifications, and system updates. |

---

## 2. Doctor Appointments (`/doctor/appointments`)
- **Component:** [`frontend/src/pages/doctor/DoctorAppointments.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorAppointments.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.appointments` | `SELECT` | `.from('appointments').select('*, patients:patient_id(full_name, email, phone, gender, blood_group)').eq('doctor_id', doctorId).order('appointment_date', { ascending: false })` | `doctor_id = auth.uid()` | Full historical and upcoming appointment schedule with patient demographics. |
| `public.appointments` | `UPDATE` | `.from('appointments').update({ status, notes, updated_at: now() }).eq('id', appointmentId).eq('doctor_id', doctorId)` | `id = p_appointment_id`, `doctor_id = auth.uid()` | State transitions (`confirmed`, `in_progress`, `completed`, `cancelled`). |

---

## 3. Consultation Room (`/doctor/consultation/:appointmentId`)
- **Component:** [`frontend/src/pages/doctor/ConsultationRoom.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/ConsultationRoom.jsx)
- **Primary Services:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js), [`frontend/src/services/videoConsultation.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/videoConsultation.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.appointments` | `SELECT` | `.from('appointments').select('*, patients:patient_id(*)').eq('id', appointmentId).single()` | `id = appointmentId`, `doctor_id = auth.uid()` | Verify authorized doctor appointment and load patient baseline. |
| `public.patient_doctor_access` | `SELECT` | `.from('patient_doctor_access').select('*').eq('doctor_id', doctorId).eq('patient_id', patientId).eq('is_active', true)` | `doctor_id = auth.uid()`, `patient_id = p_patient_id` | Ensure active consent bridge exists before exposing clinical history. |
| `public.consultations` | `INSERT` / `UPDATE` | `.from('consultations').insert({ appointment_id, doctor_id, patient_id, status: 'in_progress', consultation_type: 'video' })` | `doctor_id = auth.uid()` | Record encounter metadata, clinical vitals, and consultation timeline. |
| `public.consultation_sessions` | `INSERT` / `UPDATE` | `.from('consultation_sessions').insert({ consultation_id, session_token, room_id, is_active: true })` | `consultation_id = c_id` | WebRTC / Telehealth session token management via `VideoConsultationProvider`. |
| `public.medical_records` | `INSERT` | `.from('medical_records').insert({ patient_id, doctor_id, record_type: 'clinical_notes', title, description, attachments })` | `doctor_id = auth.uid()`, `patient_id = p_id` | Persist clinical consultation notes and diagnosis into patient's longitudinal EHR. |
| `public.symptom_assessments` | `SELECT` | `.from('symptom_assessments').select('*').eq('patient_id', patientId).order('created_at', { ascending: false })` | Access bridge verified | Assistive AI symptom history with prominent Clinical Safety Disclaimer banner. |

---

## 4. Prescription Generator (`/doctor/prescriptions/new` & `/doctor/prescriptions`)
- **Component:** [`frontend/src/pages/doctor/PrescriptionGenerator.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/PrescriptionGenerator.jsx)
- **Primary Service:** [`frontend/src/services/prescription.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/prescription.service.js)

| Database Table / Object | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.medicines` | `SELECT` | `.from('medicines').select('id, name, generic_name, dosage_form, strength, instructions').order('name')` | Available formulary items | Live medicine autocomplete catalog. |
| `public.patient_allergies` | `SELECT` | `.from('patient_allergies').select('allergen, allergen_type, severity').eq('patient_id', patientId)` | `patient_id = selected_patient_id` | Real-time drug-allergy contraindication check before signing. |
| `public.create_prescription_tx` | `RPC (POST)` | `supabase.rpc('create_prescription_tx', { p_doctor_id, p_patient_id, p_appointment_id, p_diagnosis, p_advice, p_medicines })` | `p_doctor_id = auth.uid()`, verified practitioner role | Atomic issuance of digital prescription, itemized line generation, prescription code generation (`RX-...`), and notifications. |
| `public.medication_schedules` | `INSERT` | `.from('medication_schedules').insert(schedules)` | `patient_id = p_id`, `prescription_id = rx_id` | Synchronize patient medication reminder calendar (Morning, Noon, Evening, Night). |
| `public.prescriptions` | `SELECT` | `.from('prescriptions').select('*, patients:patient_id(*), prescription_items(*)').eq('doctor_id', doctorId).order('created_at', { ascending: false })` | `doctor_id = auth.uid()` | Issued prescription history and PDF preview/download. |

---

## 5. Doctor Patients (`/doctor/patients`)
- **Component:** [`frontend/src/pages/doctor/DoctorPatients.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorPatients.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.patient_doctor_access` | `SELECT` | `.from('patient_doctor_access').select('*, patients:patient_id(*)').eq('doctor_id', doctorId).eq('is_active', true)` | `doctor_id = auth.uid()`, `is_active = true` | Active roster of patients with valid consent bridges. |
| `public.medical_records` | `SELECT` | `.from('medical_records').select('*').eq('patient_id', selectedPatientId).order('created_at', { ascending: false })` | RLS bridge: `has_patient_doctor_access(patient_id, auth.uid())` | Longitudinal EHR history for authorized patient. |
| `public.health_reports` | `SELECT` | `.from('health_reports').select('*').eq('patient_id', selectedPatientId).order('created_at', { ascending: false })` | RLS bridge: `has_patient_doctor_access(patient_id, auth.uid())` | Diagnostic lab reports, radiology documents, and AI insights. |
| `public.prescriptions` | `SELECT` | `.from('prescriptions').select('*, prescription_items(*)').eq('patient_id', selectedPatientId).eq('doctor_id', doctorId)` | `patient_id = p_id`, `doctor_id = auth.uid()` | Previous treatment history and pharmacological interventions. |

---

## 6. Doctor Schedule (`/doctor/schedule`)
- **Component:** [`frontend/src/pages/doctor/DoctorSchedule.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorSchedule.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.doctor_availability` | `SELECT` | `.from('doctor_availability').select('*').eq('doctor_id', doctorId).order('day_of_week')` | `doctor_id = auth.uid()` | Retrieve practitioner's weekly recurring availability templates. |
| `public.doctor_availability` | `DELETE` / `INSERT` | `.from('doctor_availability').delete().eq('doctor_id', doctorId)` followed by `.insert(newSlots)` | `doctor_id = auth.uid()` | Batch update weekly working hours, slot durations, and break windows. |
| `public.appointments` | `SELECT` | `.from('appointments').select('*').eq('doctor_id', doctorId).gte('appointment_date', weekStart).lte('appointment_date', weekEnd)` | `doctor_id = auth.uid()`, date interval | View existing bookings superimposed on calendar slots to prevent overbooking. |

---

## 7. Doctor Analytics (`/doctor/analytics`)
- **Component:** [`frontend/src/pages/doctor/DoctorAnalytics.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorAnalytics.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.appointments` | `SELECT` | `.from('appointments').select('id, appointment_date, status, consultation_fee').eq('doctor_id', doctorId)` | `doctor_id = auth.uid()` | Compute total encounters, completion rates, cancellation rates, and appointment trends. |
| `public.prescriptions` | `SELECT` | `.from('prescriptions').select('id, created_at, diagnosis').eq('doctor_id', doctorId)` | `doctor_id = auth.uid()` | Compute total prescriptions issued, frequent diagnostic codes, and medication trends. |
| `public.patient_doctor_access` | `SELECT` | `.from('patient_doctor_access').select('patient_id, created_at').eq('doctor_id', doctorId)` | `doctor_id = auth.uid()` | Longitudinal patient retention and new patient onboarding volume. |

---

## 8. Doctor Profile (`/doctor/profile`)
- **Component:** [`frontend/src/pages/doctor/DoctorProfile.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorProfile.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.doctors` | `SELECT` | `.from('doctors').select('*').eq('id', doctorId).single()` | `id = auth.uid()` | Retrieve practitioner demographics, medical registration number, specialization, qualifications, and consultation fees. |
| `public.doctors` | `UPDATE` | `.from('doctors').update({ full_name, specialization, qualifications, experience_years, consultation_fee, bio, clinic_address, languages_spoken, updated_at: now() }).eq('id', doctorId)` | `id = auth.uid()` | Update professional biography, clinic address, and fee schedule. |
| `storage.objects` (`doctor-documents`) | `UPLOAD` / `SIGNED_URL` | `supabase.storage.from('doctor-documents').upload(path, file)` | Bucket `doctor-documents`, folder `doctorId` | Upload profile photo or clinic credentials. |

---

## 9. Doctor Verification (`/doctor/verification`)
- **Component:** [`frontend/src/pages/doctor/DoctorVerification.jsx`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/pages/doctor/DoctorVerification.jsx)
- **Primary Service:** [`frontend/src/services/doctor.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/doctor.service.js)

| Database Table | Operation | Query / RPC Signature | Filters & Parameters | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `public.doctor_verifications` | `SELECT` | `.from('doctor_verifications').select('*').eq('doctor_id', doctorId).order('submitted_at', { ascending: false }).limit(1)` | `doctor_id = auth.uid()` | Check current verification lifecycle state (`pending`, `verified`, `rejected`, `action_required`). |
| `storage.objects` (`doctor-documents`) | `UPLOAD` | `supabase.storage.from('doctor-documents').upload(`${doctorId}/${docType}_${ts}.pdf`, file)` | Private bucket, strict RLS | Securely ingest medical council registration certificate, degree certificates, and government photo ID. |
| `public.doctor_verifications` | `INSERT` / `UPDATE` | `.from('doctor_verifications').upsert({ doctor_id: doctorId, registration_number, council_name, document_paths, status: 'pending', submitted_at: now() })` | `doctor_id = auth.uid()` | Submit credential verification package for administrative review. |
| `public.audit_logs` | `INSERT` | Automatic via database trigger / service wrapper | Authoritative audit context | Track practitioner onboarding compliance trail. |

---

## Clinical Safety Guardrail System

All doctor views consuming AI-generated predictions (e.g. `symptom_assessments`, `health_reports`, `predictions`) render the mandatory Clinical Assistive Notice:

```
┌──────────────────────────────────────────────────────────────────────────┐
│  AI CLINICAL ASSISTIVE NOTICE                                            │
│  The insights below are generated by AI diagnostic models and are        │
│  strictly intended as assistive clinical suggestions. They do NOT       │
│  constitute a definitive diagnosis. The attending medical practitioner  │
│  retains sole diagnostic authority and clinical responsibility.          │
└──────────────────────────────────────────────────────────────────────────┘
```
