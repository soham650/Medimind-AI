# MEDIMIND AI — REQUIRED PAGE GAP ANALYSIS & IMPLEMENTATION REQUIREMENTS

This document compares the current MediMind AI frontend implementation against the real-world healthcare product requirements for Patients, Doctors, Pharmacists, and Administrators.

---

## 1. Summary Comparison: Current vs. Required Product

| Persona | Current Pages | Missing Required Pages | Incomplete / Mock Pages | Action Required |
|---|---|---|---|---|
| **Patient** | 12 Pages (Home, Dashboard, SymptomChecker, DoctorSearch, DoctorRecommendation, PatientPrescriptions, PharmacyStore, LabDiagnostics, ReportAnalyzer, Chatbot, HealthRecords, PatientTwin, TrialsExplorer, Billing) | 3 Pages (`/patient/orders`, `/patient/appointments`, `/patient/profile`) | `DoctorSearch.jsx` (uses fallback doctors when DB empty), `PharmacyStore.jsx` (no post-order tracking view) | Create 3 pages + wire live DB |
| **Doctor** | 6 Pages (DoctorDashboard, DoctorAppointments, ConsultationRoom, PrescriptionGenerator, AiInsights, DoctorHealthRecords, Analytics) | 2 Pages (`/doctor/availability`, `/doctor/profile`) | `DoctorDashboard.jsx` (census data not hydrated from DB), `PrescriptionGenerator.jsx` (patient hardcoded) | Create 2 pages + wire live DB |
| **Pharmacy** | 3 Pages (PharmacyDashboard, OrderProcessing, InventoryManagement) | 2 Pages (`/pharmacy/inventory/batches`, `/pharmacy/profile`) | `InventoryManagement.jsx` (missing batch & expiry management) | Create 2 pages + wire live DB |
| **Admin** | 4 Pages (AdminDashboard, DoctorApprovals, PharmacyApprovals, AuditLogs) | 2 Pages (`/admin/users`, `/admin/settings`) | `AdminDashboard.jsx` (calls `getAllUsers` instead of dedicated count queries) | Create 2 pages + wire live DB |

---

## 2. Detailed Gap Analysis by Persona

### 2.1 Patient Persona Gaps

#### Gap P-1: Missing "My Orders & Order Tracking" Page (`/patient/orders`)
- **Real Product Problem:** After a patient orders medicines on `/pharmacy`, there is no page to view past orders, track delivery progression (`confirmed` -> `packed` -> `out_for_delivery` -> `delivered`), view attached digital Rx IDs, or inspect order receipts.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/patient/orders` and `/orders`
- **Database Dependency:** `medicine_orders` JOIN `pharmacies` JOIN `order_items` JOIN `medicines`
- **User Actions:** View active and past orders, check delivery timeline, view order items and unit prices, cancel pending order.
- **Decision:** **CREATE `/frontend/src/pages/patient/PatientOrders.jsx`**.

#### Gap P-2: Missing Dedicated "Patient Appointments & History" Page (`/patient/appointments`)
- **Real Product Problem:** Patient appointments are embedded in a card on `DoctorSearch.jsx` and in a brief list on `PatientDashboard.jsx`. Patients cannot view full appointment history, doctor consultation notes, cancel scheduled visits, or launch teleconsultation directly from an appointment list.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/patient/appointments`
- **Database Dependency:** `appointments` JOIN `doctors` JOIN `consultations`
- **User Actions:** View upcoming & past appointments, filter by status (scheduled, completed, cancelled), view symptoms summary, join video consultation room, cancel appointment.
- **Decision:** **CREATE `/frontend/src/pages/patient/PatientAppointments.jsx`**.

#### Gap P-3: Missing "Patient Profile & Clinical Settings" Page (`/patient/profile`)
- **Real Product Problem:** Patients cannot edit their emergency contact, phone number, ABHA address, blood group, chronic conditions, or allergies.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/patient/profile`
- **Database Dependency:** `patients`, `patient_allergies`, `profiles`
- **User Actions:** Update demographics, edit blood group and emergency contact, manage allergies list, view ABHA card QR.
- **Decision:** **CREATE `/frontend/src/pages/patient/PatientProfile.jsx`**.

#### Gap P-4: Incomplete Lab Slip Persistence in `SymptomChecker.jsx`
- **Current State:** `SymptomChecker.jsx` allows attaching a lab report in Mode 2, but does not persist the uploaded document to private Supabase Storage `medical-documents` or `health_reports`.
- **Classification:** **EXISTING + INCOMPLETE**
- **Resolution:** Wire Mode 2 file upload to `reportService.uploadReport()` so extracted findings persist directly to the patient's record.

---

### 2.2 Doctor Persona Gaps

#### Gap D-1: Missing "Doctor Availability & Schedule Management" Page (`/doctor/availability`)
- **Real Product Problem:** Database migration 0005 defines `doctor_availability` (`day_of_week`, `start_time`, `end_time`, `slot_duration_minutes`, `is_active`), but there is NO Doctor Schedule page. Doctors have no UI to set their working hours, active days, consultation duration, or consultation fees.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/doctor/availability`, `/doctor/schedule`
- **Database Dependency:** `doctor_availability`, `doctors`
- **User Actions:** Toggle active days of week (Mon-Sun), set start and end times, configure consultation duration (15m, 30m, 45m), update consultation fee.
- **Decision:** **CREATE `/frontend/src/pages/doctor/DoctorAvailability.jsx`**.

#### Gap D-2: Missing "Doctor Profile & Verification Documents" Page (`/doctor/profile`)
- **Real Product Problem:** Doctors cannot edit their bio, qualifications, clinic address, or upload their medical registration certificate and ID to private Supabase Storage for Admin verification.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/doctor/profile`
- **Database Dependency:** `doctors`, `doctor_verifications`, storage bucket `doctor-documents`
- **User Actions:** Update doctor bio, specialization, hospital affiliation, upload medical registration certificate PDF/image, view admin verification status.
- **Decision:** **CREATE `/frontend/src/pages/doctor/DoctorProfile.jsx`**.

#### Gap D-3: Hardcoded Patient Target in `PrescriptionGenerator.jsx`
- **Current State:** Line 48 of `PrescriptionGenerator.jsx` hardcodes `patientId: profile.id // Fallback demo target` because there is no patient or appointment selector.
- **Classification:** **EXISTING + INCOMPLETE**
- **Resolution:** Add patient selector / appointment query param so doctor can select an authorized patient or load patient from active appointment.

#### Gap D-4: Unhydrated Inpatient Census in `DoctorDashboard.jsx`
- **Current State:** Inpatient census and rounding schedule use static mock arrays instead of querying `appointments` and `patient_doctor_access`.
- **Classification:** **EXISTING + INCOMPLETE**
- **Resolution:** Add `useEffect` querying `doctorService.getMissionControlData(profile.id)` with graceful fallback to ensure live DB synchronization.

---

### 2.3 Pharmacy / Medical Store Persona Gaps

#### Gap PH-1: Missing "Batch & Expiry Management" Page (`/pharmacy/inventory/batches`)
- **Real Product Problem:** In healthcare retail, pharmaceutical inventory requires tracking batch numbers, manufacturing dates, expiry dates, and lot numbers to prevent dispensing expired drugs. Migration 0005 defines `batch_number`, `expiry_date`, and `reorder_level` on `pharmacy_inventory`, but the UI has no batch tracking interface.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/pharmacy/inventory/batches`
- **Database Dependency:** `pharmacy_inventory`, `medicines`
- **User Actions:** View near-expiry lots (< 90 days), record new batch arrivals, adjust batch stock counts, mark batches quarantined.
- **Decision:** **CREATE `/frontend/src/pages/pharmacy/BatchManagement.jsx`**.

#### Gap PH-2: Missing "Pharmacy Profile & Licensing" Page (`/pharmacy/profile`)
- **Real Product Problem:** Medical stores cannot view or update their drug license number, GSTIN, pharmacy premises address, operating hours, or upload verification documents for Admin review.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/pharmacy/profile`
- **Database Dependency:** `pharmacies`, `pharmacy_verifications`, storage bucket `pharmacy-documents`
- **User Actions:** Update store name, contact person, phone, address, upload drug license certificate, check approval status.
- **Decision:** **CREATE `/frontend/src/pages/pharmacy/PharmacyProfile.jsx`**.

---

### 2.4 Admin & Super Admin Persona Gaps

#### Gap A-1: Missing "User & Role Governance" Page (`/admin/users`)
- **Real Product Problem:** Admin Dashboard shows count of users, but there is no page to browse all registered patients, doctors, and pharmacists, inspect their account status, or ban/unban abusive accounts. To respect healthcare privacy, this page must strictly show user account metadata without exposing private clinical notes or medical records (PHI).
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/admin/users`
- **Database Dependency:** `profiles`, `user_roles`
- **User Actions:** Filter by role (Patient, Doctor, Pharmacy, Admin), search by name/email, toggle account status, view registration date.
- **Decision:** **CREATE `/frontend/src/pages/admin/UserManagement.jsx`**.

#### Gap A-2: Missing "Platform Settings & System Health" Page (`/admin/settings`)
- **Real Product Problem:** Administrators have no interface to verify that ML Service (Phase 1 & 2) is healthy, inspect rate limit events (`rate_limit_events`), review daily AI usage (`ai_usage_daily`), or configure global platform parameters.
- **Classification:** **MISSING + REQUIRED**
- **Required Route:** `/admin/settings`
- **Database Dependency:** `rate_limit_events`, `ai_usage_daily`, FastAPI `/health` endpoint
- **User Actions:** Test ML Service ping, view blocked IP events, review daily token usage, toggle platform maintenance mode.
- **Decision:** **CREATE `/frontend/src/pages/admin/SystemSettings.jsx`**.

---

## 3. Inventory of Pages to Implement

| Page Title | Target File Path | Route | Persona | Real-World Justification |
|---|---|---|---|---|
| **Patient Orders & Tracking** | `frontend/src/pages/patient/PatientOrders.jsx` | `/patient/orders`, `/orders` | Patient | Enables patient to track medicine orders, delivery states, and view pharmacy receipts. |
| **Patient Appointment List** | `frontend/src/pages/patient/PatientAppointments.jsx` | `/patient/appointments` | Patient | Dedicated management of clinical consultations, cancellations, and teleconsultation entry. |
| **Patient Profile & Settings** | `frontend/src/pages/patient/PatientProfile.jsx` | `/patient/profile` | Patient | Patient demographic data, emergency contacts, blood group, and allergy registry. |
| **Doctor Availability Schedule** | `frontend/src/pages/doctor/DoctorAvailability.jsx` | `/doctor/availability` | Doctor | Weekly schedule manager, consultation slot times, and fee configuration. |
| **Doctor Clinical Profile** | `frontend/src/pages/doctor/DoctorProfile.jsx` | `/doctor/profile` | Doctor | Professional profile, credentials, and medical license document submission for verification. |
| **Pharmacy Batch & Expiry** | `frontend/src/pages/pharmacy/BatchManagement.jsx` | `/pharmacy/inventory/batches` | Pharmacy | Lot number tracking, expiry date monitoring, and stock adjustment for drug safety. |
| **Pharmacy Store Profile** | `frontend/src/pages/pharmacy/PharmacyProfile.jsx` | `/pharmacy/profile` | Pharmacy | Drug license verification, GSTIN, store address, and dispensary profile management. |
| **Admin User Management** | `frontend/src/pages/admin/UserManagement.jsx` | `/admin/users` | Admin | Multi-role user governance without exposing protected health information (PHI). |
| **Admin Platform Settings** | `frontend/src/pages/admin/SystemSettings.jsx` | `/admin/settings` | Admin | ML microservice uptime monitor, rate-limiting event audit, and platform settings. |

---

## 4. UI State Standards for All New & Existing Pages

Every newly implemented and modified page will strictly conform to the following states:
1. **Loading State:** Clean inline spinner or skeleton placeholder. No artificial `setTimeout`.
2. **Empty State:** Distinct iconography, clear explanation, and a helpful action button (e.g. "No orders placed yet. Browse pharmacy store").
3. **Error State:** Human-readable error banner with retry action.
4. **Success State:** Instant toast confirmation or green status badge.
5. **Unauthorized State:** Guarded by `ApprovalGateGuard` and RBAC, with redirect to `/unauthorized` or `/pending-approval`.
6. **Form Validation:** Client-side validation before submission, highlighted error borders, and disabled submit buttons while saving.
