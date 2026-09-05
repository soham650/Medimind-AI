-- 1. Create Predictions Table
create table public.predictions (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    date timestamp with time zone default timezone('utc'::text, now()) not null,
    symptoms text[] not null,
    predicted_disease text not null,
    probability float not null,
    reliability text not null,
    specialist text not null,
    caution text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for predictions
alter table public.predictions enable row level security;

create policy "Users can view their own predictions" 
    on public.predictions for select 
    using (auth.uid() = patient_id);

create policy "Users can insert their own predictions" 
    on public.predictions for insert 
    with check (auth.uid() = patient_id);

create policy "Doctors can view patient predictions" 
    on public.predictions for select 
    using (
        exists (
            select 1 from public.profiles where id = auth.uid() and role = 'doctor'
        )
    );

-- 2. Create Reports Table
create table public.reports (
    id uuid default gen_random_uuid() primary key,
    patient_id uuid references public.profiles(id) on delete cascade not null,
    file_name text not null,
    upload_date timestamp with time zone default timezone('utc'::text, now()) not null,
    parsed_data jsonb not null,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for reports
alter table public.reports enable row level security;

create policy "Users can view their own reports" 
    on public.reports for select 
    using (auth.uid() = patient_id);

create policy "Users can insert their own reports" 
    on public.reports for insert 
    with check (auth.uid() = patient_id);

create policy "Doctors can view patient reports" 
    on public.reports for select 
    using (
        exists (
            select 1 from public.profiles where id = auth.uid() and role = 'doctor'
        )
    );
