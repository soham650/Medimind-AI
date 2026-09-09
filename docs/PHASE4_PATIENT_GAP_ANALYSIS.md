# MEDIMIND AI — PHASE 4 PATIENT EXPERIENCE GAP ANALYSIS

**Date:** September 9, 2026  
**Phase:** Phase 4 — Complete Patient Experience  
**Database Baseline:** Live Supabase PostgreSQL Verified through Migration 0009  
**Status:** Frozen Database Schema (Zero New Migrations)

---

## 1. Existing Patient Pages

| Page Component | Route(s) | Current Purpose & Implementation Status |
|---|---|---|
| `frontend/src/pages/patient/PatientDashboard.jsx` | `/dashboard` | Patient home screen showing care summary, upcoming visits, active prescriptions, and baseline vitals. Incomplete Supabase hydration and legacy service imports. |
| `frontend/src/pages/SymptomChecker.jsx` | `/predict`, `/symptom-checker` | Dual-engine intake (NLP + Random Forest Classifier `symptom-rf-v1` + Lab slip analyzer). Initial view was pre-populated with static symptoms and predictions. |
| `frontend/src/pages/patient/DoctorSearch.jsx` | `/doctors`, `/teleconsultations` | Specialist discovery and appointment scheduling. Contained hardcoded fallback doctor array with fake UUIDs, and static demo consultations. |
| `frontend/src/pages/DoctorRecommendation.jsx` | `/consult` | Specialist matching. Attempted to fetch unconfigured Edge Function `/functions/v1/doctor-recommendation` and raw inserted into `appointments`. |
| `frontend/src/pages/patient/PatientAppointments.jsx` | `/patient/appointments` | Dedicated appointment management and cancellation. Status filter omitted `'scheduled'`, hiding newly booked visits. |
| `frontend/src/pages/patient/PatientPrescriptions.jsx` | `/prescriptions`, `/patient/prescriptions` | Tamper-evident digital Rx viewer and daily dose tracker. Hardcoded UI cards without querying real `prescriptions` and `prescription_items`. |
| `frontend/src/pages/patient/PharmacyStore.jsx` | `/pharmacy`, `/patient/pharmacy` | Medicine catalog search, pharmacy selection, prescription attachment, and checkout. Used legacy service inserting directly into `orders` with frontend price calculation. |
| `frontend/src/pages/patient/PatientOrders.jsx` | `/patient/orders`, `/orders` | Order tracking and fulfillment progression. Cancellation attempted to call a doctor/pharmacy-only dispatch RPC. |
| `frontend/src/pages/HealthRecords.jsx` | `/records` | ABDM 3.0 records locker, family dependents, and consent processing. Lacked unified chronological patient medical timeline. |
| `frontend/src/pages/ReportAnalyzer.jsx` | `/reports` | Multimodal medical document analysis via Gemini. Pre-populated with static "John Doe" dummy report rather than loading user's historical reports from `health_reports`. |
| `frontend/src/pages/patient/PatientProfile.jsx` | `/patient/profile` | Patient demographic and clinical baseline editor (BP, blood sugar, BMI, allergies). Requires real Supabase session derivation. |
| `frontend/src/pages/patient/PatientSettings.jsx` | `/patient/settings` | Missing dedicated settings page for language, timezone, notification preferences, and privacy controls. |
| `frontend/src/pages/PatientTwin.jsx` | `/twin` | Physiological avatar and multi-organ trajectory simulator. |
| `frontend/src/pages/TrialsExplorer.jsx` | `/trials` | Clinical trials matcher. |
| `frontend/src/pages/Billing.jsx` | `/billing` | Patient invoice ledger. |
| `frontend/src/pages/Chatbot.jsx` | `/chat` | Conversational triage assistant with clinical guardrails. |

---

## 2. Existing Patient Services

1. **`auth.service.js`:** Supabase Auth wrapper for sign-in, signup, role resolution (`user_roles`), and profile hydration (`patients` / `profiles`).
2. **`patient.service.js`:** Profile fetch/update, clinical baseline vitals, dashboard aggregates, and allergy management (`patient_allergies`).
3. **`appointment.service.js`:** Stored procedure booking (`create_appointment_tx`), patient/doctor appointment list queries, and cancellation.
4. **`doctor.service.js`:** Approved doctor discovery, doctor details, schedule management, and `recommend_doctors_for_disease` RPC. Contained fallback doctor objects.
5. **`prescription.service.js`:** Stored procedure prescription creation (`create_prescription_tx`), patient prescriptions query joining `prescription_items` and `doctors`, and dose schedule.
6. **`pharmacy.service.js`:** Catalog query (`medicines`), approved dispensaries (`pharmacies`), and per-pharmacy inventory (`pharmacy_inventory`).
7. **`order.service.js`:** Stored procedure order placement (`create_medicine_order_tx`) and order query (`medicine_orders`).
8. **`medical_records.service.js`:** Clinical records query (`medical_records`) and allergy management.
9. **`report.service.js`:** Storage upload to private bucket `medical-documents`, signed URL generation, and metadata insertion in `health_reports`.
10. **`notification.service.js`:** Real-time Supabase websocket subscription, unread count, and mark-as-read mutations on `notifications`.
11. **`ai.service.js`:** Phase 1 ML symptom prediction and persistence to `symptom_assessments`.

---

## 3. Existing Supabase Queries

- `SELECT * FROM public.patients WHERE id = auth.uid()`
- `UPDATE public.patients SET ... WHERE id = auth.uid()`
- `SELECT * FROM public.doctors WHERE verification_status = 'approved' AND is_available = true`
- `SELECT * FROM public.appointments WHERE patient_id = auth.uid() ORDER BY appointment_date ASC`
- `SELECT * FROM public.prescriptions JOIN prescription_items ... WHERE patient_id = auth.uid()`
- `SELECT * FROM public.medicines ORDER BY brand_name ASC`
- `SELECT * FROM public.pharmacy_inventory WHERE pharmacy_id = :id AND stock_quantity > 0`
- `SELECT * FROM public.medicine_orders WHERE patient_id = auth.uid() ORDER BY created_at DESC`
- `SELECT * FROM public.notifications WHERE user_id = auth.uid() ORDER BY created_at DESC`
- `SELECT * FROM public.health_reports WHERE patient_id = auth.uid() ORDER BY created_at DESC`
- `SELECT * FROM public.patient_allergies WHERE patient_id = auth.uid()`
- `SELECT * FROM public.symptom_assessments WHERE patient_id = auth.uid() ORDER BY created_at DESC`

---

## 4. Existing API Integrations

1. **Phase 1 ML Service (`ml-service` FastAPI):**
   - `POST /predict_disease`: Random Forest classifier (`symptom-rf-v1`) returning top predictions, probabilities, ICD-10 codes, and risk level.
   - `POST /predict_risk`: Demographic + vitals risk scoring.
   - `GET /symptoms`: Master symptom vocabulary.
2. **Phase 2 Report Intelligence:**
   - `POST /analyze_report_and_assess`: Multimodal Gemini 3.5 Flash Lite report analysis extracting clinical parameters, reference ranges, mapped symptoms, and triage acuity.
3. **Supabase Storage API:**
   - Private bucket `medical-documents`: Patient uploaded lab slips and diagnostic reports. Signed URLs with 300s TTL.
   - Public bucket `profile-images`: Patient avatars.

---

## 5. Existing Hardcoded / Mock Data Found

| Location | Hardcoded Element | Classification | Remedy |
|---|---|---|---|
| `frontend/src/context/AuthContext.jsx` | `TEST_PATIENT_USER` (`00000000-0000-0000-0000-000000000001`) | Development testing fallback | Replace with real Supabase Auth session derivation and verified demo login adapter. |
| `frontend/src/pages/patient/DoctorSearch.jsx` | `FALLBACK_APPROVED_DOCTORS` (8 static doctor objects with fake UUIDs) | Unnecessary fake data | Remove completely. Render real approved doctors from `doctors` table. |
| `frontend/src/pages/patient/DoctorSearch.jsx` | `myConsultations` initial state (`tele-001`, `tele-002`) | Fake UI data | Query real patient appointments with `consultation_type = 'video'`. |
| `frontend/src/services/doctor.service.js` | `getRecommendedDoctors` fallback array (`doc-001`, `doc-002`) | Unnecessary fake fallback | Remove fake fallback. Use `recommend_doctors_for_disease` RPC. |
| `frontend/src/pages/patient/PatientPrescriptions.jsx` | Entire active prescription list (Atorvastatin, Metoprolol, CoQ10, `#RX-2025-09192`) | Hardcoded HTML | Query real `prescriptions` and `prescription_items` from `prescriptionService`. |
| `frontend/src/pages/ReportAnalyzer.jsx` | `reportData` initial state ("John Doe", "CBC_BloodWork_2026.pdf") | Hardcoded sample | Replace with real historical reports from `health_reports` and private signed URLs. |
| `frontend/src/services/pharmacyService.js` | `getMedicines` fallback catalog (`m1` - `m6`) | Obsolete mock service | Standardize on `pharmacy.service.js` with live `medicines` table. |

---

## 6. Missing Patient Workflows

1. **Patient Settings (`/patient/settings`):** Patient cannot view or update language (`preferred_language`), timezone (`timezone`), or notification preferences without a dedicated settings screen.
2. **Real-Time Notification Popover:** Header Bell icon in `App.jsx` was an inert SVG button with no interactive list of unread clinical alerts, appointment reminders, or prescription updates.
3. **Doctor Match Bridge:** Navigating from AI preliminary assessment in `SymptomChecker` to `DoctorSearch` did not pre-select the recommended clinical specialty or forward reported symptoms into the appointment booking modal.
4. **Prescription-to-Pharmacy Bridge:** Patient viewing an issued prescription on `PatientPrescriptions.jsx` could not click "Order Prescribed Medicines" to populate the pharmacy cart with the exact prescribed items.

---

## 7. Broken Patient Workflows

1. **`create_medicine_order_tx` RPC Parameter Mismatch in `order.service.js`:**
   - `order.service.js` passed: `p_pharmacy_id`, `p_prescription_id`, `p_items` with `{ id, quantity }`, `p_payment_method`, `p_delivery_address`.
   - Migration 0009 actual signature requires: `p_patient_id`, `p_pharmacy_id`, `p_items: [{ medicine_id, quantity }]`, `p_delivery_address`, `p_notes`.
   - **Effect:** Medicine orders placed from the frontend failed at the PostgreSQL stored procedure boundary.
2. **Hidden Scheduled Appointments in `PatientAppointments.jsx`:**
   - Filter `isUpcoming` checked only `['requested', 'confirmed', 'in_progress']`.
   - `create_appointment_tx` sets initial status to `'scheduled'`.
   - **Effect:** Newly booked appointments vanished from the "Upcoming" tab.
3. **Broken Order Cancellation in `PatientOrders.jsx`:**
   - Attempted to call `pharmacy_fulfill_prescription_tx(orderId, '00000000-0000...', 'cancel')`.
   - `pharmacy_fulfill_prescription_tx` is a privileged dispensary-only RPC that rejected the request.
   - **Effect:** Order cancellation threw an error instead of executing the permitted `medicine_orders` status update.
4. **Broken Doctor Recommendation in `DoctorRecommendation.jsx`:**
   - Called nonexistent Supabase Edge Function `/functions/v1/doctor-recommendation` and attempted raw SQL insert with nonexistent column `clinic_id`.
   - **Effect:** Page failed on load and failed on booking.

---

## 8. Missing Database Queries

- **Language and Timezone update on `patients` and `profiles`:** Missing query in `patientService` to persist localization preferences.
- **Combined Patient Medical Timeline:** Missing joined query aggregating `medical_records`, `symptom_assessments`, `health_reports`, `prescriptions`, and `consultations`.
- **Active Appointment Query:** Querying active slots for real-time conflict avoidance before modal submission.

---

## 9. Missing RLS-Safe Access Patterns

- Every client query must rely on `auth.uid()` rather than passing arbitrary patient UUIDs.
- `order.service.js` must pass `auth.uid()` as `p_patient_id` to satisfy `IF auth.uid() <> p_patient_id AND NOT public.is_admin() THEN RAISE EXCEPTION 'Unauthorized...'`.
- In `PatientProfile.jsx` and `PatientAppointments.jsx`, queries must strictly bind to the authenticated session user to ensure Patient A cannot inspect Patient B's records.

---

## 10. Missing Loading / Empty / Error / Offline States

- `PatientPrescriptions.jsx`: Completely lacked an empty state when no prescriptions exist.
- `DoctorSearch.jsx`: Displayed hardcoded fake doctors when database query returned 0 rows instead of displaying a clean "No approved doctors matching this specialty" empty state with a reset filter button.
- `PatientOrders.jsx`: Lacked offline retry banner when network fails.
- `PatientDashboard.jsx`: Lacked section-level loading skeletons for appointments, prescriptions, and orders.

---

## 11. Missing Navigation & Route Gaps

- In `App.jsx`, when `role === 'patient'`, the sidebar was hardcoded with only 5 links (`/twin`, `/predict`, `/teleconsultations`, `/prescriptions`, `/records`), hiding `/dashboard`, `/patient/appointments`, `/pharmacy`, `/patient/orders`, `/patient/profile`, `/patient/settings`, `/reports`, and `/labs`.
- Route `/patient/settings` was unmapped in `App.jsx`.
- Route `/patient/notifications` was unmapped in `App.jsx`.

---

## 12. Missing Persistence

- Lab slip findings extracted in `SymptomChecker.jsx` Mode 2 were stored in component state but not uploaded to private bucket `medical-documents` or saved to `health_reports`.
- Daily dose toggle in `PatientPrescriptions.jsx` was logged to console rather than saved to `medication_schedules`.

---

## 13. Required Fixes Summary

1. **`AuthContext.jsx`:** Remove fake fallback UUID `00000000-0000-0000-0000-000000000001`. Derive session from real Supabase Auth. Provide a 1-click evaluation login using a real Supabase account.
2. **`order.service.js`:** Realign `create_medicine_order_tx` parameters with migration 0009. Add safe client order cancellation.
3. **`PatientAppointments.jsx`:** Add `'scheduled'` to `isUpcoming` filter. Wire cancellation modal to `appointmentService.updateStatus`.
4. **`DoctorSearch.jsx`:** Delete `FALLBACK_APPROVED_DOCTORS`. Query real `doctors`. Wire booking to `create_appointment_tx`. Accept navigation parameters from `SymptomChecker`.
5. **`DoctorRecommendation.jsx`:** Wire to `recommend_doctors_for_disease` RPC and `create_appointment_tx`.
6. **`PatientPrescriptions.jsx`:** Replace hardcoded cards with live query from `prescriptionService.getPatientPrescriptions(user.id)`. Add "Order Medicines" bridge.
7. **`PharmacyStore.jsx`:** Wire checkout to `orderService.createOrder` (`create_medicine_order_tx`).
8. **`PatientOrders.jsx`:** Fix cancellation flow and link to prescription references.
9. **`PatientSettings.jsx`:** Create new settings page for language, timezone, notification preferences, and privacy.
10. **`PatientDashboard.jsx`:** Replace legacy services with `patientService.getDashboardSummary(user.id)` and add real empty/loading states.
11. **`App.jsx`:** Populate full patient sidebar navigation and add interactive notifications popover.
12. **`HealthRecords.jsx`:** Add unified chronological clinical timeline tab.

---

## 14. Recommended Implementation Order

1. Fix service layer RPC parameter alignments (`order.service.js`, `doctor.service.js`, `patient.service.js`).
2. Fix authentication and session handling in `AuthContext.jsx`.
3. Complete Patient Dashboard (`PatientDashboard.jsx`).
4. Complete Patient Profile (`PatientProfile.jsx`) and Settings (`PatientSettings.jsx`).
5. Complete Doctor Discovery (`DoctorSearch.jsx`) and Recommendation (`DoctorRecommendation.jsx`).
6. Complete Patient Appointments (`PatientAppointments.jsx`).
7. Complete Symptom Checker persistence and doctor link (`SymptomChecker.jsx`).
8. Complete Report Analyzer history and storage (`ReportAnalyzer.jsx`).
9. Complete Patient Health Records timeline (`HealthRecords.jsx`).
10. Complete Patient Prescriptions (`PatientPrescriptions.jsx`).
11. Complete Pharmacy Store (`PharmacyStore.jsx`) and Orders (`PatientOrders.jsx`).
12. Complete Patient Notifications and header popover.
13. Update routing and sidebar navigation in `App.jsx`.
14. Security and RLS verification.
15. Integration testing with `scripts/verify_phase4_patient_experience.js`.
16. Production build (`npm run build`).
17. Produce `docs/PHASE4_IMPLEMENTATION_REPORT.md`.
