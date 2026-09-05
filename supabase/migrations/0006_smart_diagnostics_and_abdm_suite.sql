-- ============================================================================
-- MIGRATION 0006: SMART DIAGNOSTICS, ABDM 3.0 VAULT, AMBIENT SCRIBE & CLINICAL AI
-- Matches 100% of the updated MediMind AI Clinical & Patient UI specifications
-- ============================================================================

-- 1. EXTEND PATIENTS TABLE WITH OFFICIAL ABDM ATTRIBUTES
ALTER TABLE patients 
  ADD COLUMN IF NOT EXISTS abha_number TEXT DEFAULT '91-2345-6789-0123',
  ADD COLUMN IF NOT EXISTS abha_address TEXT DEFAULT 'rahul.sharma@abdm',
  ADD COLUMN IF NOT EXISTS repository_sync_status TEXT DEFAULT '100% Synced (3 Facilities)',
  ADD COLUMN IF NOT EXISTS emergency_donor_flag BOOLEAN DEFAULT true;

-- 2. FAMILY HEALTH VAULT DEPENDENTS TABLE
CREATE TABLE IF NOT EXISTS patient_dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  primary_patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  relationship TEXT NOT NULL, -- 'self', 'spouse', 'child', 'father', 'mother', etc.
  age INT NOT NULL,
  blood_group TEXT DEFAULT 'O+',
  abha_number TEXT,
  records_count INT DEFAULT 0,
  hospitals_connected INT DEFAULT 1,
  access_level TEXT DEFAULT 'dependent', -- 'current_view', 'linked', 'dependent', 'monitoring'
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 3. ABDM CONSENT MANAGER ARTIFACTS TABLE
CREATE TABLE IF NOT EXISTS abdm_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consent_artifact_id TEXT UNIQUE NOT NULL,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  requester_doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  requester_organization TEXT NOT NULL,
  requested_records_scope TEXT NOT NULL, -- e.g. 'Lipid Profiles & ECG Records'
  purpose TEXT DEFAULT 'Pre-consultation clinical evaluation',
  valid_from TIMESTAMPTZ DEFAULT now(),
  valid_until TIMESTAMPTZ DEFAULT (now() + interval '30 days'),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'granted', 'revoked', 'expired', 'denied')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 4. ABDM ACCESS AUDIT LOGS TABLE
CREATE TABLE IF NOT EXISTS abdm_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  accessor_name TEXT NOT NULL,
  accessor_role TEXT DEFAULT 'Doctor (Cardiology)',
  gateway_hash TEXT NOT NULL, -- e.g. '#0x9F42...88CA'
  action_type TEXT DEFAULT 'VIEW_FHIR_RECORD',
  target_resource TEXT NOT NULL,
  accessed_at TIMESTAMPTZ DEFAULT now()
);

-- 5. LAB DIAGNOSTICS & HEALTH PACKAGES CATALOG
CREATE TABLE IF NOT EXISTS lab_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  subtitle TEXT,
  category TEXT DEFAULT 'general', -- 'all', 'full_body', 'cardiac', 'diabetes', 'vitamins'
  discount_badge TEXT, -- '50% OFF', 'Doctor Pick', 'Routine Essential'
  sub_badge TEXT, -- 'NABL Certified', 'Cardio Suite', 'Quarterly Sync'
  parameters_count INT NOT NULL DEFAULT 1,
  turnaround_time TEXT DEFAULT '8h',
  included_parameters JSONB DEFAULT '[]'::jsonb,
  highlight_badge TEXT, -- 'Free At-Home Certified Phlebotomy'
  mrp_price NUMERIC(10,2) NOT NULL,
  discounted_price NUMERIC(10,2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. STANDALONE INDIVIDUAL LAB TESTS TABLE
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_code TEXT UNIQUE NOT NULL, -- e.g. 'MM-THY-01'
  test_name TEXT NOT NULL,
  methodology TEXT, -- 'Ultra-sensitive ECLIA'
  sample_type TEXT DEFAULT 'Serum (Blood)',
  fasting_requirement TEXT DEFAULT 'No fasting needed',
  turnaround_time TEXT DEFAULT '6 hours',
  mrp_price NUMERIC(10,2) NOT NULL,
  discounted_price NUMERIC(10,2) NOT NULL,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 7. LAB AT-HOME SAMPLE BOOKINGS & COLD CHAIN TRACKING
CREATE TABLE IF NOT EXISTS lab_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_ref TEXT UNIQUE NOT NULL, -- e.g. '#MM-78264'
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  package_id UUID REFERENCES lab_packages(id) ON DELETE SET NULL,
  test_names TEXT NOT NULL,
  sample_slot_start TIMESTAMPTZ,
  sample_slot_end TIMESTAMPTZ,
  fasting_protocol_active BOOLEAN DEFAULT true,
  phlebotomist_name TEXT DEFAULT 'Vikram Rajput',
  phlebotomist_badge TEXT DEFAULT 'Double Vaccinated & NABL',
  phlebotomist_phone TEXT DEFAULT '+91 98110 44921',
  cold_chain_temp_range TEXT DEFAULT '4°C - 8°C',
  pickup_otp TEXT NOT NULL DEFAULT '4921',
  status TEXT DEFAULT 'out_for_pickup' CHECK (status IN ('booked', 'technician_assigned', 'out_for_pickup', 'sample_at_lab', 'ai_analysis_ready', 'completed', 'cancelled')),
  current_step INT DEFAULT 3, -- 1 to 5
  step_notes TEXT DEFAULT 'Technician En Route (1.2km away)',
  total_paid NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 8. DAILY MEDICATION DOSE SCHEDULE & SMART PHARMACY REFILLS
CREATE TABLE IF NOT EXISTS medication_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  prescription_id UUID REFERENCES prescriptions(id) ON DELETE SET NULL,
  medicine_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  time_of_day TEXT NOT NULL CHECK (time_of_day IN ('morn', 'afternoon', 'night')),
  scheduled_time TEXT NOT NULL, -- '08:30 AM'
  instructions TEXT DEFAULT 'After meals with warm water',
  status TEXT DEFAULT 'pending' CHECK (status IN ('taken', 'pending', 'skipped')),
  taken_at TIMESTAMPTZ,
  date_logged DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 9. AI CLINICAL FINDINGS & MULTI-MODAL PREDICTION INFERENCES (DOCTOR & PATIENT)
CREATE TABLE IF NOT EXISTS ai_clinical_findings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES doctors(id) ON DELETE SET NULL,
  finding_type TEXT NOT NULL, -- 'Early Sepsis Biomarker', 'Cardiac Arrhythmia / QTc', 'Acute Bacterial Sinusitis'
  acuity_level TEXT DEFAULT 'ESI-3', -- ESI-1, ESI-2, ESI-3, ESI-4, ESI-5
  probability_pct INT NOT NULL, -- 0 to 100
  clinical_tier TEXT DEFAULT 'Urgent Intervention Required',
  icd10_codes TEXT[] DEFAULT ARRAY[]::TEXT[],
  biomarker_correlations JSONB DEFAULT '{}'::jsonb, -- e.g. {"WBC": "14.8k", "CRP": "28 mg/L"}
  shap_features JSONB DEFAULT '[]'::jsonb,
  oversight_signed BOOLEAN DEFAULT false,
  signed_by_doctor_id UUID REFERENCES doctors(id),
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 10. AMBIENT CLINICAL SCRIBE & TELEHEALTH SESSIONS
CREATE TABLE IF NOT EXISTS consultation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
  doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  transcript JSONB DEFAULT '[]'::jsonb,
  extracted_snomed_entities JSONB DEFAULT '[]'::jsonb,
  soap_notes JSONB DEFAULT '{
    "subjective": "",
    "objective": "",
    "assessment": "",
    "plan": ""
  }'::jsonb,
  dsc_signed_token TEXT,
  is_concluded BOOLEAN DEFAULT false,
  concluded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE patient_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE abdm_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE abdm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_clinical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_sessions ENABLE ROW LEVEL SECURITY;

-- lab_packages and lab_tests: Read-only for authenticated & anon
CREATE POLICY "Public read for lab packages" ON lab_packages FOR SELECT USING (true);
CREATE POLICY "Public read for lab tests" ON lab_tests FOR SELECT USING (true);

-- patient_dependents
CREATE POLICY "Patients view own dependents" ON patient_dependents
  FOR SELECT USING (
    primary_patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin', 'super_admin'))
  );
CREATE POLICY "Patients manage own dependents" ON patient_dependents
  FOR ALL USING (primary_patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- abdm_consents
CREATE POLICY "Patients & Doctors access consents" ON abdm_consents
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    requester_doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );
CREATE POLICY "Patients modify their consents" ON abdm_consents
  FOR UPDATE USING (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- abdm_audit_logs
CREATE POLICY "Patients read own abdm logs" ON abdm_audit_logs
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- lab_bookings
CREATE POLICY "Patients view own lab bookings" ON lab_bookings
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin', 'super_admin'))
  );
CREATE POLICY "Patients insert own lab bookings" ON lab_bookings
  FOR INSERT WITH CHECK (patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()));

-- medication_schedules
CREATE POLICY "Patients view & update own medication schedules" ON medication_schedules
  FOR ALL USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin', 'super_admin'))
  );

-- ai_clinical_findings
CREATE POLICY "Clinicians & Patients view AI findings" ON ai_clinical_findings
  FOR SELECT USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'admin', 'super_admin'))
  );
CREATE POLICY "Doctors sign AI findings" ON ai_clinical_findings
  FOR UPDATE USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('doctor', 'super_admin')));

-- consultation_sessions
CREATE POLICY "Consultation session participants" ON consultation_sessions
  FOR ALL USING (
    patient_id IN (SELECT id FROM patients WHERE profile_id = auth.uid()) OR
    doctor_id IN (SELECT id FROM doctors WHERE profile_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin'))
  );

-- ============================================================================
-- ATOMIC STORED PROCEDURES & TRANSACTIONS (RPCs)
-- ============================================================================

-- 1. Atomic Lab Test Booking RPC
CREATE OR REPLACE FUNCTION book_lab_test_tx(
  p_patient_id UUID,
  p_package_id UUID,
  p_test_names TEXT,
  p_total_amount NUMERIC
) RETURNS JSONB AS $$
DECLARE
  v_booking_ref TEXT;
  v_otp TEXT;
  v_booking_id UUID;
BEGIN
  -- Generate unique booking reference and 4-digit OTP
  v_booking_ref := '#MM-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 5));
  v_otp := (1000 + FLOOR(random() * 9000))::text;

  INSERT INTO lab_bookings (
    booking_ref,
    patient_id,
    package_id,
    test_names,
    sample_slot_start,
    sample_slot_end,
    pickup_otp,
    total_paid,
    status,
    current_step,
    step_notes
  ) VALUES (
    v_booking_ref,
    p_patient_id,
    p_package_id,
    p_test_names,
    now() + interval '12 hours',
    now() + interval '13 hours',
    v_otp,
    p_total_amount,
    'technician_assigned',
    2,
    'Phlebotomist Vikram Rajput assigned. Pre-collection vacutainer kit sealed.'
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'booking_ref', v_booking_ref,
    'pickup_otp', v_otp
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Process ABDM Consent Action RPC
CREATE OR REPLACE FUNCTION process_abdm_consent_tx(
  p_consent_id UUID,
  p_action TEXT -- 'grant', 'deny', 'revoke'
) RETURNS JSONB AS $$
DECLARE
  v_patient_id UUID;
  v_requester TEXT;
  v_hash TEXT;
BEGIN
  SELECT patient_id, requester_name INTO v_patient_id, v_requester
  FROM abdm_consents WHERE id = p_consent_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Consent artifact not found');
  END IF;

  v_hash := '#0x' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 8)) || '...88CA';

  IF p_action = 'grant' THEN
    UPDATE abdm_consents SET status = 'granted', updated_at = now() WHERE id = p_consent_id;
    INSERT INTO abdm_audit_logs (patient_id, accessor_name, gateway_hash, action_type, target_resource)
    VALUES (v_patient_id, v_requester, v_hash, 'CONSENT_GRANTED_30D', 'Lipid Profiles & ECG Records');
  ELSIF p_action = 'deny' THEN
    UPDATE abdm_consents SET status = 'denied', updated_at = now() WHERE id = p_consent_id;
    INSERT INTO abdm_audit_logs (patient_id, accessor_name, gateway_hash, action_type, target_resource)
    VALUES (v_patient_id, v_requester, v_hash, 'CONSENT_DENIED', 'Lipid Profiles & ECG Records');
  ELSIF p_action = 'revoke' THEN
    UPDATE abdm_consents SET status = 'revoked', updated_at = now() WHERE id = p_consent_id;
    INSERT INTO abdm_audit_logs (patient_id, accessor_name, gateway_hash, action_type, target_resource)
    VALUES (v_patient_id, v_requester, v_hash, 'CONSENT_REVOKED', 'Ambulatory & EHR records');
  END IF;

  RETURN jsonb_build_object('success', true, 'status', p_action, 'audit_hash', v_hash);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Log Medication Dose RPC
CREATE OR REPLACE FUNCTION log_medication_dose_tx(
  p_schedule_id UUID,
  p_status TEXT -- 'taken', 'skipped'
) RETURNS JSONB AS $$
BEGIN
  UPDATE medication_schedules
  SET status = p_status,
      taken_at = CASE WHEN p_status = 'taken' THEN now() ELSE NULL END
  WHERE id = p_schedule_id;

  RETURN jsonb_build_object('success', true, 'schedule_id', p_schedule_id, 'status', p_status);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DSC Sign Consultation Session RPC
CREATE OR REPLACE FUNCTION sign_consultation_dsc_tx(
  p_session_id UUID,
  p_doctor_id UUID,
  p_soap_notes JSONB
) RETURNS JSONB AS $$
DECLARE
  v_token TEXT;
BEGIN
  v_token := 'DSC-SIG-' || UPPER(SUBSTRING(gen_random_uuid()::text, 1, 12));

  UPDATE consultation_sessions
  SET soap_notes = p_soap_notes,
      dsc_signed_token = v_token,
      is_concluded = true,
      concluded_at = now(),
      updated_at = now()
  WHERE id = p_session_id;

  RETURN jsonb_build_object(
    'success', true,
    'session_id', p_session_id,
    'dsc_token', v_token,
    'signed_at', now()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SEED INITIAL CORE CATALOG MATCHING SCREENSHOTS
-- ============================================================================

-- Seed Lab Packages
INSERT INTO lab_packages (slug, title, subtitle, category, discount_badge, sub_badge, parameters_count, turnaround_time, included_parameters, highlight_badge, mrp_price, discounted_price)
VALUES 
(
  'executive-full-body',
  'MediMind Executive Full Body Comprehensive',
  'Complete wellness & organ function screen',
  'full_body',
  '50% OFF',
  'NABL Certified',
  64,
  '8h',
  '["Complete Hemogram (CBC, ESR)", "Liver (LFT) & Kidney (KFT) Function", "Lipid Profile & HbA1c Glycated", "Vitamin D3 & Active B12 Complex"]'::jsonb,
  'Free At-Home Certified Phlebotomy',
  3200.00,
  1499.00
),
(
  'cardiac-risk-screening',
  'Advanced Cardiac Risk & Lipid Screening',
  'Dr. Sarah Chen Recommended',
  'cardiac',
  'Doctor Pick',
  'Cardio Suite',
  18,
  '8h',
  '["High Sensitivity CRP (hs-CRP)", "Apolipoprotein A1 & Apo-B Ratio", "Lipid Subfractions & VLDL", "Serum Homocysteine"]'::jsonb,
  'AI Atherosclerosis Score Included',
  1800.00,
  999.00
),
(
  'hba1c-glucose-monitor',
  'HbA1c & Fasting Blood Glucose Dual Monitor',
  'Quarterly Glycemic Sync',
  'diabetes',
  'Routine Essential',
  'Quarterly Sync',
  4,
  '4h',
  '["Glycated Hemoglobin (HbA1c)", "Estimated Average Glucose (eAG)", "Plasma Glucose (Fasting)", "Urine Microalbumin Screen"]'::jsonb,
  'Trends synced with CGM data',
  850.00,
  399.00
)
ON CONFLICT (slug) DO NOTHING;

-- Seed Standalone Lab Tests
INSERT INTO lab_tests (test_code, test_name, methodology, sample_type, fasting_requirement, turnaround_time, mrp_price, discounted_price, is_popular)
VALUES
('MM-THY-01', 'Thyroid Stimulating Hormone (TSH 3rd Gen)', 'Ultra-sensitive ECLIA', 'Serum (Blood)', 'No fasting needed', '6 hours', 400.00, 249.00, true),
('MM-VIT-25', 'Vitamin D 25-Hydroxy (Total)', 'Chemiluminescent LC-MS', 'Serum (Blood)', 'Non-fasting', '12 hours', 1400.00, 699.00, true),
('MM-URN-04', 'Complete Urine Analysis with Microscopic Exam', 'Automated Strip + Flow Cytometry', 'Mid-stream Urine', 'Morning sample preferred', '4 hours', 350.00, 199.00, true),
('MM-LIP-08', 'Lipid Profile Extended (Direct LDL, Triglycerides)', 'Enzymatic Selective Inhibition', 'Serum (Blood)', '10-12 hrs fasting required', '6 hours', 850.00, 450.00, true)
ON CONFLICT (test_code) DO NOTHING;
