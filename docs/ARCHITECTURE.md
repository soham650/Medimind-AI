# MediMind AI — System Architecture & Technical Specifications

> **Document Status:** IMPLEMENTED & EMPIRICALLY VERIFIED  
> **Last Verified:** September 30, 2026  
> **Current Baseline:** Phase 1–9 Complete | Database Baseline Frozen (0001–0009)  
> **Architectural Standard:** Defense-in-depth, Zero-Trust RLS, Deterministic Safety Invariants

---

## 1. MULTI-TIER SYSTEM ARCHITECTURE

MediMind AI is architected as an asynchronous, decoupled multi-tier clinical intelligence platform:

```
[ Tier 1: Client Layer ]
    │
    ├── Patient Web App (React 18 SPA)
    ├── Doctor Clinical Portal (React 18 SPA)
    ├── Pharmacy Dispensary Workspace (React 18 SPA)
    └── Admin Governance Console (React 18 SPA)
            │
            │ HTTPS (REST / GraphQL / Supabase RPC) + WSS (WebSockets / Signaling)
            ▼
[ Tier 2: Application & API Gateway ]
    │
    ├── Vite Connect Auth Middleware (Local Port 3000 /api/auth/*)
    ├── Supabase Managed PostgREST API Gateway
    └── FastAPI ML Microservice Gateway (Uvicorn Port 8000)
            │
            ├─────────────────────────────────────────┐
            ▼                                         ▼
[ Tier 3: Core Database & Storage ]     [ Tier 4: Clinical AI & ML Service ]
    │                                         │
    ├── Supabase PostgreSQL 15                ├── Symptom Predictor (Random Forest)
    │   ├── 26 Tables                         ├── Deterministic Risk Engine
    │   ├── Frozen Migrations (0001-0009)     ├── Clinical RAG Engine (WHO/ICMR)
    │   ├── 45+ RLS Policies                  ├── Medical Report OCR & Normalizer
    │   └── Transactional RPCs                └── Gemini 3.5 Flash Lite Orchestrator
    │                                                 │
    ├── Supabase Storage Buckets                      │ HTTPS (REST)
    │   ├── medical-documents (Private)               ▼
    │   ├── doctor-documents (Private)          [ Tier 5: External Providers ]
    │   └── pharmacy-documents (Private)              │
    └── Supabase Realtime Channels                    ├── Google Gemini API (AI Studio)
        ├── consultation-{id} (WebRTC)                ├── STUN/TURN (WebRTC Traversal)
        └── notifications-{user_id}                   └── Multi-Channel (Email/SMS/WA)
```

---

## 2. DETAILED LAYER SPECIFICATIONS

### Layer 1: Client Presentation Layer
- **Purpose:** Deliver specialized responsive interfaces for all 4 healthcare personas.
- **Responsibilities:** Client-side state hydration, route protection, interactive vital visualization, WebRTC media rendering.
- **Inputs:** User clicks, form submissions, microphone/camera streams, uploaded PDF/image blobs.
- **Outputs:** Sanitized API payloads, WebRTC SDP offers/answers, rendered UI states.
- **Key Files:** `frontend/src/App.jsx`, `frontend/src/pages/`, `frontend/src/components/`.

### Layer 2: Application & API Gateway Layer
- **Purpose:** Ingress routing, session validation, and privileged onboarding mediation.
- **Responsibilities:** Proxying client requests, handling CORS headers, auto-confirming new dev registrations via `vite-auth-plugin.js`.
- **Inputs:** Client HTTP requests.
- **Outputs:** JSON responses, HTTP status codes, session JWT tokens.
- **Key Files:** `frontend/vite-auth-plugin.js`, `frontend/vite.config.js`.

### Layer 3: Persistence & Storage Layer (Supabase PostgreSQL)
- **Purpose:** Authoritative clinical data store and security boundary.
- **Responsibilities:** ACID transaction execution, anti-double-booking concurrency locks, RLS persona isolation, audit logging.
- **Inputs:** SQL queries, RPC procedure calls, file uploads.
- **Outputs:** Filtered row sets, transaction confirmation receipts, signed storage URLs.
- **Key Files:** `supabase/migrations/0001` through `0009`.

### Layer 4: Clinical AI & Machine Learning Microservice
- **Purpose:** Statistical symptom inference, vital threshold risk evaluation, lab slip extraction.
- **Responsibilities:** Feature vectorization (132 features), Random Forest inference, red-flag emergency detection, RAG retrieval.
- **Inputs:** Symptom array, patient vitals, raw lab PDF/image files.
- **Outputs:** Probabilistic condition list, severity score (0–100), triage tier, normalized biomarker list.
- **Key Files:** `ml-service/main.py`, `ml-service/src/`.

### Layer 5: External Service & Provider Integrations
- **Purpose:** Offloading generative summarization, NAT traversal, and multi-channel delivery.
- **Responsibilities:** Gemini generative explanations, WebRTC peer discovery, SMS/WhatsApp delivery.
- **Security:** Zero private keys exposed to browser; all requests routed server-side or via ephemeral peer tokens.

---

## 3. ARCHITECTURE MERMAID DIAGRAMS

### Diagram 1: High-Level System Architecture

```mermaid
graph TD
    subgraph Client["Client Tier (React 18 SPA)"]
        UI_PAT["Patient Portal"]
        UI_DOC["Doctor Portal"]
        UI_PHM["Pharmacy Portal"]
        UI_ADM["Admin Portal"]
    end

    subgraph Gateway["Gateway & Auth Bridge"]
        VITE_AUTH["Vite Auth Plugin<br/>(Port 3000 /api/auth)"]
        SUPA_AUTH["Supabase Auth Service<br/>(JWT Engine)"]
    end

    subgraph Backend["Core Database Tier (Supabase PostgreSQL 15)"]
        RLS["PostgreSQL RLS Engine"]
        RPCS["Transactional RPCs<br/>(create_appointment, fulfill_rx)"]
        TABLES["Relational Tables<br/>(appointments, prescriptions, orders)"]
        STORAGE["Encrypted Storage Buckets<br/>(medical-documents)"]
        REALTIME["Realtime Signaling Engine<br/>(WSS Channels)"]
    end

    subgraph MLService["AI / ML Microservice (FastAPI Port 8000)"]
        ML_PRED["Random Forest Classifier<br/>(symptom-rf-v1)"]
        RISK_ENG["Deterministic Risk Engine"]
        RAG_ENG["Clinical RAG Knowledge Base<br/>(WHO / ICMR)"]
        OCR_ENG["Lab Report OCR & Normalizer"]
        ORCH["Clinical AI Orchestrator"]
    end

    subgraph External["External Cloud Services"]
        GEMINI["Google Gemini 3.5 Flash Lite"]
        STUN["Google STUN Servers"]
    end

    Client --> Gateway
    Gateway --> Backend
    Client --> Backend
    Client --> MLService
    MLService --> External
    Client -.-> STUN
    Backend -.-> REALTIME
```

---

### Diagram 2: Patient End-to-End Workflow

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient
    participant UI as Patient Portal (/patient)
    participant ML as ML Service (:8000)
    participant DB as PostgreSQL (Supabase)
    actor D as Doctor
    actor Ph as Pharmacy

    P->>UI: Selects symptoms & vitals
    UI->>ML: POST /api/predict
    ML->>ML: Vectorize symptoms (132 features)
    ML->>ML: Run Random Forest (symptom-rf-v1)
    ML->>ML: Run Deterministic RiskEngine
    ML-->>UI: Return top conditions & Triage Level
    UI->>DB: Query approved doctors matching specialist
    DB-->>UI: Return available OPD slots
    P->>UI: Selects slot & confirms booking
    UI->>DB: RPC create_appointment_tx()
    DB->>DB: Anti-double booking lock (uq_appointment_slot)
    DB-->>UI: Appointment confirmed (APT-XXXX)
    Note over P,D: WebRTC Video Consultation
    D->>DB: RPC create_prescription_tx()
    DB-->>P: Prescription notification received
    P->>UI: Clicks "Order Medicines"
    UI->>DB: RPC create_medicine_order_tx()
    DB-->>Ph: Order routed to Pharmacy queue
```

---

### Diagram 3: Doctor Clinical Workflow

```mermaid
sequenceDiagram
    autonumber
    actor D as Doctor
    participant UI as Doctor Portal (/doctor)
    participant DB as PostgreSQL (Supabase)
    participant ML as ML Service (:8000)
    actor P as Patient

    D->>UI: Logs in with credentials
    UI->>DB: Query appointments for today
    DB-->>UI: Return patient queue
    D->>UI: Opens Patient Clinical Vault
    UI->>DB: Query patient_doctor_access (Consent check)
    DB-->>UI: Return historical vitals & lab reports
    D->>UI: Launches Consultation Room
    UI->>DB: Subscribe to Realtime channel consultation-{id}
    P->>UI: Connects to WebRTC MediaStream
    UI->>ML: Request clinical AI insights
    ML-->>UI: Return differential recommendations (assistive)
    D->>UI: Enters digital prescription details
    UI->>DB: RPC create_prescription_tx()
    DB-->>UI: Rx created & signed (RX-XXXX)
```

---

### Diagram 4: Pharmacy Dispensary & FEFO Workflow

```mermaid
sequenceDiagram
    autonumber
    actor Ph as Pharmacist
    participant UI as Pharmacy Portal (/pharmacy)
    participant DB as PostgreSQL (Supabase)

    Ph->>UI: Logs in & views /pharmacy/orders
    UI->>DB: Query orders where status = 'pending'
    DB-->>UI: Return active order queue
    Ph->>UI: Clicks "Fulfill Prescription"
    UI->>DB: RPC pharmacy_fulfill_prescription_tx()
    DB->>DB: Query batches ordered by expiry_date ASC (FEFO)
    DB->>DB: Verify stock >= quantity
    DB->>DB: Deduct batch quantities & update inventory
    DB->>DB: Update order status to 'packed'
    DB-->>UI: Order packed successfully
    Ph->>UI: Marks dispatched with tracking ID
    UI->>DB: Update order status to 'dispatched'
    DB-->>UI: Patient notified via multi-channel router
```

---

### Diagram 5: Administrative Governance Workflow

```mermaid
sequenceDiagram
    autonumber
    actor A as Administrator
    participant UI as Admin Portal (/admin)
    participant DB as PostgreSQL (Supabase)

    A->>UI: Logs in with administrative credentials
    UI->>DB: Verify role = 'admin' in public.user_roles
    DB-->>UI: Session validated (Admin Layout rendered)
    A->>UI: Navigates to /admin/doctor-approvals
    UI->>DB: Query doctors where verification_status = 'pending'
    DB-->>UI: Return pending practitioners
    A->>UI: Inspects license number & council credentials
    A->>UI: Clicks "Approve License"
    UI->>DB: RPC verify_doctor_tx(p_doctor_id, 'approved')
    DB->>DB: Update doctors verification_status = 'approved'
    DB->>DB: Insert audit log in public.audit_logs
    DB-->>UI: Doctor verified & activated
```

---

### Diagram 6: AI Clinical Triage & Risk Flow

```mermaid
flowchart TD
    START([Patient Intake]) --> INPUTS[Collect 132 Symptoms + Age + Vitals]
    INPUTS --> PREPROC[preprocessor.py: Binary 132-Vectorization]
    
    subgraph ParallelEvaluation["Parallel Clinical Assessment"]
        PREPROC --> RF[predictor.py: symptom-rf-v1 Inference]
        INPUTS --> RISK[risk_engine.py: Deterministic Risk Logic]
    end

    RF --> CONDITIONS[Top Probable Conditions & Confidence Scores]
    RISK --> REDFLAGS{Any Red Flags<br/>or Critical Vitals?}

    REDFLAGS -- YES --> EMERGENCY[Triage: EMERGENCY / HIGH<br/>Severity: 85-100<br/>Direct ER Warning]
    REDFLAGS -- NO --> ROUTINE[Triage: ROUTINE / LOW<br/>Severity: 0-45<br/>OPD Specialist Advice]

    CONDITIONS --> COMBINE[Synthesize Assessment Payload]
    EMERGENCY --> COMBINE
    ROUTINE --> COMBINE
    COMBINE --> RAG_RETRIEVE[retriever.py: Fetch WHO/ICMR Guidelines]
    RAG_RETRIEVE --> GEMINI[orchestrator.py: Generate Patient Explanation]
    GEMINI --> SAFETY[safety_guard.py: Strip Drug Dosages & Apply Disclaimers]
    SAFETY --> OUTPUT([Final Structured Clinical Response])
```

---

### Diagram 7: Medical Report OCR & Biomarker Pipeline

```mermaid
flowchart TD
    UPLOAD([User Uploads Lab Slip]) --> VALIDATE{Check Format & Size<br/>PDF/PNG/JPEG < 10MB}
    VALIDATE -- Invalid --> REJECT[Throw Validation Error]
    VALIDATE -- Valid --> PARSE[document_parser.py: Extract Raw Content]

    PARSE --> TYPE{File Type?}
    TYPE -- PDF --> PDF_PROC[pdf_processor.py: PDFPlumber Text Extract]
    TYPE -- Image --> IMG_PROC[image_processor.py: Gemini Vision OCR]

    PDF_PROC --> RAW_TEXT[Raw Extracted Clinical Text]
    IMG_PROC --> RAW_TEXT

    RAW_TEXT --> EXTRACT[ai_provider.py: Extract Biomarkers via Gemini Flash]
    EXTRACT --> NORMALIZE[finding_normalizer.py: Normalize Units mg/dL, g/dL]
    NORMALIZE --> BRIDGE[Map Abnormal Biomarkers to 132-Symptom Keys]
    BRIDGE --> RISK_CHECK[Evaluate Severity in Independent RiskEngine]
    RISK_CHECK --> DB_STORE[(Save to public.health_reports)]
    DB_STORE --> RESP([Return Structured Lab Findings to UI])
```

---

### Diagram 8: Multi-Channel Notification Dispatch Flow

```mermaid
flowchart TD
    EVENT([Trigger Event: Booking / Prescription / Order]) --> ROUTER[channelRouter.js: Dispatch Event]
    ROUTER --> IDEM{idempotency.js: Has key been processed in TTL?}
    IDEM -- YES --> DEDUP[Drop Duplicate Event]
    IDEM -- NO --> TEMPLATE[templates.js: Render PHI-safe Template]

    TEMPLATE --> CHANNELS{Active Channels?}
    CHANNELS --> IN_APP[Write to public.notifications table]
    CHANNELS --> EMAIL[EmailProvider.js: Send SMTP / SES]
    CHANNELS --> SMS[SMSProvider.js: Send Twilio / SNS]
    CHANNELS --> WHATSAPP[WhatsAppProvider.js: Send Meta Cloud API]

    EMAIL --> RETRY{Delivery Error?}
    SMS --> RETRY
    WHATSAPP --> RETRY

    RETRY -- Transient (503/429) --> BACKOFF[retryHandler.js: Bounded Backoff 3x]
    BACKOFF --> RETRY
    RETRY -- Fatal (400/Invalid) --> AUDIT_FAIL[Log Delivery Failure]
    RETRY -- Success (200) --> AUDIT_OK[Update Delivery Status: DELIVERED]
```

---

### Diagram 9: Authentication & Role Resolution Flow

```mermaid
sequenceDiagram
    autonumber
    actor U as User
    participant UI as Login Screen (Login.jsx)
    participant VITE as Vite Auth Plugin (Port 3000)
    participant SUPA as Supabase Auth
    participant DB as PostgreSQL (public)

    U->>UI: Enters email and password
    UI->>SUPA: signInWithPassword({ email, password })
    
    alt Email not confirmed error
        SUPA-->>UI: Error: Email not confirmed
        UI->>VITE: POST /api/auth/confirm { email }
        VITE->>SUPA: admin.updateUserById(id, { email_confirm: true })
        UI->>SUPA: Retries signInWithPassword()
    end

    SUPA-->>UI: Returns active session JWT & User Object
    UI->>DB: Query public.user_roles where user_id = user.id
    DB-->>UI: Returns canonical role ('doctor', 'patient', etc.)
    UI->>DB: Query role-specific profile (doctors, patients, pharmacies)
    DB-->>UI: Returns profile record & approval status
    
    alt Role is DOCTOR
        UI-->>U: Navigates to /doctor/dashboard
    else Role is PHARMACIST
        UI-->>U: Navigates to /pharmacy/dashboard
    else Role is ADMIN
        UI-->>U: Navigates to /admin/dashboard
    else Role is PATIENT
        UI-->>U: Navigates to /patient/dashboard
    end
```

---

### Diagram 10: WebRTC Video Teleconsultation Signaling Flow

```mermaid
sequenceDiagram
    autonumber
    actor P as Patient Browser
    participant STUN as Google STUN Server
    participant WSS as Supabase Realtime Channel
    actor D as Doctor Browser

    P->>P: getUserMedia({ audio: true, video: true })
    D->>D: getUserMedia({ audio: true, video: true })
    
    P->>WSS: Joins channel consultation-{appointment_id}
    D->>WSS: Joins channel consultation-{appointment_id}

    P->>STUN: Request ICE Candidates (Public IP:Port)
    STUN-->>P: Return reflexive ICE candidates

    P->>P: createOffer() -> Set LocalDescription
    P->>WSS: Broadcast 'video-offer' (SDP Offer)
    WSS-->>D: Forward 'video-offer'

    D->>D: setRemoteDescription(SDP Offer)
    D->>D: createAnswer() -> Set LocalDescription
    D->>WSS: Broadcast 'video-answer' (SDP Answer)
    WSS-->>P: Forward 'video-answer'
    P->>P: setRemoteDescription(SDP Answer)

    P->>WSS: Broadcast ICE Candidate
    WSS-->>D: Forward ICE Candidate
    D->>WSS: Broadcast ICE Candidate
    WSS-->>P: Forward ICE Candidate

    Note over P,D: Direct P2P Encrypted SRTP Media Pipeline Established
```

---

### Diagram 11: Database Entity-Relationship Overview

```mermaid
erDiagram
    users ||--|| profiles : "has profile"
    users ||--|| user_roles : "assigned role"
    profiles ||--o| patients : "extends"
    profiles ||--o| doctors : "extends"
    profiles ||--o| pharmacies : "extends"

    patients ||--o{ appointments : "books"
    doctors ||--o{ appointments : "conducts"
    doctors ||--o{ doctor_availability : "configures"

    appointments ||--o| consultations : "initiates"
    consultations ||--o| prescriptions : "generates"
    prescriptions ||--o{ prescription_items : "contains"

    patients ||--o{ medicine_orders : "places"
    pharmacies ||--o{ medicine_orders : "fulfills"
    medicine_orders ||--o{ order_items : "contains"

    pharmacies ||--o{ pharmacy_inventory : "stocks"
    pharmacy_inventory ||--o{ pharmacy_batches : "tracks lots"
    medicines ||--o{ pharmacy_inventory : "catalogs"

    patients ||--o{ symptom_assessments : "logs triage"
    patients ||--o{ health_reports : "uploads labs"
    users ||--o{ notifications : "receives"
    users ||--o{ audit_logs : "audited"
```

---

### Diagram 12: Request / Response Lifecycle Flow

```mermaid
flowchart LR
    BROWSER[Browser Client] -->|1. HTTP Request| VITE[Vite Dev Server / Proxy]
    VITE -->|2. Route Match| BACKEND{Route Type?}
    
    BACKEND -->|/api/auth/*| AUTH_PLUGIN[vite-auth-plugin.js: Privileged Admin Handler]
    BACKEND -->|/api/predict| FASTAPI[FastAPI ML Service :8000]
    BACKEND -->|PostgREST / RPC| SUPABASE[Supabase PostgreSQL 15]

    AUTH_PLUGIN -->|Admin DDL/DML| SUPABASE
    FASTAPI -->|Inference + Risk| FASTAPI
    SUPABASE -->|RLS Check + ACID Commit| DB[(PostgreSQL)]

    DB -->|Result Rows / JSON| SUPABASE
    SUPABASE -->|HTTP 200 JSON| BROWSER
    FASTAPI -->|Triage JSON| BROWSER
    AUTH_PLUGIN -->|Auth Session JSON| BROWSER
```
