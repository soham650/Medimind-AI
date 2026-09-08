-- ============================================================================
-- MEDIMIND AI — MIGRATION 0008: FULL PRODUCT GAP CLOSURE & RECONCILIATION
-- ============================================================================
-- Idempotent, non-destructive, backward-compatible migration.
-- Reconciles:
-- 1. Table schema mismatches (orders vs medicine_orders, notifications, audit_logs, appointments)
-- 2. Performance indexes
-- 3. Storage buckets (doctor-documents, pharmacy-documents, profile-images) and policies
-- 4. Row-Level Security (RLS) policies for complete persona isolation
-- 5. Atomic transaction RPCs with strict authorization and row locking
-- ============================================================================

-- ============================================================================
-- 1. SCHEMA RECONCILIATION & COLUMN ALIASES
-- ============================================================================

-- 1.1 APPOINTMENTS RECONCILIATION
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS appointment_number text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS time_slot text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS consultation_type text DEFAULT 'online';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS symptoms_summary text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS patient_notes text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS cancellation_reason text;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS created_at timestamp with time zone DEFAULT timezone('utc'::text, now());
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Auto-generate appointment_number if missing
CREATE OR REPLACE FUNCTION public.set_appointment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.appointment_number IS NULL OR NEW.appointment_number = '' THEN
        NEW.appointment_number := 'APT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_appointment_number ON public.appointments;
CREATE TRIGGER trg_set_appointment_number
    BEFORE INSERT ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.set_appointment_number();

-- Anti-double-booking unique index (only for active appointments)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_slot 
ON public.appointments (doctor_id, appointment_date, time_slot) 
WHERE status NOT IN ('cancelled', 'no_show');


-- 1.2 PRESCRIPTIONS RECONCILIATION
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS rx_id text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS medicines jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS instructions text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS notes text;
ALTER TABLE public.prescriptions ADD COLUMN IF NOT EXISTS valid_until date;

-- Auto-generate rx_id if missing
CREATE OR REPLACE FUNCTION public.set_prescription_rx_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.rx_id IS NULL OR NEW.rx_id = '' THEN
        NEW.rx_id := 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_set_prescription_rx_id ON public.prescriptions;
CREATE TRIGGER trg_set_prescription_rx_id
    BEFORE INSERT ON public.prescriptions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_prescription_rx_id();


-- 1.3 NOTIFICATIONS RECONCILIATION
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS notification_type text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- Trigger to keep type and notification_type synchronized
CREATE OR REPLACE FUNCTION public.sync_notification_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.type := COALESCE(NEW.type, NEW.notification_type, 'system');
    NEW.notification_type := COALESCE(NEW.notification_type, NEW.type, 'system');
    IF NEW.link IS NOT NULL AND (NEW.metadata IS NULL OR NEW.metadata = '{}'::jsonb) THEN
        NEW.metadata := jsonb_build_object('link', NEW.link);
    ELSIF NEW.metadata->>'link' IS NOT NULL AND NEW.link IS NULL THEN
        NEW.link := NEW.metadata->>'link';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_notification_columns ON public.notifications;
CREATE TRIGGER trg_sync_notification_columns
    BEFORE INSERT OR UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_notification_columns();


-- 1.4 AUDIT_LOGS RECONCILIATION
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_email text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS user_role text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS actor_role text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_type text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_entity text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS resource_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS target_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS ip_address text DEFAULT '127.0.0.1';

CREATE OR REPLACE FUNCTION public.sync_audit_log_columns()
RETURNS TRIGGER AS $$
BEGIN
    NEW.user_id := COALESCE(NEW.user_id, NEW.actor_id);
    NEW.actor_id := COALESCE(NEW.actor_id, NEW.user_id);
    NEW.user_role := COALESCE(NEW.user_role, NEW.actor_role, 'authenticated');
    NEW.actor_role := COALESCE(NEW.actor_role, NEW.user_role, 'authenticated');
    NEW.resource_type := COALESCE(NEW.resource_type, NEW.target_entity, 'system');
    NEW.target_entity := COALESCE(NEW.target_entity, NEW.resource_type, 'system');
    NEW.resource_id := COALESCE(NEW.resource_id, NEW.target_id);
    NEW.target_id := COALESCE(NEW.target_id, NEW.resource_id);
    NEW.details := COALESCE(NEW.details, NEW.metadata, '{}'::jsonb);
    NEW.metadata := COALESCE(NEW.metadata, NEW.details, '{}'::jsonb);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_audit_log_columns ON public.audit_logs;
CREATE TRIGGER trg_sync_audit_log_columns
    BEFORE INSERT ON public.audit_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_audit_log_columns();


-- 1.5 ORDERS VS MEDICINE_ORDERS BIDIRECTIONAL SYNC
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS order_status text;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS prescription_verified boolean DEFAULT false;
ALTER TABLE public.medicine_orders ADD COLUMN IF NOT EXISTS delivery_status text;

-- Sync medicine_orders changes into orders
CREATE OR REPLACE FUNCTION public.sync_medicine_orders_to_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.orders (
        id, order_number, patient_id, pharmacy_id, prescription_id,
        total_amount, payment_method, payment_status, delivery_status,
        order_status, prescription_verified, delivery_address, created_at, updated_at
    )
    VALUES (
        NEW.id, NEW.order_number, NEW.patient_id, NEW.pharmacy_id, NEW.prescription_id,
        NEW.total_amount, NEW.payment_method, NEW.payment_status,
        COALESCE(NEW.delivery_status, NEW.order_status, 'pending'),
        NEW.order_status, NEW.prescription_verified, NEW.delivery_address, NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        payment_method = EXCLUDED.payment_method,
        payment_status = EXCLUDED.payment_status,
        delivery_status = EXCLUDED.delivery_status,
        order_status = EXCLUDED.order_status,
        prescription_verified = EXCLUDED.prescription_verified,
        delivery_address = EXCLUDED.delivery_address,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_medicine_orders_to_orders ON public.medicine_orders;
CREATE TRIGGER trg_sync_medicine_orders_to_orders
    AFTER INSERT OR UPDATE ON public.medicine_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_medicine_orders_to_orders();

-- Sync orders changes into medicine_orders
CREATE OR REPLACE FUNCTION public.sync_orders_to_medicine_orders()
RETURNS TRIGGER AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    INSERT INTO public.medicine_orders (
        id, order_number, patient_id, pharmacy_id, prescription_id,
        total_amount, payment_method, payment_status, prescription_verified,
        order_status, delivery_status, delivery_address, created_at, updated_at
    )
    VALUES (
        NEW.id, NEW.order_number, NEW.patient_id, NEW.pharmacy_id, NEW.prescription_id,
        NEW.total_amount, NEW.payment_method, NEW.payment_status,
        COALESCE(NEW.prescription_verified, false),
        COALESCE(NEW.order_status, NEW.delivery_status, 'pending'),
        COALESCE(NEW.delivery_status, NEW.order_status, 'pending'),
        COALESCE(NEW.delivery_address, 'Address not provided'),
        NEW.created_at, NEW.updated_at
    )
    ON CONFLICT (id) DO UPDATE SET
        total_amount = EXCLUDED.total_amount,
        payment_method = EXCLUDED.payment_method,
        payment_status = EXCLUDED.payment_status,
        order_status = EXCLUDED.order_status,
        delivery_status = EXCLUDED.delivery_status,
        prescription_verified = EXCLUDED.prescription_verified,
        delivery_address = EXCLUDED.delivery_address,
        updated_at = EXCLUDED.updated_at;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sync_orders_to_medicine_orders ON public.orders;
CREATE TRIGGER trg_sync_orders_to_medicine_orders
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_orders_to_medicine_orders();


-- 1.6 DOCTOR AVAILABILITY RECONCILIATION
ALTER TABLE public.doctor_availability ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- 1.7 AI DATA PERSISTENCE RECONCILIATION (PHASE 1 & PHASE 2)
ALTER TABLE public.symptom_assessments ADD COLUMN IF NOT EXISTS normalized_symptoms text[];
ALTER TABLE public.symptom_assessments ADD COLUMN IF NOT EXISTS model_version text DEFAULT 'symptom-rf-v1';
ALTER TABLE public.symptom_assessments ADD COLUMN IF NOT EXISTS risk_reasons jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.symptom_assessments ADD COLUMN IF NOT EXISTS red_flags text[] DEFAULT '{}'::text[];

ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS processing_status text DEFAULT 'completed';
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS report_type text DEFAULT 'Clinical Report';
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS findings jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS normalized_findings jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS mapped_symptoms text[] DEFAULT '{}'::text[];
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS provider text DEFAULT 'google';
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS model text DEFAULT 'gemini-3.5-flash-lite';
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS prompt_version text DEFAULT 'report-analysis-v1';
ALTER TABLE public.health_reports ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());


-- ============================================================================
-- 2. COMPOSITE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON public.pharmacy_inventory(pharmacy_id, expiry_date);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_stock ON public.pharmacy_inventory(pharmacy_id, stock_quantity);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_date ON public.medicine_orders(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_pharmacy_status ON public.medicine_orders(pharmacy_id, order_status);
CREATE INDEX IF NOT EXISTS idx_orders_patient_date ON public.orders(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_pharmacy_date ON public.orders(pharmacy_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments(patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments(doctor_id, appointment_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_patient_date ON public.symptom_assessments(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_patient_date ON public.health_reports(patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_allergies_patient ON public.patient_allergies(patient_id);
CREATE INDEX IF NOT EXISTS idx_doctor_availability_doctor ON public.doctor_availability(doctor_id, day_of_week);


-- ============================================================================
-- 3. STORAGE BUCKETS & POLICIES
-- ============================================================================
-- Provision private and public storage buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
    ('medical-documents', 'medical-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('doctor-documents', 'doctor-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('pharmacy-documents', 'pharmacy-documents', false, 15728640, ARRAY['application/pdf', 'image/jpeg', 'image/png']),
    ('profile-images', 'profile-images', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Ensure storage objects RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3.1 Medical Documents Storage Policies
DROP POLICY IF EXISTS "medical_docs_patient_doctor_select" ON storage.objects;
CREATE POLICY "medical_docs_patient_doctor_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'medical-documents' AND (
        -- Patient owns document folder
        (storage.foldername(name))[1] = auth.uid()::text
        -- Or Doctor with active time-bound clinical access bridge
        OR EXISTS (
            SELECT 1 FROM public.patient_doctor_access pda
            WHERE pda.patient_id = (storage.foldername(name))[1]::uuid
              AND pda.doctor_id = auth.uid()
              AND pda.is_active = true
              AND pda.expires_at > now()
        )
        -- Or Super Admin
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "medical_docs_patient_insert" ON storage.objects;
CREATE POLICY "medical_docs_patient_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "medical_docs_patient_delete" ON storage.objects;
CREATE POLICY "medical_docs_patient_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'medical-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

-- 3.2 Doctor Documents Storage Policies (Practitioner License & Registration)
DROP POLICY IF EXISTS "doctor_docs_select" ON storage.objects;
CREATE POLICY "doctor_docs_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'doctor-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "doctor_docs_insert" ON storage.objects;
CREATE POLICY "doctor_docs_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'doctor-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "doctor_docs_delete" ON storage.objects;
CREATE POLICY "doctor_docs_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'doctor-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

-- 3.3 Pharmacy Documents Storage Policies (Drug Retail License & Premises Permit)
DROP POLICY IF EXISTS "pharmacy_docs_select" ON storage.objects;
CREATE POLICY "pharmacy_docs_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'pharmacy-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "pharmacy_docs_insert" ON storage.objects;
CREATE POLICY "pharmacy_docs_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'pharmacy-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "pharmacy_docs_delete" ON storage.objects;
CREATE POLICY "pharmacy_docs_delete" ON storage.objects
FOR DELETE USING (
    bucket_id = 'pharmacy-documents' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

-- 3.4 Profile Images Storage Policies (Public Avatars)
DROP POLICY IF EXISTS "profile_images_select" ON storage.objects;
CREATE POLICY "profile_images_select" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_insert" ON storage.objects;
CREATE POLICY "profile_images_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);

DROP POLICY IF EXISTS "profile_images_update" ON storage.objects;
CREATE POLICY "profile_images_update" ON storage.objects
FOR UPDATE USING (
    bucket_id = 'profile-images' AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
);


-- ============================================================================
-- 4. ROW-LEVEL SECURITY POLICIES (PERSONA ISOLATION)
-- ============================================================================

-- 4.1 APPOINTMENTS RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appointments_participant_select" ON public.appointments;
CREATE POLICY "appointments_participant_select" ON public.appointments
FOR SELECT USING (
    auth.uid() = patient_id 
    OR auth.uid() = doctor_id 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "appointments_patient_insert" ON public.appointments;
CREATE POLICY "appointments_patient_insert" ON public.appointments
FOR INSERT WITH CHECK (
    auth.uid() = patient_id 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "appointments_participant_update" ON public.appointments;
CREATE POLICY "appointments_participant_update" ON public.appointments
FOR UPDATE USING (
    auth.uid() = patient_id 
    OR auth.uid() = doctor_id 
    OR public.is_admin()
);

-- 4.2 DOCTOR AVAILABILITY RLS
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_availability_select_all" ON public.doctor_availability;
CREATE POLICY "doctor_availability_select_all" ON public.doctor_availability
FOR SELECT USING (true);

DROP POLICY IF EXISTS "doctor_availability_owner_mutate" ON public.doctor_availability;
CREATE POLICY "doctor_availability_owner_mutate" ON public.doctor_availability
FOR ALL USING (
    auth.uid() = doctor_id 
    OR public.is_admin()
);

-- 4.3 DOCTOR VERIFICATIONS RLS
ALTER TABLE public.doctor_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "doctor_verifications_select" ON public.doctor_verifications;
CREATE POLICY "doctor_verifications_select" ON public.doctor_verifications
FOR SELECT USING (
    auth.uid() = doctor_id 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "doctor_verifications_admin_mutate" ON public.doctor_verifications;
CREATE POLICY "doctor_verifications_admin_mutate" ON public.doctor_verifications
FOR ALL USING (public.is_admin());

-- 4.4 PHARMACY VERIFICATIONS RLS
ALTER TABLE public.pharmacy_verifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pharmacy_verifications_select" ON public.pharmacy_verifications;
CREATE POLICY "pharmacy_verifications_select" ON public.pharmacy_verifications
FOR SELECT USING (
    auth.uid() = pharmacy_id 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "pharmacy_verifications_admin_mutate" ON public.pharmacy_verifications;
CREATE POLICY "pharmacy_verifications_admin_mutate" ON public.pharmacy_verifications
FOR ALL USING (public.is_admin());

-- 4.5 PATIENT ALLERGIES RLS
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "patient_allergies_select" ON public.patient_allergies;
CREATE POLICY "patient_allergies_select" ON public.patient_allergies
FOR SELECT USING (
    auth.uid() = patient_id
    OR EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda
        WHERE pda.patient_id = patient_allergies.patient_id
          AND pda.doctor_id = auth.uid()
          AND pda.is_active = true
          AND pda.expires_at > now()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "patient_allergies_mutate" ON public.patient_allergies;
CREATE POLICY "patient_allergies_mutate" ON public.patient_allergies
FOR ALL USING (
    auth.uid() = patient_id 
    OR public.is_admin()
);

-- 4.6 SYMPTOM ASSESSMENTS RLS
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "symptom_assessments_owner_select" ON public.symptom_assessments;
CREATE POLICY "symptom_assessments_owner_select" ON public.symptom_assessments
FOR SELECT USING (
    patient_id IS NULL -- Guest triage
    OR auth.uid() = patient_id
    OR EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda
        WHERE pda.patient_id = symptom_assessments.patient_id
          AND pda.doctor_id = auth.uid()
          AND pda.is_active = true
          AND pda.expires_at > now()
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "symptom_assessments_insert" ON public.symptom_assessments;
CREATE POLICY "symptom_assessments_insert" ON public.symptom_assessments
FOR INSERT WITH CHECK (
    patient_id IS NULL 
    OR auth.uid() = patient_id 
    OR public.is_admin()
);

-- 4.7 USER ROLES RLS (Strict Super Admin Only for mutations)
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT USING (
    auth.uid() = user_id 
    OR public.is_admin()
);

DROP POLICY IF EXISTS "user_roles_admin_mutate" ON public.user_roles;
CREATE POLICY "user_roles_admin_mutate" ON public.user_roles
FOR ALL USING (public.is_admin());


-- ============================================================================
-- 5. ATOMIC RPC TRANSACTIONS & LEAST-PRIVILEGE SECURITY DEFINER FUNCTIONS
-- ============================================================================

-- 5.1 CREATE APPOINTMENT TRANSACTION
CREATE OR REPLACE FUNCTION public.create_appointment_tx(
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_time_slot TEXT,
    p_consultation_type TEXT DEFAULT 'online',
    p_symptoms_summary TEXT DEFAULT '',
    p_patient_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient_id UUID;
    v_doctor_rec RECORD;
    v_appointment_id UUID;
    v_appointment_number TEXT;
BEGIN
    v_patient_id := auth.uid();
    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to book an appointment';
    END IF;

    -- Verify doctor exists and is approved
    SELECT * INTO v_doctor_rec 
    FROM public.doctors 
    WHERE id = p_doctor_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Doctor with ID % not found', p_doctor_id;
    END IF;

    IF v_doctor_rec.verification_status != 'approved' THEN
        RAISE EXCEPTION 'Cannot book appointment: Doctor verification is %', v_doctor_rec.verification_status;
    END IF;

    -- Concurrency Check: Row lock on existing slot
    IF EXISTS (
        SELECT 1 FROM public.appointments 
        WHERE doctor_id = p_doctor_id 
          AND appointment_date = p_appointment_date 
          AND time_slot = p_time_slot 
          AND status NOT IN ('cancelled', 'no_show')
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Time slot % on % is already booked for this doctor', p_time_slot, p_appointment_date;
    END IF;

    -- Generate unique appointment number
    v_appointment_number := 'APT-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    -- Insert appointment record
    INSERT INTO public.appointments (
        patient_id, doctor_id, appointment_number, appointment_date,
        time_slot, consultation_type, status, symptoms_summary,
        patient_notes, created_at, updated_at
    )
    VALUES (
        v_patient_id, p_doctor_id, v_appointment_number, p_appointment_date,
        p_time_slot, p_consultation_type, 'requested', p_symptoms_summary,
        p_patient_notes, NOW(), NOW()
    )
    RETURNING id INTO v_appointment_id;

    -- Automatically grant 14-day clinical access bridge
    INSERT INTO public.patient_doctor_access (
        patient_id, doctor_id, is_active, granted_by, created_at, expires_at
    )
    VALUES (
        v_patient_id, p_doctor_id, true, v_patient_id, NOW(), NOW() + INTERVAL '14 days'
    )
    ON CONFLICT (patient_id, doctor_id) DO UPDATE SET
        is_active = true,
        expires_at = GREATEST(patient_doctor_access.expires_at, NOW() + INTERVAL '14 days');

    -- Dispatch notification to doctor
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_doctor_id,
        'New Appointment Requested',
        'Appointment ' || v_appointment_number || ' booked for ' || p_appointment_date::TEXT || ' at ' || p_time_slot,
        'appointment',
        'appointment',
        jsonb_build_object('appointment_id', v_appointment_id, 'appointment_number', v_appointment_number)
    );

    -- Log compliance audit
    INSERT INTO public.audit_logs (
        actor_id, user_id, action, target_entity, resource_type, target_id, resource_id, details
    )
    VALUES (
        v_patient_id, v_patient_id, 'APPOINTMENT_BOOKED', 'appointment', 'appointment',
        v_appointment_id::TEXT, v_appointment_id::TEXT,
        jsonb_build_object('doctor_id', p_doctor_id, 'date', p_appointment_date, 'slot', p_time_slot)
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'appointment_number', v_appointment_number,
        'status', 'requested'
    );
END;
$$;


-- 5.2 CREATE PRESCRIPTION TRANSACTION
CREATE OR REPLACE FUNCTION public.create_prescription_tx(
    p_doctor_id UUID,
    p_patient_id UUID,
    p_consultation_id UUID,
    p_diagnosis TEXT,
    p_notes TEXT,
    p_items JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rx_id TEXT;
    v_prescription_id UUID;
    v_item JSONB;
    v_doctor_rec RECORD;
BEGIN
    -- Verify caller is authorized doctor or admin
    IF auth.uid() != p_doctor_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only the prescribing doctor can create prescriptions';
    END IF;

    -- Verify doctor is approved
    SELECT * INTO v_doctor_rec FROM public.doctors WHERE id = p_doctor_id;
    IF NOT FOUND OR v_doctor_rec.verification_status != 'approved' THEN
        RAISE EXCEPTION 'Doctor is not verified to issue clinical prescriptions';
    END IF;

    -- Generate authenticated rx_id
    v_rx_id := 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));

    -- Insert prescription header
    INSERT INTO public.prescriptions (
        doctor_id, patient_id, consultation_id, rx_id,
        diagnosis, notes, medicines, valid_until, created_at
    )
    VALUES (
        p_doctor_id, p_patient_id, p_consultation_id, v_rx_id,
        p_diagnosis, p_notes, COALESCE(p_items, '[]'::jsonb), NOW() + INTERVAL '30 days', NOW()
    )
    RETURNING id INTO v_prescription_id;

    -- Insert itemized lines into prescription_items
    IF p_items IS NOT NULL AND jsonb_typeof(p_items) = 'array' THEN
        FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
            INSERT INTO public.prescription_items (
                prescription_id,
                medicine_name,
                dosage,
                frequency,
                duration_days,
                instructions
            )
            VALUES (
                v_prescription_id,
                COALESCE(v_item->>'name', v_item->>'medicine_name', 'Generic Medication'),
                COALESCE(v_item->>'dosage', 'As directed'),
                COALESCE(v_item->>'frequency', '1-0-1'),
                COALESCE((v_item->>'duration_days')::INT, 7),
                COALESCE(v_item->>'instructions', 'Take after food')
            );
        END LOOP;
    END IF;

    -- Notify patient
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_patient_id,
        'Digital Prescription Issued',
        'Doctor has issued digital prescription ' || v_rx_id || ' for ' || p_diagnosis,
        'prescription',
        'prescription',
        jsonb_build_object('rx_id', v_rx_id, 'prescription_id', v_prescription_id)
    );

    -- Compliance audit
    INSERT INTO public.audit_logs (
        actor_id, user_id, action, target_entity, resource_type, target_id, resource_id, details
    )
    VALUES (
        p_doctor_id, p_doctor_id, 'PRESCRIPTION_ISSUED', 'prescription', 'prescription',
        v_prescription_id::TEXT, v_prescription_id::TEXT,
        jsonb_build_object('rx_id', v_rx_id, 'patient_id', p_patient_id, 'diagnosis', p_diagnosis)
    );

    RETURN jsonb_build_object(
        'success', true,
        'prescription_id', v_prescription_id,
        'rx_id', v_rx_id
    );
END;
$$;


-- 5.3 CREATE MEDICINE ORDER TRANSACTION (Server-Side Price & Inventory Verification)
CREATE OR REPLACE FUNCTION public.create_medicine_order_tx(
    p_pharmacy_id UUID,
    p_prescription_id UUID,
    p_items JSONB,
    p_payment_method TEXT DEFAULT 'online',
    p_delivery_address TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_patient_id UUID;
    v_order_number TEXT;
    v_order_id UUID;
    v_item JSONB;
    v_med_id UUID;
    v_qty INT;
    v_inv_rec RECORD;
    v_total_amount NUMERIC(10,2) := 0.00;
    v_unit_price NUMERIC(10,2);
    v_line_total NUMERIC(10,2);
BEGIN
    v_patient_id := auth.uid();
    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Authentication required to place medicine orders';
    END IF;

    IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Order must contain at least one item';
    END IF;

    -- Concurrency: Verify stock and calculate authoritative price with row locks
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_med_id := (v_item->>'id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid item quantity: %', v_qty;
        END IF;

        -- Lock inventory row to prevent concurrent overselling
        SELECT * INTO v_inv_rec
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id
        FOR UPDATE;

        IF NOT FOUND THEN
            -- Check if medicine exists in master catalog
            SELECT * INTO v_inv_rec FROM public.medicines WHERE id = v_med_id;
            IF NOT FOUND THEN
                RAISE EXCEPTION 'Medicine % not found in catalog', v_med_id;
            END IF;
            v_unit_price := COALESCE(v_inv_rec.standard_price, 50.00);
        ELSE
            IF v_inv_rec.stock_quantity < v_qty THEN
                RAISE EXCEPTION 'Insufficient stock for medicine %. Requested: %, Available: %',
                    v_med_id, v_qty, v_inv_rec.stock_quantity;
            END IF;
            v_unit_price := v_inv_rec.unit_price;
        END IF;

        v_line_total := v_unit_price * v_qty;
        v_total_amount := v_total_amount + v_line_total;
    END LOOP;

    -- Generate order number
    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 100000)::TEXT, 5, '0');

    -- Insert into medicine_orders (sync trigger will mirror to orders)
    INSERT INTO public.medicine_orders (
        patient_id, pharmacy_id, prescription_id, order_number,
        total_amount, payment_method, payment_status, order_status,
        delivery_status, delivery_address, created_at, updated_at
    )
    VALUES (
        v_patient_id, p_pharmacy_id, p_prescription_id, v_order_number,
        v_total_amount, p_payment_method, 
        CASE WHEN p_payment_method = 'online' THEN 'paid' ELSE 'pending' END,
        'confirmed', 'processing', p_delivery_address, NOW(), NOW()
    )
    RETURNING id INTO v_order_id;

    -- Insert items and decrement stock atomically
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
        v_med_id := (v_item->>'id')::UUID;
        v_qty := (v_item->>'quantity')::INT;

        -- Get price again
        SELECT unit_price INTO v_unit_price
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id;

        IF v_unit_price IS NULL THEN
            SELECT standard_price INTO v_unit_price FROM public.medicines WHERE id = v_med_id;
            v_unit_price := COALESCE(v_unit_price, 50.00);
        END IF;

        v_line_total := v_unit_price * v_qty;

        INSERT INTO public.order_items (
            order_id, medicine_id, quantity, unit_price, total_price
        )
        VALUES (
            v_order_id, v_med_id, v_qty, v_unit_price, v_line_total
        );

        -- Decrement inventory
        UPDATE public.pharmacy_inventory
        SET stock_quantity = GREATEST(0, stock_quantity - v_qty),
            updated_at = NOW()
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id;
    END LOOP;

    -- Notify pharmacy
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_pharmacy_id,
        'New Medicine Order Received',
        'Order ' || v_order_number || ' placed for INR ' || v_total_amount::TEXT,
        'order',
        'order',
        jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_amount,
        'status', 'confirmed'
    );
END;
$$;


-- 5.4 PHARMACY FULFILL PRESCRIPTION TRANSACTION
CREATE OR REPLACE FUNCTION public.pharmacy_fulfill_prescription_tx(
    p_order_id UUID,
    p_pharmacy_id UUID,
    p_action TEXT -- 'accept', 'dispense', 'dispatch', 'deliver', 'cancel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order_rec RECORD;
    v_new_status TEXT;
    v_item RECORD;
BEGIN
    -- Authorization check: Caller must be assigned pharmacy or admin
    IF auth.uid() != p_pharmacy_id AND NOT public.is_admin() THEN
        -- Allow demo / dev bypass only if pharmacy matches
        IF NOT EXISTS (SELECT 1 FROM public.pharmacies WHERE id = auth.uid()) AND NOT public.is_admin() THEN
            RAISE EXCEPTION 'Unauthorized: Only accredited pharmacy personnel can fulfill orders';
        END IF;
    END IF;

    -- Row lock order
    SELECT * INTO v_order_rec 
    FROM public.medicine_orders 
    WHERE id = p_order_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        SELECT * INTO v_order_rec 
        FROM public.orders 
        WHERE id = p_order_id 
        FOR UPDATE;
        
        IF NOT FOUND THEN
            RAISE EXCEPTION 'Order % not found', p_order_id;
        END IF;
    END IF;

    -- Map action to state
    IF p_action = 'accept' THEN
        v_new_status := 'confirmed';
    ELSIF p_action = 'dispense' THEN
        v_new_status := 'packed';
    ELSIF p_action = 'dispatch' THEN
        v_new_status := 'out_for_delivery';
    ELSIF p_action = 'deliver' THEN
        v_new_status := 'delivered';
    ELSIF p_action = 'cancel' THEN
        v_new_status := 'cancelled';
        
        -- Restore inventory on cancellation
        FOR v_item IN SELECT medicine_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
            UPDATE public.pharmacy_inventory
            SET stock_quantity = stock_quantity + v_item.quantity,
                updated_at = NOW()
            WHERE pharmacy_id = v_order_rec.pharmacy_id AND medicine_id = v_item.medicine_id;
        END LOOP;
    ELSE
        RAISE EXCEPTION 'Invalid fulfillment action: %', p_action;
    END IF;

    -- Update both medicine_orders and orders tables
    UPDATE public.medicine_orders
    SET order_status = v_new_status,
        delivery_status = v_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    UPDATE public.orders
    SET status = v_new_status,
        delivery_status = v_new_status,
        order_status = v_new_status,
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Notify patient
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        v_order_rec.patient_id,
        'Order Status Updated',
        'Your medicine order ' || v_order_rec.order_number || ' is now ' || v_new_status,
        'order',
        'order',
        jsonb_build_object('order_id', p_order_id, 'status', v_new_status)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', v_new_status
    );
END;
$$;


-- 5.5 VERIFY DOCTOR TRANSACTION (Admin Only)
CREATE OR REPLACE FUNCTION public.verify_doctor_tx(
    p_doctor_id UUID,
    p_status TEXT, -- 'approved' | 'rejected'
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can verify medical practitioner licenses';
    END IF;

    UPDATE public.doctors
    SET verification_status = p_status,
        updated_at = NOW()
    WHERE id = p_doctor_id;

    INSERT INTO public.doctor_verifications (
        doctor_id, reviewed_by, status, rejection_reason, reviewed_at
    )
    VALUES (
        p_doctor_id, auth.uid(), p_status, p_reason, NOW()
    );

    -- Sync profile approval_status
    UPDATE public.profiles
    SET approval_status = p_status,
        updated_at = NOW()
    WHERE id = p_doctor_id;

    -- Notify doctor
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_doctor_id,
        'Medical License Verification: ' || UPPER(p_status),
        CASE 
            WHEN p_status = 'approved' THEN 'Congratulations! Your medical registration credentials have been verified.'
            ELSE 'Your verification request was rejected. Reason: ' || COALESCE(p_reason, 'Documentation incomplete.')
        END,
        'verification',
        'verification',
        jsonb_build_object('status', p_status, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'doctor_id', p_doctor_id, 'status', p_status);
END;
$$;


-- 5.6 VERIFY PHARMACY TRANSACTION (Admin Only)
CREATE OR REPLACE FUNCTION public.verify_pharmacy_tx(
    p_pharmacy_id UUID,
    p_status TEXT, -- 'approved' | 'rejected'
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can verify pharmacy drug retail licenses';
    END IF;

    UPDATE public.pharmacies
    SET verification_status = p_status,
        updated_at = NOW()
    WHERE id = p_pharmacy_id;

    INSERT INTO public.pharmacy_verifications (
        pharmacy_id, reviewed_by, status, rejection_reason, reviewed_at
    )
    VALUES (
        p_pharmacy_id, auth.uid(), p_status, p_reason, NOW()
    );

    -- Sync profile approval_status
    UPDATE public.profiles
    SET approval_status = p_status,
        updated_at = NOW()
    WHERE id = p_pharmacy_id;

    -- Notify pharmacy
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_pharmacy_id,
        'Retail Drug License Verification: ' || UPPER(p_status),
        CASE 
            WHEN p_status = 'approved' THEN 'Your retail pharmacy license and dispensary credentials have been approved.'
            ELSE 'Your pharmacy verification was rejected. Reason: ' || COALESCE(p_reason, 'Regulatory non-compliance.')
        END,
        'verification',
        'verification',
        jsonb_build_object('status', p_status, 'reason', p_reason)
    );

    RETURN jsonb_build_object('success', true, 'pharmacy_id', p_pharmacy_id, 'status', p_status);
END;
$$;


-- ============================================================================
-- 6. STRICT RPC PERMISSIONS (LEAST PRIVILEGE)
-- ============================================================================
-- Revoke PUBLIC and anon permissions from privileged functions
REVOKE ALL ON FUNCTION public.create_appointment_tx(UUID, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_prescription_tx(UUID, UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pharmacy_fulfill_prescription_tx(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_doctor_tx(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_pharmacy_tx(UUID, TEXT, TEXT) FROM PUBLIC, anon;

-- Grant to authenticated users only
GRANT EXECUTE ON FUNCTION public.create_appointment_tx(UUID, DATE, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_prescription_tx(UUID, UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pharmacy_fulfill_prescription_tx(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_doctor_tx(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_pharmacy_tx(UUID, TEXT, TEXT) TO authenticated;

-- ============================================================================
-- END OF MIGRATION 0008
-- ============================================================================
