-- ==============================================================================
-- MediMind AI - Production Supabase Schema Migration (0005_production_backend_schema.sql)
-- Complete Production Healthcare Schema, RLS Least-Privilege Security, & Atomic RPCs
-- ==============================================================================

-- 1. Enable Required Extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 2. USER ROLES TABLE (Strict 5-Tier RBAC)
create table if not exists public.user_roles (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null unique,
    role text not null check (role in ('patient', 'doctor', 'pharmacist', 'admin', 'super_admin')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.user_roles is 'System authorization roles. Super admin controls privileged elevations.';

-- Helper functions for RLS
create or replace function public.current_user_role()
returns text as $$
  select role from public.user_roles where user_id = auth.uid();
$$ language sql stable security definer;

create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role in ('admin', 'super_admin')
  );
$$ language sql stable security definer;

create or replace function public.is_super_admin()
returns boolean as $$
  select exists (
    select 1 from public.user_roles 
    where user_id = auth.uid() and role = 'super_admin'
  );
$$ language sql stable security definer;

-- 3. PATIENTS TABLE (Extended clinical baseline)
create table if not exists public.patients (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    phone text,
    date_of_birth date,
    gender text check (gender in ('Male', 'Female', 'Other')),
    blood_group text check (blood_group in ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-')),
    emergency_contact text,
    address text,
    preferred_language text default 'English',
    timezone text default 'Asia/Kolkata',
    abha_id text,
    bmi numeric(4,1) default 22.0,
    blood_sugar numeric(5,1) default 100.0,
    bp_systolic numeric(4,1) default 120.0,
    bp_diastolic numeric(4,1) default 80.0,
    is_smoker boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. DOCTORS & VERIFICATIONS TABLE
create table if not exists public.doctors (
    id uuid references auth.users(id) on delete cascade primary key,
    full_name text not null,
    specialization text not null,
    qualification text not null default 'MBBS',
    experience_years integer default 5,
    bio text,
    languages text[] default array['English', 'Hindi'],
    consultation_fee numeric(10,2) default 500.00,
    rating numeric(3,2) default 4.9,
    clinic_name text default 'MediMind Clinical Centre',
    clinic_address text,
    license_number text not null,
    verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
    is_available boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.doctor_verifications (
    id uuid default gen_random_uuid() primary key,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    submitted_documents jsonb not null default '[]'::jsonb,
    reviewed_by uuid references auth.users(id) on delete set null,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Doctor Availability
create table if not exists public.doctor_availability (
    id uuid default gen_random_uuid() primary key,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday
    start_time time not null,
    end_time time not null,
    slot_duration_minutes integer default 30,
    is_active boolean default true,
    unique(doctor_id, day_of_week, start_time)
);

-- 5. PHARMACIES & VERIFICATIONS TABLE
create table if not exists public.pharmacies (
    id uuid references auth.users(id) on delete cascade primary key,
    pharmacy_name text not null,
    contact_person text not null,
    phone text not null,
    email text not null,
    drug_license_number text not null unique,
    gstin text,
    address text not null,
    verification_status text default 'pending' check (verification_status in ('pending', 'approved', 'rejected')),
    is_active boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.pharmacy_verifications (
    id uuid default gen_random_uuid() primary key,
    pharmacy_id uuid references public.pharmacies(id) on delete cascade not null,
    submitted_documents jsonb not null default '[]'::jsonb,
    reviewed_by uuid references auth.users(id) on delete set null,
    status text default 'pending' check (status in ('pending', 'approved', 'rejected')),
    rejection_reason text,
    reviewed_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. PATIENT-DOCTOR ACCESS AUTHORIZATION BRIDGE
create table if not exists public.patient_doctor_access (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    granted_by text default 'appointment' check (granted_by in ('appointment', 'explicit_consent', 'emergency_override', 'admin')),
    is_active boolean default true,
    expires_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(patient_id, doctor_id)
);

-- 7. APPOINTMENTS TABLE (Real State Machine)
create table if not exists public.appointments (
    id uuid default gen_random_uuid() primary key,
    appointment_number text unique not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    appointment_date date not null,
    time_slot text not null,
    consultation_type text default 'video' check (consultation_type in ('video', 'in_person')),
    status text default 'requested' check (status in ('requested', 'confirmed', 'in_progress', 'completed', 'cancelled', 'no_show')),
    symptoms_summary text,
    patient_notes text,
    cancellation_reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(doctor_id, appointment_date, time_slot) -- Prevents double booking
);

-- 8. CONSULTATIONS & MEDICAL RECORDS
create table if not exists public.consultations (
    id uuid default gen_random_uuid() primary key,
    appointment_id uuid references public.appointments(id) on delete cascade unique not null,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    chief_complaint text not null,
    clinical_summary text not null,
    diagnosis text not null,
    meeting_url text,
    started_at timestamp with time zone default timezone('utc'::text, now()),
    ended_at timestamp with time zone,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.medical_records (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    doctor_id uuid references public.doctors(id) on delete set null,
    consultation_id uuid references public.consultations(id) on delete set null,
    record_type text not null check (record_type in ('diagnosis', 'lab_report', 'clinical_note', 'discharge_summary')),
    title text not null,
    clinical_summary text not null,
    structured_data jsonb default '{}'::jsonb,
    record_date date default current_date not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.patient_allergies (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    allergen text not null,
    severity text default 'Moderate' check (severity in ('Mild', 'Moderate', 'Severe')),
    reaction_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. AI SYMPTOM ASSESSMENTS & RATE LIMITING
create table if not exists public.symptom_assessments (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references auth.users(id) on delete set null,
    symptoms text[] not null check (cardinality(symptoms) > 0),
    possible_conditions jsonb not null default '[]'::jsonb,
    risk_level text not null check (risk_level in ('Low', 'Moderate', 'High')),
    ai_summary text not null,
    recommended_action text not null,
    disclaimer text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.ai_usage_daily (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    usage_date date default current_date not null,
    request_count integer default 1,
    unique(user_id, usage_date)
);

create table if not exists public.rate_limit_events (
    id uuid default gen_random_uuid() primary key,
    ip_address text,
    user_id uuid references auth.users(id) on delete set null,
    endpoint text not null,
    blocked_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. MEDICINES & PHARMACY INVENTORY
create table if not exists public.medicines (
    id uuid default gen_random_uuid() primary key,
    brand_name text not null,
    generic_name text not null,
    category text not null,
    dosage_form text not null,
    strength text not null,
    standard_price numeric(10,2) not null check (standard_price >= 0),
    requires_prescription boolean default true,
    manufacturer text default 'MediMind Certified Pharma',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.pharmacy_inventory (
    id uuid default gen_random_uuid() primary key,
    pharmacy_id uuid references public.pharmacies(id) on delete cascade not null,
    medicine_id uuid references public.medicines(id) on delete cascade not null,
    stock_quantity integer not null default 0 check (stock_quantity >= 0),
    unit_price numeric(10,2) not null check (unit_price >= 0),
    reorder_level integer default 10,
    batch_number text default 'BATCH-2026',
    expiry_date date default current_date + interval '365 days',
    is_available boolean default true,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(pharmacy_id, medicine_id)
);

-- 11. PRESCRIPTIONS & PRESCRIPTION ITEMS
create table if not exists public.prescriptions (
    id uuid default gen_random_uuid() primary key,
    rx_id text unique not null,
    doctor_id uuid references public.doctors(id) on delete cascade not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    consultation_id uuid references public.consultations(id) on delete set null,
    diagnosis text not null,
    general_advice text,
    follow_up_date date,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.prescription_items (
    id uuid default gen_random_uuid() primary key,
    prescription_id uuid references public.prescriptions(id) on delete cascade not null,
    medicine_name text not null,
    dosage text not null,
    frequency text not null,
    duration text not null,
    instructions text
);

-- 12. MEDICINE ORDERS & ORDER ITEMS
create table if not exists public.medicine_orders (
    id uuid default gen_random_uuid() primary key,
    order_number text unique not null,
    patient_id uuid references public.patients(id) on delete cascade not null,
    pharmacy_id uuid references public.pharmacies(id) on delete cascade not null,
    prescription_id uuid references public.prescriptions(id) on delete set null,
    total_amount numeric(10,2) not null check (total_amount >= 0),
    payment_method text default 'online' check (payment_method in ('online', 'cod')),
    payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
    prescription_verified boolean default false,
    order_status text default 'pending' check (order_status in ('pending', 'prescription_review', 'confirmed', 'packed', 'dispatched', 'out_for_delivery', 'delivered', 'cancelled')),
    delivery_address text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.medicine_orders(id) on delete cascade not null,
    medicine_id uuid references public.medicines(id) on delete cascade not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(10,2) not null check (unit_price >= 0),
    total_price numeric(10,2) not null check (total_price >= 0)
);

-- 13. PAYMENTS TABLE
create table if not exists public.payments (
    id uuid default gen_random_uuid() primary key,
    transaction_reference text unique not null,
    user_id uuid references auth.users(id) on delete cascade not null,
    order_id uuid references public.medicine_orders(id) on delete set null,
    appointment_id uuid references public.appointments(id) on delete set null,
    amount numeric(10,2) not null check (amount >= 0),
    provider text not null default 'razorpay' check (provider in ('razorpay', 'stripe', 'cash')),
    provider_payment_id text,
    status text default 'completed' check (status in ('pending', 'completed', 'failed', 'refunded')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 14. HEALTH REPORTS & STORAGE METADATA
create table if not exists public.health_reports (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null,
    report_title text not null,
    storage_path text not null,
    mime_type text not null,
    file_size_bytes bigint not null,
    ai_analysis jsonb default '{}'::jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 15. NOTIFICATIONS TABLE (Real-time enabled)
create table if not exists public.notifications (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id) on delete cascade not null,
    title text not null,
    message text not null,
    notification_type text not null check (notification_type in ('appointment', 'prescription', 'order', 'alert', 'system')),
    link text,
    is_read boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 16. AUDIT LOGS TABLE (Immutable HIPAA-compliant Trail)
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    actor_id uuid references auth.users(id) on delete set null,
    actor_role text not null default 'system',
    action text not null,
    target_entity text not null,
    target_id text,
    details jsonb default '{}'::jsonb,
    ip_address text default '127.0.0.1',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 17. STORAGE BUCKET CONFIGURATION ('medical-documents')
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-documents', 'medical-documents', false, 15728640, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- ==============================================================================
-- 18. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

alter table public.user_roles enable row level security;
alter table public.patients enable row level security;
alter table public.doctors enable row level security;
alter table public.doctor_verifications enable row level security;
alter table public.doctor_availability enable row level security;
alter table public.pharmacies enable row level security;
alter table public.pharmacy_verifications enable row level security;
alter table public.patient_doctor_access enable row level security;
alter table public.appointments enable row level security;
alter table public.consultations enable row level security;
alter table public.medical_records enable row level security;
alter table public.patient_allergies enable row level security;
alter table public.symptom_assessments enable row level security;
alter table public.ai_usage_daily enable row level security;
alter table public.rate_limit_events enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.prescriptions enable row level security;
alter table public.prescription_items enable row level security;
alter table public.medicine_orders enable row level security;
alter table public.order_items enable row level security;
alter table public.payments enable row level security;
alter table public.health_reports enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;

-- USER ROLES: Users can view own role; only Super Admin can manage roles
create policy "user_roles_select_own" on public.user_roles for select using (auth.uid() = user_id or public.is_admin());
create policy "user_roles_manage_super_admin" on public.user_roles for all using (public.is_super_admin());

-- PATIENTS: Patient reads/updates own record; authorized doctor reads
create policy "patients_select" on public.patients for select using (
    auth.uid() = id or 
    public.is_admin() or 
    exists (select 1 from public.patient_doctor_access pda where pda.patient_id = id and pda.doctor_id = auth.uid() and pda.is_active = true)
);
create policy "patients_update_own" on public.patients for update using (auth.uid() = id);
create policy "patients_insert_own" on public.patients for insert with check (auth.uid() = id);

-- DOCTORS: Public can view approved doctors; Doctor updates own profile; Admin manages
create policy "doctors_select" on public.doctors for select using (verification_status = 'approved' or auth.uid() = id or public.is_admin());
create policy "doctors_update_own" on public.doctors for update using (auth.uid() = id and verification_status = (select verification_status from public.doctors where id = auth.uid()));
create policy "doctors_admin_all" on public.doctors for all using (public.is_admin());

-- DOCTOR VERIFICATIONS: Only Admin reads & reviews
create policy "doctor_verifications_admin" on public.doctor_verifications for all using (public.is_admin());

-- DOCTOR AVAILABILITY: Public can view; Doctor manages own
create policy "doctor_availability_select" on public.doctor_availability for select using (true);
create policy "doctor_availability_doctor" on public.doctor_availability for all using (auth.uid() = doctor_id);

-- PHARMACIES: Public views approved; Pharmacist manages own; Admin manages
create policy "pharmacies_select" on public.pharmacies for select using (verification_status = 'approved' or auth.uid() = id or public.is_admin());
create policy "pharmacies_update_own" on public.pharmacies for update using (auth.uid() = id);
create policy "pharmacies_admin_all" on public.pharmacies for all using (public.is_admin());

-- PHARMACY VERIFICATIONS: Admin only
create policy "pharmacy_verifications_admin" on public.pharmacy_verifications for all using (public.is_admin());

-- APPOINTMENTS: Patient and Doctor view own; Patient books
create policy "appointments_select" on public.appointments for select using (auth.uid() = patient_id or auth.uid() = doctor_id or public.is_admin());
create policy "appointments_insert_patient" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "appointments_update_participants" on public.appointments for update using (auth.uid() in (patient_id, doctor_id) or public.is_admin());

-- CONSULTATIONS & MEDICAL RECORDS
create policy "consultations_select" on public.consultations for select using (auth.uid() = patient_id or auth.uid() = doctor_id or public.is_admin());
create policy "consultations_doctor_manage" on public.consultations for all using (auth.uid() = doctor_id or public.is_admin());

create policy "medical_records_select" on public.medical_records for select using (
    auth.uid() = patient_id or 
    public.is_admin() or 
    exists (select 1 from public.patient_doctor_access pda where pda.patient_id = medical_records.patient_id and pda.doctor_id = auth.uid() and pda.is_active = true)
);
create policy "medical_records_doctor_insert" on public.medical_records for insert with check (
    auth.uid() = doctor_id or auth.uid() = patient_id or public.is_admin()
);

create policy "patient_allergies_select" on public.patient_allergies for select using (auth.uid() = patient_id or public.is_admin() or exists (select 1 from public.patient_doctor_access pda where pda.patient_id = patient_allergies.patient_id and pda.doctor_id = auth.uid() and pda.is_active = true));
create policy "patient_allergies_patient" on public.patient_allergies for all using (auth.uid() = patient_id);

-- SYMPTOM ASSESSMENTS
create policy "symptom_assessments_select" on public.symptom_assessments for select using (auth.uid() = patient_id or public.is_admin());
create policy "symptom_assessments_insert" on public.symptom_assessments for insert with check (auth.uid() = patient_id or patient_id is null);

-- MEDICINES: Public Read; Admin manages
create policy "medicines_select" on public.medicines for select using (true);
create policy "medicines_admin" on public.medicines for all using (public.is_admin());

-- PHARMACY INVENTORY: Public can view active; Pharmacy manages own
create policy "pharmacy_inventory_select" on public.pharmacy_inventory for select using (is_available = true or auth.uid() = pharmacy_id or public.is_admin());
create policy "pharmacy_inventory_manage" on public.pharmacy_inventory for all using (auth.uid() = pharmacy_id or public.is_admin());

-- PRESCRIPTIONS & ITEMS: Patient views own; Doctor views issued; Pharmacy views if order linked
create policy "prescriptions_select" on public.prescriptions for select using (
    auth.uid() = patient_id or 
    auth.uid() = doctor_id or 
    public.is_admin() or
    exists (select 1 from public.medicine_orders mo where mo.prescription_id = prescriptions.id and mo.pharmacy_id = auth.uid())
);
create policy "prescriptions_doctor_all" on public.prescriptions for all using (auth.uid() = doctor_id or public.is_admin());

create policy "prescription_items_select" on public.prescription_items for select using (
    exists (select 1 from public.prescriptions p where p.id = prescription_items.prescription_id and (
        p.patient_id = auth.uid() or 
        p.doctor_id = auth.uid() or 
        public.is_admin() or
        exists (select 1 from public.medicine_orders mo where mo.prescription_id = p.id and mo.pharmacy_id = auth.uid())
    ))
);
create policy "prescription_items_doctor_all" on public.prescription_items for all using (
    exists (select 1 from public.prescriptions p where p.id = prescription_items.prescription_id and p.doctor_id = auth.uid()) or public.is_admin()
);

-- MEDICINE ORDERS & ITEMS
create policy "medicine_orders_select" on public.medicine_orders for select using (auth.uid() = patient_id or auth.uid() = pharmacy_id or public.is_admin());
create policy "medicine_orders_patient_insert" on public.medicine_orders for insert with check (auth.uid() = patient_id);
create policy "medicine_orders_update" on public.medicine_orders for update using (auth.uid() in (patient_id, pharmacy_id) or public.is_admin());

create policy "order_items_select" on public.order_items for select using (
    exists (select 1 from public.medicine_orders mo where mo.id = order_items.order_id and (mo.patient_id = auth.uid() or mo.pharmacy_id = auth.uid() or public.is_admin()))
);
create policy "order_items_insert" on public.order_items for insert with check (
    exists (select 1 from public.medicine_orders mo where mo.id = order_items.order_id and mo.patient_id = auth.uid())
);

-- PAYMENTS: User reads own; Admin reads all
create policy "payments_select" on public.payments for select using (auth.uid() = user_id or public.is_admin());
create policy "payments_insert" on public.payments for insert with check (auth.uid() = user_id);

-- HEALTH REPORTS
create policy "health_reports_select" on public.health_reports for select using (
    auth.uid() = patient_id or 
    public.is_admin() or 
    exists (select 1 from public.patient_doctor_access pda where pda.patient_id = health_reports.patient_id and pda.doctor_id = auth.uid() and pda.is_active = true)
);
create policy "health_reports_patient_all" on public.health_reports for all using (auth.uid() = patient_id);

-- NOTIFICATIONS: User reads and updates own
create policy "notifications_select_own" on public.notifications for select using (auth.uid() = user_id);
create policy "notifications_update_own" on public.notifications for update using (auth.uid() = user_id);

-- AUDIT LOGS: Super Admin and Admin only
create policy "audit_logs_admin_all" on public.audit_logs for select using (public.is_admin());

-- STORAGE POLICIES: medical-documents
create policy "storage_med_docs_patient_read" on storage.objects for select using (
    bucket_id = 'medical-documents' and (
        (storage.foldername(name))[1] = auth.uid()::text or
        public.is_admin() or
        exists (select 1 from public.patient_doctor_access pda where pda.patient_id::text = (storage.foldername(name))[1] and pda.doctor_id = auth.uid() and pda.is_active = true)
    )
);
create policy "storage_med_docs_patient_insert" on storage.objects for insert with check (
    bucket_id = 'medical-documents' and (storage.foldername(name))[1] = auth.uid()::text
);
create policy "storage_med_docs_patient_delete" on storage.objects for delete using (
    bucket_id = 'medical-documents' and (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================================================
-- 19. ATOMIC DATABASE RPC FUNCTIONS (TRANSACTIONS)
-- ==============================================================================

-- A. Book Appointment Atomically
create or replace function public.create_appointment_tx(
    p_doctor_id uuid,
    p_appointment_date date,
    p_time_slot text,
    p_consultation_type text,
    p_symptoms_summary text,
    p_patient_notes text
) returns jsonb as $$
declare
    v_patient_id uuid := auth.uid();
    v_appointment_id uuid;
    v_appt_number text;
    v_doctor_verified boolean;
begin
    -- 1. Verify user is authenticated patient
    if v_patient_id is null then
        raise exception 'Authentication required.';
    end if;

    -- 2. Verify doctor is approved
    select (verification_status = 'approved') into v_doctor_verified 
    from public.doctors where id = p_doctor_id;

    if v_doctor_verified is not true then
        raise exception 'Selected doctor is not verified for clinical practice.';
    end if;

    -- 3. Verify slot is not in the past
    if p_appointment_date < current_date then
        raise exception 'Cannot book an appointment in the past.';
    end if;

    -- 4. Check overlapping slot with lock
    if exists (
        select 1 from public.appointments 
        where doctor_id = p_doctor_id 
          and appointment_date = p_appointment_date 
          and time_slot = p_time_slot
          and status not in ('cancelled')
    ) then
        raise exception 'This appointment slot is no longer available. Please select another slot.';
    end if;

    -- 5. Generate unique appointment number
    v_appt_number := 'APT-' || to_char(current_date, 'YYYYMMDD') || '-' || floor(1000 + random() * 9000)::text;

    -- 6. Insert Appointment
    insert into public.appointments (
        appointment_number, patient_id, doctor_id, appointment_date, time_slot,
        consultation_type, symptoms_summary, patient_notes, status
    ) values (
        v_appt_number, v_patient_id, p_doctor_id, p_appointment_date, p_time_slot,
        p_consultation_type, p_symptoms_summary, p_patient_notes, 'confirmed'
    ) returning id into v_appointment_id;

    -- 7. Grant doctor access to patient medical records
    insert into public.patient_doctor_access (patient_id, doctor_id, granted_by, is_active, expires_at)
    values (v_patient_id, p_doctor_id, 'appointment', true, timezone('utc'::text, now()) + interval '14 days')
    on conflict (patient_id, doctor_id) do update set is_active = true, expires_at = timezone('utc'::text, now()) + interval '14 days';

    -- 8. Create Notification for Doctor
    insert into public.notifications (user_id, title, message, notification_type, link)
    values (
        p_doctor_id,
        'New Appointment Confirmed',
        'Patient confirmed an appointment for ' || p_appointment_date::text || ' at ' || p_time_slot,
        'appointment',
        '/doctor/appointments'
    );

    -- 9. Audit Log
    insert into public.audit_logs (actor_id, actor_role, action, target_entity, target_id, details)
    values (v_patient_id, 'patient', 'BOOK_APPOINTMENT', 'appointments', v_appointment_id::text, jsonb_build_object('appointment_number', v_appt_number));

    return jsonb_build_object('success', true, 'appointment_id', v_appointment_id, 'appointment_number', v_appt_number);
end;
$$ language plpgsql security definer;

-- B. Create Prescription with Line Items Atomically
create or replace function public.create_prescription_tx(
    p_patient_id uuid,
    p_appointment_id uuid,
    p_diagnosis text,
    p_medicines jsonb,
    p_general_advice text,
    p_follow_up_date date
) returns jsonb as $$
declare
    v_doctor_id uuid := auth.uid();
    v_prescription_id uuid;
    v_rx_id text;
    v_item jsonb;
begin
    if v_doctor_id is null then
        raise exception 'Only authenticated doctors can issue prescriptions.';
    end if;

    v_rx_id := 'RX-' || to_char(current_date, 'YYYY') || '-' || floor(1000 + random() * 9000)::text;

    -- Insert prescription header
    insert into public.prescriptions (
        rx_id, doctor_id, patient_id, diagnosis, general_advice, follow_up_date
    ) values (
        v_rx_id, v_doctor_id, p_patient_id, p_diagnosis, p_general_advice, p_follow_up_date
    ) returning id into v_prescription_id;

    -- Insert line items
    for v_item in select * from jsonb_array_elements(p_medicines) loop
        insert into public.prescription_items (
            prescription_id, medicine_name, dosage, frequency, duration, instructions
        ) values (
            v_prescription_id,
            v_item->>'name',
            coalesce(v_item->>'dosage', 'Standard'),
            coalesce(v_item->>'frequency', '1-0-1'),
            coalesce(v_item->>'duration', '5 Days'),
            v_item->>'instructions'
        );
    end loop;

    -- Notify patient
    insert into public.notifications (user_id, title, message, notification_type, link)
    values (
        p_patient_id,
        'Digital Prescription Issued',
        'Dr. issued Prescription #' || v_rx_id || '. Ready for download or pharmacy order.',
        'prescription',
        '/prescriptions'
    );

    -- Audit log
    insert into public.audit_logs (actor_id, actor_role, action, target_entity, target_id, details)
    values (v_doctor_id, 'doctor', 'CREATE_PRESCRIPTION', 'prescriptions', v_prescription_id::text, jsonb_build_object('rx_id', v_rx_id));

    return jsonb_build_object('success', true, 'prescription_id', v_prescription_id, 'rx_id', v_rx_id);
end;
$$ language plpgsql security definer;

-- C. Create Medicine Order Atomically (With Inventory Decrementing)
create or replace function public.create_medicine_order_tx(
    p_pharmacy_id uuid,
    p_prescription_id uuid,
    p_items jsonb,
    p_payment_method text,
    p_delivery_address text
) returns jsonb as $$
declare
    v_patient_id uuid := auth.uid();
    v_order_id uuid;
    v_order_number text;
    v_item jsonb;
    v_med_id uuid;
    v_qty integer;
    v_unit_price numeric(10,2);
    v_total_amount numeric(10,2) := 0;
    v_available_stock integer;
begin
    if v_patient_id is null then
        raise exception 'Authentication required to place medicine order.';
    end if;

    -- Validate stock and calculate verified server-side total
    for v_item in select * from jsonb_array_elements(p_items) loop
        v_med_id := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::integer;

        if v_qty <= 0 then
            raise exception 'Invalid quantity requested.';
        end if;

        -- Lock inventory row and check stock
        select stock_quantity, unit_price into v_available_stock, v_unit_price
        from public.pharmacy_inventory
        where pharmacy_id = p_pharmacy_id and medicine_id = v_med_id
        for update;

        if v_available_stock is null or v_available_stock < v_qty then
            raise exception 'Medicine out of stock or insufficient quantity available.';
        end if;

        v_total_amount := v_total_amount + (v_unit_price * v_qty);
    end loop;

    -- Generate order number
    v_order_number := 'ORD-' || to_char(current_date, 'YYYYMMDD') || '-' || floor(1000 + random() * 9000)::text;

    -- Insert Order
    insert into public.medicine_orders (
        order_number, patient_id, pharmacy_id, prescription_id, total_amount,
        payment_method, payment_status, order_status, delivery_address
    ) values (
        v_order_number, v_patient_id, p_pharmacy_id, p_prescription_id, v_total_amount,
        p_payment_method, (case when p_payment_method = 'online' then 'paid' else 'pending' end),
        'confirmed', p_delivery_address
    ) returning id into v_order_id;

    -- Decrement inventory & insert order items
    for v_item in select * from jsonb_array_elements(p_items) loop
        v_med_id := (v_item->>'id')::uuid;
        v_qty := (v_item->>'quantity')::integer;

        select unit_price into v_unit_price 
        from public.pharmacy_inventory
        where pharmacy_id = p_pharmacy_id and medicine_id = v_med_id;

        update public.pharmacy_inventory
        set stock_quantity = stock_quantity - v_qty, updated_at = timezone('utc'::text, now())
        where pharmacy_id = p_pharmacy_id and medicine_id = v_med_id;

        insert into public.order_items (order_id, medicine_id, quantity, unit_price, total_price)
        values (v_order_id, v_med_id, v_qty, v_unit_price, (v_unit_price * v_qty));
    end loop;

    -- Notify Pharmacy
    insert into public.notifications (user_id, title, message, notification_type, link)
    values (
        p_pharmacy_id,
        'New Prescription Order Received',
        'Order #' || v_order_number || ' received for dispensation.',
        'order',
        '/pharmacy/orders'
    );

    return jsonb_build_object('success', true, 'order_id', v_order_id, 'order_number', v_order_number, 'total_amount', v_total_amount);
end;
$$ language plpgsql security definer;

-- D. Admin Verification Functions
create or replace function public.verify_doctor_tx(
    p_doctor_id uuid,
    p_status text,
    p_reason text default null
) returns jsonb as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators can verify medical practitioner credentials.';
    end if;

    update public.doctors
    set verification_status = p_status, updated_at = timezone('utc'::text, now())
    where id = p_doctor_id;

    insert into public.doctor_verifications (doctor_id, reviewed_by, status, rejection_reason, reviewed_at)
    values (p_doctor_id, auth.uid(), p_status, p_reason, timezone('utc'::text, now()));

    insert into public.notifications (user_id, title, message, notification_type, link)
    values (
        p_doctor_id,
        'Doctor Credentialing Status: ' || upper(p_status),
        case when p_status = 'approved' then 'Your medical credentials have been approved. You are now active in patient triage searches.' else 'Your verification was not approved: ' || coalesce(p_reason, 'Credential review failed.') end,
        'system',
        '/doctor/dashboard'
    );

    insert into public.audit_logs (actor_id, actor_role, action, target_entity, target_id, details)
    values (auth.uid(), 'admin', 'VERIFY_DOCTOR', 'doctors', p_doctor_id::text, jsonb_build_object('status', p_status, 'reason', p_reason));

    return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

create or replace function public.verify_pharmacy_tx(
    p_pharmacy_id uuid,
    p_status text,
    p_reason text default null
) returns jsonb as $$
begin
    if not public.is_admin() then
        raise exception 'Only administrators can verify pharmacy licenses.';
    end if;

    update public.pharmacies
    set verification_status = p_status, updated_at = timezone('utc'::text, now())
    where id = p_pharmacy_id;

    insert into public.pharmacy_verifications (pharmacy_id, reviewed_by, status, rejection_reason, reviewed_at)
    values (p_pharmacy_id, auth.uid(), p_status, p_reason, timezone('utc'::text, now()));

    insert into public.notifications (user_id, title, message, notification_type, link)
    values (
        p_pharmacy_id,
        'Pharmacy Licensing Status: ' || upper(p_status),
        case when p_status = 'approved' then 'Your pharmacy license has been approved. You can now receive patient orders.' else 'Your verification was not approved: ' || coalesce(p_reason, 'License check failed.') end,
        'system',
        '/pharmacy/dashboard'
    );

    insert into public.audit_logs (actor_id, actor_role, action, target_entity, target_id, details)
    values (auth.uid(), 'admin', 'VERIFY_PHARMACY', 'pharmacies', p_pharmacy_id::text, jsonb_build_object('status', p_status, 'reason', p_reason));

    return jsonb_build_object('success', true);
end;
$$ language plpgsql security definer;

-- E. Auto Provision Patient Profile Trigger
create or replace function public.handle_user_signup()
returns trigger as $$
begin
    -- 1. Insert default 'patient' role in public.user_roles (never trust client role override)
    insert into public.user_roles (user_id, role)
    values (new.id, 'patient')
    on conflict (user_id) do nothing;

    -- 2. Insert patient record
    insert into public.patients (id, full_name, phone, abha_id)
    values (
        new.id,
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)),
        new.raw_user_meta_data->>'phone',
        new.raw_user_meta_data->>'abha_id'
    )
    on conflict (id) do nothing;

    return new;
end;
$$ language plpgsql security definer;

-- Bind trigger to auth.users if not exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_user_signup();
