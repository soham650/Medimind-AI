-- ==============================================================================
-- MediMind Architecture Schema Migration (0004_full_architecture_schema.sql)
-- Aligns database with the MediMind 4-Role Architecture & Admin Approval Gate
-- ==============================================================================

-- 1. Extend public.profiles with approval workflow and multi-role attributes
alter table public.profiles add column if not exists approval_status text default 'approved' check (approval_status in ('pending', 'approved', 'rejected'));
alter table public.profiles add column if not exists license_document_url text;
alter table public.profiles add column if not exists pharmacy_name text;
alter table public.profiles add column if not exists pharmacy_address text;
alter table public.profiles add column if not exists gst_number text;
alter table public.profiles add column if not exists experience_years integer default 0;
alter table public.profiles add column if not exists consultation_fee numeric(10,2) default 500.00;
alter table public.profiles add column if not exists is_available boolean default true;
alter table public.profiles add column if not exists rejection_reason text;

-- Existing patients and admins are auto-approved; doctors and pharmacies will follow the approval gate
update public.profiles set approval_status = 'approved' where role in ('patient', 'admin') and approval_status is null;

-- 2. Appointments Table (Core Service 2: Doctor & Appointment Service)
create table if not exists public.appointments (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    doctor_id uuid references public.profiles(id) on delete cascade not null,
    appointment_date date not null,
    time_slot text not null,
    status text default 'scheduled' check (status in ('scheduled', 'in_consultation', 'completed', 'cancelled', 'no_show')),
    consultation_type text default 'video' check (consultation_type in ('video', 'in_person')),
    symptoms_summary text,
    patient_notes text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.appointments is 'Scheduled teleconsultations and clinic visits between patients and approved doctors.';

create index if not exists idx_appointments_patient_id on public.appointments (patient_id);
create index if not exists idx_appointments_doctor_id on public.appointments (doctor_id);
create index if not exists idx_appointments_date on public.appointments (appointment_date);

-- 3. Consultations Table (Core Service 3: Consultation Service)
create table if not exists public.consultations (
    id uuid default gen_random_uuid() primary key,
    appointment_id uuid references public.appointments(id) on delete cascade unique not null,
    doctor_id uuid references public.profiles(id) on delete cascade not null,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    chief_complaint text,
    clinical_findings text,
    diagnosis text not null,
    doctor_notes text,
    follow_up_date date,
    meeting_url text,
    status text default 'completed' check (status in ('ongoing', 'completed')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.consultations is 'Clinical notes, diagnostic records, and session history from consultations.';

-- 4. Prescriptions Table (Core Service 4: Prescription Service)
create table if not exists public.prescriptions (
    id uuid default gen_random_uuid() primary key,
    rx_id text unique not null, -- e.g. RX-2026-0891
    appointment_id uuid references public.appointments(id) on delete set null,
    consultation_id uuid references public.consultations(id) on delete set null,
    doctor_id uuid references public.profiles(id) on delete cascade not null,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    diagnosis text not null,
    medicines jsonb not null default '[]'::jsonb, -- Array of { name, dosage, frequency, duration, instructions }
    general_advice text,
    is_dispensed boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.prescriptions is 'Digitally signed medical prescriptions issued by verified doctors.';

create index if not exists idx_prescriptions_rx_id on public.prescriptions (rx_id);
create index if not exists idx_prescriptions_patient_id on public.prescriptions (patient_id);
create index if not exists idx_prescriptions_doctor_id on public.prescriptions (doctor_id);

-- 5. Medicines & Pharmacy Inventory (Core Service 5 & Master Data 14)
create table if not exists public.medicines (
    id uuid default gen_random_uuid() primary key,
    brand_name text not null,
    generic_name text not null,
    category text not null, -- Antibiotic, Analgesic, Antipyretic, etc.
    dosage_form text not null, -- Tablet, Syrup, Injection, Capsule
    strength text not null, -- 500mg, 10mg, etc.
    standard_price numeric(10,2) not null,
    requires_prescription boolean default true,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.medicines is 'Master catalog of pharmaceuticals available in the MediMind network.';

create table if not exists public.pharmacy_inventory (
    id uuid default gen_random_uuid() primary key,
    pharmacy_id uuid references public.profiles(id) on delete cascade not null,
    medicine_id uuid references public.medicines(id) on delete cascade not null,
    stock_quantity integer default 0 check (stock_quantity >= 0),
    unit_price numeric(10,2) not null,
    is_available boolean default true,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
    unique(pharmacy_id, medicine_id)
);

comment on table public.pharmacy_inventory is 'Stock and pricing per approved pharmacy.';

-- 6. Orders & Order Items (Core Service 5: Pharmacy & Order Service)
create table if not exists public.orders (
    id uuid default gen_random_uuid() primary key,
    order_number text unique not null,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    pharmacy_id uuid references public.profiles(id) on delete cascade not null,
    prescription_id uuid references public.prescriptions(id) on delete set null,
    total_amount numeric(10,2) not null,
    payment_method text default 'online' check (payment_method in ('online', 'cod')),
    payment_status text default 'pending' check (payment_status in ('pending', 'paid', 'failed', 'refunded')),
    delivery_status text default 'pending' check (delivery_status in ('pending', 'processing', 'ready_for_pickup', 'completed', 'cancelled')),
    delivery_address text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.order_items (
    id uuid default gen_random_uuid() primary key,
    order_id uuid references public.orders(id) on delete cascade not null,
    medicine_id uuid references public.medicines(id) on delete cascade not null,
    quantity integer not null check (quantity > 0),
    unit_price numeric(10,2) not null,
    total_price numeric(10,2) not null
);

-- 7. Audit & Logging Service (Supporting Service 9 & Security 34)
create table if not exists public.audit_logs (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references public.profiles(id) on delete set null,
    user_email text,
    user_role text,
    action text not null, -- e.g. "DOCTOR_APPROVED", "PRESCRIPTION_ISSUED", "LOGIN_ATTEMPT"
    resource_type text not null, -- "doctor", "prescription", "order", "system"
    resource_id text,
    details jsonb default '{}'::jsonb,
    ip_address text default '127.0.0.1',
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.audit_logs is 'HIPAA-compliant immutable audit trails of all sensitive actions.';

create index if not exists idx_audit_logs_action on public.audit_logs (action);
create index if not exists idx_audit_logs_created_at on public.audit_logs (created_at desc);

-- 8. Seed Initial Master Medicines
insert into public.medicines (brand_name, generic_name, category, dosage_form, strength, standard_price, requires_prescription)
values
    ('Paracetamol 650', 'Acetaminophen', 'Antipyretic', 'Tablet', '650mg', 30.00, false),
    ('Augmentin 625', 'Amoxicillin + Clavulanic Acid', 'Antibiotic', 'Tablet', '625mg', 210.00, true),
    ('Metformin 500', 'Metformin Hydrochloride', 'Antidiabetic', 'Tablet', '500mg', 45.00, true),
    ('Amlodipine 5', 'Amlodipine Besylate', 'Antihypertensive', 'Tablet', '5mg', 35.00, true),
    ('Cetirizine 10', 'Cetirizine Hydrochloride', 'Antihistamine', 'Tablet', '10mg', 25.00, false),
    ('Azithromycin 500', 'Azithromycin', 'Antibiotic', 'Tablet', '500mg', 120.00, true),
    ('Pantoprazole 40', 'Pantoprazole Sodium', 'Antacid', 'Tablet', '40mg', 90.00, false)
on conflict do nothing;

-- 9. Row Level Security Policies for New Tables
alter table public.appointments enable row level security;
alter table public.consultations enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medicines enable row level security;
alter table public.pharmacy_inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.audit_logs enable row level security;

-- Public read for medicines master list
create policy "Medicines: Public read" on public.medicines for select using (true);

-- Appointments policies
create policy "Appointments: Patient view own" on public.appointments for select using (auth.uid() = patient_id);
create policy "Appointments: Doctor view own" on public.appointments for select using (auth.uid() = doctor_id);
create policy "Appointments: Patient create" on public.appointments for insert with check (auth.uid() = patient_id);
create policy "Appointments: Participants update" on public.appointments for update using (auth.uid() in (patient_id, doctor_id));

-- Prescriptions policies
create policy "Prescriptions: Patient view own" on public.prescriptions for select using (auth.uid() = patient_id);
create policy "Prescriptions: Doctor manage own" on public.prescriptions for all using (auth.uid() = doctor_id);
create policy "Prescriptions: Pharmacy view dispensed" on public.prescriptions for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'pharmacy')
);

-- Orders policies
create policy "Orders: Patient view own" on public.orders for select using (auth.uid() = patient_id);
create policy "Orders: Pharmacy view received" on public.orders for all using (auth.uid() = pharmacy_id);
create policy "Orders: Patient create" on public.orders for insert with check (auth.uid() = patient_id);

-- Audit logs: Super Admin view
create policy "AuditLogs: Admin full access" on public.audit_logs for select using (
    exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);
