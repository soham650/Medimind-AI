# MediMind AI — Practical Troubleshooting & Diagnostics Guide

**Document Status:** VERIFIED ENGINEERING RUNBOOK  
**Scope:** Real-world failures, configuration errors, and diagnostic procedures observed in MediMind AI  
**Target Audience:** Developers, DevOps engineers, QA testers, and AI coding agents

---

## 1. Authentication & Role Resolution Issues

### Issue 1.1: "Email not confirmed" on Login
- **Problem:** User enters valid credentials on `/login` but receives an error stating *"Email not confirmed"*, preventing login.
- **Symptoms:** User cannot log in; network tab shows HTTP 400 from Supabase GoTrue with message `Email not confirmed`.
- **Cause:** Supabase Auth cloud projects enforce email confirmation by default. Standard `supabase.auth.signUp()` creates an unconfirmed user where `session` is `null`.
- **How to Diagnose:** Inspect browser DevTools Console or Network tab for `/auth/v1/token?grant_type=password`.
- **Fix:**
  1. In local development, the frontend automatically intercepts this error and calls `/api/auth/confirm` via [`vite-auth-plugin.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/vite-auth-plugin.js).
  2. For test accounts, sign in using the pre-confirmed demo accounts (`patient@medimind.ai`, `doctor@medimind.ai`, etc.).
  3. In Supabase Dashboard, disable *"Confirm email"* under **Authentication -> Email Auth -> Email Confirmations**.
- **Verification:** User signs in and immediately receives a valid JWT session.
- **Related Files:** [`frontend/src/services/auth.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/auth.service.js), [`frontend/vite-auth-plugin.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/vite-auth-plugin.js).

---

### Issue 1.2: User Lands on Wrong Dashboard or Cannot Access Role Module
- **Problem:** A Doctor or Pharmacist logs in but gets redirected to `/patient/dashboard` or generic profile page.
- **Symptoms:** Dashboard shows wrong navigation tabs or unauthorized route warnings.
- **Cause:** The user's role was not resolved from `public.user_roles` or `public.profiles`, causing `AuthContext` to default to `'patient'`.
- **How to Diagnose:** Open browser console and inspect `[AuthService] Resolved role: ...`. Check if `user_roles` table contains a record for the user's `auth.uid()`.
- **Fix:** Ensure [`auth.service.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/src/services/auth.service.js) queries multiple fallbacks: `user_roles` -> `profiles` -> `user_metadata` -> `doctors`/`pharmacies` tables.
- **Verification:** Logging in as `doctor@medimind.ai` routes directly to `/doctor/dashboard`.

---

## 2. Database & Row-Level Security (RLS) Issues

### Issue 2.1: `new row violates row-level security policy` on Registration
- **Problem:** During account creation, registration fails when trying to insert into `public.doctors` or `public.pharmacies`.
- **Symptoms:** Toast error *"Failed to save practitioner profile: new row violates row-level security policy"*.
- **Cause:** RLS policies on `doctors` and `pharmacies` restrict `INSERT` to users with `public.is_admin() = true`. A freshly registered unconfirmed user has no admin authority to insert into clinical directories.
- **How to Diagnose:** Check PostgreSQL query logs in Supabase Dashboard.
- **Fix:** Route account creation through the privileged endpoint `/api/auth/register` provided by [`vite-auth-plugin.js`](file:///c:/Users/HP/.gemini/antigravity-ide/scratch/medimind/frontend/vite-auth-plugin.js), which uses `SUPABASE_SERVICE_ROLE_KEY` to insert profile, role, and directory records server-side.
- **Verification:** Registering a new doctor via `/register` succeeds and creates records across `auth.users`, `profiles`, `user_roles`, and `doctors`.

---

### Issue 2.2: Doctor Cannot See Patient Health Records
- **Problem:** Treating doctor navigates to `/doctor/consultations/:id` and medical records section is completely empty.
- **Symptoms:** `medical_records` query returns `data: []` even though the patient has uploaded past lab reports.
- **Cause:** The 14-day `patient_doctor_access` bridge is missing or expired (`expires_at < NOW()`). RLS policy `medical_records_select_authorized` blocks the doctor from querying the records.
- **How to Diagnose:** Execute SQL:
  ```sql
  SELECT * FROM public.patient_doctor_access 
  WHERE doctor_id = '...' AND patient_id = '...';
  ```
- **Fix:** Ensure appointments are booked via `create_appointment_tx`, which automatically inserts an active 14-day record into `public.patient_doctor_access`.
- **Verification:** Querying `medical_records` as the assigned doctor returns the patient's records.

---

## 3. Atomic Stored Procedures (RPC) Issues

### Issue 3.1: Appointment Booking Rejection (Anti-Double Booking)
- **Problem:** Patient selects a date and slot, but booking fails with error *"Slot is already booked for this doctor"*.
- **Symptoms:** UI displays alert *"This time slot has already been reserved by another patient. Please choose a different slot."*
- **Cause:** The unique database constraint `UNIQUE (doctor_id, appointment_date, time_slot)` in `public.appointments` caught a concurrent booking attempt.
- **How to Diagnose:** Query `public.appointments` for that `doctor_id`, `appointment_date`, and `time_slot`.
- **Fix:** This is intended behavior. The frontend booking calendar must refresh available slots and grey out the booked slot.
- **Verification:** Re-fetching available slots for the doctor shows the contested slot is marked as `is_booked = true`.

---

### Issue 3.2: Pharmacy Checkout Fails: Insufficient Stock
- **Problem:** Patient submits a medicine order, but the RPC returns `{ "success": false, "error": "Insufficient stock for Paracetamol" }`.
- **Symptoms:** Order creation modal displays error and order is not created.
- **Cause:** `create_medicine_order_tx` acquires a row lock on `pharmacy_inventory` and verifies that `stock_quantity >= quantity`. If inventory has been depleted by another order, the transaction rolls back.
- **How to Diagnose:** Inspect `stock_quantity` in `public.pharmacy_inventory` for the target pharmacy and medicine ID.
- **Fix:** Update inventory stock or select an alternative pharmacy with available stock.
- **Verification:** Submitting an order within available stock quantities succeeds and decrements `stock_quantity`.

---

## 4. Frontend & Dev Server Startup Issues

### Issue 4.1: Port 3000 Collision / Address in Use
- **Problem:** Running `npm run dev` in `frontend/` fails or prompts to switch to port 3001.
- **Symptoms:** Terminal message `Port 3000 is in use, trying another one...`
- **Cause:** An orphaned Node.js process is holding port 3000.
- **How to Diagnose:**
  - Windows: `Get-NetTCPConnection -LocalPort 3000`
  - Linux/Mac: `lsof -i :3000`
- **Fix:**
  - Windows PowerShell: `Get-Process node | Stop-Process -Force`
  - Restart dev server: `npm run dev`
- **Verification:** Dev server starts cleanly on `http://localhost:3000/`.

---

### Issue 4.2: Vite Production Build Failure
- **Problem:** Running `npm run build` fails with syntax or unresolved import errors.
- **Symptoms:** Rollup error output indicating broken module path or undefined variable.
- **Cause:** Unresolved component import or missing dependency.
- **How to Diagnose:** Run `npm run build` and read the exact file and line number in the Rollup error output.
- **Fix:** Fix missing import or typo. Verify dependencies in `package.json`.
- **Verification:** `npm run build` completes with `✓ built in ~10s` and exit code 0.

---

## 5. Python ML Microservice Issues

### Issue 5.1: `ModuleNotFoundError: No module named 'src'`
- **Problem:** Starting FastAPI server with `uvicorn src.main:app` fails with import error.
- **Symptoms:** Python traceback showing `ModuleNotFoundError: No module named 'src'`.
- **Cause:** Executing uvicorn from a subfolder rather than the root `ml-service/` directory.
- **How to Diagnose:** Check current working directory (`pwd` or `Get-Location`).
- **Fix:** Ensure you are in `ml-service/` root and run:
  ```powershell
  cd ml-service
  .\venv\Scripts\Activate.ps1
  $env:PYTHONPATH="."
  uvicorn main:app --reload --port 8000
  ```
- **Verification:** Terminal displays `Uvicorn running on http://127.0.0.1:8000`.

---

### Issue 5.2: Gemini API Fallback (Quota Exceeded or Missing Key)
- **Problem:** Medical report analysis or AI explanation returns canned clinical rules rather than dynamic generative text.
- **Symptoms:** ML service logs contain `[AIProvider] Warning: Gemini API request timed out or returned 429; activating local RAG fallback`.
- **Cause:** `GEMINI_API_KEY` is missing in `ml-service/.env`, or the Google AI Studio quota has been exhausted.
- **How to Diagnose:** Test key with `python tests/verify_live_gemini.py`.
- **Fix:** Check `ml-service/.env` for valid `GEMINI_API_KEY`. If quota is exhausted, system operates safely on deterministic RAG fallback protocols without throwing 500 errors to users.
- **Verification:** Running `verify_live_gemini.py` returns HTTP 200 with structured JSON response.

---

## 6. Medical Report Upload Issues

### Issue 6.1: `File size exceeds 15 MB limit`
- **Problem:** User uploads a high-resolution CT scan or large multi-page PDF and upload fails.
- **Symptoms:** UI displays alert *"File size exceeds 15MB. Please upload a compressed document."*
- **Cause:** Enforced security boundary in `document_parser.py` preventing denial-of-service through memory exhaustion.
- **Fix:** Compress PDF or upload individual relevant laboratory report pages.

### Issue 6.2: `Unsupported file type (HTTP 415)`
- **Problem:** User uploads a `.docx`, `.txt`, or renamed binary file.
- **Symptoms:** Server returns HTTP 415 Unsupported Media Type.
- **Cause:** `document_parser.py` verifies MIME type and file magic bytes. Only `application/pdf`, `image/jpeg`, and `image/png` are permitted.
- **Fix:** Convert document to standard PDF or JPEG before uploading.

---

## 7. WebRTC Video Teleconsultation Issues

### Issue 7.1: Black Video Screen or No Audio
- **Problem:** Doctor and Patient enter `/doctor/consultations/:id` but cannot see or hear each other.
- **Symptoms:** Video elements display spinner or black feed; browser console reports `NotAllowedError: Permission denied`.
- **Cause:** Browser camera/microphone permissions blocked, or NAT traversal failure behind symmetric corporate firewalls.
- **How to Diagnose:**
  1. Check browser address bar for camera/mic permission prompt.
  2. Check console for `ICE connection state: failed`.
- **Fix:**
  1. Click lock icon in browser address bar and grant Camera and Microphone access.
  2. Verify STUN server URL `stun:stun.l.google.com:19302` in `frontend/.env`.
- **Verification:** Remote audio/video streams render in the consultation video frame.
