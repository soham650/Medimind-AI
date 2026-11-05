# MediMind AI — Terminology & Healthcare Engineering Glossary

**Document Status:** MASTER GLOSSARY & REFERENCE GUIDE  
**Target Audience:** New developers, healthcare informatics engineers, AI researchers, and QA testers  
**Format:** General Definition followed by MediMind-Specific Context

---

### API (Application Programming Interface)
- **General Definition:** A standardized set of rules and protocols allowing different software programs to communicate and exchange data with one another.
- **In MediMind AI:** Refers to the PostgREST REST API automatically provided by Supabase, and the FastAPI HTTP microservice running on port 8000 handling machine learning and report intelligence.

---

### ABDM (Ayushman Bharat Digital Mission)
- **General Definition:** India's national digital health infrastructure standard establishing interoperability across health records, electronic consents, and clinical registries.
- **In MediMind AI:** Represented by the `abdm_consents` and `abdm_audit_logs` tables, enabling patients to grant, deny, or revoke treating doctors' access to longitudinal health records.

---

### Audit Log
- **General Definition:** An immutable, chronological record of system events providing documented evidence of activities that have affected an operation, procedure, or event.
- **In MediMind AI:** Stored in the `public.audit_logs` table. Records credential verifications, prescription creations, appointment bookings, and access events. Completely immutable (`UPDATE` and `DELETE` forbidden by PostgreSQL RLS).

---

### Auth (Authentication & Authorization)
- **General Definition:** Authentication verifies *who* a user is (e.g. logging in with email and password); Authorization determines *what* that user is allowed to do.
- **In MediMind AI:** Managed via Supabase Auth (GoTrue). Resolves user identity into `auth.uid()`, while authorization is enforced across 4 canonical roles (`patient`, `doctor`, `pharmacist`, `admin`).

---

### ESI (Emergency Severity Index)
- **General Definition:** A 5-level emergency department triage algorithm categorizing patient acuity from Level 1 (Resuscitation / Immediate) to Level 5 (Non-urgent).
- **In MediMind AI:** Encoded in `disease_clinical_guidelines` and evaluated by the `IndependentRiskEngine` to ensure life-threatening presentations bypass outpatient booking.

---

### EHR (Electronic Health Record)
- **General Definition:** A systematized collection of patient health information stored in digital format, containing medical histories, diagnoses, lab results, and medications.
- **In MediMind AI:** Stored in the `public.medical_records` table, categorized into `diagnosis`, `lab_report`, `clinical_note`, and `discharge_summary`.

---

### Embedding
- **General Definition:** A numerical representation of text, images, or audio as high-dimensional vectors, capturing semantic meaning and contextual relationships.
- **In MediMind AI:** Used in document intelligence to measure semantic similarity between patient-described symptoms and standardized clinical definitions.

---

### Feature Vector
- **General Definition:** An ordered list of numerical values representing measurable characteristics or properties of an observed phenomenon used in machine learning algorithms.
- **In MediMind AI:** A 132-dimensional binary vector where each position corresponds to a specific canonical symptom (e.g. `1` for present, `0` for absent), fed into the `symptom-rf-v1` Random Forest classifier.

---

### FEFO (First-Expired, First-Out)
- **General Definition:** An inventory management strategy prioritizing the dispensation or sale of perishable items whose expiration dates are closest to the present.
- **In MediMind AI:** Applied in `pharmacy_inventory` during prescription fulfillment. Medicine batches with the nearest `expiry_date` are automatically selected and decremented first.

---

### Gemini
- **General Definition:** Google's family of multimodal generative large language models capable of reasoning across text, code, images, and audio.
- **In MediMind AI:** Specifically `gemini-2.5-flash-lite`, utilized in the AI Orchestrator to synthesize plain-language summaries, structure lab report observations, and extract findings under strict safety directives.

---

### Idempotency
- **General Definition:** An operation that produces the exact same outcome whether executed once or multiple times consecutively without side effects.
- **In MediMind AI:** All SQL migrations (0001–0009) use idempotent constructs (`CREATE TABLE IF NOT EXISTS`, `DO $$ BEGIN ... END $$`) ensuring the database schema can be executed safely multiple times.

---

### Inference
- **General Definition:** The process of running live data through a trained machine learning model to calculate predictions or classifications.
- **In MediMind AI:** In `predictor.py`, the Random Forest model evaluates the 132-dim feature vector in milliseconds, outputting predicted disease classes with probability distributions.

---

### JWT (JSON Web Token)
- **General Definition:** A compact, URL-safe means of representing claims to be transferred between two parties, cryptographically signed by the issuer.
- **In MediMind AI:** Issued by Supabase Auth upon successful login. Transmitted in the HTTP `Authorization: Bearer <token>` header, allowing PostgreSQL to securely resolve `auth.uid()` for RLS checks.

---

### LLM (Large Language Model)
- **General Definition:** An artificial intelligence model trained on vast amounts of text data to generate, summarize, and understand human language.
- **In MediMind AI:** Used strictly as an assistive synthesis and communication layer. The LLM is never the primary decision-maker for clinical emergencies or prescriptions.

---

### ML (Machine Learning)
- **General Definition:** A branch of artificial intelligence focused on training computer algorithms to learn patterns from sample data and make decisions without being explicitly programmed.
- **In MediMind AI:** Refers specifically to the Scikit-Learn `RandomForestClassifier` (`symptom-rf-v1`) trained on 4,920 clinical rows across 41 disease categories.

---

### OCR (Optical Character Recognition)
- **General Definition:** Electronic conversion of images of typed, handwritten, or printed text into machine-encoded text.
- **In MediMind AI:** Handled by PyMuPDF and image processing libraries in `ml-service/src/report/` to extract text from scanned patient PDF reports and lab images.

---

### PHI (Protected Health Information)
- **General Definition:** Any health information that can be linked to an individual patient, including diagnoses, treatment notes, prescriptions, and lab tests under HIPAA regulations.
- **In MediMind AI:** Governed under strict privacy policies: zero PHI logging in application stdout/files, ephemeral report processing, and mandatory database RLS encryption at rest.

---

### PostgreSQL
- **General Definition:** A powerful, open-source object-relational database system known for reliability, feature robustness, and performance.
- **In MediMind AI:** The core storage engine hosted on Supabase, enforcing relational foreign keys, row locks, JSONB indexing, and Row-Level Security.

---

### Prompt
- **General Definition:** The natural-language text instruction provided to an AI model directing it to perform a specific task.
- **In MediMind AI:** The orchestrator prompt in `orchestrator.py` that instructs Gemini to format medical evaluations in JSON, enforce clinical disclaimers, and cite retrieved guidelines.

---

### Prompt Injection
- **General Definition:** A cyberattack technique where malicious user input tricks an AI model into ignoring its system instructions and executing unauthorized commands.
- **In MediMind AI:** Prevented by wrapping all patient text in `<untrusted_patient_input>` tags and using `ClinicalSafetyGuard` to strip illegal drug recommendations or dosage instructions.

---

### Pydantic
- **General Definition:** A data validation and settings management library for Python based on Python type annotations.
- **In MediMind AI:** Defines strict schemas in `schemas.py` (`MedicalReportAnalysis`, `StructuredClinicalAssessment`), ensuring that incoming HTTP bodies and outgoing AI JSON responses are strictly validated.

---

### RAG (Retrieval-Augmented Generation)
- **General Definition:** An AI framework that enhances generative model responses by retrieving verified, authoritative facts from an external knowledge base before answering.
- **In MediMind AI:** Implemented in `ml-service/src/rag/`. Retrieves peer-reviewed guidelines from WHO, ICMR, and NICE based on the predicted condition, preventing the LLM from hallucinating clinical facts.

---

### Rate Limiting
- **General Definition:** A defensive networking technique controlling the rate of incoming requests to prevent server exhaustion and abuse.
- **In MediMind AI:** Enforced in the Python ML service via an in-memory sliding window limiter (`rate_limiter.py`), and logged to `rate_limit_events` in PostgreSQL.

---

### RBAC (Role-Based Access Control)
- **General Definition:** A security method restricting system access to authorized users based on their assigned role in an organization.
- **In MediMind AI:** Enforced across 4 canonical roles (`patient`, `doctor`, `pharmacist`, `admin`). Checked via helper functions like `public.is_admin()` and `public.has_role()`.

---

### Risk Engine
- **General Definition:** A deterministic computational module that evaluates input parameters against hardcoded safety thresholds and rule matrices.
- **In MediMind AI:** Implemented in `risk_engine.py`. Evaluates red-flag symptoms and vital signs to output triage tiers (`Emergency`, `High / Urgent`, `Moderate`, `Low`). **Always overrides the LLM.**

---

### RLS (Row-Level Security)
- **General Definition:** A database engine security feature allowing system administrators to define policies controlling which specific rows of a table are visible or modifiable by a given user.
- **In MediMind AI:** Enabled on 100% of tables in the `public` schema. Acts as the ultimate security boundary ensuring complete data isolation between different patients, doctors, and pharmacies.

---

### RPC (Remote Procedure Call / Stored Procedure)
- **General Definition:** A computer program causing a procedure to execute in another address space or database engine, coded as if it were a normal local procedure call.
- **In MediMind AI:** PostgreSQL functions declared with `SECURITY DEFINER` (e.g. `create_appointment_tx`, `create_prescription_tx`, `create_medicine_order_tx`). Executes multi-table transactions atomically with row-level locks.

---

### STUN (Session Traversal Utilities for NAT)
- **General Definition:** A standardized protocol used in WebRTC networking allowing clients behind a NAT (router) to discover their public IP address and port.
- **In MediMind AI:** Used in video teleconsultations via public Google STUN servers (`stun:stun.l.google.com:19302`) configured in `frontend/.env`.

---

### Supabase
- **General Definition:** An open-source Backend-as-a-Service (BaaS) providing managed PostgreSQL, authentication, real-time subscriptions, and object storage.
- **In MediMind AI:** Hosts the cloud PostgreSQL database, handles user authentication (GoTrue), and manages private encrypted storage buckets for medical reports and credentials.

---

### TURN (Traversal Using Relays around NAT)
- **General Definition:** A protocol assisting in the traversal of network address translators (NATs) or firewalls for multimedia applications by acting as an intermediary media relay server.
- **In MediMind AI:** Serves as a fallback for WebRTC video consultations when direct peer-to-peer connection is blocked by strict enterprise or mobile symmetric NAT firewalls.

---

### WebRTC (Web Real-Time Communication)
- **General Definition:** An open-source technology enabling web browsers and mobile applications to exchange real-time video, audio, and data directly peer-to-peer without plugins.
- **In MediMind AI:** Powers encrypted real-time video and audio consultations between patients and licensed physicians in `/doctor/consultations/:id`.
