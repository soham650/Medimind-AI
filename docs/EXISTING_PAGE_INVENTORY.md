# MEDIMIND AI — EXISTING PAGE INVENTORY

This document provides an exhaustive, code-level inventory of every existing page in the MediMind AI repository as of Version 2.4.0.

---

## 1. Public & Authentication Pages

### 1.1 Home / Landing Page
- **Page File:** `frontend/src/pages/Home.jsx`
- **Route:** `/` (Note: Currently redirected in `App.jsx` to default persona home `/predict` in testing mode)
- **Role:** Public / Unauthenticated
- **Purpose:** Public marketing showcase, value propositions, key statistics (99.8% triage accuracy, HIPAA compliant, ABDM integrated).
- **Components:** Header with branding & navigation buttons, Hero section, feature pills, primary call-to-action buttons (`Create Patient Account`, `Clinician Portal`), statistics strip, visual preview frame, footer.
- **Forms:** None.
- **Displayed Data:** Static marketing text, feature tags, accuracy metrics, footer copyright.
- **Actions:** Navigate to `/login`, `/register-patient`, `/register`.
- **API Calls:** None.
- **Current DB Dependency:** None.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** Direct link to "About", "How it Works", "FAQ", and Contact form.

### 1.2 Auth Login
- **Page File:** `frontend/src/pages/auth/Login.jsx` (and root `pages/Login.jsx`)
- **Route:** `/login` (Temporarily redirected to `/predict` in `App.jsx` for zero-barrier evaluation)
- **Role:** Public / All Roles
- **Purpose:** Secure authentication gate using Supabase Auth.
- **Components:** Split-screen authentication card, email/password form, role-switch tabs, demo account quick-fill buttons.
- **Forms:** Email, Password, Remember Me checkbox.
- **Displayed Data:** Form inputs, error banners, demo credentials for Patient, Doctor, Pharmacy, Admin.
- **Actions:** Submit login (`login(email, password)`), quick demo fill, navigate to registration.
- **API Calls:** `supabase.auth.signInWithPassword()`, `authService.login()`.
- **Current DB Dependency:** `auth.users`, `public.user_roles`, `public.profiles`.
- **Missing Backend Dependency:** MFA / OTP authentication.
- **Missing UI Functionality:** "Forgot Password" self-service reset flow with email recovery magic link.

### 1.3 Auth Register (Clinician / General)
- **Page File:** `frontend/src/pages/auth/Register.jsx` (and root `pages/Register.jsx`, `pages/RegisterPatient.jsx`)
- **Route:** `/register`, `/register-patient`
- **Role:** Public / Prospective Users
- **Purpose:** User registration and onboarding into role-specific data tables.
- **Components:** Step-by-step registration wizard, role selection (Patient, Doctor, Pharmacy), professional credential fields.
- **Forms:** Full Name, Email, Password, Role, License Number (Doctor), Pharmacy Name / Drug License (Pharmacy), Phone, ABHA ID (Patient).
- **Displayed Data:** Dynamic input fields based on selected role, password strength indicator.
- **Actions:** Submit registration (`authService.signup()`), navigate to login.
- **API Calls:** `supabase.auth.signUp()`, trigger `handle_user_signup()`.
- **Current DB Dependency:** `auth.users`, `public.user_roles`, `public.patients`, `public.doctors`, `public.pharmacies`.
- **Missing Backend Dependency:** Document upload during signup to `doctor-documents` and `pharmacy-documents`.
- **Missing UI Functionality:** File uploader for medical license / certificate attachment directly during registration.

### 1.4 Pending Approval Screen
- **Page File:** `frontend/src/pages/auth/PendingApproval.jsx`
- **Route:** `/pending-approval`
- **Role:** Doctor, Pharmacy (Unapproved status: `pending` or `rejected`)
- **Purpose:** Gatekeeper waiting room preventing unverified medical practitioners and dispensaries from practicing.
- **Components:** Status banner, license details card, review timeframe notice, logout button, contact compliance support link.
- **Forms:** None.
- **Displayed Data:** User name, registered license number, application submission date, review status badge.
- **Actions:** Refresh status check, logout.
- **API Calls:** `supabase.from('profiles').select('approval_status')` or `doctors`/`pharmacies`.
- **Current DB Dependency:** `public.doctors`, `public.pharmacies`.
- **Missing Backend Dependency:** Resubmission RPC when rejected with compliance feedback.
- **Missing UI Functionality:** Document re-upload form if rejected.

### 1.5 Unauthorized Screen
- **Page File:** `frontend/src/pages/auth/Unauthorized.jsx`
- **Route:** `/unauthorized`
- **Role:** All
- **Purpose:** 403 Forbidden alert screen when a role tries to access forbidden endpoints (e.g. Patient accessing `/admin`).
- **Components:** Warning graphic, error code, return to home button.
- **Forms:** None.
- **Displayed Data:** Error explanation.
- **Actions:** Navigate back to authorized dashboard.
- **API Calls:** None.
- **Current DB Dependency:** None.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** None.

---

## 2. Patient Persona Pages

### 2.1 Patient Dashboard
- **Page File:** `frontend/src/pages/patient/PatientDashboard.jsx` (and `pages/Dashboard.jsx`)
- **Route:** `/dashboard`
- **Role:** Patient
- **Purpose:** Central health hub displaying care summaries, appointments, prescriptions, and quick navigation.
- **Components:** Welcome gradient header, 4 core pillar quick-action cards, Upcoming Appointments list, Vitals & Biomarkers widget.
- **Forms:** None.
- **Displayed Data:** Patient full name, upcoming appointment doctor, date, time slot, active prescriptions count, blood pressure, blood sugar.
- **Actions:** Navigate to `/predict`, `/doctors`, `/prescriptions`, `/pharmacy`.
- **API Calls:** `appointmentService.getPatientAppointments()`, `prescriptionService.getPatientPrescriptions()`.
- **Current DB Dependency:** `appointments`, `prescriptions`, `profiles`/`patients`.
- **Missing Backend Dependency:** Real-time stream of upcoming appointments and order statuses.
- **Missing UI Functionality:** Recent medicine orders summary widget, link to order tracking.

### 2.2 Dual-Engine AI Symptom Checker & Triage
- **Page File:** `frontend/src/pages/SymptomChecker.jsx`
- **Route:** `/predict`, `/symptom-checker`
- **Role:** Patient
- **Purpose:** Dual-mode AI diagnostic intake: Mode 1 (interactive symptom tags + NLP narrative + voice dictation) and Mode 2 (uploaded laboratory slip extraction). Provides preliminary assessment and independent triage risk scoring.
- **Components:**
  - Mode switcher (`Method 1: Interactive Triage` vs `Method 2: Lab Slip AI Reader`).
  - Search symptom input with autocomplete badges.
  - Pain scale selector (Mild, Moderate, Severe) & onset timeframe.
  - Speech recognition mic button for audio narrative transcription.
  - Lab slip upload card with PDF preview modal.
  - Dual AI Prediction Results panel: Primary condition, ICD-10 code, probability percentage, clinical explanation, Emergency Red-Flag banner, triage acuity level.
  - Emergency 108 SOS dispatch trigger button.
- **Forms:** Custom symptom adder, pain level radio, onset timeframe, narrative textarea, lab slip file input.
- **Displayed Data:** Dynamic symptom tags, probability differential, clinical explanation, triage recommendation.
- **Actions:** Add/remove tags, voice transcribe, run analysis (`handleAnalyzeSymptoms`), upload lab slip, book recommended specialist.
- **API Calls:** `mlApi.predictDisease()`, `mlApi.analyzeReport()`.
- **Current DB Dependency:** Persists to `symptom_assessments` table via `aiService.assessSymptoms()`.
- **Missing Backend Dependency:** Automatic persistence of lab slip findings directly to `health_reports`.
- **Missing UI Functionality:** Button to export assessment PDF or save to patient's ABDM health records.

### 2.3 Medical Report Analyzer (Phase 2)
- **Page File:** `frontend/src/pages/ReportAnalyzer.jsx`
- **Route:** `/reports`
- **Role:** Patient & Doctor
- **Purpose:** Multimodal medical document understanding (Gemini 3.5 Flash Lite) with automated parameter extraction, range normalization, and longitudinal trends.
- **Components:** Drag & drop file uploader, report metadata banner, clinical summary callout, extracted biomarker table (Normal, Low, High), longitudinal trend Recharts line graph.
- **Forms:** File dropzone (PDF/JPG/PNG).
- **Displayed Data:** Extracted laboratory tests (e.g. Hemoglobin, Platelets, WBC, Glucose), reference ranges, status badges, historical trends.
- **Actions:** Drag/drop report, trigger Gemini analysis, upload file to private Supabase storage `medical-documents`.
- **API Calls:** `mlApi.analyzeReport()`, `reportService.uploadReport()`.
- **Current DB Dependency:** `public.health_reports`, private bucket `medical-documents`.
- **Missing Backend Dependency:** Automated trigger to create an AI preliminary assessment (`/analyze_report_and_assess`).
- **Missing UI Functionality:** Direct button to share analyzed report with an approved doctor.

### 2.4 Doctor Search & Teleconsultations
- **Page File:** `frontend/src/pages/patient/DoctorSearch.jsx`
- **Route:** `/doctors`, `/teleconsultations`
- **Role:** Patient
- **Purpose:** Discover verified doctors by medical specialty, view credentials and consultation fees, schedule appointments, and join live teleconsultation rooms.
- **Components:** Specialty pill filters, doctor profile cards (rating, experience, fee, hospital affiliation), appointment booking modal (date picker, slot picker, symptom summary), simulated live WebRTC video room modal.
- **Forms:** Specialty filter select, text search, appointment booking form (date, time slot, consultation type, patient notes).
- **Displayed Data:** Approved doctor profiles, clinic affiliation, consultation fee, available slots, active appointment video call.
- **Actions:** Filter/search doctors, select slot, book appointment (`appointmentService.createAppointment`), launch video call, end call.
- **API Calls:** `appointmentService.getApprovedDoctors()`, `appointmentService.bookAppointment()` / `create_appointment_tx`.
- **Current DB Dependency:** `doctors`, `doctor_availability`, `appointments`, `patient_doctor_access`.
- **Missing Backend Dependency:** Real-time doctor slot availability querying from `doctor_availability` table rather than hardcoded slots.
- **Missing UI Functionality:** Reschedule and cancel appointment buttons directly in the list.

### 2.5 Prescriptions & Daily Dose Tracker
- **Page File:** `frontend/src/pages/patient/PatientPrescriptions.jsx`
- **Route:** `/prescriptions`
- **Role:** Patient
- **Purpose:** View tamper-evident digital prescriptions issued by verified doctors with unique authenticated Rx IDs, plus daily dosage reminder schedule.
- **Components:** Tab navigation (`Active Prescriptions`, `Daily Dose Schedule`, `Past Refill History`), Rx card with doctor digital signature badge, prescribed medications table (dosage, frequency, duration, instructions), daily timeline dosage tracker (Morning, Afternoon, Night) with checkbox logging.
- **Forms:** Daily dose toggle checkboxes, refill quantity selector.
- **Displayed Data:** Rx ID, doctor name, clinic affiliation, diagnosis, medicines array, advice, dose schedule times and taken status.
- **Actions:** Log dose taken (`handleToggleNightDose`), download prescription PDF, re-order medicines via pharmacy store link.
- **API Calls:** `prescriptionService.getPatientPrescriptions()`, `prescriptionService.getDailyDoseSchedule()`, `prescriptionService.logDoseStatus()`.
- **Current DB Dependency:** `prescriptions`, `prescription_items`, `medication_schedules`.
- **Missing Backend Dependency:** Integration to push prescription directly into Pharmacy cart.
- **Missing UI Functionality:** One-click "Send Rx to Pharmacy" button.

### 2.6 Pharmacy Store & Medicine Ordering
- **Page File:** `frontend/src/pages/patient/PharmacyStore.jsx`
- **Route:** `/pharmacy`
- **Role:** Patient
- **Purpose:** Browse pharmaceuticals catalog, select approved dispensing pharmacy, attach digital prescription for Rx-mandated items, manage cart, and complete order checkout.
- **Components:** Medicine catalog search and category filters, medicine cards with OTC vs Rx-Mandated badges, pharmacy selection dropdown, prescription selector, shopping cart slide-out, checkout modal with address input and payment method.
- **Forms:** Medicine search, quantity increment/decrement, pharmacy select, Rx selector, delivery address input, payment method radio.
- **Displayed Data:** Medicine brand & generic names, strength, unit price, prescription requirement, cart subtotal, order confirmation receipt.
- **Actions:** Add to cart, adjust quantities, select pharmacy, checkout (`orderService.createOrder` / `create_medicine_order_tx`).
- **API Calls:** `pharmacyService.getMedicines()`, `pharmacyService.getApprovedPharmacies()`, `prescriptionService.getPatientPrescriptions()`, `orderService.createOrder()`.
- **Current DB Dependency:** `medicines`, `pharmacies`, `pharmacy_inventory`, `medicine_orders`, `order_items`.
- **Missing Backend Dependency:** Real-time per-pharmacy stock quantity checking in the UI catalog view.
- **Missing UI Functionality:** Order tracking link after order placement; dedicated "My Orders" page.

### 2.7 Lab Diagnostics & Cold-Chain Tracking
- **Page File:** `frontend/src/pages/patient/LabDiagnostics.jsx`
- **Route:** `/labs`
- **Role:** Patient
- **Purpose:** Browse NABL-certified diagnostic health packages and individual tests, book at-home phlebotomy sample collection, and track phlebotomist cold-chain temperature and live status.
- **Components:** Category filter pills (Full Body, Cardiac, Diabetes, Vitamins), diagnostic package cards, at-home booking modal (time slot, address, fasting check), live cold-chain tracking card with 5-step timeline, phlebotomist phone & badge, and 4-digit pickup OTP.
- **Forms:** Package selection, slot picker, address input, OTP verification.
- **Displayed Data:** Package title, parameters count, turnaround time, MRP and discounted prices, phlebotomist name, cold-chain temperature range (4°C - 8°C), tracking progress step.
- **Actions:** Book lab test (`labService.bookTest` / `book_lab_test_tx`), cancel booking.
- **API Calls:** `labService.getPackages()`, `labService.getIndividualTests()`, `labService.bookTest()`.
- **Current DB Dependency:** `lab_packages`, `lab_tests`, `lab_bookings`.
- **Missing Backend Dependency:** Integration with lab results PDF upload back into `health_reports`.
- **Missing UI Functionality:** View past lab booking history tab.

### 2.8 ABDM Records Vault & Family Locker
- **Page File:** `frontend/src/pages/HealthRecords.jsx`
- **Route:** `/records`
- **Role:** Patient
- **Purpose:** Ayushman Bharat Digital Mission (ABDM 3.0) compliant longitudinal health locker, family dependent management, and consent artifact approval/revocation.
- **Components:** ABHA card banner, family dependent member tabs (Self, Spouse, Children, Parents), categorized records list (Prescriptions, Lab Reports, Diagnostic Imaging), ABDM doctor consent request cards with 30-day validity timers, cryptographic access audit log list.
- **Forms:** Add family dependent modal, consent Grant/Deny buttons.
- **Displayed Data:** ABHA address, ABHA number, records count, hospital facility sync status, consent requester details, gateway transaction hash.
- **Actions:** Grant/Deny consent (`handleConsentAction`), view record details, download record, add dependent.
- **API Calls:** `abdmService.getFamilyDependents()`, `abdmService.getAbdmConsents()`, `abdmService.processConsent()`, `abdmService.getAuditLogs()`.
- **Current DB Dependency:** `patient_dependents`, `abdm_consents`, `abdm_audit_logs`, `medical_records`.
- **Missing Backend Dependency:** Real ABDM sandbox bridge (currently backed by compliant PostgreSQL schema and mock ABDM service).
- **Missing UI Functionality:** Direct file upload into ABDM locker.

### 2.9 Patient Digital Twin
- **Page File:** `frontend/src/pages/PatientTwin.jsx`
- **Route:** `/twin`
- **Role:** Patient & Doctor
- **Purpose:** Physiological avatar and multi-organ health trajectory simulator forecasting 5-year cardiovascular, metabolic, and respiratory risks.
- **Components:** Interactive organ risk cards (Heart, Pancreas, Lungs, Kidneys), physiological vitals editor, risk projection chart, AI conversational twin assistant.
- **Forms:** Vitals adjustment (BP, BMI, Blood Sugar, Smoking), interactive twin prompt input.
- **Displayed Data:** Estimated risk scores (Low, Moderate, High), projected trajectory, AI personalized lifestyle and clinical recommendations.
- **Actions:** Adjust vitals, query twin AI model, switch patient (doctor mode).
- **API Calls:** `mlApi.predictRisk()`, `supabase.from('patients')`.
- **Current DB Dependency:** `patients`, `symptom_assessments`.
- **Missing Backend Dependency:** Historical longitudinal risk trend table.
- **Missing UI Functionality:** Save updated vitals back to patient profile.

### 2.10 Clinical Trials Explorer
- **Page File:** `frontend/src/pages/TrialsExplorer.jsx`
- **Route:** `/trials`
- **Role:** Patient & Doctor
- **Purpose:** Matches clinical trials from international registers (e.g. ClinicalTrials.gov) based on patient conditions and biomarkers.
- **Components:** Search bar, phase filter buttons, trial cards with compatibility match score, inclusion/exclusion criteria checklist.
- **Forms:** Search input, filter buttons.
- **Displayed Data:** NCT ID, trial title, sponsor, phase, location, recruiting status, compatibility percentage, eligibility criteria.
- **Actions:** Search trials, bookmark trial.
- **API Calls:** Mock clinical trial data.
- **Current DB Dependency:** None.
- **Missing Backend Dependency:** Supabase table for saved/bookmarked trials.
- **Missing UI Functionality:** Apply / Express interest in clinical trial.

### 2.11 Billing & Payment Ledger
- **Page File:** `frontend/src/pages/Billing.jsx`
- **Route:** `/billing`
- **Role:** Patient
- **Purpose:** Financial transactions ledger, consultation invoices, pharmacy order receipts, and insurance claims.
- **Components:** Payment method cards, transaction history table, insurance claim status cards, receipt download button.
- **Forms:** Add new payment method modal.
- **Displayed Data:** Transaction reference, service description, date, status (Completed, Pending, Refunded), amount (INR), insurance claim numbers.
- **Actions:** Filter transactions, download invoice, file insurance claim.
- **API Calls:** `supabase.from('payments')`, `supabase.from('medicine_orders')`.
- **Current DB Dependency:** `payments`, `medicine_orders`.
- **Missing Backend Dependency:** Real payment gateway webhook handler (Razorpay/Stripe).
- **Missing UI Functionality:** Detailed receipt breakdown view.

### 2.12 Clinical AI Chatbot
- **Page File:** `frontend/src/pages/Chatbot.jsx`
- **Route:** `/chat`
- **Role:** Patient & Doctor
- **Purpose:** Conversational healthcare guidance adhering to strict non-diagnostic, non-prescriptive clinical safety guardrails.
- **Components:** Chat message thread, user and AI message bubbles, disclaimer banner, query suggestions, input box with send button.
- **Forms:** Chat message text input.
- **Displayed Data:** Chat messages, medical safety disclaimers.
- **Actions:** Send message, clear conversation, click suggested prompts.
- **API Calls:** `mlApi.getChatReply()`.
- **Current DB Dependency:** `chat_history`.
- **Missing Backend Dependency:** Per-session chat persistence.
- **Missing UI Functionality:** Link AI chat recommendations directly to Doctor Search.

---

## 3. Doctor Persona Pages

### 3.1 Doctor Dashboard (Clinical Mission Control)
- **Page File:** `frontend/src/pages/doctor/DoctorDashboard.jsx`
- **Route:** `/doctor/dashboard`
- **Role:** Doctor
- **Purpose:** Inpatient ward census, rounding queue, critical patient alerts, hospital throughput, and diagnostic precision indexes.
- **Components:** Top clinical search bar, emergency override button, KPI cards (Active Inpatients, Critical Alerts, Precision Index, Pending Lab Reports), ward census table with patient stability badges, rounding schedule sidebar, admissions/discharges chart, AI precision curve.
- **Forms:** Ward filter select, search input, patient checkbox selector.
- **Displayed Data:** Inpatient names, room/bed numbers, ABHA IDs, stability indexes (Stable, Elevated Risk, Critical), rounding times and teleconsult slots.
- **Actions:** View chart, launch urgent action, activate emergency override, print census.
- **API Calls:** Static initial state (Needs hook to `doctorService.getMissionControlData()`).
- **Current DB Dependency:** `appointments`, `patients`, `symptom_assessments`, `patient_doctor_access`.
- **Missing Backend Dependency:** Live query wiring to `appointments` and `patient_doctor_access`.
- **Missing UI Functionality:** Direct action from rounding schedule to start consultation.

### 3.2 Doctor Appointment Queue & Ward Census
- **Page File:** `frontend/src/pages/doctor/DoctorAppointments.jsx`
- **Route:** `/doctor/appointments`
- **Role:** Doctor
- **Purpose:** View and manage scheduled patient appointments, teleconsultations, and mark attendance.
- **Components:** Appointment schedule table, patient demographics summary, status badges, action buttons (Start Consult, Mark Completed, Cancel).
- **Forms:** None.
- **Displayed Data:** Appointment date, time slot, patient name, age, gender, consultation type, reported symptoms, status.
- **Actions:** Update appointment status (`handleStatus`), navigate to `/doctor/consultation/:id`.
- **API Calls:** `appointmentService.getDoctorAppointments()`, `appointmentService.updateStatus()`.
- **Current DB Dependency:** `appointments`, `patients`.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** Date picker filter to view future dates.

### 3.3 Active Consultation Room & Ambient Scribe
- **Page File:** `frontend/src/pages/doctor/ConsultationRoom.jsx`
- **Route:** `/doctor/consultation`, `/doctor/consultation/:appointmentId`
- **Role:** Doctor
- **Purpose:** Conduct teleconsultations with live WebRTC video, automated ambient clinical note transcription, SOAP note editor (Subjective, Objective, Assessment, Plan), digital signature (DSC) token generator, and prescription preview.
- **Components:** Video call monitor with camera/mic controls, active patient EHR drawer, ambient speech transcript view, SOAP note tabs, medication builder with quick-add buttons, Cryptographic DSC signature action button.
- **Forms:** SOAP note inputs (Subjective, Objective, Assessment, Plan), medicine line item adder (name, dosage, frequency, duration).
- **Displayed Data:** Patient vitals, call duration, transcript snippets, prescribed medicines, DSC token hash.
- **Actions:** Toggle mic/cam, add/remove medicines, sign encounter with DSC token (`handleSignDsc`).
- **API Calls:** `consultationService.signConsultationDsc()`.
- **Current DB Dependency:** `consultations`, `consultation_sessions`, `appointments`.
- **Missing Backend Dependency:** Direct generation of `prescriptions` row upon consultation conclusion.
- **Missing UI Functionality:** Automated transition to `/doctor/prescribe` with pre-filled medications.

### 3.4 Digital Prescription Generator
- **Page File:** `frontend/src/pages/doctor/PrescriptionGenerator.jsx`
- **Route:** `/doctor/prescribe`
- **Role:** Doctor
- **Purpose:** Compose and issue tamper-evident digital prescriptions with authenticated Rx IDs.
- **Components:** Patient selection input, clinical diagnosis field, dynamic medicine line-items editor, general advice textarea, signed prescription preview with print layout.
- **Forms:** Patient identifier, diagnosis text, dynamic medicine rows (name, dosage, frequency, duration, instructions), general advice, follow-up date.
- **Displayed Data:** Doctor details, license number, signed Rx ID, printable prescription sheet.
- **Actions:** Add/remove medicine rows, submit prescription (`prescriptionService.createPrescription` / `create_prescription_tx`), print Rx.
- **API Calls:** `prescriptionService.createPrescription()`.
- **Current DB Dependency:** `prescriptions`, `prescription_items`, `notifications`, `audit_logs`.
- **Missing Backend Dependency:** Patient selection dropdown querying doctor's authorized patients from `patient_doctor_access` or `appointments`.
- **Missing UI Functionality:** Patient auto-complete search.

### 3.5 Doctor AI Insights & Clinical Findings
- **Page File:** `frontend/src/pages/doctor/AiInsights.jsx`
- **Route:** `/doctor/ai-insights`
- **Role:** Doctor
- **Purpose:** Multimodal predictive intelligence queue alerting clinicians to early sepsis biomarkers, cardiac arrhythmias (QTc prolongation), and acute deterioration risks with SHAP explainability.
- **Components:** Urgent findings queue, clinical acuity tiers (ESI-1 to ESI-5), biomarker correlation panels, SHAP feature importance bar charts, model calibration curve, doctor oversight sign-off button.
- **Forms:** None.
- **Displayed Data:** Patient name, MRN, finding type, probability percentage, ICD-10 codes, biomarker laboratory values, SHAP weight attributions.
- **Actions:** Sign oversight (`aiService.signFindingOversight`), view calibration, dismiss alert.
- **API Calls:** `aiService.getClinicalFindingsQueue()`, `aiService.signFindingOversight()`.
- **Current DB Dependency:** `ai_clinical_findings`, `patients`.
- **Missing Backend Dependency:** Real-time push notification on high-acuity findings.
- **Missing UI Functionality:** Filter findings by ward or acuity level.

### 3.6 Doctor Health Records (EHR)
- **Page File:** `frontend/src/pages/doctor/DoctorHealthRecords.jsx`
- **Route:** `/doctor/records`
- **Role:** Doctor
- **Purpose:** Access-controlled longitudinal electronic health records viewer for authorized patients.
- **Components:** Patient selector, longitudinal lab parameter charts (e.g. Lipid panel, HbA1c), past clinical encounter summaries, ABDM repository sync status.
- **Forms:** Patient search input, date range filters.
- **Displayed Data:** Historical lab values, trends, diagnostic imaging summaries, doctor notes.
- **Actions:** Search patients, view trend chart, request ABDM consent extension.
- **API Calls:** Static demonstration arrays with ABDM sync indicators.
- **Current DB Dependency:** `medical_records`, `health_reports`, `patient_doctor_access`.
- **Missing Backend Dependency:** Live query joining `medical_records` filtered by active `patient_doctor_access`.
- **Missing UI Functionality:** Live selector of doctor's actual authorized patients.

---

## 4. Pharmacy / Medical Store Pages

### 4.1 Pharmacy Dashboard
- **Page File:** `frontend/src/pages/pharmacy/PharmacyDashboard.jsx`
- **Route:** `/pharmacy/dashboard`
- **Role:** Pharmacist / Medical Store
- **Purpose:** Store operational overview displaying incoming prescription orders, completed dispensations, and inventory status.
- **Components:** Store license header banner, KPI metric cards (Orders In Processing, Completed Orders, Medicine Inventory), recent prescription orders table.
- **Forms:** None.
- **Displayed Data:** Pharmacy name, drug license number, GSTIN, pending orders count, completed count, recent order list.
- **Actions:** Quick links to `/pharmacy/orders` and `/pharmacy/inventory`.
- **API Calls:** `pharmacyService.getPharmacyOrders()`.
- **Current DB Dependency:** `medicine_orders`, `pharmacies`.
- **Missing Backend Dependency:** Live revenue and order totals calculation.
- **Missing UI Functionality:** Quick toggle for "Pharmacy Open/Closed for Online Orders".

### 4.2 Prescription Order Processing & Dispensation
- **Page File:** `frontend/src/pages/pharmacy/OrderProcessing.jsx`
- **Route:** `/pharmacy/orders`
- **Role:** Pharmacist / Medical Store
- **Purpose:** Validate attached digital Rx identifiers, dispense medications atomically with inventory decrements, and advance delivery fulfillment states (`confirmed` -> `packed` -> `out_for_delivery` -> `delivered`).
- **Components:** Order queue table, attached Rx verification inspector, order line items detail card, fulfillment status action buttons.
- **Forms:** Order status change buttons, prescription lookup search bar.
- **Displayed Data:** Order number, patient contact, attached Rx ID, total amount, payment method, delivery address, order items breakdown.
- **Actions:** Select order, verify Rx, update status (`pharmacy_fulfill_prescription_tx`), dispense drugs.
- **API Calls:** `pharmacyService.getPharmacyOrders()`, `orderService.fulfillPrescriptionOrder()`.
- **Current DB Dependency:** `medicine_orders`, `order_items`, `prescriptions`, `pharmacy_inventory`.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** Print packaging slip and delivery invoice.

### 4.3 Drug Inventory & Stock Management
- **Page File:** `frontend/src/pages/pharmacy/InventoryManagement.jsx`
- **Route:** `/pharmacy/inventory`
- **Role:** Pharmacist / Medical Store
- **Purpose:** Manage retail medicine inventory, unit prices, prescription mandates, and stock levels.
- **Components:** Catalog search input, inventory items table, stock status indicators, Rx mandated pill badges.
- **Forms:** Search input.
- **Displayed Data:** Brand and generic names, category, dosage form, strength, standard price, Rx mandate, stock status.
- **Actions:** Filter medicines, edit stock quantity and unit price.
- **API Calls:** `pharmacyService.getMedicines()`.
- **Current DB Dependency:** `medicines`, `pharmacy_inventory`.
- **Missing Backend Dependency:** Per-pharmacy inventory price and quantity updates.
- **Missing UI Functionality:** Add new medicine to pharmacy inventory; batch number and expiry date tracking.

---

## 5. Super Admin Pages

### 5.1 Admin Overview Dashboard
- **Page File:** `frontend/src/pages/admin/AdminDashboard.jsx`
- **Route:** `/admin/dashboard`, `/admin`
- **Role:** Admin & Super Admin
- **Purpose:** High-level platform governance, real-time user statistics, approval gate alerts, appointment and order volumes.
- **Components:** Platform governance banner, mandatory approval gate alert banner (pending doctors/pharmacies), KPI cards (Pending/Approved Doctors, Pending/Approved Pharmacies, Total Patients), recent platform activity feed.
- **Forms:** None.
- **Displayed Data:** Pending and approved counters across all roles, total patients, appointment volume.
- **Actions:** Navigate to Doctor Approvals, Pharmacy Approvals, Audit Logs.
- **API Calls:** `adminService.getAllUsers()` / `adminService.getSystemKPIs()`.
- **Current DB Dependency:** `profiles`, `doctors`, `pharmacies`, `patients`, `appointments`, `medicine_orders`.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** Quick toggle for emergency platform maintenance mode.

### 5.2 Doctor Credentialing & Verification Gate
- **Page File:** `frontend/src/pages/admin/DoctorApprovals.jsx`
- **Route:** `/admin/doctor-approvals`
- **Role:** Admin & Super Admin
- **Purpose:** Mandatory verification gate. Review practitioner credentials, license numbers, specialization, qualifications, and approve or reject with clinical justification.
- **Components:** Filter tabs (Pending, Approved, Rejected, All), search input, doctor verification card list, credential details (License #, Experience, Clinic, Fee), Approve/Reject action buttons, Rejection reason modal.
- **Forms:** Rejection reason textarea.
- **Displayed Data:** Doctor full name, specialization, medical license number, experience years, clinic address, current approval status.
- **Actions:** Approve doctor (`adminService.verifyDoctor` / `verify_doctor_tx`), reject doctor with reason.
- **API Calls:** `adminService.getDoctorApplications()`, `adminService.updateApprovalStatus()` / `adminService.verifyDoctor()`.
- **Current DB Dependency:** `doctors`, `doctor_verifications`, `notifications`, `audit_logs`.
- **Missing Backend Dependency:** Storage preview of submitted license PDF documents from `doctor-documents`.
- **Missing UI Functionality:** In-app document viewer modal for license certificates.

### 5.3 Pharmacy License Approvals
- **Page File:** `frontend/src/pages/admin/PharmacyApprovals.jsx`
- **Route:** `/admin/pharmacy-approvals`
- **Role:** Admin & Super Admin
- **Purpose:** Review retail pharmacy applications, valid Drug License numbers, GSTIN, and physical premises address.
- **Components:** Filter tabs, pharmacy applications list, license details, Approve/Reject buttons, rejection reason modal.
- **Forms:** Rejection reason textarea.
- **Displayed Data:** Pharmacy name, contact person, drug license number, GSTIN, address, status.
- **Actions:** Approve pharmacy (`adminService.verifyPharmacy` / `verify_pharmacy_tx`), reject with reason.
- **API Calls:** `adminService.getPharmacyApplications()`, `adminService.updateApprovalStatus()` / `adminService.verifyPharmacy()`.
- **Current DB Dependency:** `pharmacies`, `pharmacy_verifications`, `notifications`, `audit_logs`.
- **Missing Backend Dependency:** Storage preview of drug license documents from `pharmacy-documents`.
- **Missing UI Functionality:** Document preview modal.

### 5.4 Platform Audit & Compliance Logs
- **Page File:** `frontend/src/pages/admin/AuditLogs.jsx`
- **Route:** `/admin/audit-logs`
- **Role:** Admin & Super Admin
- **Purpose:** HIPAA and ABDM security audit trail viewer logging all sensitive platform actions (credential approvals, prescription issuances, consent updates).
- **Components:** Audit log table with action type badges, actor email/role, resource type and ID, JSON details inspector, timestamp.
- **Forms:** Action type filter select.
- **Displayed Data:** Action name (e.g. `VERIFY_DOCTOR_APPROVED`, `CREATE_PRESCRIPTION`), actor role, resource type, IP address, timestamp.
- **Actions:** Refresh logs, inspect metadata JSON.
- **API Calls:** `adminService.getAuditLogs()`.
- **Current DB Dependency:** `audit_logs`.
- **Missing Backend Dependency:** None.
- **Missing UI Functionality:** Date range filter and export audit trail to CSV.
