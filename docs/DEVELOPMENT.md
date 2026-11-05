# MediMind AI — Developer Onboarding & Local Environment Guide

**Document Status:** VERIFIED ONBOARDING SPECIFICATION  
**Target Audience:** New developers, engineers, QA testers, and AI agents  
**Primary Stack:** React 18, Vite 5, Supabase PostgreSQL 15+, Python 3.10+, FastAPI  
**Repository Root:** `MediMind-AI/`

---

## 1. Prerequisites & System Requirements

Before setting up MediMind AI, ensure your local development workstation satisfies these requirements:

| Tool | Minimum Version | Recommended | Verification Command |
|---|---|---|---|
| **Node.js** | `v18.0.0` | `v20.x LTS` | `node -v` |
| **npm** | `9.0.0` | `10.x` | `npm -v` |
| **Python** | `3.10.0` | `3.11.x` | `python --version` |
| **Git** | `2.30.0` | Latest | `git --version` |
| **PowerShell / Bash** | Windows PS 5.1+ or Bash | PowerShell Core / zsh | `$PSVersionTable.PSVersion` |
| **Supabase CLI** (Optional) | `1.100.0+` | Latest | `supabase --version` |

---

## 2. Environment Variables Specification

MediMind AI segregates configuration between the untrusted browser frontend and the privileged backend/ML services.

### 2.1 Master Environment Variables Catalog

| Variable Name | Purpose | Required? | Consumed By | Safe for Frontend? | Secret? | Example Format (Placeholder) | Location Configured |
|---|---|---|---|---|---|---|---|
| `VITE_SUPABASE_URL` | Supabase API project endpoint | **Yes** | Frontend (`supabaseClient.js`) | **Yes** | No | `https://xyzproject.supabase.co` | `frontend/.env` |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous JWT key for PostgREST | **Yes** | Frontend (`supabaseClient.js`) | **Yes** | No | `eyJhbGciOiJIUzI1NiIsIn...` | `frontend/.env` |
| `VITE_ML_SERVICE_URL` | Local or cloud URL for Python ML API | **Yes** | Frontend (`ai.service.js`) | **Yes** | No | `http://localhost:8000` | `frontend/.env` |
| `VITE_WEBRTC_STUN_URL` | Public Google STUN server for P2P video | Optional | Frontend (`video.service.js`) | **Yes** | No | `stun:stun.l.google.com:19302` | `frontend/.env` |
| `SUPABASE_URL` | Server-side Supabase project endpoint | **Yes** | ML service (`config.py`) | No | No | `https://xyzproject.supabase.co` | `ml-service/.env` |
| `SUPABASE_SERVICE_ROLE_KEY` | Admin service-role key (bypasses RLS) | **Yes** | ML service & Vite auth plugin | **NEVER** | **YES (CRITICAL)** | `eyJhbGciOiJIUzI1NiIsIn...` | `ml-service/.env` |
| `GEMINI_API_KEY` | Google AI Studio API key for Gemini models | **Yes** | ML service (`ai_provider.py`) | **NEVER** | **YES (CRITICAL)** | `AIzaSyD...` | `ml-service/.env` |
| `GEMINI_REPORT_MODEL` | Specific Gemini model identifier | No | ML service (`config.py`) | No | No | `gemini-2.5-flash-lite` | `ml-service/.env` |
| `PORT` | Local HTTP binding port for FastAPI | No | ML service (`main.py`) | No | No | `8000` | `ml-service/.env` |
| `MAX_REPORT_SIZE_MB` | File size limit for uploaded PDF reports | No | ML service (`document_parser.py`) | No | No | `15` | `ml-service/.env` |
| `REPORT_ANALYSIS_TIMEOUT_SECONDS` | Timeout before falling back to cached RAG | No | ML service (`ai_provider.py`) | No | No | `25` | `ml-service/.env` |
| `REPORT_RATE_LIMIT` | Max requests per IP in sliding window | No | ML service (`rate_limiter.py`) | No | No | `15` | `ml-service/.env` |

> [!CAUTION]
> **Zero Secrets in Frontend:**  
> Never commit real secret keys to source control. Never prefix `SUPABASE_SERVICE_ROLE_KEY` or `GEMINI_API_KEY` with `VITE_`. If a secret is prefixed with `VITE_`, Vite bundles it into public client JavaScript where anyone can extract it.

---

## 3. Step-by-Step Local Setup From Scratch

### Step 1: Clone the Repository
```bash
git clone https://github.com/soham650/Medimind-AI.git
cd Medimind-AI
```

### Step 2: Configure Environment Files
1. **Frontend:**
   ```bash
   cp frontend/.env.example frontend/.env
   ```
   Open `frontend/.env` and paste your Supabase URL and public Anonymous key.

2. **ML Service:**
   ```bash
   cp ml-service/.env.example ml-service/.env
   ```
   Open `ml-service/.env` and paste your Supabase URL, Service Role key, and Gemini API key.

---

### Step 3: Frontend Setup & Dependencies
```bash
# Navigate to frontend
cd frontend

# Install exact npm dependencies
npm install

# Verify production build succeeds cleanly
npm run build
```

---

### Step 4: Python ML Microservice Setup
Open a separate terminal window:
```powershell
# Navigate to ml-service
cd ml-service

# Create isolated Python virtual environment
python -m venv venv

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

# Install required dependencies
pip install -r requirements.txt

# Run test suite to verify model artifacts
pytest tests/
```

---

### Step 5: Database Baseline (0001–0009)
The database schema is already applied to the connected Supabase instance (`smmelvzldriqujaodckf.supabase.co`).
If setting up a fresh local Supabase instance:
```bash
# Apply baseline migrations in strict sequential order
supabase migration up
# OR execute files 0001 through 0009 in Supabase SQL Editor
```

> [!WARNING]
> **Do NOT create migration 0010.** Migrations 0001 through 0009 represent the frozen architectural baseline.

---

## 4. Running the Development Environment

### 4.1 Service Startup Order
To run MediMind AI with full functionality, start the services in the following order:
1. **Database:** Supabase cloud project or local instance (always online).
2. **ML Microservice:** FastAPI Python server on port 8000.
3. **Frontend Client:** Vite React server on port 3000.

### 4.2 Start Frontend Server
From `frontend/`:
```bash
npm run dev
```
- Local URL: **`http://localhost:3000/`**
- Network URL: **`http://0.0.0.0:3000/`**

### 4.3 Start ML Microservice
From `ml-service/` (with `venv` activated):
```bash
uvicorn main:app --reload --port 8000
```
- API Endpoint: **`http://localhost:8000/`**
- Interactive Swagger Docs: **`http://localhost:8000/docs`**
- Health Check: **`http://localhost:8000/health`**

---

## 5. Development Verification & Build Commands

| Target | Command | Purpose | Expected Output |
|---|---|---|---|
| **Frontend Dev** | `npm run dev` | Runs Vite dev server with HMR | `Local: http://localhost:3000/` |
| **Frontend Build** | `npm run build` | Compiles production bundle | `✓ built in ~10s` with zero errors |
| **Frontend Preview**| `npm run preview` | Previews production build | `Local: http://localhost:3000/` |
| **ML Service Dev** | `uvicorn main:app --reload` | Runs FastAPI server with auto-reload | `Uvicorn running on http://127.0.0.1:8000` |
| **ML Unit Tests** | `pytest tests/` | Executes Python regression suite | `test_phase1.py` & report tests pass |

---

## 6. Pre-Provisioned Test Accounts

To immediately test the 4 operational modules without manual registration, use the pre-provisioned demo accounts:

| Role | Email | Password | Primary Module Route |
|---|---|---|---|
| **Patient** | `patient@medimind.ai` | `Patient@123` | `/patient/dashboard` |
| **Doctor** | `doctor@medimind.ai` | `Doctor@123` | `/doctor/dashboard` |
| **Pharmacist**| `pharmacy@medimind.ai`| `Pharmacy@123`| `/pharmacy/dashboard` |
| **Admin** | `admin@medimind.ai` | `Admin@123` | `/admin/dashboard` |

> [!TIP]
> On the login page (`/login`), click the **"Quick Demo Sign-In"** button to automatically populate credentials and sign into the selected role in 1 click.

---

## 7. Common Setup Errors & Solutions

### Issue 1: `Email not confirmed` on Login
- **Cause:** Supabase project enforces email confirmation by default.
- **Fix:** The frontend automatically calls `/api/auth/confirm` via `vite-auth-plugin.js` during dev, or sign in via the demo accounts which are pre-confirmed.

### Issue 2: `Vite Port 3000 in Use`
- **Cause:** A background dev server is already running on port 3000.
- **Fix:** Terminate existing node processes (`Get-Process node | Stop-Process` on Windows) or Vite will automatically offer port 3001.

### Issue 3: `ModuleNotFoundError: No module named 'src'` in ML Service
- **Cause:** Python path not recognizing `ml-service` root directory.
- **Fix:** Run uvicorn from the `ml-service/` root directory, or set `$env:PYTHONPATH="."` before launching.

### Issue 4: `RLS policy violation on INSERT into user_roles`
- **Cause:** Attempting to assign or modify roles directly from client frontend code without admin privileges.
- **Fix:** Roles must be created server-side via `vite-auth-plugin.js` using `SUPABASE_SERVICE_ROLE_KEY` or managed by an administrator.
