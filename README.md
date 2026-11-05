# MediMind AI — Smart Healthcare & Clinical Intelligence Platform

[![React](https://img.shields.io/badge/React-18.3-61dafb?style=for-the-badge&logo=react)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-5.2-646cff?style=for-the-badge&logo=vite)](https://vitejs.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)
[![Python](https://img.shields.io/badge/Python-3.13-3776ab?style=for-the-badge&logo=python)](https://python.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ecf8e?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v3-38bdf8?style=for-the-badge&logo=tailwindcss)](https://tailwindcss.com/)

**MediMind AI** is an end-to-end, multi-portal digital healthcare and clinical intelligence platform. Built with modern web technologies, machine learning microservices, and India's ABDM (Ayushman Bharat Digital Mission) architectural principles, it seamlessly connects **Patients**, **Licensed Doctors/Pediatricians**, **Pharmacies**, and **Super Administrators**.

---

## 🌟 Key Platform Portals & Features

### 1. 🧒 Patient Portal & Dual Intake AI Disease Predictor
* **Dual Guided Intake Pathways:**
  * **Mode 1 (Symptoms & Signs):** 8 Quick interactive symptom tiles (Headache, Fever, Cough, Upset Stomach, Fatigue, Throat, Light Sensitivity, Ear Discomfort), discomfort levels (Mild/Moderate/Severe), onset timelines, speech-to-text voice input, and custom symptom search tags.
  * **Mode 2 (Clinic Lab Slip Reader):** OCR & AI-powered medical slip scanner for CBC & CRP blood test reports with plain-language biomarker translations (WBC, CRP, Hb, Platelets).
* **Real-Time AI Multi-Engine Triage:**
  * Probability predictions with ICD-10 diagnostic coding (e.g. Sinus Congestion 84%, Digital Eye Strain 61%).
  * Pediatric Tria-Score safety checks (All 4 Safe & Sound verification).
  * Recommended home care steps (hydration, screen-free rest, cool compress).
  * Direct Emergency SOS (108 Ambulance Dispatch).
* **Doctor Consultations:** Instant pediatric video visits and after-school appointment scheduling.
* **Digital Health Vault:** ABHA records locker, digital prescriptions, and personal health twin.

### 2. 🩺 Doctor Clinical Intel Suite (`Dr. Sarah Chen, MD`)
* **Real-time Clinical Dashboard:** Inpatient census monitoring, critical vitals alerts, and bed occupancy metrics.
* **Telemedicine Consultation Room:** Integrated WebRTC video room with real-time SOAP clinical notes (Subjective, Objective, Assessment, Plan) and digital prescription generator.
* **AI Clinical Insights:** Multi-layer machine learning models (NLP symptom engine, risk assessment models, and disease correlation).
* **Patient Electronic Health Records (EHR):** Longitudinal lab biomarker trend charts (cholesterol, glucose, lipid profiles).

### 3. 💊 Pharmacy Portal & Multi-Batch Inventory Suite
* **Real-time Inventory & Dispensing:** Live medicine stock tracking with low-stock alerts and order processing.
* **Deterministic FEFO/FIFO Batch Management:** Multi-batch inventory tracking with automated FEFO (First-Expired, First-Out) sequential consumption preventing batch stock collisions.
* **Prescription Verification & Order Processing:** Validation of doctor digital prescriptions and fulfillment workflows.

### 4. 🛡️ Super Admin Portal (Platform Governance)
* **Doctor Credentialing Gate:** Verification of medical council registration numbers, university degrees, and clinical credentials before granting practice privileges.
* **Pharmacy Licensing Gate:** Verification of state drug control permits and pharmacy retail licenses.
* **Audit & Compliance Trail:** Tamper-evident logging of all prescription generation, patient record access, and admin credentialing actions.
* **User & System Governance:** Dynamic user role management and platform configuration controls.

---

## 🏗️ System Architecture & Tech Stack

```
medimind/
├── frontend/             # React 18 + Vite + Tailwind CSS + Lucide Icons
│   ├── src/
│   │   ├── components/   # Modular UI components
│   │   ├── context/      # AuthContext with multi-role state management
│   │   ├── lib/          # mlApi.js client and Supabase client
│   │   ├── pages/        # Patient, Doctor, Pharmacy, and Admin portals
│   │   └── services/     # Clinical and data layer services
│   └── package.json
│
├── ml-service/           # FastAPI Machine Learning Core Microservice
│   ├── app/
│   │   ├── main.py       # FastAPI application entrypoint & CORS
│   │   ├── routers/      # Disease prediction, risk assessment, report analysis
│   │   ├── models/       # Pickled ML models (Random Forest, SHAP explainers)
│   │   ├── schemas/      # Pydantic data schemas
│   │   └── services/     # Gemini AI & confidence scoring engines
│   ├── requirements.txt  # Python dependencies
│   └── Dockerfile
│
├── supabase/             # PostgreSQL database migrations & RLS policies
└── docker-compose.yml    # Multi-container orchestration
```

---

## 🚀 Setup & Installation Guide

### 📋 Prerequisites
Make sure you have the following installed on your machine:
* **Node.js**: v18.0 or higher ([Download Node.js](https://nodejs.org/))
* **Python**: v3.11, 3.12, or 3.13 ([Download Python](https://www.python.org/))
* **Git**: ([Download Git](https://git-scm.com/))
* *(Optional)* **Docker & Docker Compose**: ([Download Docker Desktop](https://www.docker.com/))

---

### 1️⃣ Clone the Repository
```bash
git clone https://github.com/soham650/Medimind-AI.git
cd Medimind-AI
```

---

### 2️⃣ Backend Setup (FastAPI ML Service — Port 8000)

Open a terminal and navigate to `ml-service`:

```powershell
# Navigate to backend directory
cd ml-service

# Create a Python virtual environment
py -3.13 -m venv venv
# (or: python -m venv venv)

# Activate virtual environment
# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# (or Windows CMD: .\venv\Scripts\activate.bat)
# (or macOS/Linux: source venv/bin/activate)

# Install required Python packages
pip install --upgrade pip
pip install -r requirements.txt

# Start the FastAPI Backend Server on Port 8000
uvicorn main:app --reload --port 8000
```

> **Direct Windows Shortcut (without manual activation):**
> ```powershell
> .\venv\Scripts\python.exe -m uvicorn main:app --reload --port 8000
> ```

* **Backend Health Check:** [http://localhost:8000/health](http://localhost:8000/health)
* **Interactive Swagger API Docs:** [http://localhost:8000/docs](http://localhost:8000/docs)

---

### 3️⃣ Frontend Setup (React + Vite — Port 3000)

Open a **new, separate terminal** and navigate to `frontend`:

```bash
# Navigate to frontend directory
cd frontend

# Install Node dependencies
npm install

# Start the Vite Development Server on Port 3000
npm run dev
```

* **Frontend Web App:** [http://localhost:3000](http://localhost:3000)

---

### 4️⃣ Environment Variables Setup

#### Frontend (`frontend/.env`)
Create a `.env` file in the `frontend/` directory (or copy from `.env.example`):
```env
VITE_SUPABASE_URL=https://your-supabase-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
VITE_ML_SERVICE_URL=http://localhost:8000
VITE_GEMINI_API_KEY=your_google_gemini_api_key
VITE_GEMINI_MODEL=gemini-1.5-flash
```

#### Backend (`ml-service/.env`)
Create a `.env` file in the `ml-service/` directory:
```env
SUPABASE_URL=https://your-supabase-id.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key
GEMINI_API_KEY=your_google_gemini_api_key
PORT=8000
```

---

### 🐳 Alternative: Run with Docker Compose
To build and run both Frontend and Backend together in isolated containers:

```bash
docker-compose up --build
```
* Frontend will be accessible at: `http://localhost:3000`
* Backend will be accessible at: `http://localhost:8000`

---

## 🧭 Navigating Between Portals

MediMind AI provides seamless 1-click role switching in test mode via the left sidebar footer:
* **Patient Disease Predictor & Portal:** [http://localhost:3000/predict](http://localhost:3000/predict)
* **Doctor Clinical Intel Suite:** [http://localhost:3000/doctor/dashboard](http://localhost:3000/doctor/dashboard)
* **Pharmacy Portal & Inventory:** [http://localhost:3000/pharmacy/dashboard](http://localhost:3000/pharmacy/dashboard)
* **Super Admin Governance Portal:** [http://localhost:3000/admin/dashboard](http://localhost:3000/admin/dashboard)

---

## 🗄️ Supabase Production Database & Live Verification

The backend is backed by a fully hardened Supabase PostgreSQL instance:
* **Schema Definition:** `supabase/complete_database_schema_and_migrations.sql` (44 core tables, partial unique index `uq_appointment_slot`, triggers, and hardened RPCs).
* **Production Remediation Patch:** `supabase/migrations/0009_production_issue_remediation.sql` (implements row-locked deterministic FEFO batch allocation in `create_medicine_order_tx` and doctor access bridge RLS policy).
* **Storage Buckets:** 4 provisioned buckets (`medical-documents`, `doctor-documents`, `pharmacy-documents`, `profile-images`) with MIME type whitelist enforcement and private access protection.

### Running Live Verification & Regression Suites
```bash
# Run comprehensive live database audit (44 tables, RLS, storage, RPC security)
node scripts/verify_live_database.js

# Run 11-point live regression suite on inventory FEFO and doctor access RLS
node scripts/verify_remediation_0009.js
```
*Current Verdict:* **LIVE VERIFICATION PASSED (11/11 Regression Tests Passing)**. See full report at [`docs/LIVE_SUPABASE_VERIFICATION_REPORT.md`](docs/LIVE_SUPABASE_VERIFICATION_REPORT.md).

---

## 📡 Core API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Microservice health check & AI layer status |
| `GET` | `/symptoms` | List of supported model symptom features |
| `POST` | `/predict_disease` | Predicts condition with confidence score and ICD-10 codes |
| `POST` | `/predict_risk` | Clinical triage risk calculation based on vitals |
| `POST` | `/analyze` | Gemini OCR multimodal analysis of uploaded lab reports |
| `POST` | `/chat` | Conversational clinical AI triage assistant |

---

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

© 2026 MediMind AI Healthcare Platform. All rights reserved.
