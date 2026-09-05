-- 1. Create Clinics Table
create table public.clinics (
    id text primary key,
    name text not null,
    speciality text not null,
    location text not null,
    rating float default 4.5
);

-- Enable RLS for clinics
alter table public.clinics enable row level security;
create policy "Allow public read access to clinics" on public.clinics for select using (true);

-- 2. Create Profiles Table (extends auth.users)
create table public.profiles (
    id uuid references auth.users on delete cascade primary key,
    email text unique not null,
    name text,
    role text default 'patient' check (role in ('patient', 'doctor')),
    age integer default 30,
    gender text default 'Male',
    bmi float default 22.0,
    blood_sugar float default 100.0,
    bp_systolic float default 120.0,
    bp_diastolic float default 80.0,
    smoking integer default 0,
    license_number text default '',
    mobile text default '',
    abha_id text default '',
    specialist text default 'General Physician',
    clinic_id text references public.clinics(id) on delete set null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for profiles
alter table public.profiles enable row level security;

create policy "Users can view their own profile" 
    on public.profiles for select 
    using (auth.uid() = id);

create policy "Users can update their own profile" 
    on public.profiles for update 
    using (auth.uid() = id);

create policy "Doctors can view patient profiles" 
    on public.profiles for select 
    using (
        exists (
            select 1 from public.profiles where id = auth.uid() and role = 'doctor'
        )
    );

-- Trigger to sync profile creation on user signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
    insert into public.profiles (
        id, 
        email, 
        name, 
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
        coalesce(new.raw_user_meta_data->>'name', ''),
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

create trigger on_auth_user_created
    after insert on auth.users
    for each row execute procedure public.handle_new_user();

-- 3. Create Appointments Table
create table public.appointments (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    clinic_id text references public.clinics(id) on delete cascade not null,
    date timestamp with time zone not null,
    status text default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled')),
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.appointments enable row level security;

create policy "Users can view their own appointments" 
    on public.appointments for select 
    using (auth.uid() = patient_id or exists (
        select 1 from public.profiles where id = auth.uid() and role = 'doctor' and clinic_id = appointments.clinic_id
    ));

create policy "Users can insert their own appointments" 
    on public.appointments for insert 
    with check (auth.uid() = patient_id);

-- 4. Create Queues Table
create table public.queues (
    id uuid default gen_random_uuid() primary key,
    clinic_id text references public.clinics(id) on delete cascade unique not null,
    current_number integer default 0,
    waiting_list integer[] default '{}'::integer[]
);

alter table public.queues enable row level security;
create policy "Allow read access to queues" on public.queues for select using (true);
create policy "Allow clinic updates to queues" on public.queues for update using (true);

-- 5. Create Chat History Table
create table public.chat_history (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.profiles(id) on delete cascade unique not null,
    messages jsonb default '[]'::jsonb,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.chat_history enable row level security;
create policy "Users can view their own chat history" on public.chat_history for select using (auth.uid() = patient_id);
create policy "Users can update their own chat history" on public.chat_history for update using (auth.uid() = patient_id);
create policy "Users can insert their own chat history" on public.chat_history for insert with check (auth.uid() = patient_id);
