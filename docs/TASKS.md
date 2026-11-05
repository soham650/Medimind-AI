# MediMind AI — Central Task Tracker & Engineering Backlog

**Document Status:** ACTIVE AUDIT TRACKER  
**Current Development Focus:** **Phase 1–9 Bug and Regression Audit**  
**Phase 10 Status:** **NOT STARTED — STRICTLY ON HOLD UNTIL EXPLICITLY AUTHORIZED**  
**Priority Legend:**
- `P0 Critical` — Severe security vulnerability, data loss, HIPAA violation, or broken core workflow.
- `P1 High` — Major functional gap, missing error state, or incomplete integration.
- `P2 Medium` — UI/UX polish, non-blocking edge cases, or performance optimizations.
- `P3 Low` — Minor cosmetic adjustments, documentation enhancements, or refactoring.

---

## 1. Current Phase Priority & Status

> [!IMPORTANT]
> **Directive on Phase 10:**  
> Phase 10 (Advanced Clinical Decision Support / IoT Biometric Feeds) is **STRICTLY ON HOLD**. All current engineering resources must be dedicated to maintaining, testing, and auditing the core stability of Phases 1 through 9.

| Phase | Domain | Status | Audit Result |
|---|---|---|---|
| **Phase 1** | Machine Learning Symptom Assessment (`symptom-rf-v1`) | **IMPLEMENTED & VERIFIED** | 100% Passing Unit & Regression Tests |
| **Phase 2** | Medical Report Intelligence & Document Understanding | **IMPLEMENTED & VERIFIED** | Ephemeral OCR & Pydantic Schema Validated |
| **Phase 3** | Supabase Identity, Auth & Storage Provisioning | **IMPLEMENTED & VERIFIED** | 4 Buckets Active, Privileged Dev Bridge Configured |
| **Phase 4** | Patient Experience & Appointment Booking | **IMPLEMENTED & VERIFIED** | Anti-Double Booking RPC Active |
| **Phase 5** | Doctor Clinical Workspace & Digital Prescriptions | **IMPLEMENTED & VERIFIED** | `create_prescription_tx` & Access Bridge Active |
| **Phase 6** | Pharmacy Inventory & Order Dispensation | **IMPLEMENTED & VERIFIED** | Atomic Stock Deduction & FEFO Working |
| **Phase 7** | Administrative Governance & HIPAA Compliance | **IMPLEMENTED & VERIFIED** | Practitioner Credentialing & Audit Logs Active |
| **Phase 8** | Clinical RAG & Gemini 2.5 Flash Lite Orchestration | **IMPLEMENTED & VERIFIED** | Controlled WHO/ICMR Knowledge Base Active |
| **Phase 9** | Real-Time Cross-Role Notifications | **IMPLEMENTED & VERIFIED** | User-Isolated Notification Subscriptions Active |
| **Phase 10** | External IoT Biometrics & Advanced Integrations | **PLANNED / NOT STARTED** | Do NOT start without explicit user directive |

---

## 2. Active Audit Tasks by Domain

### 2.1 Critical Bugs & Regression (Phase 1–9 Audit)
- [x] `P0` **Fixed Login & Registration Role Resolution:** Resolved issue where users were not routed to their respective role modules after sign-in. Fixed in [`auth.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/auth.service.js) and [`vite-auth-plugin.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/vite-auth-plugin.js).
- [x] `P0` **Fixed Supabase Unconfirmed Email Stalling:** Created privileged local API endpoint `/api/auth/confirm` and auto-confirm during registration to ensure test accounts persist directly to PostgreSQL.
- [x] `P0` **Provisioned Permanent Demo Personas:** Created and verified permanent test accounts in Supabase database (`patient@medimind.ai`, `doctor@medimind.ai`, `pharmacy@medimind.ai`, `admin@medimind.ai`).
- [ ] `P1` **Continuous Regression Testing:** Re-run verification scripts (`scripts/verify_*.js`) against live database to ensure baseline 0001–0009 stability.

---

### 2.2 Patient Domain
- [x] `P1` Patient profile creation and ABHA ID storage.
- [x] `P1` Multi-symptom selection and ML preliminary triage execution.
- [x] `P1` Doctor directory browsing with specialty and fee filters.
- [x] `P1` Appointment slot booking via atomic RPC `create_appointment_tx`.
- [x] `P1` Digital prescription review and one-click pharmacy order placement.
- [ ] `P2` Add client-side appointment cancellation confirmation modal.
- [ ] `P2` Implement patient prescription download as formatted PDF.

---

### 2.3 Doctor Domain
- [x] `P1` Weekly schedule management in `doctor_availability`.
- [x] `P1` Appointment queue management with filtering by date and status.
- [x] `P1` Patient clinical history access via `patient_doctor_access` bridge.
- [x] `P1` Teleconsultation interface with meeting URL routing.
- [x] `P1` Digital prescription creation with tamper-evident `rx_id`.
- [ ] `P2` Refine audio visualizer UI during ambient scribe capture.

---

### 2.4 Pharmacy Domain
- [x] `P1` Inventory catalog management with unit pricing and batch tracking.
- [x] `P1` Real-time order queue with status filters (`pending`, `packed`, etc.).
- [x] `P1` Atomic stock decrementing during order placement via `create_medicine_order_tx`.
- [x] `P1` Order lifecycle advancement (`accept` -> `dispense` -> `dispatch` -> `deliver`).
- [ ] `P2` Automated low-stock email/in-app alert when quantity falls below reorder threshold.

---

### 2.5 Administrator Domain
- [x] `P1` Practitioner credential verification queue (`verify_doctor_tx`).
- [x] `P1` Pharmacy state drug license verification queue (`verify_pharmacy_tx`).
- [x] `P1` Immutable audit log inspection interface (`/admin/audit`).
- [x] `P1` System telemetry and rate limit event surveillance.
- [ ] `P2` Export audit logs to encrypted CSV for compliance archiving.

---

### 2.6 AI, ML & RAG Intelligence
- [x] `P0` Isolate ML classification confidence from clinical risk urgency.
- [x] `P0` Enforce Risk Engine precedence over LLM generative responses.
- [x] `P0` Neutralize prompt injection using XML boundaries (`<untrusted_patient_input>`).
- [x] `P1` Implement controlled RAG retriever referencing WHO and ICMR guidelines.
- [x] `P1` Strip unverified or hallucinated citation IDs in `ClinicalSafetyGuard`.
- [ ] `P2` Expand RAG guideline corpus to cover rare tropical diseases.

---

### 2.7 Medical Report Processing
- [x] `P0` Enforce ephemeral report file quarantine and automatic post-processing deletion.
- [x] `P0` Validate file magic bytes to reject executable masquerading as PDF/image.
- [x] `P1` PyMuPDF digital text extraction with OCR fallback.
- [x] `P1` Finding normalizer mapping raw lab markers to 132 canonical symptoms.
- [ ] `P2` Add visual bounding boxes for scanned PDF preview in UI.

---

### 2.8 Database & Security
- [x] `P0` Maintain frozen baseline 0001–0009 (**Do NOT create migration 0010**).
- [x] `P0` Enforce 100% RLS coverage on all public schema tables.
- [x] `P0` Prevent non-admin mutation of `user_roles` and `approval_status`.
- [x] `P0` Verify zero service-role keys or Gemini secrets exposed in frontend bundles.
- [ ] `P1` Audit database query response times under high-concurrency connection pools.

---

### 2.9 Testing & Documentation
- [x] `P0` Create comprehensive `docs/README.md` onboarding guide.
- [x] `P0` Create complete `docs/PRD.md` requirements document.
- [x] `P0` Create multi-tier `docs/ARCHITECTURE.md` with 12 Mermaid diagrams.
- [x] `P0` Create `docs/DESIGN.md` design system tokens & 42-page inventory.
- [x] `P0` Create `docs/DATABASE.md` schema, RLS, and RPC guide.
- [x] `P0` Create `docs/AI_ML.md` engineering guide.
- [x] `P0` Create `docs/SECURITY.md` HIPAA and RBAC guide.
- [x] `P0` Create `docs/DEVELOPMENT.md` local onboarding guide.
- [x] `P0` Create `docs/TESTING.md` test strategy and verification commands.
- [x] `P0` Create `.agent/rules/development.rule` for all future AI coding agents.
- [ ] `P1` Create `docs/MEMORY.md`, `docs/TROUBLESHOOTING.md`, and `docs/GLOSSARY.md`.
