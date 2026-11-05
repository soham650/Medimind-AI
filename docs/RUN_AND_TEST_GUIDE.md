# MEDIMIND AI — RUN & TEST COMMAND REFERENCE GUIDE

A complete operational guide for starting, developing, building, and running automated test suites across the MediMind AI healthcare platform.

---

## 1. Quick Start: Running the Platform

To run the complete platform, open **two separate terminal windows** (one for the backend and one for the frontend).

### Terminal 1: Backend ML Microservice (FastAPI + Python)

```powershell
# 1. Navigate to the ml-service directory
cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind\ml-service

# 2. Run with the virtual environment Python interpreter
.\venv\Scripts\python.exe main.py
```

* **Service URL:** `http://localhost:8000`
* **Health Check:** `http://localhost:8000/health`
* **Interactive API Docs (Swagger UI):** `http://localhost:8000/docs`
* **Alternative Uvicorn command:**
  ```powershell
  .\venv\Scripts\uvicorn.exe main:app --host 0.0.0.0 --port 8000 --reload
  ```

---

### Terminal 2: Frontend Web Application (React + Vite)

```powershell
# 1. Navigate to the frontend directory
cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind\frontend

# 2. Install dependencies (only needed on initial setup or package changes)
npm install

# 3. Start the Vite development server
npm run dev
```

* **Frontend Web App URL:** `http://localhost:5173`
* **Default landing:** Auto-redirects to `/predict` (Symptom Checker) or respective portal depending on login status.

---

## 2. Production Build Commands

To validate TypeScript/JSX syntax and compile production bundles:

```powershell
# From the project root:
npm run build --prefix frontend

# Or from inside the frontend directory:
cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind\frontend
npm run build
npm run preview   # Previews the production dist/ bundle locally
```

---

## 3. Automated Verification & Regression Test Suites

All automated tests connect to the verified live Supabase target (`smmelvzldriqujaodckf.supabase.co`) using non-destructive, ephemeral synthetic test identities that clean up automatically after execution.

> **Note:** Run all Node verification scripts from the **project root directory**:  
> `cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind`

---

### WebRTC Live Video Consultation Platform (25 Tests)
Tests raw browser-native WebRTC peer connection abstraction, STUN configuration, Supabase Realtime signaling, doctor license verification gates, participant authorization, ICE candidate buffering, bounded reconnection, and zero PHI in signaling.

```powershell
node scripts/verify_webrtc_consultation.js
```

---

### Phase 9: Notification & Communication Platform (40 Tests)
Tests multi-channel notification routing, in-memory idempotency TTL deduplication, bounded exponential retry engines, strict `NOT_CONFIGURED` credentials security, and multilingual localization (EN, HI, MR).

```powershell
node scripts/verify_phase9_notification_platform.js
```

---

### Phase 8: Advanced AI Clinical Intelligence & RAG (42 Tests)
Tests server-side Gemini orchestrator, prompt injection neutralization, PII/PHI scrubbing, closed-loop RAG citations, uncertainty framing, and deterministic emergency red-flag supremacy.

```powershell
node scripts/verify_phase8_ai_intelligence.js
```

---

### Phase 7: Admin & Super Admin Platform (35 Tests)
Tests `is_admin()` and `is_super_admin()` RPCs, immutable audit log enforcement, privilege escalation protection, least-privilege medical record isolation, and doctor/pharmacy verification workflows.

```powershell
node scripts/verify_phase7_admin_platform.js
```

---

### Phase 6: Pharmacy Platform & FEFO Engine (34 Tests)
Tests multi-batch FEFO inventory deduction, stock reservation atomicity, insufficient-stock rollback, pharmacy isolation, and prescription fulfillment transactions.

```powershell
node scripts/verify_phase6_pharmacy_platform.js
```

---

### Phase 5: Doctor Platform & Clinical EHR (29 Tests)
Tests doctor session authorization, patient-doctor access bridges, digital prescription generation via RPC, consultation notes, and cross-doctor data isolation.

```powershell
node scripts/verify_phase5_doctor_platform.js
```

---

### Phase 4: Patient Experience & Portal (21 Tests)
Tests patient appointment booking via `create_appointment_tx`, double-booking prevention, report uploads, order placements, and cross-patient isolation.

```powershell
node scripts/verify_phase4_patient_experience.js
```

---

### Migration 0009 Remediation Regression Suite (11 Tests)
Validates database integrity for Migration 0009, inventory concurrency, RLS policy enforcement, and privileged RPC restrictions.

```powershell
node scripts/verify_remediation_0009.js
```

---

### Phase 1 & 2: Symptom Checker & Medical Report Analyzer (21 Tests)
Tests Random Forest 132-symptom classifier, clinical risk engine, PDF/PNG/JPG lab report parsing, and file size/format rejection.
*(Requires the ML service to be running on `http://127.0.0.1:8000`)*

```powershell
node scripts/verify_symptom_and_report_checker.js
```

---

### Python ML Pytest Suite (33 Tests)
Runs unit and integration tests across data normalizers, report parsers, prompt sanitizers, and clinical schemas.

```powershell
cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind\ml-service
.\venv\Scripts\pytest.exe tests
cd ..
```

---

## 4. Run All Test Suites in One Command

You can run the complete platform regression verification suite sequentially with this PowerShell command:

```powershell
# From project root:
cd c:\Users\HP\.gemini\antigravity-ide\scratch\medimind

# Run all test suites
node scripts/verify_webrtc_consultation.js; `
node scripts/verify_phase9_notification_platform.js; `
node scripts/verify_phase8_ai_intelligence.js; `
node scripts/verify_phase7_admin_platform.js; `
node scripts/verify_phase6_pharmacy_platform.js; `
node scripts/verify_phase5_doctor_platform.js; `
node scripts/verify_phase4_patient_experience.js; `
node scripts/verify_remediation_0009.js; `
npm run build --prefix frontend; `
cd ml-service; .\venv\Scripts\pytest.exe tests; cd ..
```

---

## 5. Port and Service Summary

| Service | Port | Directory | Start Command |
| :--- | :--- | :--- | :--- |
| **Frontend (React/Vite)** | `5173` | `frontend/` | `npm run dev` |
| **ML Backend (FastAPI)** | `8000` | `ml-service/` | `.\venv\Scripts\python.exe main.py` |
| **Supabase (Cloud)** | `443` | Remote (`smmelvzldriqujaodckf`) | Managed via `.env` credentials |
| **API Docs (Swagger)** | `8000` | Browser URL | `http://localhost:8000/docs` |
| **Health Endpoint** | `8000` | Browser/Curl | `http://localhost:8000/health` |

---

## 6. Environment Configurations

Both services use `.env` files for configuration:
* `frontend/.env`: Contains public client-side Supabase URL (`VITE_SUPABASE_URL`) and anonymous publishable key (`VITE_SUPABASE_ANON_KEY`), plus `VITE_ML_SERVICE_URL=http://localhost:8000`. **Never place secret keys or service-role keys here.**
* `ml-service/.env`: Contains server-side `SUPABASE_SERVICE_ROLE_KEY`, `GEMINI_API_KEY`, and `GEMINI_MODEL=gemini-3.5-flash-lite`.
