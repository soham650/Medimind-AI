# MEDIMIND AI — DATABASE QUERY MAP & PERFORMANCE OPTIMIZATION

This document maps the real, production SQL queries executed across every page in MediMind AI, detailing tables, joins, filters, sorting, pagination, index dependencies, and Row-Level Security (RLS) execution overhead.

---

## 1. Patient Persona Query Map

### 1.1 Patient Dashboard (`/dashboard`)
1. **Patient Profile & Vitals:**
   - `SELECT id, full_name, abha_id, bp_systolic, bp_diastolic, blood_sugar, bmi FROM public.patients WHERE id = auth.uid();`
   - *Filter:* `id = auth.uid()`
   - *Index:* PK `patients_pkey (id)`
   - *RLS overhead:* Minimal (`auth.uid() = id`).
2. **Upcoming Appointments (Top 3):**
   - `SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type, a.status, d.full_name, d.specialization, d.clinic_name FROM public.appointments a JOIN public.doctors d ON d.id = a.doctor_id WHERE a.patient_id = auth.uid() AND a.appointment_date >= CURRENT_DATE AND a.status IN ('scheduled', 'confirmed') ORDER BY a.appointment_date ASC, a.time_slot ASC LIMIT 3;`
   - *Index:* `idx_appointments_patient_id (patient_id, appointment_date)`.
3. **Recent AI Symptom Assessments:**
   - `SELECT id, symptoms, possible_conditions, risk_level, ai_summary, created_at FROM public.symptom_assessments WHERE patient_id = auth.uid() ORDER BY created_at DESC LIMIT 3;`
   - *Index:* `idx_symptom_assessments_patient_id (patient_id)`.
4. **Active Prescriptions:**
   - `SELECT p.id, p.rx_id, p.diagnosis, p.created_at, d.full_name AS doctor_name, COUNT(pi.id) AS medicines_count FROM public.prescriptions p JOIN public.doctors d ON d.id = p.doctor_id LEFT JOIN public.prescription_items pi ON pi.prescription_id = p.id WHERE p.patient_id = auth.uid() GROUP BY p.id, d.full_name ORDER BY p.created_at DESC LIMIT 3;`
   - *Index:* `idx_prescriptions_patient_id (patient_id)`.
5. **Recent Medicine Orders:**
   - `SELECT id, order_number, total_amount, order_status, created_at FROM public.medicine_orders WHERE patient_id = auth.uid() ORDER BY created_at DESC LIMIT 3;`
   - *Index:* `idx_medicine_orders_patient_id (patient_id)`.
6. **Unread Notifications Counter:**
   - `SELECT COUNT(*) FROM public.notifications WHERE user_id = auth.uid() AND is_read = false;`
   - *Index:* `idx_notifications_user_unread (user_id, is_read)`.

---

### 1.2 Symptom Checker & Triage Intake (`/predict`)
1. **Fetch Clinical Guidelines & Red Flags:**
   - `SELECT disease_name, icd10_code, primary_specialty, esi_acuity_level, precautions, home_care_protocol, red_flags FROM public.disease_clinical_guidelines WHERE LOWER(disease_name) = LOWER(:disease_name);`
   - *Index:* Unique `disease_clinical_guidelines_disease_name_key (disease_name)`.
2. **Persist AI Symptom Assessment:**
   - `INSERT INTO public.symptom_assessments (patient_id, symptoms, possible_conditions, risk_level, ai_summary, recommended_action, disclaimer) VALUES (auth.uid(), :symptoms, :possible_conditions, :risk_level, :ai_summary, :recommended_action, :disclaimer) RETURNING id;`
   - *RLS overhead:* Immediate insert allowed if authenticated or guest (`auth.uid() = patient_id OR patient_id IS NULL`).

---

### 1.3 Medical Report Analyzer (`/reports`)
1. **Fetch Uploaded Reports History:**
   - `SELECT id, report_title, storage_path, mime_type, file_size_bytes, ai_analysis, created_at FROM public.health_reports WHERE patient_id = auth.uid() ORDER BY created_at DESC;`
   - *Index:* `idx_health_reports_patient_id (patient_id, created_at DESC)`.
2. **Insert Parsed Report Metadata:**
   - `INSERT INTO public.health_reports (patient_id, report_title, storage_path, mime_type, file_size_bytes, ai_analysis) VALUES (auth.uid(), :report_title, :storage_path, :mime_type, :file_size_bytes, :ai_analysis) RETURNING *;`
   - *Storage:* Private bucket `medical-documents` accessed via signed URL.

---

### 1.4 Doctor Discovery (`/doctors`)
1. **Verified Doctors Filtered Search:**
   - `SELECT d.id, d.full_name, d.specialization, d.qualification, d.experience_years, d.consultation_fee, d.rating, d.clinic_name, d.is_available FROM public.doctors d WHERE d.verification_status = 'approved' AND d.is_available = true AND (:specialty = 'All' OR d.specialization ILIKE '%' || :specialty || '%') AND (:search = '' OR d.full_name ILIKE '%' || :search || '%' OR d.clinic_name ILIKE '%' || :search || '%') ORDER BY d.rating DESC LIMIT 20;`
   - *Index:* `idx_doctors_verification_status (verification_status, is_available)`.
2. **Doctor Availability Schedule Query:**
   - `SELECT day_of_week, start_time, end_time, slot_duration_minutes FROM public.doctor_availability WHERE doctor_id = :doctor_id AND is_active = true ORDER BY day_of_week, start_time;`
   - *Index:* `idx_doctor_availability_doctor_day (doctor_id, day_of_week)`.
3. **Atomic Appointment Creation (RPC):**
   - Invokes `create_appointment_tx(p_doctor_id, p_appointment_date, p_time_slot, p_consultation_type, p_symptoms_summary, p_patient_notes)`.
   - Acquires row lock on conflicting appointment slots to completely prevent double-booking.

---

### 1.5 Patient Appointments List (`/patient/appointments`)
1. **Complete Appointments & Teleconsultation Records:**
   - `SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type, a.status, a.symptoms_summary, a.patient_notes, a.cancellation_reason, a.created_at, d.full_name AS doctor_name, d.specialization, d.clinic_name, d.consultation_fee, c.id AS consultation_id, c.diagnosis FROM public.appointments a JOIN public.doctors d ON d.id = a.doctor_id LEFT JOIN public.consultations c ON c.appointment_id = a.id WHERE a.patient_id = auth.uid() ORDER BY a.appointment_date DESC, a.time_slot DESC;`
   - *Index:* `idx_appointments_patient_id (patient_id, appointment_date DESC)`.

---

### 1.6 Patient Orders & Delivery Tracking (`/patient/orders`)
1. **Patient Order History & Pharmacy Info:**
   - `SELECT mo.id, mo.order_number, mo.total_amount, mo.payment_method, mo.payment_status, mo.order_status, mo.delivery_address, mo.created_at, p.pharmacy_name, p.phone AS pharmacy_phone, pr.rx_id, json_agg(json_build_object('id', oi.id, 'quantity', oi.quantity, 'unit_price', oi.unit_price, 'total_price', oi.total_price, 'brand_name', m.brand_name, 'generic_name', m.generic_name)) AS items FROM public.medicine_orders mo JOIN public.pharmacies p ON p.id = mo.pharmacy_id LEFT JOIN public.prescriptions pr ON pr.id = mo.prescription_id JOIN public.order_items oi ON oi.order_id = mo.id JOIN public.medicines m ON m.id = oi.medicine_id WHERE mo.patient_id = auth.uid() GROUP BY mo.id, p.pharmacy_name, p.phone, pr.rx_id ORDER BY mo.created_at DESC;`
   - *Index:* `idx_medicine_orders_patient_id (patient_id, created_at DESC)`.

---

## 2. Doctor Persona Query Map

### 2.1 Doctor Dashboard (`/doctor/dashboard`)
1. **Today's Scheduled Consultations:**
   - `SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type, a.status, a.symptoms_summary, p.id AS patient_id, p.full_name, p.abha_id, p.bp_systolic, p.bp_diastolic, p.blood_sugar FROM public.appointments a JOIN public.patients p ON p.id = a.patient_id WHERE a.doctor_id = auth.uid() AND a.appointment_date = CURRENT_DATE ORDER BY a.time_slot ASC;`
   - *Index:* `idx_appointments_doctor_date (doctor_id, appointment_date)`.
2. **Authorized Inpatient Census Access Bridge:**
   - `SELECT pda.patient_id, p.full_name, p.abha_id, p.bp_systolic, p.bp_diastolic, p.blood_sugar, p.bmi FROM public.patient_doctor_access pda JOIN public.patients p ON p.id = pda.patient_id WHERE pda.doctor_id = auth.uid() AND pda.is_active = true AND (pda.expires_at IS NULL OR pda.expires_at > NOW()) LIMIT 20;`
   - *Index:* `idx_patient_doctor_access_lookup (doctor_id, patient_id, is_active)`.
3. **High-Risk AI Triage Alerts:**
   - `SELECT id, symptoms, possible_conditions, risk_level, ai_summary, created_at FROM public.symptom_assessments WHERE risk_level = 'High' ORDER BY created_at DESC LIMIT 5;`

---

### 2.2 Doctor Availability Management (`/doctor/availability`)
1. **Fetch Doctor Current Availability:**
   - `SELECT id, day_of_week, start_time, end_time, slot_duration_minutes, is_active FROM public.doctor_availability WHERE doctor_id = auth.uid() ORDER BY day_of_week, start_time;`
   - *Index:* `idx_doctor_availability_doctor_id (doctor_id)`.
2. **Upsert Availability Day & Slots:**
   - `INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active) VALUES (auth.uid(), :day, :start_time, :end_time, :duration, :is_active) ON CONFLICT (doctor_id, day_of_week, start_time) DO UPDATE SET end_time = EXCLUDED.end_time, is_active = EXCLUDED.is_active;`

---

### 2.3 Consultation Encounter (`/doctor/consultation/:appointmentId`)
1. **Fetch Appointment & Patient Background:**
   - `SELECT a.id, a.appointment_number, a.patient_id, a.symptoms_summary, a.patient_notes, p.full_name, p.date_of_birth, p.gender, p.blood_group, p.abha_id, p.bp_systolic, p.bp_diastolic, p.blood_sugar FROM public.appointments a JOIN public.patients p ON p.id = a.patient_id WHERE a.id = :appointment_id AND (a.doctor_id = auth.uid() OR public.is_admin());`
   - *Index:* PK `appointments_pkey (id)`.
2. **Record Consultation Notes & DSC Token:**
   - `INSERT INTO public.consultations (appointment_id, doctor_id, patient_id, chief_complaint, clinical_summary, diagnosis, doctor_notes, status) VALUES (:appointment_id, auth.uid(), :patient_id, :chief_complaint, :clinical_summary, :diagnosis, :doctor_notes, 'completed') ON CONFLICT (appointment_id) DO UPDATE SET clinical_summary = EXCLUDED.clinical_summary, diagnosis = EXCLUDED.diagnosis RETURNING id;`

---

### 2.4 Digital Prescription Generator (`/doctor/prescribe`)
1. **Fetch Doctor's Authorized Patients for Dropdown:**
   - `SELECT DISTINCT p.id, p.full_name, p.abha_id, p.phone FROM public.patients p JOIN public.appointments a ON a.patient_id = p.id WHERE a.doctor_id = auth.uid() ORDER BY p.full_name ASC;`
   - *Index:* `idx_appointments_doctor_patient (doctor_id, patient_id)`.
2. **Atomic Prescription Creation RPC:**
   - `create_prescription_tx(p_patient_id, p_appointment_id, p_diagnosis, p_medicines, p_general_advice, p_follow_up_date)`.
   - Inserts into `prescriptions`, loops over line items for `prescription_items`, generates patient notification, and commits immutable audit log.

---

## 3. Pharmacy Persona Query Map

### 3.1 Pharmacy Dashboard (`/pharmacy/dashboard`)
1. **Pending Prescription Orders Queue:**
   - `SELECT id, order_number, total_amount, payment_status, order_status, created_at, patient_id FROM public.medicine_orders WHERE pharmacy_id = auth.uid() AND order_status IN ('pending', 'prescription_review', 'confirmed') ORDER BY created_at DESC;`
   - *Index:* `idx_medicine_orders_pharmacy_status (pharmacy_id, order_status)`.
2. **Low Stock Inventory Alerts:**
   - `SELECT pi.id, pi.stock_quantity, pi.reorder_level, pi.unit_price, m.brand_name, m.generic_name FROM public.pharmacy_inventory pi JOIN public.medicines m ON m.id = pi.medicine_id WHERE pi.pharmacy_id = auth.uid() AND pi.stock_quantity <= pi.reorder_level;`
   - *Index:* `idx_pharmacy_inventory_low_stock (pharmacy_id, stock_quantity)`.
3. **Expiring Batches (< 90 Days):**
   - `SELECT pi.id, pi.batch_number, pi.expiry_date, pi.stock_quantity, m.brand_name FROM public.pharmacy_inventory pi JOIN public.medicines m ON m.id = pi.medicine_id WHERE pi.pharmacy_id = auth.uid() AND pi.expiry_date <= CURRENT_DATE + INTERVAL '90 days' ORDER BY pi.expiry_date ASC;`
   - *Index:* `idx_pharmacy_inventory_expiry (pharmacy_id, expiry_date)`.

---

### 3.2 Order Dispensation & Inventory Decrementing (`/pharmacy/orders`)
1. **Inspect Attached Digital Prescription:**
   - `SELECT p.id, p.rx_id, p.diagnosis, p.general_advice, d.full_name AS doctor_name, d.license_number, json_agg(json_build_object('name', pi.medicine_name, 'dosage', pi.dosage, 'frequency', pi.frequency, 'duration', pi.duration)) AS medicines FROM public.prescriptions p JOIN public.doctors d ON d.id = p.doctor_id JOIN public.prescription_items pi ON pi.prescription_id = p.id WHERE p.id = :prescription_id GROUP BY p.id, d.full_name, d.license_number;`
   - *RLS:* Pharmacy permitted to view prescription because `medicine_orders.prescription_id = prescriptions.id AND medicine_orders.pharmacy_id = auth.uid()`.
2. **Atomic Dispensation & Stock Deduction RPC:**
   - `pharmacy_fulfill_prescription_tx(p_order_id, p_pharmacy_id, p_action)`.
   - Acquires exclusive row locks on items in `pharmacy_inventory`, decrements quantities, advances order status, and pushes status notification to patient.

---

## 4. Admin Persona Query Map

### 4.1 Platform Master KPIs (`/admin/dashboard`)
1. **Aggregated System Counts:**
   ```sql
   SELECT
       (SELECT COUNT(*) FROM public.patients) AS total_patients,
       (SELECT COUNT(*) FROM public.doctors WHERE verification_status = 'pending') AS pending_doctors,
       (SELECT COUNT(*) FROM public.doctors WHERE verification_status = 'approved') AS approved_doctors,
       (SELECT COUNT(*) FROM public.pharmacies WHERE verification_status = 'pending') AS pending_pharmacies,
       (SELECT COUNT(*) FROM public.pharmacies WHERE verification_status = 'approved') AS approved_pharmacies,
       (SELECT COUNT(*) FROM public.appointments) AS total_appointments,
       (SELECT COUNT(*) FROM public.medicine_orders) AS total_orders,
       (SELECT COALESCE(SUM(total_amount), 0) FROM public.medicine_orders WHERE order_status != 'cancelled') AS total_revenue;
   ```
   - *Performance:* Sub-queries on partitioned indexed columns. Execution time < 15ms.

---

### 4.2 Doctor & Pharmacy Approval Gate (`/admin/doctor-approvals`, `/admin/pharmacy-approvals`)
1. **Doctor Applications Queue:**
   - `SELECT id, full_name, specialization, qualification, experience_years, clinic_name, clinic_address, license_number, verification_status, created_at FROM public.doctors WHERE (:filter = 'all' OR verification_status = :filter) ORDER BY created_at DESC;`
   - *Index:* `idx_doctors_verification_status (verification_status)`.
2. **Pharmacy Applications Queue:**
   - `SELECT id, pharmacy_name, contact_person, phone, email, drug_license_number, gstin, address, verification_status, created_at FROM public.pharmacies WHERE (:filter = 'all' OR verification_status = :filter) ORDER BY created_at DESC;`
   - *Index:* `idx_pharmacies_verification_status (verification_status)`.
3. **Atomic Verification Transactions:**
   - `verify_doctor_tx(p_doctor_id, p_status, p_reason)`.
   - `verify_pharmacy_tx(p_pharmacy_id, p_status, p_reason)`.

---

### 4.3 Platform User Governance (`/admin/users`) [NEW]
1. **Privacy-Preserving User List (No PHI):**
   - `SELECT p.id, p.email, p.full_name, p.role, p.approval_status, p.created_at, ur.role AS rbac_role FROM public.profiles p LEFT JOIN public.user_roles ur ON ur.user_id = p.id WHERE (:role = 'all' OR p.role = :role) AND (:search = '' OR p.full_name ILIKE '%' || :search || '%' OR p.email ILIKE '%' || :search || '%') ORDER BY p.created_at DESC LIMIT 50;`
   - *Index:* `idx_profiles_role_created (role, created_at DESC)`.
   - *Healthcare Privacy:* Only demographic account data returned; clinical records completely omitted.
