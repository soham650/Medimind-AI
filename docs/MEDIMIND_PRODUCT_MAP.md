# MEDIMIND AI — COMPLETE PRODUCT MAP & PERSONA ARCHITECTURE

**System Version:** 2.4.0 (Enterprise Clinical Intelligence Suite)  
**Security Standard:** HIPAA Compliance, ABDM 3.0 FHIR Guidelines, Least-Privilege RLS  
**Supported Personas:** Patient, Doctor, Pharmacist / Medical Store, Admin, Super Admin  

---

## 1. Persona 1: Patient

### Overview
The Patient persona provides consumer and patient workflows ranging from dual-engine AI symptom triage and medical document parsing to doctor teleconsultations, digital prescription fulfillment, medicine ordering, and health records management.

### Pages & Routes
| Page Name | Route | Purpose | User Actions | API / Service | DB Tables | Storage | RLS Enforcement |
|---|---|---|---|---|---|---|---|
| **Public Landing** | `/` | Platform introduction, value proposition, entry points | View services, navigate to login / register | Frontend Static | None | None | Public |
| **Auth / Login** | `/login` | Authentication & session creation | Enter credentials, password reset | Supabase Auth | `auth.users`, `user_roles`, `profiles` | None | Self auth |
| **Auth / Register** | `/register`, `/register-patient` | Patient onboarding | Input name, phone, ABHA ID | `auth.signUp()` + `handle_user_signup()` | `auth.users`, `user_roles`, `patients` | None | Self insert |
| **Patient Dashboard** | `/dashboard` | Clinical hub & care overview | View upcoming appointments, active Rx, vitals summary, quick action links | `appointmentService`, `prescriptionService` | `appointments`, `prescriptions`, `patients` | None | `auth.uid() = patient_id` |
| **AI Symptom Checker** | `/predict`, `/symptom-checker` | Dual-mode preliminary triage & risk engine | Select symptoms, voice dictation, upload lab slip, run ML triage | `mlApi.predictDisease()`, `aiService.assessSymptoms()` | `symptom_assessments`, `disease_clinical_guidelines` | `medical-documents` (private) | Insert own, select own |
| **Medical Report Analyzer** | `/reports` | Multimodal lab report parsing (Phase 2 Gemini) | Upload PDF/image report, view extracted parameters & trend chart | `mlApi.analyzeReport()`, `reportService.uploadReport()` | `health_reports` | `medical-documents` (private) | `patient_id = auth.uid()` |
| **Doctor Discovery & Teleconsultations** | `/doctors`, `/teleconsultations` | Search verified doctors, book appointments, join video calls | Filter by specialty, select doctor slot, book appointment, launch WebRTC/video room | `doctorService.searchDoctors()`, `appointmentService.createAppointment()` (`create_appointment_tx`) | `doctors`, `doctor_availability`, `appointments`, `patient_doctor_access` | None | Read verified doctors; write own appt |
| **Doctor Recommendation** | `/consult` | AI-suggested specialists based on triage | View matched doctors by symptom/condition | `supabase.rpc('recommend_doctors_for_disease')` | `disease_clinical_guidelines`, `doctors`, `profiles` | None | Public read |
| **Prescriptions & Rx** | `/prescriptions` | Digitally signed Rx view & dose tracking | View Rx details, download PDF, track daily doses (morning/noon/night) | `prescriptionService.getPatientPrescriptions()`, `prescriptionService.logDoseStatus()` | `prescriptions`, `prescription_items`, `medication_schedules` | None | `patient_id = auth.uid()` |
| **Pharmacy Store & Checkout** | `/pharmacy` | Drug catalog, digital cart, prescription attachment, checkout | Search medicines, add to cart, select pharmacy, attach Rx, place order | `pharmacyService.getMedicines()`, `orderService.createOrder()` (`create_medicine_order_tx`) | `medicines`, `pharmacies`, `pharmacy_inventory`, `medicine_orders`, `order_items` | None | Read available meds; insert own orders |
| **My Orders & Order Tracking** | `/patient/orders`, `/orders` *(Required)* | Track medication deliveries and order history | View order status, items ordered, dispatch details, receipt | `orderService.getPatientOrders()` | `medicine_orders`, `order_items`, `pharmacies` | None | `patient_id = auth.uid()` |
| **Patient Appointments & History** | `/patient/appointments` *(Required)* | Manage scheduled & past clinical sessions | Cancel appointment, view doctor notes, launch video consult | `appointmentService.getPatientAppointments()`, `appointmentService.updateStatus()` | `appointments`, `doctors`, `consultations` | None | `patient_id = auth.uid()` |
| **Lab Diagnostics** | `/labs` | At-home lab test packages & phlebotomist cold-chain tracking | Browse NABL test packages, book at-home pickup, track sample status | `labService.getPackages()`, `labService.bookTest()` (`book_lab_test_tx`) | `lab_packages`, `lab_tests`, `lab_bookings` | None | Read active packages; manage own bookings |
| **ABDM Records Vault** | `/records` | Longitudinal health locker & ABDM consent management | View FHIR records, add family dependents, grant/deny doctor consent | `abdmService.getFamilyDependents()`, `abdmService.processConsent()` | `patient_dependents`, `abdm_consents`, `abdm_audit_logs`, `medical_records` | `medical-documents` | `patient_id = auth.uid()` |
| **Patient Digital Twin** | `/twin` | Personalized physiological risk simulation | Review cardiovascular/metabolic risk score, chat with twin model | `mlApi.predictRisk()`, `supabase.from('patients')` | `patients`, `symptom_assessments` | None | Read own profile |
| **Clinical Trials Explorer** | `/trials` | Match clinical research studies | Search condition-specific studies | External ClinicalTrials API / fallback | None | None | Public read |
| **Billing & Payments** | `/billing` | Transaction ledger & insurance claim tracking | View past payments, invoices, download receipts | `supabase.from('payments')`, `supabase.from('medicine_orders')` | `payments`, `medicine_orders` | None | `user_id = auth.uid()` |
| **Clinical Chatbot** | `/chat` | Conversational triage assistant with medical safety rails | Ask medical query, receive non-prescriptive supportive guidance | `mlApi.getChatReply()` | `chat_history` | None | `profile_id = auth.uid()` |
| **Patient Profile & Settings** | `/patient/profile` *(Required)* | Demographics, emergency contacts, ABHA ID, allergies | Edit emergency contact, language, blood group, allergies | `patientService.updateProfile()` | `patients`, `patient_allergies` | None | `auth.uid() = id` |

---

## 2. Persona 2: Doctor

### Overview
The Doctor persona handles clinical consultation workflows, real-time inpatient ward monitoring, teleconsultation video calls, ambient scribe clinical note generation, digital prescription generation, and access-controlled patient EHR reviews.

### Pages & Routes
| Page Name | Route | Purpose | User Actions | API / Service | DB Tables | Storage | RLS Enforcement |
|---|---|---|---|---|---|---|---|
| **Doctor Dashboard** | `/doctor/dashboard` | Clinical Mission Control & Census | View today's rounding schedule, inpatient census, critical triage alerts | `doctorService.getMissionControlData()` | `appointments`, `patients`, `symptom_assessments`, `patient_doctor_access` | None | `doctor_id = auth.uid()` |
| **Appointment Queue** | `/doctor/appointments` | Manage patient appointment queue | View appointments by date, mark checked-in/completed/no-show, launch consult | `appointmentService.getDoctorAppointments()`, `appointmentService.updateStatus()` | `appointments`, `patients` | None | `doctor_id = auth.uid()` |
| **Consultation Room** | `/doctor/consultation/:appointmentId` | Active teleconsultation session | Conduct video call, ambient clinical scribe, write SOAP notes, sign with DSC token | `consultationService.signConsultationDsc()`, WebRTC | `consultations`, `consultation_sessions`, `appointments`, `patient_doctor_access` | None | Doctor or Patient participant |
| **Digital Rx Generator** | `/doctor/prescribe` | Issue digitally signed medical prescription | Select patient/appointment, add medicines, dosage, frequency, sign Rx | `prescriptionService.createPrescription()` (`create_prescription_tx`) | `prescriptions`, `prescription_items`, `notifications`, `audit_logs` | None | `doctor_id = auth.uid()` |
| **AI Insights & Findings** | `/doctor/ai-insights` | Multi-modal clinical risk predictions | Review AI-detected sepsis/cardiac biomarker findings, SHAP attribution, sign oversight | `aiService.getClinicalFindingsQueue()`, `aiService.signFindingOversight()` | `ai_clinical_findings`, `patients` | None | Doctor or Admin |
| **Doctor Health Records (EHR)** | `/doctor/records` | Longitudinal patient health history | Search authorized patients, view lab reports, trend graphs | `supabase.from('medical_records')` | `medical_records`, `health_reports`, `patient_doctor_access` | `medical-documents` (via signed URLs) | Active `patient_doctor_access` bridge |
| **Doctor Availability & Schedule** | `/doctor/availability` *(Required)* | Manage clinical slots & consultation fees | Set active days, working hours, slot interval, consultation fee | `doctorService.updateAvailability()` | `doctor_availability`, `doctors` | None | `doctor_id = auth.uid()` |
| **Doctor Profile & Verification** | `/doctor/profile` *(Required)* | Credentials, bio, license verification documents | Edit qualifications, clinic address, upload medical registration certificate | `doctorService.updateProfile()`, `storage.upload()` | `doctors`, `doctor_verifications` | `doctor-documents` (private) | `doctor_id = auth.uid()` |
| **Clinical Analytics** | `/analytics` | Departmental throughput and diagnostic accuracy | View admissions vs discharges, model calibration metrics | Static / Aggregation query | `appointments`, `consultations` | None | Doctor or Admin |

---

## 3. Persona 3: Pharmacist / Medical Store

### Overview
The Pharmacist persona manages pharmacy inventory, reviews attached digital prescriptions, dispenses medications atomically, updates delivery fulfillment states, and manages batch expiry tracking.

### Pages & Routes
| Page Name | Route | Purpose | User Actions | API / Service | DB Tables | Storage | RLS Enforcement |
|---|---|---|---|---|---|---|---|
| **Pharmacy Dashboard** | `/pharmacy/dashboard` | Store overview & KPI metrics | View pending orders count, low-stock warnings, revenue summary | `pharmacyService.getPharmacyOrders()` | `medicine_orders`, `pharmacy_inventory`, `pharmacies` | None | `pharmacy_id = auth.uid()` |
| **Prescription Order Processing** | `/pharmacy/orders` | Prescription verification & order fulfillment | Inspect attached Rx ID, dispense medication (decrement stock), dispatch order | `orderService.fulfillPrescriptionOrder()` (`pharmacy_fulfill_prescription_tx`) | `medicine_orders`, `order_items`, `prescriptions`, `pharmacy_inventory` | None | `pharmacy_id = auth.uid()` |
| **Drug Inventory & Stock** | `/pharmacy/inventory` | Catalog management & stock levels | Search medicines, update quantity, unit price, reorder thresholds | `pharmacyService.getMedicines()`, `pharmacyService.updateStock()` | `medicines`, `pharmacy_inventory` | None | `pharmacy_id = auth.uid()` |
| **Batch & Expiry Management** | `/pharmacy/inventory/batches` *(Required)* | Track expiring lots & batch numbers | Record lot numbers, monitor near-expiry batches, adjust counts | `pharmacyService.getBatches()`, `pharmacyService.updateBatch()` | `pharmacy_inventory`, `inventory_batches` | None | `pharmacy_id = auth.uid()` |
| **Pharmacy Profile & Licensing** | `/pharmacy/profile` *(Required)* | Store license, GSTIN, address, hours | Update contact person, address, upload drug license certificate | `pharmacyService.updateProfile()` | `pharmacies`, `pharmacy_verifications` | `pharmacy-documents` (private) | `pharmacy_id = auth.uid()` |

---

## 4. Persona 4 & 5: Admin & Super Admin

### Overview
Admin and Super Admin oversee platform governance, mandatory credentialing approval gates for doctors and pharmacies, user account management, and HIPAA-compliant immutable audit logs. Super Admin has platform-wide authorization overrides and RBAC control.

### Pages & Routes
| Page Name | Route | Purpose | User Actions | API / Service | DB Tables | Storage | RLS Enforcement |
|---|---|---|---|---|---|---|---|
| **Admin Overview Dashboard** | `/admin/dashboard` | Platform metrics & approval gate alerts | View pending verifications, user counts, appointment statistics, revenue | `adminService.getSystemKPIs()` | `patients`, `doctors`, `pharmacies`, `appointments`, `medicine_orders` | None | Admin or Super Admin |
| **Doctor Credentialing Approvals** | `/admin/doctor-approvals` | Review medical practitioner credentials | Inspect license number, qualifications, approve or reject with clinical reason | `adminService.verifyDoctor()` (`verify_doctor_tx`) | `doctors`, `doctor_verifications`, `notifications`, `audit_logs` | `doctor-documents` | Admin or Super Admin |
| **Pharmacy License Approvals** | `/admin/pharmacy-approvals` | Review retail drug dispensary licenses | Inspect drug license certificate, GSTIN, approve or reject with reason | `adminService.verifyPharmacy()` (`verify_pharmacy_tx`) | `pharmacies`, `pharmacy_verifications`, `notifications`, `audit_logs` | `pharmacy-documents` | Admin or Super Admin |
| **Platform Audit & Compliance Logs** | `/admin/audit-logs` | HIPAA/ABDM security trail viewer | Filter sensitive events (approvals, logins, Rx generation, consent updates) | `adminService.getAuditLogs()` | `audit_logs`, `abdm_audit_logs` | None | Admin or Super Admin |
| **User & Role Governance** | `/admin/users` *(Required)* | Manage platform users and account status | View registered users, block/unblock, verify roles (no medical PHI exposed) | `adminService.getAllUsers()` | `profiles`, `user_roles` | None | Admin or Super Admin |
| **Platform Configuration & System Health** | `/admin/settings` *(Required)* | View AI services status, system parameters, rate limit events | Monitor ML service uptime, view rate limit logs, adjust system settings | `supabase.from('rate_limit_events')`, `mlApi.getHealth()` | `rate_limit_events`, `ai_usage_daily` | None | Admin or Super Admin |
