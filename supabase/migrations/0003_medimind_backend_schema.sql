-- 1. Extend public.profiles Table
-- Add full_name and deleted_at to profiles if they do not exist
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists deleted_at timestamp with time zone;

-- Update existing records to populate full_name from name if empty
update public.profiles set full_name = name where full_name is null and name is not null;

comment on table public.profiles is 'Stores user profile information, extending auth.users 1:1.';

-- 2. Create updated_at trigger function
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = timezone('utc'::text, now());
    return new;
end;
$$ language plpgsql;

-- Bind updated_at trigger to profiles if not already bound
do $$
begin
    if not exists (select 1 from pg_trigger where tgname = 'tr_profiles_updated_at') then
        create trigger tr_profiles_updated_at
            before update on public.profiles
            for each row execute procedure public.update_updated_at_column();
    end if;
end;
$$;

-- 3. Redefine handle_new_user trigger function to map both full_name and name
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (
        id, 
        email, 
        name, 
        full_name,
        role, 
        age, 
        gender, 
        bmi, 
        blood_sugar, 
        bp_systolic, 
        bp_diastolic, 
        smoking, 
        license_number, 
        mobile, 
        abha_id, 
        specialist, 
        clinic_id
    )
    values (
        new.id,
        new.email,
        coalesce(new.raw_user_meta_data->>'name', new.raw_user_meta_data->>'full_name', ''),
        coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
        coalesce(new.raw_user_meta_data->>'role', 'patient'),
        coalesce((new.raw_user_meta_data->>'age')::integer, 30),
        coalesce(new.raw_user_meta_data->>'gender', 'Male'),
        coalesce((new.raw_user_meta_data->>'bmi')::float, 22.0),
        coalesce((new.raw_user_meta_data->>'blood_sugar')::float, 100.0),
        coalesce((new.raw_user_meta_data->>'bp_systolic')::float, 120.0),
        coalesce((new.raw_user_meta_data->>'bp_diastolic')::float, 80.0),
        coalesce((new.raw_user_meta_data->>'smoking')::integer, 0),
        coalesce(new.raw_user_meta_data->>'license_number', ''),
        coalesce(new.raw_user_meta_data->>'mobile', ''),
        coalesce(new.raw_user_meta_data->>'abha_id', ''),
        coalesce(new.raw_user_meta_data->>'specialist', 'General Physician'),
        new.raw_user_meta_data->>'clinic_id'
    );
    return new;
end;
$$ language plpgsql security definer;

-- 4. Create Symptom Logs Table
create table if not exists public.symptom_logs (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    symptoms text[] not null check (cardinality(symptoms) > 0),
    logged_at timestamp with time zone default timezone('utc'::text, now()) not null,
    deleted_at timestamp with time zone,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.symptom_logs is 'Logs of patient-submitted symptoms for diagnostics.';

create trigger tr_symptom_logs_updated_at
    before update on public.symptom_logs
    for each row execute procedure public.update_updated_at_column();

-- 5. Recreate Predictions Table
drop table if exists public.predictions cascade;
create table public.predictions (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    symptom_log_id uuid references public.symptom_logs(id) on delete cascade not null,
    disease text not null,
    probability numeric(5,2) not null check (probability >= 0.00 and probability <= 100.00),
    confidence_tag text not null check (confidence_tag in ('High', 'Medium', 'Low')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    deleted_at timestamp with time zone
);

comment on table public.predictions is 'AI-generated disease prediction results for patient symptom logs.';

-- 6. Create Specialists Registry Table
create table if not exists public.specialists (
    id uuid default gen_random_uuid() primary key,
    disease text unique not null,
    specialist_type text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

comment on table public.specialists is 'Static registry mapping diseases to medical specialist types.';

create trigger tr_specialists_updated_at
    before update on public.specialists
    for each row execute procedure public.update_updated_at_column();

-- 7. Recreate Chat History Table
drop table if exists public.chat_history cascade;
create table public.chat_history (
    id uuid default gen_random_uuid() primary key,
    profile_id uuid references public.profiles(id) on delete cascade not null,
    role text not null check (role in ('user', 'assistant')),
    message text not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    deleted_at timestamp with time zone
);

comment on table public.chat_history is 'Sequential chat message logs between patients and the AI assistant.';

-- 8. Add Indexes
create index if not exists idx_profiles_created_at on public.profiles (created_at);

create index if not exists idx_symptom_logs_profile_id on public.symptom_logs (profile_id);
create index if not exists idx_symptom_logs_logged_at on public.symptom_logs (logged_at);

create index if not exists idx_predictions_profile_id on public.predictions (profile_id);
create index if not exists idx_predictions_symptom_log_id on public.predictions (symptom_log_id);
create index if not exists idx_predictions_created_at on public.predictions (created_at);

create index if not exists idx_chat_history_profile_id on public.chat_history (profile_id);
create index if not exists idx_chat_history_created_at on public.chat_history (created_at);

-- 9. Row Level Security (RLS) Configuration

-- Enable RLS on every table
alter table public.profiles enable row level security;
alter table public.symptom_logs enable row level security;
alter table public.predictions enable row level security;
alter table public.specialists enable row level security;
alter table public.chat_history enable row level security;

-- Profiles Policies
drop policy if exists "Users can view their own profile" on public.profiles;
drop policy if exists "Users can update their own profile" on public.profiles;
drop policy if exists "Doctors can view patient profiles" on public.profiles;

create policy "Profiles: Users can SELECT own non-deleted profile"
    on public.profiles for select
    using (auth.uid() = id and deleted_at is null);

create policy "Profiles: Users can UPDATE own non-deleted profile"
    on public.profiles for update
    using (auth.uid() = id and deleted_at is null);

create policy "Profiles: Doctors can SELECT patient profiles"
    on public.profiles for select
    using (
        exists (
            select 1 from public.profiles 
            where id = auth.uid() and role = 'doctor' and deleted_at is null
        )
        and deleted_at is null
    );

-- Symptom Logs Policies
create policy "Symptom Logs: Users can SELECT own non-deleted logs"
    on public.symptom_logs for select
    using (auth.uid() = profile_id and deleted_at is null);

create policy "Symptom Logs: Users can INSERT own logs if email confirmed"
    on public.symptom_logs for insert
    with check (
        auth.uid() = profile_id 
        and (select email_confirmed_at from auth.users where id = auth.uid()) is not null
    );

create policy "Symptom Logs: Users can UPDATE own non-deleted logs"
    on public.symptom_logs for update
    using (auth.uid() = profile_id and deleted_at is null);

-- Predictions Policies
create policy "Predictions: Users can SELECT own non-deleted predictions"
    on public.predictions for select
    using (auth.uid() = profile_id and deleted_at is null);

-- Specialists Policies (Public read-only, write restricted to service_role)
create policy "Specialists: Public read-only SELECT"
    on public.specialists for select
    using (true);

-- Chat History Policies
create policy "Chat History: Users can SELECT own non-deleted chat"
    on public.chat_history for select
    using (auth.uid() = profile_id and deleted_at is null);

create policy "Chat History: Users can INSERT own chat message"
    on public.chat_history for insert
    with check (auth.uid() = profile_id);

create policy "Chat History: Users can UPDATE own non-deleted chat"
    on public.chat_history for update
    using (auth.uid() = profile_id and deleted_at is null);

-- 10. Private Storage Bucket for Medical Reports

-- Set up private bucket 'medical-reports'
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('medical-reports', 'medical-reports', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png'])
on conflict (id) do nothing;

-- Enable RLS on storage.objects
alter table storage.objects enable row level security;

-- Storage Policies (Users can only read/write files under their own uuid/ folder)
drop policy if exists "Storage: Allow users to upload to own folder" on storage.objects;
drop policy if exists "Storage: Allow users to read from own folder" on storage.objects;

create policy "Storage: Allow users to upload to own folder"
    on storage.objects for insert
    with check (
        bucket_id = 'medical-reports'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "Storage: Allow users to read from own folder"
    on storage.objects for select
    using (
        bucket_id = 'medical-reports'
        and auth.role() = 'authenticated'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
