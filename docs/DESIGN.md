# MediMind AI — UI/UX Design System & Page Inventory

> **Document Status:** IMPLEMENTED & EMPIRICALLY VERIFIED  
> **Last Verified:** September 30, 2026  
> **Design Philosophy:** Human-Centric Clinical Precision, Zero Medical Ambiguity, Premium Healthcare Aesthetics  
> **Typography:** Inter (Body/UI) & Outfit (Display/Headlines) | Modern Curated HSL Tokens

---

## 1. DESIGN SYSTEM SPECIFICATIONS

### 1.1 Color Tokens
The color palette avoids harsh browser primaries in favor of clinical-grade, accessible HSL tailored tokens:

| Token Name | Hex Code | HSL / Role | Usage Context |
| :--- | :--- | :--- | :--- |
| `primary` | `#0f766e` | `teal-700` | Primary brand accent, primary CTA buttons, active sidebar highlights |
| `primary-hover` | `#0d9488` | `teal-600` | Hover states on interactive primary elements |
| `primary-container` | `#ccfbf1` | `teal-100` | Subtle active tabs, badge backgrounds, selected card highlights |
| `secondary` | `#0284c7` | `sky-600` | Informational callouts, telemetry stats, medical records icon |
| `surface` | `#f8fafc` | `slate-50` | Global background canvas for non-clinical screens |
| `surface-card` | `#ffffff` | `white` | Elevated clinical cards, table containers, modal overlays |
| `outline-variant` | `#e2e8f0` | `slate-200` | Subtle hairline borders, divider rules, input field strokes |
| `on-surface` | `#0f172a` | `slate-900` | High-contrast body typography, card headers, table data |
| `on-surface-variant`| `#64748b` | `slate-500` | Secondary metadata labels, timestamps, helper text |
| `error` | `#dc2626` | `red-600` | Emergency red-flag alarms, critical vitals warnings, validation errors |
| `error-container` | `#fee2e2` | `red-100` | Emergency banner background, severe drug interaction alerts |
| `warning` | `#d97706` | `amber-600` | Near-expiry medicine warning (<90 days), pending approval notice |
| `success` | `#16a34a` | `emerald-600` | Order delivered, appointment confirmed, verified practitioner badge |

### 1.2 Typography Hierarchy
- **Display (Hero Titles):** `Outfit`, sans-serif; `font-weight: 800`; `letter-spacing: -0.02em`. Used on welcome headers and brand banners.
- **Headlines (Card / Section Titles):** `Inter`, sans-serif; `font-weight: 700`; `font-size: 1.25rem - 1.5rem`.
- **Body Regular:** `Inter`, sans-serif; `font-weight: 400`; `font-size: 0.875rem`; `line-height: 1.5`.
- **Labels & Microcopy:** `Inter`, sans-serif; `font-weight: 600`; `font-size: 0.75rem`; `text-transform: uppercase`; `letter-spacing: 0.05em`.
- **Clinical Data & Metrics:** `Inter / Monospace`, `font-variant-numeric: tabular-nums`. Used for blood pressure, glucose, and lot numbers.

### 1.3 Spacing & Layout Tokens
- `stack-xs`: `4px` | Fine inline badge gaps
- `stack-sm`: `8px` | Icon-to-text spacing, input label padding
- `stack-md`: `16px` | Card internal padding, form row spacing
- `stack-lg`: `24px` | Section dividers, grid gutters
- `stack-xl`: `32px` | Dashboard module layout gaps

---

## 2. COMPONENT DESIGN STANDARDS

### 2.1 Buttons & Interactive Controls
- **Primary Action:** Solid background (`bg-[#0f766e]`), white bold text, `rounded-lg`, subtle shadow (`shadow-sm`), active scale micro-interaction (`active:scale-[0.99]`).
- **Secondary Action:** White background, hairline stroke (`border border-slate-300`), text in `slate-700`, hover transition (`hover:bg-slate-50`).
- **Critical / Emergency Action:** Solid crimson background (`bg-red-600`), white bold text, pulsing beacon on urgent triage.
- **Disabled State:** Opacity 50% (`opacity-50 cursor-not-allowed pointer-events-none`).

### 2.2 Clinical Cards & Containers
- Flat white surface with subtle border (`border border-slate-200`), rounded corners (`rounded-xl` / `16px`), zero harsh drop-shadows (`box-shadow: 0 1px 3px rgba(0,0,0,0.05)`).
- Distinct header band with clinical icon and persona context.

### 2.3 Tables & Data Grids
- Clean borders with fixed column widths.
- Alternating subtle row hover highlight (`hover:bg-slate-50/80`).
- Status badges use pill format (`rounded-full px-2.5 py-0.5 text-xs font-semibold`).

### 2.4 State Specifications
- **Loading State:** Centered pulsing spinner with progress text: *"Checking your MediMind session... Validating Role-Based Security Access Control"*. Content is never flashed during auth resolution.
- **Empty State:** Illustrated empty visual, explanatory heading, and clear primary CTA button (e.g., *"No Appointments Scheduled — Book Your First Consultation"*).
- **Error State:** High-contrast alert box with icon and actionable guidance (e.g., *"Slot unavailable — please pick another time slot"*).

---

## 3. COMPLETE PAGE INVENTORY (42 PRODUCTION SCREENS)

### 3.1 Public & Authentication Pages

#### 1. Login Page
- **Route:** `/login`
- **Role:** Public (Redirects authenticated users to their canonical module)
- **File:** `frontend/src/pages/auth/Login.jsx`
- **Purpose:** 4-role switcher login with 1-click evaluation access and credential validation.
- **Services:** `authService.login()`, `authService.loginDemo()`
- **Status:** **IMPLEMENTED & VERIFIED**

#### 2. Registration Page
- **Route:** `/register`
- **Role:** Public
- **File:** `frontend/src/pages/auth/Register.jsx`
- **Purpose:** Self-service registration for Patients, Doctors, and Pharmacies with database persistence.
- **Services:** `/api/auth/register`, `authService.signup()`, `authService.registerPractitioner()`
- **Status:** **IMPLEMENTED & VERIFIED**

#### 3. Forgot Password Page
- **Route:** `/forgot-password`
- **Role:** Public
- **File:** `frontend/src/pages/auth/ForgotPassword.jsx`
- **Purpose:** Password reset request dispatch.
- **Status:** **IMPLEMENTED & VERIFIED**

#### 4. Reset Password Page
- **Route:** `/reset-password`
- **Role:** Public
- **File:** `frontend/src/pages/auth/ResetPassword.jsx`
- **Purpose:** Updating account password from token recovery link.
- **Status:** **IMPLEMENTED & VERIFIED**

#### 5. Pending Approval Screen
- **Route:** `/pending-approval`
- **Role:** Authenticated Doctor / Pharmacist
- **File:** `frontend/src/pages/auth/PendingApproval.jsx`
- **Purpose:** Licensing compliance gate with 1-click evaluation activation.
- **Status:** **IMPLEMENTED & VERIFIED**

#### 6. Unauthorized Access Screen
- **Route:** `/unauthorized`
- **Role:** Public / Authenticated
- **File:** `frontend/src/pages/auth/Unauthorized.jsx`
- **Purpose:** Displayed when user attempts cross-persona direct URL navigation.
- **Status:** **IMPLEMENTED & VERIFIED**

---

### 3.2 Patient Portal Pages (`/patient/*`)

| # | Route | Page Component | File Location | Purpose & Key Features | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/patient/dashboard` | `PatientDashboard` | `pages/patient/PatientDashboard.jsx` | Patient Health Hub: Vitals telemetry, upcoming appointments, active orders | **IMPLEMENTED** |
| 2 | `/patient/appointments`| `PatientAppointments`| `pages/patient/PatientAppointments.jsx`| Appointment history, upcoming visit cancellation, doctor notes | **IMPLEMENTED** |
| 3 | `/patient/orders` | `PatientOrders` | `pages/patient/PatientOrders.jsx` | Medicine delivery tracking, order receipts, courier status stepper | **IMPLEMENTED** |
| 4 | `/patient/profile` | `PatientProfile` | `pages/patient/PatientProfile.jsx` | Demographics, ABHA ID, emergency contacts, allergy registry | **IMPLEMENTED** |
| 5 | `/patient/settings` | `PatientSettings` | `pages/patient/PatientSettings.jsx` | Account password, notification toggles, language preferences | **IMPLEMENTED** |
| 6 | `/patient/notifications`| `PatientNotifications`| `pages/patient/PatientNotifications.jsx`| Multi-channel alert feed, appointment reminders, priority triage badges | **IMPLEMENTED** |
| 7 | `/doctors` | `DoctorSearch` | `pages/patient/DoctorSearch.jsx` | Filter doctors by specialty, ratings, fee, and available OPD slots | **IMPLEMENTED** |
| 8 | `/symptom-checker` | `SymptomChecker` | `pages/SymptomChecker.jsx` | 132-symptom intake, vitals input, ML prediction, emergency red-flag alert | **IMPLEMENTED** |
| 9 | `/reports` | `ReportAnalyzer` | `pages/ReportAnalyzer.jsx` | Clinical lab PDF/image upload, biomarker extraction, normalizer | **IMPLEMENTED** |
| 10 | `/consult` | `DoctorRecommendation`| `pages/DoctorRecommendation.jsx` | AI triage match with clinical specialists | **IMPLEMENTED** |
| 11 | `/prescriptions` | `PatientPrescriptions`| `pages/patient/PatientPrescriptions.jsx`| Digital Rx viewer, download signed prescription, 1-click reorder | **IMPLEMENTED** |
| 12 | `/pharmacy` | `PharmacyStore` | `pages/patient/PharmacyStore.jsx` | Medicine catalog search, pharmacy cart, checkout order placement | **IMPLEMENTED** |
| 13 | `/records` | `HealthRecords` | `pages/HealthRecords.jsx` | Historical lab reports, uploaded medical files, past consultation notes | **IMPLEMENTED** |
| 14 | `/twin` | `PatientTwin` | `pages/PatientTwin.jsx` | Digital twin physiological simulation (BMI, blood sugar, BP projections) | **IMPLEMENTED** |
| 15 | `/chat` | `Chatbot` | `pages/Chatbot.jsx` | Assistive AI health conversational agent with clinical guardrails | **IMPLEMENTED** |
| 16 | `/billing` | `Billing` | `pages/Billing.jsx` | Consultation invoices, pharmacy receipts, payment history | **IMPLEMENTED** |
| 17 | `/labs` | `LabDiagnostics` | `pages/patient/LabDiagnostics.jsx` | Diagnostic test booking, home sample collection schedule | **IMPLEMENTED** |
| 18 | `/trials` | `TrialsExplorer` | `pages/TrialsExplorer.jsx` | Clinical trial discovery and eligibility matching | **IMPLEMENTED** |

---

### 3.3 Doctor Clinical Portal Pages (`/doctor/*`)

| # | Route | Page Component | File Location | Purpose & Key Features | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/doctor/dashboard` | `DoctorDashboard` | `pages/doctor/DoctorDashboard.jsx` | Mission Control: OPD queue count, consultation stats, urgent alerts | **IMPLEMENTED** |
| 2 | `/doctor/appointments` | `DoctorAppointments` | `pages/doctor/DoctorAppointments.jsx` | Full patient appointment schedule, status filters, patient check-in | **IMPLEMENTED** |
| 3 | `/doctor/availability` | `DoctorAvailability` | `pages/doctor/DoctorAvailability.jsx` | Weekly OPD slot schedule builder, consultation fee configuration | **IMPLEMENTED** |
| 4 | `/doctor/profile` | `DoctorProfile` | `pages/doctor/DoctorProfile.jsx` | Medical council credentials, clinic affiliation, certificate uploader | **IMPLEMENTED** |
| 5 | `/doctor/prescribe` | `PrescriptionGenerator`| `pages/doctor/PrescriptionGenerator.jsx`| Digital Rx generator, authorized patient selector, drug dosage builder | **IMPLEMENTED** |
| 6 | `/doctor/records` | `DoctorHealthRecords` | `pages/doctor/DoctorHealthRecords.jsx` | Authorized patient clinical vault, past vitals history, lab slips | **IMPLEMENTED** |
| 7 | `/doctor/ai-insights` | `AiInsights` | `pages/doctor/AiInsights.jsx` | Real-time differential AI suggestions, guideline citations (assistive) | **IMPLEMENTED** |
| 8 | `/doctor/analytics` | `DoctorAnalytics` | `pages/doctor/DoctorAnalytics.jsx` | Consultation volume, patient recovery trends, clinical ratings | **IMPLEMENTED** |
| 9 | `/doctor/notifications`| `DoctorNotifications` | `pages/doctor/DoctorNotifications.jsx` | Urgent triage alerts, lab result arrivals, appointment bookings | **IMPLEMENTED** |
| 10 | `/doctor/consultation/:id`| `ConsultationRoom` | `pages/doctor/ConsultationRoom.jsx` | Browser-native WebRTC teleconsultation, live chat, clinical scratchpad | **IMPLEMENTED** |

---

### 3.4 Pharmacy Dispensary Portal Pages (`/pharmacy/*`)

| # | Route | Page Component | File Location | Purpose & Key Features | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/pharmacy/dashboard` | `PharmacyDashboard` | `pages/pharmacy/PharmacyDashboard.jsx` | Dispensary Overview: Pending orders, low-stock alerts, revenue metrics | **IMPLEMENTED** |
| 2 | `/pharmacy/orders` | `OrderProcessing` | `pages/pharmacy/OrderProcessing.jsx` | Prescription order verification, doctor attribution check, dispatch | **IMPLEMENTED** |
| 3 | `/pharmacy/inventory` | `InventoryManagement` | `pages/pharmacy/InventoryManagement.jsx`| Drug stock ledger, unit pricing, manufacturer records | **IMPLEMENTED** |
| 4 | `/pharmacy/inventory/batches`| `BatchManagement` | `pages/pharmacy/BatchManagement.jsx` | FEFO batch ledger, expiration hazard warnings (<90 days), lot tracking | **IMPLEMENTED** |
| 5 | `/pharmacy/medicines` | `MedicineCatalog` | `pages/pharmacy/MedicineCatalog.jsx` | Standard pharmaceutical drug catalog, salt compositions, schedule tags | **IMPLEMENTED** |
| 6 | `/pharmacy/verification`| `PharmacyVerification` | `pages/pharmacy/PharmacyVerification.jsx`| State drug retail license (Form 20/21) accreditation display | **IMPLEMENTED** |
| 7 | `/pharmacy/analytics` | `PharmacyAnalytics` | `pages/pharmacy/PharmacyAnalytics.jsx` | Fast-moving drug turnover, inventory wastage, delivery fulfillment rates | **IMPLEMENTED** |
| 8 | `/pharmacy/profile` | `PharmacyProfile` | `pages/pharmacy/PharmacyProfile.jsx` | Dispensary premises address, GSTIN, operating hours, contact person | **IMPLEMENTED** |
| 9 | `/pharmacy/notifications`| `PharmacyNotifications`| `pages/pharmacy/PharmacyNotifications.jsx`| New prescription alerts, stock replenishment reminders | **IMPLEMENTED** |

---

### 3.5 Administrative Governance Portal Pages (`/admin/*`)

| # | Route | Page Component | File Location | Purpose & Key Features | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 1 | `/admin/dashboard` | `AdminDashboard` | `pages/admin/AdminDashboard.jsx` | System Overview: Platform users, pending approvals, AI telemetry | **IMPLEMENTED** |
| 2 | `/admin/users` | `UserManagement` | `pages/admin/UserManagement.jsx` | Multi-role user governance without exposing medical PHI | **IMPLEMENTED** |
| 3 | `/admin/patients` | `PatientManagement` | `pages/admin/PatientManagement.jsx` | Patient account administration (status, contact, zero clinical notes) | **IMPLEMENTED** |
| 4 | `/admin/doctors` | `DoctorManagement` | `pages/admin/DoctorManagement.jsx` | Practitioner account status, clinic assignments, license status | **IMPLEMENTED** |
| 5 | `/admin/pharmacies` | `PharmacyManagement` | `pages/admin/PharmacyManagement.jsx` | Dispensary accreditation status, active fulfillment capability | **IMPLEMENTED** |
| 6 | `/admin/doctor-approvals`| `DoctorApprovals` | `pages/admin/DoctorApprovals.jsx` | Medical council credential verification queue | **IMPLEMENTED** |
| 7 | `/admin/pharmacy-approvals`| `PharmacyApprovals` | `pages/admin/PharmacyApprovals.jsx` | State drug license accreditation review queue | **IMPLEMENTED** |
| 8 | `/admin/roles` | `RoleManagement` | `pages/admin/RoleManagement.jsx` | RBAC role assignment governance (enforces strictly 4 roles) | **IMPLEMENTED** |
| 9 | `/admin/audit-logs` | `AuditLogs` | `pages/admin/AuditLogs.jsx` | Tamper-evident administrative action log stream | **IMPLEMENTED** |
| 10 | `/admin/analytics` | `PlatformAnalytics` | `pages/admin/PlatformAnalytics.jsx` | System-wide consultation, prescription, and fulfillment volumes | **IMPLEMENTED** |
| 11 | `/admin/ai-usage` | `AIUsageMonitoring` | `pages/admin/AIUsageMonitoring.jsx` | Daily Gemini API calls, token counts, latency metrics, rate alarms | **IMPLEMENTED** |
| 12 | `/admin/security` | `SecurityMonitoring` | `pages/admin/SecurityMonitoring.jsx` | Authentication anomaly tracking, RLS violation counters | **IMPLEMENTED** |
| 13 | `/admin/notifications` | `NotificationManagement`| `pages/admin/NotificationManagement.jsx`| System broadcast dispatch, multi-channel delivery health audit | **IMPLEMENTED** |
| 14 | `/admin/settings` | `SystemSettings` | `pages/admin/SystemSettings.jsx` | Microservice health telemetry, platform maintenance flags | **IMPLEMENTED** |
