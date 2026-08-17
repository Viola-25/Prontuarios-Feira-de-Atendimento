-- ============================================================
-- Migration inicial - Feira de Saúde - São Camilo
-- Idempotente: pode rodar mesmo se objetos já existirem.
-- ============================================================

create extension if not exists "pgcrypto";

-- ---------- TABELAS ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'doctor'))
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document_id text,
  birth_date date,
  phone text
);

create table if not exists public.medical_records (
  id uuid primary key default gen_random_uuid(),
  patient_id uuid not null references public.patients (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  doctor_id uuid references public.profiles (id) on delete set null,
  anamnesis text,
  physical_exam text,
  management_plan text,
  status text not null default 'pending' check (status in ('pending', 'completed')),
  created_at timestamptz not null default now()
);

-- ---------- ÍNDICES ----------
create index if not exists medical_records_patient_id_idx on public.medical_records (patient_id);
create index if not exists medical_records_student_id_idx on public.medical_records (student_id);
create index if not exists medical_records_doctor_id_idx on public.medical_records (doctor_id);
create index if not exists medical_records_status_idx on public.medical_records (status);
create index if not exists patients_document_id_idx on public.patients (document_id);

-- Garante no banco que cada aluno tenha no máximo um prontuário ativo (pending).
create unique index if not exists medical_records_one_pending_per_student
  on public.medical_records (student_id)
  where status = 'pending';

-- ---------- FUNÇÕES ----------
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce(new.raw_user_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------- RLS ----------
alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.medical_records enable row level security;

-- PROFILES
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.get_my_role() = 'doctor');

drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role is not distinct from (select role from public.profiles where id = auth.uid())
  );

-- PATIENTS
drop policy if exists "patients_select_all" on public.patients;
create policy "patients_select_all"
  on public.patients for select
  to authenticated
  using (true);

drop policy if exists "patients_insert_student" on public.patients;
create policy "patients_insert_student"
  on public.patients for insert
  to authenticated
  with check (public.get_my_role() = 'student');

-- MEDICAL_RECORDS
drop policy if exists "records_select_student_own" on public.medical_records;
create policy "records_select_student_own"
  on public.medical_records for select
  to authenticated
  using (public.get_my_role() = 'student' and student_id = auth.uid());

drop policy if exists "records_select_doctor_all" on public.medical_records;
create policy "records_select_doctor_all"
  on public.medical_records for select
  to authenticated
  using (public.get_my_role() = 'doctor');

drop policy if exists "records_insert_student_pending" on public.medical_records;
create policy "records_insert_student_pending"
  on public.medical_records for insert
  to authenticated
  with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and doctor_id is null
    and status = 'pending'
  );

drop policy if exists "records_update_student_pending" on public.medical_records;
create policy "records_update_student_pending"
  on public.medical_records for update
  to authenticated
  using (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and status = 'pending'
  )
  with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and doctor_id is null
    and status = 'pending'
  );

drop policy if exists "records_update_doctor_complete" on public.medical_records;
create policy "records_update_doctor_complete"
  on public.medical_records for update
  to authenticated
  using (public.get_my_role() = 'doctor')
  with check (
    public.get_my_role() = 'doctor'
    and status = 'completed'
    and management_plan is not null
    and length(trim(management_plan)) > 0
  );

-- Função SECURITY DEFINER: finalização estrita pelo médico
create or replace function public.doctor_complete_record(
  record_id uuid,
  plan_text text
)
returns void
language sql
security definer
set search_path = public
as $$
  update public.medical_records
  set management_plan = plan_text,
      status = 'completed',
      doctor_id = auth.uid()
  where id = record_id
    and exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'doctor'
    )
    and status = 'pending';
$$;

-- ---------- GRANTS ----------
grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert on public.patients to authenticated;
grant select, insert, update on public.medical_records to authenticated;

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.doctor_complete_record(uuid, text) to authenticated;