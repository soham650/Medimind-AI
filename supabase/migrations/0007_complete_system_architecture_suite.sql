-- ============================================================================
-- Migration 0007: Complete 5-Module System Architecture Suite
-- Aligned with MediMind System Architecture:
-- 1. Patient User Module
-- 2. Doctor Module
-- 3. AI & ML Services
-- 4. Admin / Super Admin
-- 5. Medical Delivery Module (Pharmacy)
-- + PostgreSQL Database, Security (RBAC/RLS), Storage & Audit Logging
-- ============================================================================

-- Ensure uuid extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. MODULE 1 & 3: AI/ML PRECAUTIONS & SPECIALTY MAPPING TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.disease_clinical_guidelines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    disease_name TEXT UNIQUE NOT NULL,
    icd10_code TEXT,
    snomed_code TEXT,
    primary_specialty TEXT NOT NULL,
    esi_acuity_level INT DEFAULT 4,
    precautions JSONB DEFAULT '[]'::jsonb,
    home_care_protocol JSONB DEFAULT '[]'::jsonb,
    red_flags JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed clinical disease guidelines for AI Triage & Recommendation Engine
INSERT INTO public.disease_clinical_guidelines (disease_name, icd10_code, snomed_code, primary_specialty, esi_acuity_level, precautions, home_care_protocol, red_flags)
VALUES
(
    'Acute Bacterial Sinusitis',
    'J01.90',
    '75498004',
    'ENT Specialist',
    4,
    '["Avoid sudden barometric pressure changes", "Refrain from vigorous nose blowing", "Discontinue smoking / exposure to dust"]'::jsonb,
    '["Nasal saline irrigation 2-3x daily", "Steam inhalation with menthol crystals", "Maintain oral hydration (min 2.5L water/day)"]'::jsonb,
    '["Periorbital swelling or redness", "Visual disturbance or diplopia", "High spiking fever > 102F"]'::jsonb
),
(
    'Tension Cephalea & Digital Asthenopia',
    'G44.209',
    '398057008',
    'Neurologist',
    4,
    '["Implement 20-20-20 visual rule for digital screens", "Limit continuous headset/earphone usage", "Maintain cervical ergonomics"]'::jsonb,
    '["Sensory deprivation (15-30 min in darkened quiet room)", "Cold gel compress over forehead/temples", "Cervical stretching & magnesium supplementation"]'::jsonb,
    '["Sudden thunderclap headache (< 60 seconds to max pain)", "Unilateral limb weakness or facial drooping", "Neck stiffness with photophobia"]'::jsonb
),
(
    'Early Migraine Phase Without Aura',
    'G43.009',
    '52515009',
    'Neurologist',
    3,
    '["Avoid tyramine-rich foods (aged cheese, cured meats)", "Maintain consistent sleep-wake cycles", "Minimize exposure to flickering fluorescent lights"]'::jsonb,
    '["Rest in a cool, quiet room immediately upon prodrome", "Oral hydration with electrolyte replacement", "Judicious early use of prescribed acute abortives"]'::jsonb,
    '["Persistent vomiting with dehydration", "Duration exceeding 72 hours (Status Migrainosus)", "New neurological deficit"]'::jsonb
),
(
    'Acute Coronary Syndrome / Angina',
    'I20.9',
    '22298006',
    'Cardiologist',
    1,
    '["IMMEDIATE EMERGENCY: Call 108 / 911 immediately", "Cease all physical exertion immediately", "Do not drive yourself to hospital"]'::jsonb,
    '["Sit comfortably in upright or semi-recumbent position", "Loosen tight clothing around neck and chest", "Chew aspirin 300mg if not contraindicated while awaiting EMS"]'::jsonb,
    '["Crushing retrosternal chest pain radiating to left arm/jaw", "Diaphoresis (cold sweats) with shortness of breath", "Syncope or impending sense of doom"]'::jsonb
)
ON CONFLICT (disease_name) DO UPDATE SET
    primary_specialty = EXCLUDED.primary_specialty,
    esi_acuity_level = EXCLUDED.esi_acuity_level,
    precautions = EXCLUDED.precautions,
    home_care_protocol = EXCLUDED.home_care_protocol,
    red_flags = EXCLUDED.red_flags;

-- ----------------------------------------------------------------------------
-- 2. MODULE 1 & 2: DOCTOR RECOMMENDATION RPC
-- ----------------------------------------------------------------------------
-- Recommends verified doctors dynamically based on predicted disease or specialty
CREATE OR REPLACE FUNCTION public.recommend_doctors_for_disease(p_disease_name TEXT)
RETURNS TABLE (
    doctor_id UUID,
    full_name TEXT,
    specialty TEXT,
    experience_years INT,
    consultation_fee NUMERIC,
    rating NUMERIC,
    hospital_affiliation TEXT,
    available_now BOOLEAN
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_specialty TEXT;
BEGIN
    -- 1. Identify primary specialty mapped to disease
    SELECT primary_specialty INTO v_specialty
    FROM public.disease_clinical_guidelines
    WHERE LOWER(disease_name) = LOWER(p_disease_name)
       OR LOWER(p_disease_name) LIKE '%' || LOWER(disease_name) || '%'
    LIMIT 1;

    -- Fallback specialty if not matched
    IF v_specialty IS NULL THEN
        IF LOWER(p_disease_name) LIKE '%head%' OR LOWER(p_disease_name) LIKE '%migraine%' THEN
            v_specialty := 'Neurologist';
        ELSIF LOWER(p_disease_name) LIKE '%sinus%' OR LOWER(p_disease_name) LIKE '%ear%' OR LOWER(p_disease_name) LIKE '%throat%' THEN
            v_specialty := 'ENT Specialist';
        ELSIF LOWER(p_disease_name) LIKE '%heart%' OR LOWER(p_disease_name) LIKE '%chest%' THEN
            v_specialty := 'Cardiologist';
        ELSE
            v_specialty := 'General Physician';
        END IF;
    END IF;

    -- 2. Query verified doctors matching this specialty
    RETURN QUERY
    SELECT 
        d.id AS doctor_id,
        p.full_name,
        d.specialty,
        d.experience_years,
        d.consultation_fee,
        d.rating,
        d.hospital_affiliation,
        d.available_now
    FROM public.doctors d
    JOIN public.profiles p ON p.id = d.id
    WHERE d.verification_status = 'approved'
      AND (LOWER(d.specialty) = LOWER(v_specialty) OR LOWER(d.specialty) = 'general physician')
    ORDER BY d.available_now DESC, d.rating DESC, d.experience_years DESC
    LIMIT 5;
END;
$$;

-- ----------------------------------------------------------------------------
-- 3. MODULE 5: MEDICAL DELIVERY & INVENTORY FULFILLMENT RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.pharmacy_fulfill_prescription_tx(
    p_order_id UUID,
    p_pharmacy_id UUID,
    p_action TEXT -- 'accept', 'dispense', 'dispatch', 'cancel'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_order RECORD;
    v_new_status TEXT;
    v_item RECORD;
BEGIN
    SELECT * INTO v_order FROM public.orders WHERE id = p_order_id FOR UPDATE;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Order with ID % not found', p_order_id;
    END IF;

    -- Determine new order status
    IF p_action = 'accept' THEN
        v_new_status := 'confirmed';
    ELSIF p_action = 'dispense' THEN
        v_new_status := 'dispensed';
        
        -- Deduct inventory for all items in this order
        FOR v_item IN SELECT medicine_id, quantity FROM public.order_items WHERE order_id = p_order_id LOOP
            UPDATE public.medicines
            SET stock_quantity = GREATEST(0, stock_quantity - v_item.quantity),
                updated_at = NOW()
            WHERE id = v_item.medicine_id;
        END LOOP;
        
    ELSIF p_action = 'dispatch' THEN
        v_new_status := 'out_for_delivery';
    ELSIF p_action = 'deliver' THEN
        v_new_status := 'delivered';
    ELSIF p_action = 'cancel' THEN
        v_new_status := 'cancelled';
    ELSE
        RAISE EXCEPTION 'Invalid fulfillment action: %', p_action;
    END IF;

    -- Update order status
    UPDATE public.orders
    SET status = v_new_status,
        pharmacy_id = COALESCE(pharmacy_id, p_pharmacy_id),
        updated_at = NOW()
    WHERE id = p_order_id;

    -- Dispatch notification to patient
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata
    ) VALUES (
        v_order.patient_id,
        'Medicine Order Update: ' || UPPER(v_new_status),
        'Your prescription order #' || SUBSTRING(p_order_id::text, 1, 8) || ' is now ' || v_new_status || '.',
        'order',
        jsonb_build_object('order_id', p_order_id, 'status', v_new_status)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', p_order_id,
        'status', v_new_status,
        'updated_at', NOW()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 4. MODULE 4: ADMIN ENTITY VERIFICATION & AUDIT LOGGING RPC
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.admin_verify_entity_tx(
    p_admin_id UUID,
    p_entity_id UUID,
    p_entity_type TEXT, -- 'doctor', 'pharmacy'
    p_new_status TEXT,  -- 'approved', 'rejected'
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_name TEXT;
BEGIN
    IF p_entity_type = 'doctor' THEN
        UPDATE public.doctors
        SET verification_status = p_new_status,
            rejection_reason = p_rejection_reason,
            updated_at = NOW()
        WHERE id = p_entity_id;

        SELECT full_name INTO v_name FROM public.profiles WHERE id = p_entity_id;
    ELSIF p_entity_type = 'pharmacy' THEN
        UPDATE public.pharmacies
        SET verification_status = p_new_status,
            rejection_reason = p_rejection_reason,
            updated_at = NOW()
        WHERE id = p_entity_id;

        SELECT pharmacy_name INTO v_name FROM public.pharmacies WHERE id = p_entity_id;
    ELSE
        RAISE EXCEPTION 'Invalid entity type: %', p_entity_type;
    END IF;

    -- Record in system audit logs
    INSERT INTO public.audit_logs (
        user_id,
        action,
        resource_type,
        resource_id,
        metadata
    ) VALUES (
        p_admin_id,
        'VERIFY_' || UPPER(p_entity_type) || '_' || UPPER(p_new_status),
        p_entity_type,
        p_entity_id,
        jsonb_build_object('status', p_new_status, 'name', v_name, 'reason', p_rejection_reason)
    );

    -- Send notification to verified entity
    INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        metadata
    ) VALUES (
        p_entity_id,
        'MediMind Credential Status: ' || UPPER(p_new_status),
        'Your MediMind ' || p_entity_type || ' verification status is now ' || p_new_status || '.',
        'admin',
        jsonb_build_object('entity_type', p_entity_type, 'status', p_new_status)
    );

    RETURN jsonb_build_object(
        'success', true,
        'entity_id', p_entity_id,
        'status', p_new_status,
        'verified_at', NOW()
    );
END;
$$;

-- ----------------------------------------------------------------------------
-- 5. RLS POLICIES FOR NEW TABLES & PROCEDURES
-- ----------------------------------------------------------------------------
ALTER TABLE public.disease_clinical_guidelines ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to clinical disease guidelines"
ON public.disease_clinical_guidelines FOR SELECT
TO authenticated, anon
USING (true);

-- Ensure execute permissions on new RPCs
GRANT EXECUTE ON FUNCTION public.recommend_doctors_for_disease(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.pharmacy_fulfill_prescription_tx(UUID, UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.admin_verify_entity_tx(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated, anon;
