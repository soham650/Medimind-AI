# MEDIMIND AI — PAGE TO DATABASE REQUIREMENT MATRIX

This matrix defines the end-to-end mapping from every UI page in MediMind AI to its database schema, queries, relationships, Row Level Security (RLS) rules, storage buckets, and performance indexes.

---

## 1. Patient Pages Matrix

### 1.1 Patient Dashboard (`/dashboard`)
- **UI Fields:** Greeting, patient full name, active appointments counter, active prescriptions counter, upcoming appointment card (doctor name, specialty, date, time slot), digital vitals (BP, blood sugar, BMI).
- **UI Actions:** Click quick action cards (Symptom Checker, Consult Doctors, Digital Rx, Order Medicines), click upcoming appointment to view details.
- **API:** `appointmentService.getPatientAppointments(patientId)`, `prescriptionService.getPatientPrescriptions(patientId)`.
- **Query:**
  ```sql
  SELECT id, appointment_number, appointment_date, time_slot, status, doctor_id,
         doctors(full_name, specialization, clinic_name)
  FROM public.appointments
  WHERE patient_id = auth.uid() AND appointment_date >= CURRENT_DATE AND status = 'scheduled'
  ORDER BY appointment_date ASC, time_slot ASC LIMIT 3;
  ```
- **Tables:** `appointments`, `doctors`, `prescriptions`, `patients`.
- **Relationships:** `appointments.patient_id -> patients.id`, `appointments.doctor_id -> doctors.id`.
- **RLS:** Patient reads own records (`patient_id = auth.uid()`).
- **Storage:** None.
- **Indexes:** `idx_appointments_patient_id`, `idx_appointments_date`.

---

### 1.2 AI Symptom Checker & Triage (`/predict`, `/symptom-checker`)
- **UI Fields:** Symptom search box, symptom tags, pain intensity (mild/mod/severe), onset timeline, speech transcription textarea, lab slip attachment summary, top predicted conditions list (name, probability, ICD-10 code), clinical explanation, emergency alert banner, red flags list.
- **UI Actions:** Add/remove symptom tags, speech dictation, upload lab slip, trigger preliminary assessment, click emergency SOS 108.
- **API:** `mlApi.predictDisease(symptoms)`, `mlApi.analyzeReport(file)`, `aiService.assessSymptoms(symptoms, patientId)`.
- **Query:**
  ```sql
  INSERT INTO public.symptom_assessments (
      patient_id, symptoms, possible_conditions, risk_level, ai_summary, recommended_action, disclaimer
  ) VALUES (
      auth.uid(), :symptoms, :possible_conditions, :risk_level, :ai_summary, :recommended_action, :disclaimer
  ) RETURNING id;
  ```
- **Tables:** `symptom_assessments`, `disease_clinical_guidelines`.
- **Relationships:** `symptom_assessments.patient_id -> auth.users(id)`.
- **RLS:** Patient inserts own record (`patient_id = auth.uid() OR patient_id IS NULL`), reads own records (`patient_id = auth.uid()`).
- **Storage:** Mode 2 lab slip uploads to private bucket `medical-documents` (`{patient_id}/{timestamp}_{filename}`).
- **Indexes:** `idx_symptom_assessments_patient_id`, `idx_symptom_assessments_created_at`.

---

### 1.3 Medical Report Analyzer (`/reports`)
- **UI Fields:** Drag-and-drop file upload zone, file metadata (name, size, type), clinical summary text, parameter comparison table (Test Name, Observed Value, Unit, Standard Reference Range, Status: Low/Normal/High), longitudinal Recharts trend.
- **UI Actions:** Drop PDF/PNG/JPG file, initiate analysis, view parameter trends, view PDF preview.
- **API:** `mlApi.analyzeReport(fileName, fileType, fileData)`, `reportService.uploadReport(patientId, file, title, analysis)`.
- **Query:**
  ```sql
  INSERT INTO public.health_reports (
      patient_id, report_title, storage_path, mime_type, file_size_bytes, ai_analysis
  ) VALUES (
      auth.uid(), :report_title, :storage_path, :mime_type, :file_size_bytes, :ai_analysis
  ) RETURNING *;
  ```
- **Tables:** `health_reports`.
- **Relationships:** `health_reports.patient_id -> patients.id`.
- **RLS:** Patient reads/inserts own files (`patient_id = auth.uid()`). Authorized doctors read via `patient_doctor_access`.
- **Storage:** Supabase Storage private bucket `medical-documents`. Path pattern: `:patient_id/:file_name`. Signed URL with 300s expiry.
- **Indexes:** `idx_health_reports_patient_id`, `idx_health_reports_created_at`.

---

### 1.4 Doctor Search & Teleconsultations (`/doctors`, `/teleconsultations`)
- **UI Fields:** Specialty filter tabs, doctor search bar, doctor card (avatar, name, qualification, specialty, clinic name, experience, fee, rating), slot booking modal (date picker, slot dropdown, consultation type, patient notes), video consultation modal.
- **UI Actions:** Search/filter doctors, select appointment slot, book appointment, launch WebRTC video room.
- **API:** `doctorService.searchDoctors({ specialty, search })`, `appointmentService.createAppointment(...)`.
- **Query (Search):**
  ```sql
  SELECT id, full_name, specialization, qualification, experience_years, consultation_fee, rating, clinic_name, is_available
  FROM public.doctors
  WHERE verification_status = 'approved' AND is_available = true
    AND (:specialty = 'All' OR specialization ILIKE '%' || :specialty || '%')
    AND (:search = '' OR full_name ILIKE '%' || :search || '%' OR clinic_name ILIKE '%' || :search || '%')
  ORDER BY rating DESC;
  ```
- **Query (Atomic Booking RPC):**
  ```sql
  SELECT public.create_appointment_tx(
      p_doctor_id := :doctor_id,
      p_appointment_date := :appointment_date,
      p_time_slot := :time_slot,
      p_consultation_type := :consultation_type,
      p_symptoms_summary := :symptoms_summary,
      p_patient_notes := :patient_notes
  );
  ```
- **Tables:** `doctors`, `doctor_availability`, `appointments`, `patient_doctor_access`, `notifications`, `audit_logs`.
- **Relationships:** `appointments.patient_id -> patients.id`, `appointments.doctor_id -> doctors.id`.
- **RLS:** Public read approved doctors; Patient inserts appointment where `patient_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_doctors_verification_status`, `idx_appointments_doctor_slot` `(doctor_id, appointment_date, time_slot)` UNIQUE.

---

### 1.5 Patient Appointments & History (`/patient/appointments`) [NEW]
- **UI Fields:** Tab filters (Upcoming, Completed, Cancelled, All), appointment card list (Appointment #, Doctor Name, Specialty, Clinic, Date, Time Slot, Type: Video/In-Person, Status Badge, Symptoms Summary, Doctor Clinical Notes).
- **UI Actions:** Filter by status, cancel scheduled appointment with reason, join teleconsultation room, book follow-up.
- **API:** `appointmentService.getPatientAppointments(patientId)`, `appointmentService.updateStatus(appointmentId, 'cancelled', reason)`.
- **Query:**
  ```sql
  SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type,
         a.status, a.symptoms_summary, a.patient_notes, a.cancellation_reason, a.created_at,
         d.full_name, d.specialization, d.clinic_name, d.consultation_fee,
         c.clinical_summary, c.diagnosis
  FROM public.appointments a
  JOIN public.doctors d ON d.id = a.doctor_id
  LEFT JOIN public.consultations c ON c.appointment_id = a.id
  WHERE a.patient_id = auth.uid()
  ORDER BY a.appointment_date DESC, a.time_slot DESC;
  ```
- **Tables:** `appointments`, `doctors`, `consultations`.
- **Relationships:** `appointments.doctor_id -> doctors.id`, `consultations.appointment_id -> appointments.id`.
- **RLS:** `auth.uid() = patient_id`.
- **Storage:** None.
- **Indexes:** `idx_appointments_patient_id`, `idx_appointments_date`.

---

### 1.6 Prescriptions & Daily Dose Tracker (`/prescriptions`)
- **UI Fields:** Active prescriptions list, authenticated Rx ID badge, doctor details, diagnosis, line-item medications table (Name, Dosage, Frequency, Duration, Instructions), general advice callout, daily dose schedule checklist (Morning, Afternoon, Night).
- **UI Actions:** View Rx details, print/download prescription, toggle dose taken checkbox, order medicines via link.
- **API:** `prescriptionService.getPatientPrescriptions(patientId)`, `prescriptionService.getDailyDoseSchedule(patientId)`, `prescriptionService.logDoseStatus(id, status)`.
- **Query:**
  ```sql
  SELECT p.id, p.rx_id, p.diagnosis, p.general_advice, p.follow_up_date, p.created_at,
         d.full_name AS doctor_name, d.specialization, d.license_number, d.clinic_name,
         json_agg(json_build_object(
             'name', pi.medicine_name,
             'dosage', pi.dosage,
             'frequency', pi.frequency,
             'duration', pi.duration,
             'instructions', pi.instructions
         )) AS medicines
  FROM public.prescriptions p
  JOIN public.doctors d ON d.id = p.doctor_id
  LEFT JOIN public.prescription_items pi ON pi.prescription_id = p.id
  WHERE p.patient_id = auth.uid()
  GROUP BY p.id, d.full_name, d.specialization, d.license_number, d.clinic_name
  ORDER BY p.created_at DESC;
  ```
- **Tables:** `prescriptions`, `prescription_items`, `doctors`, `medication_schedules`.
- **Relationships:** `prescriptions.patient_id -> patients.id`, `prescriptions.doctor_id -> doctors.id`, `prescription_items.prescription_id -> prescriptions.id`.
- **RLS:** `patient_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_prescriptions_patient_id`, `idx_prescriptions_rx_id`.

---

### 1.7 Pharmacy Store & Checkout (`/pharmacy`)
- **UI Fields:** Drug catalog search input, category filters (Antibiotic, Analgesic, Antipyretic, Cardiac, Diabetes), medicine card (Brand Name, Generic Name, Strength, Price, Rx Required Badge), cart drawer, checkout modal (pharmacy selector, prescription selector, delivery address, payment method).
- **UI Actions:** Search medicines, add to cart, update quantity, select pharmacy, attach Rx, place order.
- **API:** `pharmacyService.getMedicines()`, `pharmacyService.getApprovedPharmacies()`, `orderService.createOrder(...)`.
- **Query (Atomic Order RPC with Lock):**
  ```sql
  SELECT public.create_medicine_order_tx(
      p_pharmacy_id := :pharmacy_id,
      p_prescription_id := :prescription_id,
      p_items := :items_json,
      p_payment_method := :payment_method,
      p_delivery_address := :delivery_address
  );
  ```
- **Tables:** `medicines`, `pharmacies`, `pharmacy_inventory`, `medicine_orders`, `order_items`, `prescriptions`.
- **Relationships:** `medicine_orders.patient_id -> patients.id`, `medicine_orders.pharmacy_id -> pharmacies.id`, `order_items.order_id -> medicine_orders.id`.
- **RLS:** Public read active medicines; Patient inserts orders where `patient_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_medicines_category`, `idx_pharmacy_inventory_pharmacy_id`.

---

### 1.8 Patient Orders & Delivery Tracking (`/patient/orders`, `/orders`) [NEW]
- **UI Fields:** Orders list, order number, ordered date, pharmacy name & contact, attached Rx reference, line items table (medicine name, quantity, unit price, item total), order total amount, payment status (`paid`, `pending`), delivery progress stepper (1. Confirmed -> 2. Prescription Review -> 3. Packed -> 4. Out for Delivery -> 5. Delivered), delivery address.
- **UI Actions:** View order details, track live delivery status, cancel pending order, re-order.
- **API:** `orderService.getPatientOrders(patientId)`.
- **Query:**
  ```sql
  SELECT mo.id, mo.order_number, mo.total_amount, mo.payment_method, mo.payment_status,
         mo.order_status, mo.delivery_address, mo.created_at,
         p.pharmacy_name, p.phone AS pharmacy_phone, p.address AS pharmacy_address,
         pr.rx_id,
         json_agg(json_build_object(
             'id', oi.id,
             'quantity', oi.quantity,
             'unit_price', oi.unit_price,
             'total_price', oi.total_price,
             'brand_name', m.brand_name,
             'generic_name', m.generic_name
         )) AS items
  FROM public.medicine_orders mo
  JOIN public.pharmacies p ON p.id = mo.pharmacy_id
  LEFT JOIN public.prescriptions pr ON pr.id = mo.prescription_id
  JOIN public.order_items oi ON oi.order_id = mo.id
  JOIN public.medicines m ON m.id = oi.medicine_id
  WHERE mo.patient_id = auth.uid()
  GROUP BY mo.id, p.pharmacy_name, p.phone, p.address, pr.rx_id
  ORDER BY mo.created_at DESC;
  ```
- **Tables:** `medicine_orders`, `order_items`, `medicines`, `pharmacies`, `prescriptions`.
- **Relationships:** `medicine_orders.patient_id -> patients.id`, `order_items.order_id -> medicine_orders.id`.
- **RLS:** `patient_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_medicine_orders_patient_id`, `idx_medicine_orders_created_at`.

---

### 1.9 Patient Profile & Clinical Settings (`/patient/profile`) [NEW]
- **UI Fields:** Profile avatar, full name, email, phone, ABHA ID card badge, date of birth, gender, blood group dropdown, emergency contact person and phone, primary address, preferred language, clinical baseline vitals (systolic/diastolic BP, blood sugar, BMI, smoker toggle), allergies list with severity (Mild, Moderate, Severe).
- **UI Actions:** Edit profile details, save demographic changes, add/remove allergy, copy ABHA address.
- **API:** `patientService.getProfile(patientId)`, `patientService.updateProfile(data)`, `patientService.addAllergy(allergy)`.
- **Query:**
  ```sql
  UPDATE public.patients
  SET phone = :phone, emergency_contact = :emergency_contact, address = :address,
      blood_group = :blood_group, preferred_language = :preferred_language,
      bp_systolic = :bp_systolic, bp_diastolic = :bp_diastolic, blood_sugar = :blood_sugar,
      updated_at = NOW()
  WHERE id = auth.uid();
  ```
- **Tables:** `patients`, `patient_allergies`, `profiles`.
- **Relationships:** `patients.id -> auth.users.id`, `patient_allergies.patient_id -> patients.id`.
- **RLS:** `id = auth.uid()`.
- **Storage:** Optional profile photo in `profile-images` bucket.
- **Indexes:** `idx_patient_allergies_patient_id`.

---

## 2. Doctor Pages Matrix

### 2.1 Doctor Dashboard (`/doctor/dashboard`)
- **UI Fields:** Clinician profile summary, Attending Cardiology banner, emergency override button, KPI cards (Active Inpatients, Critical Alerts, Precision Index, Pending Lab Reports), ward census table with patient stability badges, rounding schedule sidebar, Recharts admissions/discharges chart.
- **UI Actions:** Filter ward census, view patient chart, trigger emergency override, print ward list.
- **API:** `doctorService.getMissionControlData(doctorId)`.
- **Query:**
  ```sql
  SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type,
         a.status, a.symptoms_summary, p.id AS patient_id, p.full_name, p.abha_id,
         p.bp_systolic, p.bp_diastolic, p.blood_sugar
  FROM public.appointments a
  JOIN public.patients p ON p.id = a.patient_id
  WHERE a.doctor_id = auth.uid() AND a.appointment_date = CURRENT_DATE
  ORDER BY a.time_slot ASC;
  ```
- **Tables:** `appointments`, `patients`, `symptom_assessments`, `patient_doctor_access`.
- **Relationships:** `appointments.doctor_id -> doctors.id`, `patient_doctor_access.doctor_id -> doctors.id`.
- **RLS:** `doctor_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_appointments_doctor_date` `(doctor_id, appointment_date)`.

---

### 2.2 Doctor Appointment Queue (`/doctor/appointments`)
- **UI Fields:** Date selector, appointments queue table, patient demographics (name, age, gender, ABHA), appointment time slot, consultation type (Video / In-Person), symptoms summary, status badges, action buttons (Start Consult, Mark Checked-In, Mark Completed, Cancel).
- **UI Actions:** Update appointment status, launch consultation room.
- **API:** `appointmentService.getDoctorAppointments(doctorId)`, `appointmentService.updateStatus(appointmentId, status)`.
- **Query:**
  ```sql
  SELECT a.id, a.appointment_number, a.appointment_date, a.time_slot, a.consultation_type,
         a.status, a.symptoms_summary, a.patient_notes, a.created_at,
         p.id AS patient_id, p.full_name, p.phone, p.abha_id, p.bp_systolic, p.bp_diastolic, p.blood_sugar
  FROM public.appointments a
  JOIN public.patients p ON p.id = a.patient_id
  WHERE a.doctor_id = auth.uid()
  ORDER BY a.appointment_date ASC, a.time_slot ASC;
  ```
- **Tables:** `appointments`, `patients`.
- **Relationships:** `appointments.doctor_id -> doctors.id`, `appointments.patient_id -> patients.id`.
- **RLS:** `doctor_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_appointments_doctor_id`.

---

### 2.3 Consultation Room (`/doctor/consultation/:appointmentId`)
- **UI Fields:** WebRTC video interface (doctor camera, patient camera, mute/video toggles), patient vitals drawer, ambient clinical scribe transcript box, SOAP notes editor (Subjective, Objective, Assessment, Plan), medication quick-builder, DSC cryptographic signature button.
- **UI Actions:** Toggle video/audio, edit SOAP notes, add medicines, execute DSC signing.
- **API:** `consultationService.signConsultationDsc(appointmentId, doctorId, soapNotes)`.
- **Query:**
  ```sql
  INSERT INTO public.consultations (
      appointment_id, doctor_id, patient_id, chief_complaint, clinical_summary, diagnosis, doctor_notes, status
  ) VALUES (
      :appointment_id, auth.uid(), :patient_id, :chief_complaint, :clinical_summary, :diagnosis, :doctor_notes, 'completed'
  ) ON CONFLICT (appointment_id) DO UPDATE SET clinical_summary = EXCLUDED.clinical_summary
  RETURNING id;
  ```
- **Tables:** `consultations`, `consultation_sessions`, `appointments`, `patient_doctor_access`.
- **Relationships:** `consultations.appointment_id -> appointments.id`.
- **RLS:** Doctor or Patient participant in the appointment.
- **Storage:** None.
- **Indexes:** `idx_consultations_appointment_id` UNIQUE.

---

### 2.4 Digital Prescription Generator (`/doctor/prescribe`)
- **UI Fields:** Patient selector dropdown / search, appointment link, clinical diagnosis field, dynamic medicine line items (Medicine Name, Dosage Form & Strength, Frequency schedule, Duration days, Instructions), general clinical advice, follow-up date picker, printable signed prescription sheet.
- **UI Actions:** Search patient, add medicine rows, remove rows, submit digital prescription, print Rx.
- **API:** `prescriptionService.createPrescription(...)` (`create_prescription_tx` RPC).
- **Query:**
  ```sql
  SELECT public.create_prescription_tx(
      p_patient_id := :patient_id,
      p_appointment_id := :appointment_id,
      p_diagnosis := :diagnosis,
      p_medicines := :medicines_json,
      p_general_advice := :general_advice,
      p_follow_up_date := :follow_up_date
  );
  ```
- **Tables:** `prescriptions`, `prescription_items`, `patients`, `appointments`, `notifications`, `audit_logs`.
- **Relationships:** `prescriptions.doctor_id -> doctors.id`, `prescriptions.patient_id -> patients.id`.
- **RLS:** `doctor_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_prescriptions_doctor_id`, `idx_prescriptions_rx_id`.

---

### 2.5 Doctor Availability & Schedule Management (`/doctor/availability`) [NEW]
- **UI Fields:** Days of week toggles (Sunday to Saturday), working hours (start time, end time), consultation slot duration (15m, 30m, 45m, 60m), consultation fee (INR), active availability toggle.
- **UI Actions:** Toggle active days, edit start/end times, save schedule, update consultation fee.
- **API:** `doctorService.getDoctorDetails(doctorId)`, `doctorService.saveAvailability(schedule)`.
- **Query:**
  ```sql
  INSERT INTO public.doctor_availability (doctor_id, day_of_week, start_time, end_time, slot_duration_minutes, is_active)
  VALUES (auth.uid(), :day_of_week, :start_time, :end_time, :slot_duration_minutes, :is_active)
  ON CONFLICT (doctor_id, day_of_week, start_time) DO UPDATE SET
      end_time = EXCLUDED.end_time,
      is_active = EXCLUDED.is_active;
  ```
- **Tables:** `doctor_availability`, `doctors`.
- **Relationships:** `doctor_availability.doctor_id -> doctors.id`.
- **RLS:** `doctor_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_doctor_availability_doctor_day` `(doctor_id, day_of_week)`.

---

### 2.6 Doctor Profile & Verification Documents (`/doctor/profile`) [NEW]
- **UI Fields:** Doctor full name, qualification (MBBS, MD, MS, DM), medical registration license number, specialization, experience years, clinic name and address, languages spoken, bio, consultation fee, verification status badge (`pending`, `approved`, `rejected`), license document uploader.
- **UI Actions:** Edit profile details, upload medical registration certificate PDF to `doctor-documents` storage bucket, check admin review status.
- **API:** `doctorService.updateProfile(data)`, `supabase.storage.from('doctor-documents').upload()`.
- **Query:**
  ```sql
  UPDATE public.doctors
  SET full_name = :full_name, specialization = :specialization, qualification = :qualification,
      experience_years = :experience_years, clinic_name = :clinic_name, clinic_address = :clinic_address,
      bio = :bio, consultation_fee = :consultation_fee, updated_at = NOW()
  WHERE id = auth.uid();
  ```
- **Tables:** `doctors`, `doctor_verifications`.
- **Relationships:** `doctors.id -> auth.users.id`, `doctor_verifications.doctor_id -> doctors.id`.
- **RLS:** `id = auth.uid()`. Cannot mutate `verification_status` directly.
- **Storage:** Private bucket `doctor-documents`.
- **Indexes:** `idx_doctors_license_number`.

---

## 3. Pharmacy Pages Matrix

### 3.1 Pharmacy Dashboard (`/pharmacy/dashboard`)
- **UI Fields:** Medical store header, Drug License number, GSTIN, KPI cards (Orders In Processing, Completed Orders, Total Inventory Items), recent incoming prescription orders table.
- **UI Actions:** Quick links to fulfill orders and manage inventory.
- **API:** `pharmacyService.getPharmacyOrders(pharmacyId)`.
- **Query:**
  ```sql
  SELECT id, order_number, total_amount, payment_status, order_status, created_at, patient_id
  FROM public.medicine_orders
  WHERE pharmacy_id = auth.uid()
  ORDER BY created_at DESC LIMIT 5;
  ```
- **Tables:** `medicine_orders`, `pharmacies`, `pharmacy_inventory`.
- **Relationships:** `medicine_orders.pharmacy_id -> pharmacies.id`.
- **RLS:** `pharmacy_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_medicine_orders_pharmacy_id`.

---

### 3.2 Prescription Order Processing (`/pharmacy/orders`)
- **UI Fields:** Orders queue table, selected order drawer, patient details, attached Rx ID, prescribed medicines list, dispensation status buttons (Accept -> Dispense -> Dispatch -> Deliver -> Cancel).
- **UI Actions:** Select order, verify attached Rx, trigger atomic dispensation with inventory decrement.
- **API:** `orderService.fulfillPrescriptionOrder(orderId, pharmacyId, action)`.
- **Query (Fulfillment RPC):**
  ```sql
  SELECT public.pharmacy_fulfill_prescription_tx(
      p_order_id := :order_id,
      p_pharmacy_id := auth.uid(),
      p_action := :action
  );
  ```
- **Tables:** `medicine_orders`, `order_items`, `prescriptions`, `pharmacy_inventory`, `medicines`.
- **Relationships:** `order_items.order_id -> medicine_orders.id`, `order_items.medicine_id -> medicines.id`.
- **RLS:** `pharmacy_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_order_items_order_id`.

---

### 3.3 Drug Inventory & Batch Control (`/pharmacy/inventory`, `/pharmacy/inventory/batches`) [EXTENDED]
- **UI Fields:** Search bar, drug master catalog, stock quantity, unit retail price, batch number, expiry date, reorder threshold, low stock alert badge (< 10 units), near-expiry alert badge (< 90 days).
- **UI Actions:** Adjust stock quantities, update retail unit price, enter new batch number and expiry date, add medicine to inventory.
- **API:** `pharmacyService.getMedicines()`, `pharmacyService.updateStock(pharmacyId, medicineId, data)`.
- **Query:**
  ```sql
  INSERT INTO public.pharmacy_inventory (
      pharmacy_id, medicine_id, stock_quantity, unit_price, reorder_level, batch_number, expiry_date, is_available
  ) VALUES (
      auth.uid(), :medicine_id, :stock_quantity, :unit_price, :reorder_level, :batch_number, :expiry_date, true
  ) ON CONFLICT (pharmacy_id, medicine_id) DO UPDATE SET
      stock_quantity = EXCLUDED.stock_quantity,
      unit_price = EXCLUDED.unit_price,
      batch_number = EXCLUDED.batch_number,
      expiry_date = EXCLUDED.expiry_date,
      updated_at = NOW();
  ```
- **Tables:** `pharmacy_inventory`, `medicines`, `pharmacies`.
- **Relationships:** `pharmacy_inventory.pharmacy_id -> pharmacies.id`, `pharmacy_inventory.medicine_id -> medicines.id`.
- **RLS:** `pharmacy_id = auth.uid()`.
- **Storage:** None.
- **Indexes:** `idx_pharmacy_inventory_expiry` `(pharmacy_id, expiry_date)`.

---

### 3.4 Pharmacy Profile & Licensing (`/pharmacy/profile`) [NEW]
- **UI Fields:** Pharmacy name, contact person, phone, email, drug license number, GSTIN, retail address, verification status badge, uploaded license documents.
- **UI Actions:** Update address and contact details, upload drug license certificate PDF to `pharmacy-documents` storage bucket.
- **API:** `pharmacyService.updateProfile(data)`.
- **Query:**
  ```sql
  UPDATE public.pharmacies
  SET pharmacy_name = :pharmacy_name, contact_person = :contact_person,
      phone = :phone, address = :address, gstin = :gstin, updated_at = NOW()
  WHERE id = auth.uid();
  ```
- **Tables:** `pharmacies`, `pharmacy_verifications`.
- **Relationships:** `pharmacies.id -> auth.users.id`.
- **RLS:** `id = auth.uid()`. Cannot mutate `verification_status` directly.
- **Storage:** Private bucket `pharmacy-documents`.
- **Indexes:** `idx_pharmacies_license_number`.

---

## 4. Admin Pages Matrix

### 4.1 Admin Dashboard (`/admin/dashboard`)
- **UI Fields:** Master governance banner, pending approval alert notification, KPI metrics (Pending/Approved Doctors, Pending/Approved Pharmacies, Total Patients, Total Orders, Total Revenue), platform activity summary.
- **UI Actions:** Navigate to verification queues, view audit logs.
- **API:** `adminService.getSystemKPIs()`.
- **Query:**
  ```sql
  SELECT
      (SELECT COUNT(*) FROM public.patients) AS total_patients,
      (SELECT COUNT(*) FROM public.doctors WHERE verification_status = 'pending') AS pending_doctors,
      (SELECT COUNT(*) FROM public.doctors WHERE verification_status = 'approved') AS approved_doctors,
      (SELECT COUNT(*) FROM public.pharmacies WHERE verification_status = 'pending') AS pending_pharmacies,
      (SELECT COUNT(*) FROM public.pharmacies WHERE verification_status = 'approved') AS approved_pharmacies,
      (SELECT COUNT(*) FROM public.appointments) AS total_appointments,
      (SELECT COALESCE(SUM(total_amount), 0) FROM public.medicine_orders WHERE order_status != 'cancelled') AS total_revenue;
  ```
- **Tables:** `patients`, `doctors`, `pharmacies`, `appointments`, `medicine_orders`.
- **RLS:** `public.is_admin() = true`.
- **Storage:** None.
- **Indexes:** Primary key and verification_status indexes.

---

### 4.2 Doctor Approvals Gate (`/admin/doctor-approvals`)
- **UI Fields:** Tab filters (Pending, Approved, Rejected, All), search input, doctor verification cards (Name, License #, Qualifications, Experience, Clinic Address, Submitted Documents), Approve and Reject buttons, Rejection justification modal.
- **UI Actions:** Approve doctor, reject with clinical compliance reason.
- **API:** `adminService.verifyDoctor(doctorId, status, reason)` (`verify_doctor_tx` RPC).
- **Query:**
  ```sql
  SELECT public.verify_doctor_tx(
      p_doctor_id := :doctor_id,
      p_status := :status,
      p_reason := :reason
  );
  ```
- **Tables:** `doctors`, `doctor_verifications`, `notifications`, `audit_logs`.
- **RLS:** Admin or Super Admin only.
- **Storage:** Private bucket `doctor-documents` (Admin read).
- **Indexes:** `idx_doctors_verification_status`.

---

### 4.3 Pharmacy Approvals Gate (`/admin/pharmacy-approvals`)
- **UI Fields:** Tab filters, pharmacy cards (Store Name, License #, GSTIN, Address, Contact), Approve and Reject buttons, Rejection modal.
- **UI Actions:** Approve pharmacy, reject with compliance reason.
- **API:** `adminService.verifyPharmacy(pharmacyId, status, reason)` (`verify_pharmacy_tx` RPC).
- **Query:**
  ```sql
  SELECT public.verify_pharmacy_tx(
      p_pharmacy_id := :pharmacy_id,
      p_status := :status,
      p_reason := :reason
  );
  ```
- **Tables:** `pharmacies`, `pharmacy_verifications`, `notifications`, `audit_logs`.
- **RLS:** Admin or Super Admin only.
- **Storage:** Private bucket `pharmacy-documents` (Admin read).
- **Indexes:** `idx_pharmacies_verification_status`.

---

### 4.4 User & Role Governance (`/admin/users`) [NEW]
- **UI Fields:** Role filter (All, Patient, Doctor, Pharmacy, Admin), search bar, users table (Name, Email, Role Badge, Registered Date, Verification / Approval Status), account status toggle (Active / Suspended). **Strict privacy:** Does NOT display medical symptoms, diagnosis, or clinical notes (Zero PHI exposure).
- **UI Actions:** Filter users, search users, inspect account metadata.
- **API:** `adminService.getAllUsers()`.
- **Query:**
  ```sql
  SELECT p.id, p.email, p.full_name, p.role, p.approval_status, p.created_at,
         ur.role AS rbac_role
  FROM public.profiles p
  LEFT JOIN public.user_roles ur ON ur.user_id = p.id
  ORDER BY p.created_at DESC;
  ```
- **Tables:** `profiles`, `user_roles`.
- **RLS:** Admin or Super Admin only.
- **Storage:** None.
- **Indexes:** `idx_profiles_created_at`, `idx_user_roles_user_id`.

---

### 4.5 Platform Settings & System Health (`/admin/settings`) [NEW]
- **UI Fields:** AI Microservice health status (FastAPI ping, model version, feature count), rate limit events audit table (Blocked IP, User ID, Endpoint, Timestamp), daily AI usage table (`ai_usage_daily`), platform maintenance toggle.
- **UI Actions:** Run health check, clear rate limit block, inspect system parameters.
- **API:** `mlApi.getHealth()`, `supabase.from('rate_limit_events').select('*')`.
- **Query:**
  ```sql
  SELECT id, ip_address, user_id, endpoint, blocked_at
  FROM public.rate_limit_events
  ORDER BY blocked_at DESC LIMIT 50;
  ```
- **Tables:** `rate_limit_events`, `ai_usage_daily`.
- **RLS:** Admin or Super Admin only.
- **Storage:** None.
- **Indexes:** `idx_rate_limit_events_blocked_at`.
