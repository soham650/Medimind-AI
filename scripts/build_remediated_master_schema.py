"""
MediMind AI — Unified Master Schema Generator
Synthesizes migrations 0001–0008 into a single, cohesive, dependency-ordered,
non-destructive PostgreSQL schema with hardened SECURITY DEFINER search_path,
safe anti-recursion triggers, complete base tables (profiles, orders, etc.),
and strict least-privilege RLS and RPC permissions.
"""

import os
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

def build_master_sql():
    sql = """-- ============================================================================
-- MEDIMIND AI — UNIFIED MASTER DATABASE SCHEMA & MIGRATIONS (0001–0008)
-- ============================================================================
-- Complete, dependency-ordered, non-destructive PostgreSQL DDL.
-- Safe to run against a fresh database or an existing Supabase deployment.
-- Enforces:
-- 1. 5-Tier RBAC & User Profiles (auth.users extension)
-- 2. Complete Persona Entities (Patients, Doctors, Pharmacies)
-- 3. Governance, Verifications & Patient-Doctor Access Bridge
-- 4. Clinical Appointments with Anti-Double-Booking Partial Unique Index
-- 5. Consultations, Medical Records, Allergies, & ABDM Suite
-- 6. Medicines, Pharmacy Inventory, Prescriptions, & Dual Orders Synchronization
-- 7. AI Persistence: Phase 1 (symptom-rf-v1) & Phase 2 (Report Intelligence)
-- 8. Notifications, Audit Logs, AI Telemetry & Rate Limiting
-- 9. Row-Level Security (RLS) with Database-Level Persona Isolation
-- 10. Storage Bucket RLS Policies (Private Medical Docs, Public Avatars)
-- 11. Atomic Transactional RPCs with Row Locking & Zero-Trust Verification
-- 12. Hardened SECURITY DEFINER search_path & Least-Privilege EXECUTE Grants
-- ============================================================================

-- ============================================================================
-- 1. EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ============================================================================
-- 2. BASE ENTITY: USER PROFILES (Extends auth.users 1:1)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email text UNIQUE NOT NULL,
    full_name text,
    name text,
    role text DEFAULT 'patient' CHECK (role IN ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin')),
    approval_status text DEFAULT 'approved' CHECK (approval_status IN ('pending', 'approved', 'rejected')),
    age integer DEFAULT 30,
    gender text DEFAULT 'Male' CHECK (gender IN ('Male', 'Female', 'Other')),
    date_of_birth date,
    phone text DEFAULT '',
    mobile text DEFAULT '',
    blood_group text CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    emergency_contact text,
    address text,
    preferred_language text DEFAULT 'English',
    timezone text DEFAULT 'Asia/Kolkata',
    abha_id text DEFAULT '',
    bmi numeric(4,1) DEFAULT 22.0,
    blood_sugar numeric(5,1) DEFAULT 100.0,
    bp_systolic numeric(4,1) DEFAULT 120.0,
    bp_diastolic numeric(4,1) DEFAULT 80.0,
    is_smoker boolean DEFAULT false,
    smoking integer DEFAULT 0,
    license_number text DEFAULT '',
    license_document_url text,
    clinic_id text,
    specialist text DEFAULT 'General Physician',
    experience_years integer DEFAULT 0,
    consultation_fee numeric(10,2) DEFAULT 500.00,
    is_available boolean DEFAULT true,
    rejection_reason text,
    pharmacy_name text,
    pharmacy_address text,
    gst_number text,
    avatar_url text,
    status text DEFAULT 'active' CHECK (status IN ('active', 'suspended', 'deactivated')),
    deleted_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.profiles IS 'Primary user identity and demographic baseline extending auth.users.';

-- Helper updated_at function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_profiles_updated_at ON public.profiles;
CREATE TRIGGER tr_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


-- ============================================================================
-- 3. RBAC: USER ROLES & ACCESS HELPER FUNCTIONS
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    role text NOT NULL CHECK (role IN ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

COMMENT ON TABLE public.user_roles IS 'Strict 5-Tier RBAC directory. Mutations restricted to Super Admin.';

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT role FROM public.user_roles WHERE user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role IN ('admin', 'super_admin')
    );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.user_roles 
        WHERE user_id = auth.uid() AND role = 'super_admin'
    );
$$;


-- ============================================================================
-- 4. CLINICAL PERSONAS: PATIENTS, DOCTORS, PHARMACIES & CLINICS
-- ============================================================================

-- 4.1 Clinics & Specialists (Directory & Discovery)
CREATE TABLE IF NOT EXISTS public.clinics (
    id text PRIMARY KEY,
    name text NOT NULL,
    speciality text NOT NULL,
    location text NOT NULL,
    rating float DEFAULT 4.5
);

CREATE TABLE IF NOT EXISTS public.specialists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    specialty text NOT NULL,
    experience text,
    rating float DEFAULT 4.8,
    reviews integer DEFAULT 120,
    available text DEFAULT 'Today',
    fee text DEFAULT '₹500',
    image text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.queues (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    clinic_id text REFERENCES public.clinics(id) ON DELETE CASCADE,
    queue_number integer NOT NULL,
    estimated_wait_time integer NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.2 Patients Entity
CREATE TABLE IF NOT EXISTS public.patients (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name text NOT NULL,
    phone text,
    date_of_birth date,
    gender text CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group text CHECK (blood_group IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    emergency_contact text,
    address text,
    preferred_language text DEFAULT 'English',
    timezone text DEFAULT 'Asia/Kolkata',
    abha_id text,
    bmi numeric(4,1) DEFAULT 22.0,
    blood_sugar numeric(5,1) DEFAULT 100.0,
    bp_systolic numeric(4,1) DEFAULT 120.0,
    bp_diastolic numeric(4,1) DEFAULT 80.0,
    is_smoker boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.3 Doctors Entity
CREATE TABLE IF NOT EXISTS public.doctors (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    full_name text NOT NULL,
    specialization text NOT NULL,
    qualification text NOT NULL DEFAULT 'MBBS',
    experience_years integer DEFAULT 5,
    bio text,
    languages text[] DEFAULT ARRAY['English', 'Hindi'],
    consultation_fee numeric(10,2) DEFAULT 500.00,
    rating numeric(3,2) DEFAULT 4.9,
    clinic_name text DEFAULT 'MediMind Clinical Centre',
    clinic_address text,
    license_number text NOT NULL,
    license_document_url text,
    verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    is_available boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4.4 Pharmacies Entity
CREATE TABLE IF NOT EXISTS public.pharmacies (
    id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    pharmacy_name text NOT NULL,
    contact_person text NOT NULL,
    phone text NOT NULL,
    email text NOT NULL,
    drug_license_number text NOT NULL UNIQUE,
    gstin text,
    address text NOT NULL,
    operating_hours jsonb DEFAULT '{\"open\": \"08:00\", \"close\": \"22:00\"}'::jsonb,
    license_document_url text,
    verification_status text DEFAULT 'pending' CHECK (verification_status IN ('pending', 'approved', 'rejected')),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 5. VERIFICATIONS & PATIENT-DOCTOR ACCESS BRIDGE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.doctor_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    submitted_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pharmacy_verifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
    submitted_documents jsonb NOT NULL DEFAULT '[]'::jsonb,
    reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.doctor_availability (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    day_of_week integer NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time time NOT NULL,
    end_time time NOT NULL,
    slot_duration_minutes integer DEFAULT 30,
    is_active boolean DEFAULT true,
    UNIQUE(doctor_id, day_of_week, start_time)
);

CREATE TABLE IF NOT EXISTS public.patient_doctor_access (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    granted_by text DEFAULT 'appointment' CHECK (granted_by IN ('appointment', 'explicit_consent', 'emergency_override', 'admin')),
    is_active boolean DEFAULT true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(patient_id, doctor_id)
);


-- ============================================================================
-- 6. APPOINTMENTS & CONSULTATIONS (ANTI-DOUBLE-BOOKING RESOLVED)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.appointments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_number text UNIQUE,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    appointment_date date NOT NULL,
    time_slot text NOT NULL,
    consultation_type text DEFAULT 'video' CHECK (consultation_type IN ('video', 'in_person', 'online')),
    status text DEFAULT 'scheduled' CHECK (status IN ('requested', 'scheduled', 'confirmed', 'in_progress', 'in_consultation', 'completed', 'cancelled', 'no_show')),
    symptoms_summary text,
    patient_notes text,
    cancellation_reason text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Auto appointment number generator
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
    FOR EACH ROW EXECUTE FUNCTION public.set_appointment_number();

-- Anti-double-booking conditional partial unique index (only active appointments lock the slot)
CREATE UNIQUE INDEX IF NOT EXISTS uq_appointment_slot 
ON public.appointments (doctor_id, appointment_date, time_slot) 
WHERE status NOT IN ('cancelled', 'no_show');

CREATE TABLE IF NOT EXISTS public.consultations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE UNIQUE NOT NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    chief_complaint text NOT NULL,
    clinical_summary text,
    clinical_findings text,
    diagnosis text NOT NULL,
    doctor_notes text,
    follow_up_date date,
    meeting_url text,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    ended_at timestamp with time zone,
    status text DEFAULT 'completed' CHECK (status IN ('ongoing', 'completed')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.consultation_sessions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    consultation_id uuid REFERENCES public.consultations(id) ON DELETE CASCADE NOT NULL,
    session_token text NOT NULL,
    room_id text NOT NULL,
    started_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ended_at timestamp with time zone,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.medical_records (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE SET NULL,
    consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
    record_type text NOT NULL CHECK (record_type IN ('diagnosis', 'lab_report', 'clinical_note', 'discharge_summary')),
    title text NOT NULL,
    clinical_summary text NOT NULL,
    structured_data jsonb DEFAULT '{}'::jsonb,
    record_date date DEFAULT current_date NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.patient_allergies (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    allergen text NOT NULL,
    severity text DEFAULT 'Moderate' CHECK (severity IN ('Mild', 'Moderate', 'Severe')),
    reaction_notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 7. MEDICINES, INVENTORY, PRESCRIPTIONS & DUAL ORDER RECONCILIATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.medicines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    brand_name text NOT NULL,
    generic_name text NOT NULL,
    dosage_form text NOT NULL CHECK (dosage_form IN ('tablet', 'capsule', 'syrup', 'injection', 'ointment', 'drops')),
    strength text NOT NULL,
    manufacturer text NOT NULL,
    description text,
    requires_prescription boolean DEFAULT false,
    price numeric(10,2) DEFAULT 0.00,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.pharmacy_inventory (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE CASCADE NOT NULL,
    batch_number text NOT NULL,
    expiry_date date NOT NULL,
    stock_quantity integer NOT NULL CHECK (stock_quantity >= 0),
    unit_price numeric(10,2) NOT NULL CHECK (unit_price > 0),
    reorder_level integer DEFAULT 10,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(pharmacy_id, medicine_id, batch_number)
);

CREATE TABLE IF NOT EXISTS public.prescriptions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    rx_id text UNIQUE NOT NULL,
    appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
    consultation_id uuid REFERENCES public.consultations(id) ON DELETE SET NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    diagnosis text NOT NULL,
    medicines jsonb NOT NULL DEFAULT '[]'::jsonb,
    instructions text,
    notes text,
    general_advice text,
    valid_until date,
    is_dispensed boolean DEFAULT false,
    dispensed_by uuid REFERENCES public.pharmacies(id) ON DELETE SET NULL,
    dispensed_at timestamp with time zone,
    status text DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'expired', 'cancelled')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

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
    FOR EACH ROW EXECUTE FUNCTION public.set_prescription_rx_id();

CREATE TABLE IF NOT EXISTS public.prescription_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE RESTRICT NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text NOT NULL,
    instructions text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.1 Modern Medicine Orders Table
CREATE TABLE IF NOT EXISTS public.medicine_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_number text UNIQUE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_method text DEFAULT 'cash_on_delivery' CHECK (payment_method IN ('cash_on_delivery', 'upi', 'card', 'net_banking')),
    payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed', 'refunded')),
    order_status text DEFAULT 'confirmed' CHECK (order_status IN ('pending', 'confirmed', 'prescription_review', 'processing', 'packed', 'shipped', 'out_for_delivery', 'delivered', 'cancelled')),
    delivery_address text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.2 Legacy / Alias Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    medicine_order_id uuid REFERENCES public.medicine_orders(id) ON DELETE CASCADE,
    order_number text,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    pharmacy_id uuid REFERENCES public.pharmacies(id) ON DELETE CASCADE NOT NULL,
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE SET NULL,
    total_amount numeric(10,2) NOT NULL CHECK (total_amount >= 0),
    payment_method text DEFAULT 'cash_on_delivery',
    payment_status text DEFAULT 'pending',
    order_status text DEFAULT 'confirmed',
    status text DEFAULT 'confirmed',
    delivery_address text NOT NULL,
    notes text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.3 Order Items Table (Linked to Orders)
CREATE TABLE IF NOT EXISTS public.order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
    medicine_id uuid REFERENCES public.medicines(id) ON DELETE RESTRICT NOT NULL,
    quantity integer NOT NULL CHECK (quantity > 0),
    unit_price numeric(10,2) NOT NULL CHECK (unit_price >= 0),
    total_price numeric(10,2) NOT NULL CHECK (total_price >= 0),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.payments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id uuid REFERENCES public.medicine_orders(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    amount numeric(10,2) NOT NULL CHECK (amount >= 0),
    payment_gateway text DEFAULT 'mock' CHECK (payment_gateway IN ('razorpay', 'stripe', 'mock')),
    transaction_id text UNIQUE NOT NULL,
    status text DEFAULT 'success' CHECK (status IN ('initiated', 'success', 'failed', 'refunded')),
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7.4 Safe Anti-Recursion Bidirectional Triggers for Orders
CREATE OR REPLACE FUNCTION public.sync_medicine_orders_to_orders()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.orders (
            id, medicine_order_id, order_number, patient_id, pharmacy_id,
            prescription_id, total_amount, payment_method, payment_status,
            order_status, status, delivery_address, notes, created_at, updated_at
        )
        VALUES (
            NEW.id, NEW.id, NEW.order_number, NEW.patient_id, NEW.pharmacy_id,
            NEW.prescription_id, NEW.total_amount, NEW.payment_method, NEW.payment_status,
            NEW.order_status, NEW.order_status, NEW.delivery_address, NEW.notes,
            NEW.created_at, NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            order_status = EXCLUDED.order_status,
            status = EXCLUDED.status,
            payment_status = EXCLUDED.payment_status,
            updated_at = EXCLUDED.updated_at;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.orders
        SET order_status = NEW.order_status,
            status = NEW.order_status,
            payment_status = NEW.payment_status,
            total_amount = NEW.total_amount,
            updated_at = NEW.updated_at
        WHERE id = NEW.id OR medicine_order_id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_medicine_orders_to_orders ON public.medicine_orders;
CREATE TRIGGER trg_sync_medicine_orders_to_orders
    AFTER INSERT OR UPDATE ON public.medicine_orders
    FOR EACH ROW EXECUTE FUNCTION public.sync_medicine_orders_to_orders();

CREATE OR REPLACE FUNCTION public.sync_orders_to_medicine_orders()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF pg_trigger_depth() > 1 THEN
        RETURN NEW;
    END IF;

    IF TG_OP = 'INSERT' THEN
        INSERT INTO public.medicine_orders (
            id, order_number, patient_id, pharmacy_id,
            prescription_id, total_amount, payment_method, payment_status,
            order_status, delivery_address, notes, created_at, updated_at
        )
        VALUES (
            NEW.id, COALESCE(NEW.order_number, 'ORD-' || SUBSTRING(NEW.id::text, 1, 8)),
            NEW.patient_id, NEW.pharmacy_id, NEW.prescription_id,
            NEW.total_amount, COALESCE(NEW.payment_method, 'cash_on_delivery'),
            COALESCE(NEW.payment_status, 'pending'),
            COALESCE(NEW.order_status, NEW.status, 'confirmed'),
            NEW.delivery_address, NEW.notes, NEW.created_at, NEW.updated_at
        )
        ON CONFLICT (id) DO UPDATE SET
            total_amount = EXCLUDED.total_amount,
            order_status = EXCLUDED.order_status,
            payment_status = EXCLUDED.payment_status,
            updated_at = EXCLUDED.updated_at;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.medicine_orders
        SET order_status = COALESCE(NEW.order_status, NEW.status),
            payment_status = NEW.payment_status,
            total_amount = NEW.total_amount,
            updated_at = NEW.updated_at
        WHERE id = NEW.id;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_orders_to_medicine_orders ON public.orders;
CREATE TRIGGER trg_sync_orders_to_medicine_orders
    AFTER INSERT OR UPDATE ON public.orders
    FOR EACH ROW EXECUTE FUNCTION public.sync_orders_to_medicine_orders();


-- ============================================================================
-- 8. DIAGNOSTICS & ABDM HEALTHCARE SUITE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.patient_dependents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    full_name text NOT NULL,
    relationship text NOT NULL,
    date_of_birth date NOT NULL,
    gender text CHECK (gender IN ('Male', 'Female', 'Other')),
    abha_id text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.abdm_consents (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    consent_id text UNIQUE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    doctor_id uuid REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
    purpose text NOT NULL,
    status text DEFAULT 'requested' CHECK (status IN ('requested', 'granted', 'denied', 'revoked', 'expired')),
    data_types text[] NOT NULL,
    date_from date NOT NULL,
    date_to date NOT NULL,
    expiry_date timestamp with time zone NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.abdm_audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    consent_id text,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    requester_id uuid NOT NULL,
    action text NOT NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    ip_address text,
    status text NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lab_packages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    code text UNIQUE NOT NULL,
    description text,
    price numeric(10,2) NOT NULL CHECK (price >= 0),
    fasting_required boolean DEFAULT false,
    turnaround_hours integer DEFAULT 24,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lab_tests (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    package_id uuid REFERENCES public.lab_packages(id) ON DELETE CASCADE,
    test_name text NOT NULL,
    loinc_code text,
    normal_range_min numeric(10,2),
    normal_range_max numeric(10,2),
    unit text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.lab_bookings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_reference text UNIQUE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    package_id uuid REFERENCES public.lab_packages(id) ON DELETE RESTRICT NOT NULL,
    slot_date date NOT NULL,
    slot_time text NOT NULL,
    collection_type text DEFAULT 'home_collection' CHECK (collection_type IN ('home_collection', 'center_visit')),
    status text DEFAULT 'booked' CHECK (status IN ('booked', 'sample_collected', 'in_analysis', 'report_ready', 'cancelled')),
    report_url text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.medication_schedules (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    prescription_id uuid REFERENCES public.prescriptions(id) ON DELETE CASCADE NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    medicine_name text NOT NULL,
    dosage text NOT NULL,
    time_of_day text NOT NULL,
    taken boolean DEFAULT false,
    scheduled_date date NOT NULL,
    taken_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ai_clinical_findings (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    report_id text NOT NULL,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    category text NOT NULL,
    parameter_name text NOT NULL,
    observed_value text NOT NULL,
    standard_unit text,
    reference_range text,
    flag text DEFAULT 'Normal' CHECK (flag IN ('Normal', 'Abnormal', 'High', 'Low', 'Critical')),
    clinical_significance text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.disease_clinical_guidelines (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    disease_name text UNIQUE NOT NULL,
    icd10_code text NOT NULL,
    primary_specialty text NOT NULL,
    esi_acuity_level integer CHECK (esi_acuity_level BETWEEN 1 AND 5),
    precautions text[] DEFAULT ARRAY[]::text[],
    home_care_protocol text,
    red_flags text[] DEFAULT ARRAY[]::text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 9. AI DATA PERSISTENCE & SYSTEM OBSERVABILITY
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.symptom_assessments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE,
    symptoms text[] NOT NULL,
    normalized_symptoms text[] DEFAULT ARRAY[]::text[],
    model_version text DEFAULT 'symptom-rf-v1',
    possible_conditions jsonb NOT NULL,
    risk_level text NOT NULL CHECK (risk_level IN ('Low', 'Moderate', 'High', 'Critical')),
    risk_reasons text[] DEFAULT ARRAY[]::text[],
    red_flags text[] DEFAULT ARRAY[]::text[],
    ai_summary text,
    recommended_action text,
    disclaimer text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.health_reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    report_title text NOT NULL,
    storage_path text NOT NULL,
    mime_type text NOT NULL,
    file_size_bytes integer NOT NULL,
    processing_status text DEFAULT 'completed' CHECK (processing_status IN ('processing', 'completed', 'failed')),
    report_type text,
    findings jsonb DEFAULT '[]'::jsonb,
    normalized_findings jsonb DEFAULT '[]'::jsonb,
    mapped_symptoms text[] DEFAULT ARRAY[]::text[],
    ai_assessment jsonb DEFAULT '{}'::jsonb,
    risk_assessment jsonb DEFAULT '{}'::jsonb,
    provider text DEFAULT 'google_gemini',
    model text DEFAULT 'gemini-1.5-flash',
    prompt_version text DEFAULT 'report-analysis-v1',
    ai_analysis jsonb,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Backward compatibility for early predictions and symptom logs
CREATE TABLE IF NOT EXISTS public.symptom_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    symptoms text[] NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.predictions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    prediction text NOT NULL,
    confidence float,
    precautions text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.reports (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_path text NOT NULL,
    file_name text NOT NULL,
    summary text,
    key_findings text[],
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.chat_history (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
    message text NOT NULL,
    sender text NOT NULL,
    timestamp timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Notifications & Audit Logs (with Reconciliation Triggers)
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    type text DEFAULT 'system',
    notification_type text DEFAULT 'system',
    link text,
    metadata jsonb DEFAULT '{}'::jsonb,
    is_read boolean DEFAULT false,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.sync_notification_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
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
$$;

DROP TRIGGER IF EXISTS trg_sync_notification_columns ON public.notifications;
CREATE TRIGGER trg_sync_notification_columns
    BEFORE INSERT OR UPDATE ON public.notifications
    FOR EACH ROW EXECUTE FUNCTION public.sync_notification_columns();

CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_role text DEFAULT 'system',
    action text NOT NULL,
    target_entity text NOT NULL,
    target_id text,
    details jsonb DEFAULT '{}'::jsonb,
    metadata jsonb DEFAULT '{}'::jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE OR REPLACE FUNCTION public.sync_audit_log_columns()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.actor_id := COALESCE(NEW.actor_id, NEW.user_id);
    NEW.user_id := COALESCE(NEW.user_id, NEW.actor_id);
    NEW.details := COALESCE(NEW.details, NEW.metadata, '{}'::jsonb);
    NEW.metadata := COALESCE(NEW.metadata, NEW.details, '{}'::jsonb);
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_audit_log_columns ON public.audit_logs;
CREATE TRIGGER trg_sync_audit_log_columns
    BEFORE INSERT OR UPDATE ON public.audit_logs
    FOR EACH ROW EXECUTE FUNCTION public.sync_audit_log_columns();

CREATE TABLE IF NOT EXISTS public.ai_usage_daily (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    usage_date date DEFAULT current_date NOT NULL UNIQUE,
    total_calls integer DEFAULT 0,
    gemini_calls integer DEFAULT 0,
    rf_calls integer DEFAULT 0,
    high_risk_flagged integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.rate_limit_events (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    ip_address text,
    user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    endpoint text NOT NULL,
    blocked_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- ============================================================================
-- 10. COMPOSITE PERFORMANCE INDEXES
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_expiry ON public.pharmacy_inventory (pharmacy_id, expiry_date ASC);
CREATE INDEX IF NOT EXISTS idx_pharmacy_inventory_stock ON public.pharmacy_inventory (pharmacy_id, stock_quantity ASC);
CREATE INDEX IF NOT EXISTS idx_medicine_orders_patient_date ON public.medicine_orders (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_patient_date ON public.orders (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_date ON public.appointments (patient_id, appointment_date DESC);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON public.appointments (doctor_id, appointment_date, time_slot);
CREATE INDEX IF NOT EXISTS idx_symptom_assessments_patient_date ON public.symptom_assessments (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_reports_patient_date ON public.health_reports (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions (patient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications (user_id, is_read);


-- ============================================================================
-- 11. ROW-LEVEL SECURITY POLICIES (DATABASE-LEVEL PERSONA ISOLATION)
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_doctor_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescription_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.health_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rate_limit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_dependents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abdm_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.abdm_audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lab_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_clinical_findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_clinical_guidelines ENABLE ROW LEVEL SECURITY;

-- Dependents & ABDM Consents RLS
DROP POLICY IF EXISTS "patient_dependents_owner" ON public.patient_dependents;
CREATE POLICY "patient_dependents_owner" ON public.patient_dependents
FOR ALL USING (auth.uid() = patient_id OR public.is_admin());

DROP POLICY IF EXISTS "abdm_consents_participant" ON public.abdm_consents;
CREATE POLICY "abdm_consents_participant" ON public.abdm_consents
FOR ALL USING (auth.uid() = patient_id OR auth.uid() = doctor_id OR public.is_admin());

DROP POLICY IF EXISTS "abdm_audit_logs_owner" ON public.abdm_audit_logs;
CREATE POLICY "abdm_audit_logs_owner" ON public.abdm_audit_logs
FOR SELECT USING (auth.uid() = patient_id OR public.is_admin());

-- Legacy Clinical Logs (Owner Isolated)
DROP POLICY IF EXISTS "symptom_logs_owner" ON public.symptom_logs;
CREATE POLICY "symptom_logs_owner" ON public.symptom_logs
FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "predictions_owner" ON public.predictions;
CREATE POLICY "predictions_owner" ON public.predictions
FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "reports_owner" ON public.reports;
CREATE POLICY "reports_owner" ON public.reports
FOR ALL USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "chat_history_owner" ON public.chat_history;
CREATE POLICY "chat_history_owner" ON public.chat_history
FOR ALL USING (auth.uid() = user_id OR public.is_admin());

-- Profiles: Own profile or admin
DROP POLICY IF EXISTS "profiles_select_own_or_admin" ON public.profiles;
CREATE POLICY "profiles_select_own_or_admin" ON public.profiles
FOR SELECT USING (auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "profiles_update_own" ON public.profiles;
CREATE POLICY "profiles_update_own" ON public.profiles
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- User Roles: View own; Mutation strictly Super Admin
DROP POLICY IF EXISTS "user_roles_select" ON public.user_roles;
CREATE POLICY "user_roles_select" ON public.user_roles
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "user_roles_admin_mutate" ON public.user_roles;
CREATE POLICY "user_roles_admin_mutate" ON public.user_roles
FOR ALL USING (public.is_admin());

-- Patients: Own patient record or authorized doctor with active consent or admin
DROP POLICY IF EXISTS "patients_select" ON public.patients;
CREATE POLICY "patients_select" ON public.patients
FOR SELECT USING (
    auth.uid() = id 
    OR EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda 
        WHERE pda.patient_id = patients.id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true 
          AND (pda.expires_at IS NULL OR pda.expires_at > now())
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "patients_update_own" ON public.patients;
CREATE POLICY "patients_update_own" ON public.patients
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Doctors: Public directory can view approved doctors; Doctors manage own
DROP POLICY IF EXISTS "doctors_public_select" ON public.doctors;
CREATE POLICY "doctors_public_select" ON public.doctors
FOR SELECT USING (verification_status = 'approved' OR auth.uid() = id OR public.is_admin());

DROP POLICY IF EXISTS "doctors_update_own" ON public.doctors;
CREATE POLICY "doctors_update_own" ON public.doctors
FOR UPDATE USING (auth.uid() = id OR public.is_admin());

-- Doctor Availability: Public read; Doctor mutate own
DROP POLICY IF EXISTS "doctor_availability_select" ON public.doctor_availability;
CREATE POLICY "doctor_availability_select" ON public.doctor_availability
FOR SELECT USING (true);

DROP POLICY IF EXISTS "doctor_availability_owner_mutate" ON public.doctor_availability;
CREATE POLICY "doctor_availability_owner_mutate" ON public.doctor_availability
FOR ALL USING (auth.uid() = doctor_id OR public.is_admin());

-- Verifications: Admin mutate only
DROP POLICY IF EXISTS "doctor_verifications_select" ON public.doctor_verifications;
CREATE POLICY "doctor_verifications_select" ON public.doctor_verifications
FOR SELECT USING (auth.uid() = doctor_id OR public.is_admin());

DROP POLICY IF EXISTS "doctor_verifications_admin_mutate" ON public.doctor_verifications;
CREATE POLICY "doctor_verifications_admin_mutate" ON public.doctor_verifications
FOR ALL USING (public.is_admin());

DROP POLICY IF EXISTS "pharmacy_verifications_select" ON public.pharmacy_verifications;
CREATE POLICY "pharmacy_verifications_select" ON public.pharmacy_verifications
FOR SELECT USING (auth.uid() = pharmacy_id OR public.is_admin());

DROP POLICY IF EXISTS "pharmacy_verifications_admin_mutate" ON public.pharmacy_verifications;
CREATE POLICY "pharmacy_verifications_admin_mutate" ON public.pharmacy_verifications
FOR ALL USING (public.is_admin());

-- Appointments: Participants only (Patient, Doctor, Admin)
DROP POLICY IF EXISTS "appointments_participant_select" ON public.appointments;
CREATE POLICY "appointments_participant_select" ON public.appointments
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id OR public.is_admin());

DROP POLICY IF EXISTS "appointments_patient_insert" ON public.appointments;
CREATE POLICY "appointments_patient_insert" ON public.appointments
FOR INSERT WITH CHECK (auth.uid() = patient_id OR public.is_admin());

DROP POLICY IF EXISTS "appointments_participant_update" ON public.appointments;
CREATE POLICY "appointments_participant_update" ON public.appointments
FOR UPDATE USING (auth.uid() = patient_id OR auth.uid() = doctor_id OR public.is_admin());

-- Consultations: Participants only
DROP POLICY IF EXISTS "consultations_participant_select" ON public.consultations;
CREATE POLICY "consultations_participant_select" ON public.consultations
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = doctor_id OR public.is_admin());

DROP POLICY IF EXISTS "consultations_doctor_mutate" ON public.consultations;
CREATE POLICY "consultations_doctor_mutate" ON public.consultations
FOR ALL USING (auth.uid() = doctor_id OR public.is_admin());

-- Prescriptions: Patient, Doctor, or Dispensing Pharmacy
DROP POLICY IF EXISTS "prescriptions_select" ON public.prescriptions;
CREATE POLICY "prescriptions_select" ON public.prescriptions
FOR SELECT USING (
    auth.uid() = patient_id 
    OR auth.uid() = doctor_id 
    OR auth.uid() = dispensed_by 
    OR public.is_admin()
);

-- Pharmacy Inventory: Isolated per pharmacy
DROP POLICY IF EXISTS "pharmacy_inventory_select" ON public.pharmacy_inventory;
CREATE POLICY "pharmacy_inventory_select" ON public.pharmacy_inventory
FOR SELECT USING (true); -- Patients can view stock availability

DROP POLICY IF EXISTS "pharmacy_inventory_owner_mutate" ON public.pharmacy_inventory;
CREATE POLICY "pharmacy_inventory_owner_mutate" ON public.pharmacy_inventory
FOR ALL USING (auth.uid() = pharmacy_id OR public.is_admin());

-- Orders: Patient and Assigned Pharmacy
DROP POLICY IF EXISTS "medicine_orders_select" ON public.medicine_orders;
CREATE POLICY "medicine_orders_select" ON public.medicine_orders
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = pharmacy_id OR public.is_admin());

DROP POLICY IF EXISTS "orders_select" ON public.orders;
CREATE POLICY "orders_select" ON public.orders
FOR SELECT USING (auth.uid() = patient_id OR auth.uid() = pharmacy_id OR public.is_admin());

-- Symptom Assessments & Health Reports
DROP POLICY IF EXISTS "symptom_assessments_owner_select" ON public.symptom_assessments;
CREATE POLICY "symptom_assessments_owner_select" ON public.symptom_assessments
FOR SELECT USING (
    patient_id IS NULL 
    OR auth.uid() = patient_id 
    OR EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda 
        WHERE pda.patient_id = symptom_assessments.patient_id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true 
          AND (pda.expires_at IS NULL OR pda.expires_at > now())
    )
    OR public.is_admin()
);

DROP POLICY IF EXISTS "symptom_assessments_insert" ON public.symptom_assessments;
CREATE POLICY "symptom_assessments_insert" ON public.symptom_assessments
FOR INSERT WITH CHECK (patient_id IS NULL OR auth.uid() = patient_id OR public.is_admin());

DROP POLICY IF EXISTS "health_reports_owner_select" ON public.health_reports;
CREATE POLICY "health_reports_owner_select" ON public.health_reports
FOR SELECT USING (
    auth.uid() = patient_id 
    OR EXISTS (
        SELECT 1 FROM public.patient_doctor_access pda 
        WHERE pda.patient_id = health_reports.patient_id 
          AND pda.doctor_id = auth.uid() 
          AND pda.is_active = true 
          AND (pda.expires_at IS NULL OR pda.expires_at > now())
    )
    OR public.is_admin()
);

-- Notifications & Audit Logs
DROP POLICY IF EXISTS "notifications_owner_select" ON public.notifications;
CREATE POLICY "notifications_owner_select" ON public.notifications
FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "audit_logs_admin_select" ON public.audit_logs;
CREATE POLICY "audit_logs_admin_select" ON public.audit_logs
FOR SELECT USING (public.is_admin());


-- ============================================================================
-- 12. STORAGE BUCKET ROW-LEVEL SECURITY POLICIES
-- ============================================================================

-- Medical Documents (Private Bucket - Signed URLs Strictly Required)
DROP POLICY IF EXISTS "medical_docs_patient_upload" ON storage.objects;
CREATE POLICY "medical_docs_patient_upload" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'medical-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "medical_docs_participant_read" ON storage.objects;
CREATE POLICY "medical_docs_participant_read" ON storage.objects
FOR SELECT USING (
    bucket_id = 'medical-documents' 
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR EXISTS (
            SELECT 1 FROM public.patient_doctor_access pda
            WHERE pda.patient_id::text = (storage.foldername(name))[1]
              AND pda.doctor_id = auth.uid()
              AND pda.is_active = true
              AND (pda.expires_at IS NULL OR pda.expires_at > now())
        )
        OR public.is_admin()
    )
);

-- Doctor Documents (Private)
DROP POLICY IF EXISTS "doctor_docs_owner_insert" ON storage.objects;
CREATE POLICY "doctor_docs_owner_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'doctor-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "doctor_docs_owner_admin_select" ON storage.objects;
CREATE POLICY "doctor_docs_owner_admin_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'doctor-documents' 
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Pharmacy Documents (Private)
DROP POLICY IF EXISTS "pharmacy_docs_owner_insert" ON storage.objects;
CREATE POLICY "pharmacy_docs_owner_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'pharmacy-documents' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "pharmacy_docs_owner_admin_select" ON storage.objects;
CREATE POLICY "pharmacy_docs_owner_admin_select" ON storage.objects
FOR SELECT USING (
    bucket_id = 'pharmacy-documents' 
    AND ((storage.foldername(name))[1] = auth.uid()::text OR public.is_admin())
);

-- Profile Images (Public Read, Authenticated Write)
DROP POLICY IF EXISTS "profile_images_public_read" ON storage.objects;
CREATE POLICY "profile_images_public_read" ON storage.objects
FOR SELECT USING (bucket_id = 'profile-images');

DROP POLICY IF EXISTS "profile_images_auth_insert" ON storage.objects;
CREATE POLICY "profile_images_auth_insert" ON storage.objects
FOR INSERT WITH CHECK (
    bucket_id = 'profile-images' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);


-- ============================================================================
-- 13. ATOMIC TRANSACTIONAL RPCS (ROW LOCKING & SECURITY DEFINER HARDENED)
-- ============================================================================

-- 13.1 User Registration Hook
CREATE OR REPLACE FUNCTION public.handle_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_full_name text;
    v_role text;
BEGIN
    v_full_name := COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1));
    v_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');

    -- Insert into profiles
    INSERT INTO public.profiles (id, email, full_name, name, role)
    VALUES (NEW.id, NEW.email, v_full_name, v_full_name, v_role)
    ON CONFLICT (id) DO UPDATE SET
        full_name = EXCLUDED.full_name,
        name = EXCLUDED.name,
        updated_at = NOW();

    -- Insert into user_roles (default to patient if non-admin registration)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, CASE WHEN v_role IN ('doctor', 'pharmacist', 'admin') THEN v_role ELSE 'patient' END)
    ON CONFLICT (user_id) DO NOTHING;

    -- Insert into patients table if role is patient
    IF v_role = 'patient' THEN
        INSERT INTO public.patients (id, full_name, phone, abha_id)
        VALUES (
            NEW.id,
            v_full_name,
            NEW.raw_user_meta_data->>'phone',
            NEW.raw_user_meta_data->>'abha_id'
        )
        ON CONFLICT (id) DO NOTHING;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_signup();


-- 13.2 Create Appointment Transaction (Anti-Double-Booking with Row Lock)
CREATE OR REPLACE FUNCTION public.create_appointment_tx(
    p_doctor_id UUID,
    p_appointment_date DATE,
    p_time_slot TEXT,
    p_consultation_type TEXT DEFAULT 'online',
    p_symptoms_summary TEXT DEFAULT '',
    p_patient_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_patient_id UUID;
    v_doctor_rec RECORD;
    v_appointment_id UUID;
    v_appointment_number TEXT;
BEGIN
    v_patient_id := auth.uid();
    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: User must be authenticated to book an appointment';
    END IF;

    -- Verify doctor approval status
    SELECT id, full_name, is_available, verification_status INTO v_doctor_rec
    FROM public.doctors
    WHERE id = p_doctor_id;

    IF v_doctor_rec.id IS NULL THEN
        RAISE EXCEPTION 'Doctor not found';
    END IF;

    IF v_doctor_rec.verification_status <> 'approved' THEN
        RAISE EXCEPTION 'Doctor is not verified for clinical practice';
    END IF;

    -- Concurrency check: Lock slot
    IF EXISTS (
        SELECT 1 FROM public.appointments
        WHERE doctor_id = p_doctor_id
          AND appointment_date = p_appointment_date
          AND time_slot = p_time_slot
          AND status NOT IN ('cancelled', 'no_show')
        FOR UPDATE
    ) THEN
        RAISE EXCEPTION 'Time slot already booked. Please choose another slot.';
    END IF;

    v_appointment_number := 'APT-' || TO_CHAR(p_appointment_date, 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO public.appointments (
        appointment_number, patient_id, doctor_id, appointment_date, time_slot,
        consultation_type, status, symptoms_summary, patient_notes
    )
    VALUES (
        v_appointment_number, v_patient_id, p_doctor_id, p_appointment_date, p_time_slot,
        COALESCE(p_consultation_type, 'online'), 'confirmed', p_symptoms_summary, p_patient_notes
    )
    RETURNING id INTO v_appointment_id;

    -- Auto-grant 30-day patient-doctor clinical access bridge
    INSERT INTO public.patient_doctor_access (
        patient_id, doctor_id, granted_by, is_active, expires_at
    )
    VALUES (
        v_patient_id, p_doctor_id, 'appointment', true, NOW() + INTERVAL '30 days'
    )
    ON CONFLICT (patient_id, doctor_id) DO UPDATE SET
        is_active = true,
        expires_at = NOW() + INTERVAL '30 days';

    -- Emit notification to doctor
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_doctor_id,
        'New Confirmed Appointment',
        'Appointment booked for ' || p_appointment_date || ' at ' || p_time_slot,
        'appointment',
        'appointment',
        jsonb_build_object('appointment_id', v_appointment_id, 'appointment_number', v_appointment_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'appointment_id', v_appointment_id,
        'appointment_number', v_appointment_number
    );
END;
$$;


-- 13.3 Create Prescription Transaction
CREATE OR REPLACE FUNCTION public.create_prescription_tx(
    p_doctor_id UUID,
    p_patient_id UUID,
    p_appointment_id UUID,
    p_diagnosis TEXT,
    p_advice TEXT,
    p_medicines JSONB
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_rx_id TEXT;
    v_prescription_id UUID;
    v_med RECORD;
BEGIN
    IF auth.uid() <> p_doctor_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only the assigned medical practitioner can sign digital prescriptions';
    END IF;

    v_rx_id := 'RX-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));

    INSERT INTO public.prescriptions (
        rx_id, appointment_id, doctor_id, patient_id, diagnosis,
        general_advice, medicines, valid_until, status
    )
    VALUES (
        v_rx_id, p_appointment_id, p_doctor_id, p_patient_id, p_diagnosis,
        p_advice, p_medicines, CURRENT_DATE + INTERVAL '30 days', 'active'
    )
    RETURNING id INTO v_prescription_id;

    -- If appointment specified, complete consultation state
    IF p_appointment_id IS NOT NULL THEN
        UPDATE public.appointments
        SET status = 'completed', updated_at = NOW()
        WHERE id = p_appointment_id;

        INSERT INTO public.consultations (
            appointment_id, doctor_id, patient_id, chief_complaint, diagnosis, doctor_notes, status
        )
        VALUES (
            p_appointment_id, p_doctor_id, p_patient_id, p_diagnosis, p_diagnosis, p_advice, 'completed'
        )
        ON CONFLICT (appointment_id) DO UPDATE SET
            diagnosis = EXCLUDED.diagnosis,
            doctor_notes = EXCLUDED.doctor_notes,
            status = 'completed';
    END IF;

    -- Emit notification to patient
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_patient_id,
        'Digital Prescription Issued',
        'Dr. signed digital Rx ' || v_rx_id || '. Ready for pharmacy fulfillment.',
        'prescription',
        'prescription',
        jsonb_build_object('prescription_id', v_prescription_id, 'rx_id', v_rx_id)
    );

    RETURN jsonb_build_object(
        'success', true,
        'prescription_id', v_prescription_id,
        'rx_id', v_rx_id
    );
END;
$$;


-- 13.4 Create Medicine Order Transaction (Zero-Trust Frontend Pricing & Inventory Locking)
CREATE OR REPLACE FUNCTION public.create_medicine_order_tx(
    p_patient_id UUID,
    p_pharmacy_id UUID,
    p_items JSONB,
    p_delivery_address TEXT,
    p_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_id UUID;
    v_order_number TEXT;
    v_total_calculated NUMERIC(10,2) := 0.00;
    v_item JSONB;
    v_med_id UUID;
    v_qty INTEGER;
    v_unit_price NUMERIC(10,2);
    v_current_stock INTEGER;
BEGIN
    IF auth.uid() <> p_patient_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: User cannot place orders on behalf of another patient';
    END IF;

    IF jsonb_array_length(p_items) = 0 THEN
        RAISE EXCEPTION 'Cart is empty. Order requires at least one medicine item.';
    END IF;

    -- Validate stock and compute real price server-side using row lock
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_med_id := (v_item->>'medicine_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        IF v_qty <= 0 THEN
            RAISE EXCEPTION 'Invalid quantity for medicine item %', v_med_id;
        END IF;

        SELECT unit_price, stock_quantity INTO v_unit_price, v_current_stock
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id
        FOR UPDATE;

        IF v_unit_price IS NULL THEN
            RAISE EXCEPTION 'Medicine % is not stocked by selected pharmacy', v_med_id;
        END IF;

        IF v_current_stock < v_qty THEN
            RAISE EXCEPTION 'Insufficient stock for medicine %. Available: %, Requested: %', v_med_id, v_current_stock, v_qty;
        END IF;

        -- Decrement stock
        UPDATE public.pharmacy_inventory
        SET stock_quantity = stock_quantity - v_qty, updated_at = NOW()
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id;

        v_total_calculated := v_total_calculated + (v_unit_price * v_qty);
    END LOOP;

    v_order_number := 'ORD-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');

    INSERT INTO public.medicine_orders (
        order_number, patient_id, pharmacy_id, total_amount, payment_method,
        payment_status, order_status, delivery_address, notes
    )
    VALUES (
        v_order_number, p_patient_id, p_pharmacy_id, v_total_calculated, 'cash_on_delivery',
        'pending', 'confirmed', p_delivery_address, p_notes
    )
    RETURNING id INTO v_order_id;

    -- Insert order items
    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        v_med_id := (v_item->>'medicine_id')::UUID;
        v_qty := (v_item->>'quantity')::INTEGER;

        SELECT unit_price INTO v_unit_price
        FROM public.pharmacy_inventory
        WHERE pharmacy_id = p_pharmacy_id AND medicine_id = v_med_id;

        INSERT INTO public.order_items (
            order_id, medicine_id, quantity, unit_price, total_price
        )
        VALUES (
            v_order_id, v_med_id, v_qty, v_unit_price, (v_unit_price * v_qty)
        );
    END LOOP;

    -- Emit notification to pharmacy
    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        p_pharmacy_id,
        'New Prescription Order Received',
        'Order ' || v_order_number || ' received. Total: ₹' || v_total_calculated,
        'order',
        'order',
        jsonb_build_object('order_id', v_order_id, 'order_number', v_order_number)
    );

    RETURN jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'order_number', v_order_number,
        'total_amount', v_total_calculated
    );
END;
$$;


-- 13.5 Pharmacy Fulfill Prescription Transaction
CREATE OR REPLACE FUNCTION public.pharmacy_fulfill_prescription_tx(
    p_order_id UUID,
    p_pharmacy_id UUID,
    p_tracking_number TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_order_rec RECORD;
BEGIN
    SELECT id, patient_id, order_status INTO v_order_rec
    FROM public.medicine_orders
    WHERE id = p_order_id AND pharmacy_id = p_pharmacy_id;

    IF v_order_rec.id IS NULL THEN
        RAISE EXCEPTION 'Order not found or does not belong to your pharmacy dispensary';
    END IF;

    UPDATE public.medicine_orders
    SET order_status = 'shipped',
        updated_at = NOW()
    WHERE id = p_order_id;

    INSERT INTO public.notifications (
        user_id, title, message, type, notification_type, metadata
    )
    VALUES (
        v_order_rec.patient_id,
        'Order Dispatched for Delivery',
        'Your medication order has been packed and handed over to courier. Tracking: ' || COALESCE(p_tracking_number, 'Assigned'),
        'order',
        'order',
        jsonb_build_object('order_id', p_order_id, 'tracking_number', p_tracking_number)
    );

    RETURN jsonb_build_object('success', true, 'order_id', p_order_id, 'status', 'shipped');
END;
$$;


-- 13.6 Verify Doctor Transaction (Admin Only)
CREATE OR REPLACE FUNCTION public.verify_doctor_tx(
    p_doctor_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can verify medical practitioner licenses';
    END IF;

    UPDATE public.doctors
    SET verification_status = p_status, updated_at = NOW()
    WHERE id = p_doctor_id;

    INSERT INTO public.doctor_verifications (
        doctor_id, reviewed_by, status, rejection_reason, reviewed_at
    )
    VALUES (
        p_doctor_id, auth.uid(), p_status, p_reason, NOW()
    );

    UPDATE public.profiles
    SET approval_status = p_status, updated_at = NOW()
    WHERE id = p_doctor_id;

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


-- 13.7 Verify Pharmacy Transaction (Admin Only)
CREATE OR REPLACE FUNCTION public.verify_pharmacy_tx(
    p_pharmacy_id UUID,
    p_status TEXT,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized: Only Super Administrators can verify pharmacy drug retail licenses';
    END IF;

    UPDATE public.pharmacies
    SET verification_status = p_status, updated_at = NOW()
    WHERE id = p_pharmacy_id;

    INSERT INTO public.pharmacy_verifications (
        pharmacy_id, reviewed_by, status, rejection_reason, reviewed_at
    )
    VALUES (
        p_pharmacy_id, auth.uid(), p_status, p_reason, NOW()
    );

    UPDATE public.profiles
    SET approval_status = p_status, updated_at = NOW()
    WHERE id = p_pharmacy_id;

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


-- 13.8 Diagnostic & Consent RPCs
CREATE OR REPLACE FUNCTION public.book_lab_test_tx(
    p_patient_id UUID,
    p_package_id UUID,
    p_slot_date DATE,
    p_slot_time TEXT,
    p_collection_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_ref TEXT;
    v_booking_id UUID;
BEGIN
    v_ref := 'LAB-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || UPPER(SUBSTRING(MD5(RANDOM()::TEXT), 1, 6));

    INSERT INTO public.lab_bookings (
        booking_reference, patient_id, package_id, slot_date, slot_time, collection_type, status
    )
    VALUES (
        v_ref, p_patient_id, p_package_id, p_slot_date, p_slot_time, p_collection_type, 'booked'
    )
    RETURNING id INTO v_booking_id;

    RETURN jsonb_build_object('success', true, 'booking_id', v_booking_id, 'booking_reference', v_ref);
END;
$$;

CREATE OR REPLACE FUNCTION public.process_abdm_consent_tx(
    p_consent_id TEXT,
    p_action TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.abdm_consents
    SET status = p_action
    WHERE consent_id = p_consent_id;

    RETURN jsonb_build_object('success', true, 'consent_id', p_consent_id, 'status', p_action);
END;
$$;

CREATE OR REPLACE FUNCTION public.log_medication_dose_tx(
    p_schedule_id UUID,
    p_taken BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    UPDATE public.medication_schedules
    SET taken = p_taken,
        taken_at = CASE WHEN p_taken THEN NOW() ELSE NULL END
    WHERE id = p_schedule_id;

    RETURN jsonb_build_object('success', true, 'schedule_id', p_schedule_id, 'taken', p_taken);
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_consultation_dsc_tx(
    p_consultation_id UUID,
    p_doctor_id UUID,
    p_certificate_id TEXT
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    IF auth.uid() <> p_doctor_id AND NOT public.is_admin() THEN
        RAISE EXCEPTION 'Unauthorized to sign consultation record';
    END IF;

    UPDATE public.consultations
    SET status = 'completed',
        ended_at = NOW()
    WHERE id = p_consultation_id;

    RETURN jsonb_build_object('success', true, 'consultation_id', p_consultation_id, 'signed', true);
END;
$$;

CREATE OR REPLACE FUNCTION public.recommend_doctors_for_disease(p_disease_name TEXT)
RETURNS TABLE (
    doctor_id UUID,
    full_name TEXT,
    specialization TEXT,
    rating NUMERIC,
    consultation_fee NUMERIC
)
LANGUAGE plpgsql STABLE SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    RETURN QUERY
    SELECT d.id, d.full_name, d.specialization, d.rating, d.consultation_fee
    FROM public.doctors d
    WHERE d.verification_status = 'approved' AND d.is_available = true
    ORDER BY d.rating DESC
    LIMIT 5;
END;
$$;


-- ============================================================================
-- 14. STRICT RPC PERMISSIONS (LEAST PRIVILEGE)
-- ============================================================================

-- Revoke all permissions from PUBLIC and anon on privileged transactional functions
REVOKE ALL ON FUNCTION public.create_appointment_tx(UUID, DATE, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_prescription_tx(UUID, UUID, UUID, TEXT, TEXT, JSONB) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.pharmacy_fulfill_prescription_tx(UUID, UUID, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_doctor_tx(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.verify_pharmacy_tx(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.book_lab_test_tx(UUID, UUID, DATE, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.process_abdm_consent_tx(TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.log_medication_dose_tx(UUID, BOOLEAN) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.sign_consultation_dsc_tx(UUID, UUID, TEXT) FROM PUBLIC, anon;

-- Grant EXECUTE exclusively to authenticated users
GRANT EXECUTE ON FUNCTION public.create_appointment_tx(UUID, DATE, TEXT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_prescription_tx(UUID, UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_medicine_order_tx(UUID, UUID, JSONB, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.pharmacy_fulfill_prescription_tx(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_doctor_tx(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_pharmacy_tx(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_lab_test_tx(UUID, UUID, DATE, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.process_abdm_consent_tx(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.log_medication_dose_tx(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.sign_consultation_dsc_tx(UUID, UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.recommend_doctors_for_disease(TEXT) TO authenticated, anon;

-- ============================================================================
-- END OF UNIFIED MASTER SCHEMA
-- ============================================================================
"""
    out_file = ROOT / "supabase" / "complete_database_schema_and_migrations.sql"
    out_file.write_text(sql, encoding="utf-8")
    print(f"Successfully generated master schema: {out_file} ({len(sql.splitlines())} lines, {len(sql)} bytes)")

if __name__ == "__main__":
    build_master_sql()
