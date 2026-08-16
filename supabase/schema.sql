-- ============================================================
-- Feira de Saúde - São Camilo | Schema do Supabase (PostgreSQL)
-- Tabelas: profiles, patients, medical_records
-- RLS: alunos criam pacientes e registros 'pending';
--      médicos leem tudo e finalizam registros.
-- ============================================================

-- Extensões úteis (gen_random_uuid nativo no Postgres 13+; pgcrypto é redundância segura)
create extension if not exists "pgcrypto";

-- ============================================================
-- 1. PROFILES
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  role text not null default 'student' check (role in ('student', 'doctor'))
);

-- ============================================================
-- 2. PATIENTS
-- ============================================================
create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  document_id text,
  birth_date date,
  phone text
);

-- ============================================================
-- 3. MEDICAL_RECORDS
-- ============================================================
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

-- Índices
create index if not exists medical_records_patient_id_idx on public.medical_records (patient_id);
create index if not exists medical_records_student_id_idx on public.medical_records (student_id);
create index if not exists medical_records_doctor_id_idx on public.medical_records (doctor_id);
create index if not exists medical_records_status_idx on public.medical_records (status);
create index if not exists patients_document_id_idx on public.patients (document_id);

-- Garante no banco que cada aluno tenha no máximo um prontuário ativo (pending).
-- Se o aluno tentar inserir um segundo 'pending', o INSERT falha com
-- unique violation (código 23505).
create unique index if not exists medical_records_one_pending_per_student
  on public.medical_records (student_id)
  where status = 'pending';

-- ============================================================
-- Helper: papel do usuário autenticado
-- ============================================================
create or replace function public.get_my_role()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid()
$$;

-- ============================================================
-- Trigger: cria o profile automaticamente no signup
-- ============================================================
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

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- ---------- PROFILES ----------
alter table public.profiles enable row level security;

-- Cada usuário lê/edita o próprio profile; médico lê todos
-- (necessário para ver o nome do aluno responsável no atendimento).
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (id = auth.uid() or public.get_my_role() = 'doctor');

create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (id = auth.uid())
  with check (
    id = auth.uid()
    and role is not distinct from (select role from public.profiles where id = auth.uid())
  );

-- ---------- PATIENTS ----------
alter table public.patients enable row level security;

-- Alunos e médicos podem listar pacientes (fluxo compartilhado da feira).
create policy "patients_select_all"
  on public.patients for select
  to authenticated
  using (true);

-- Somente alunos inserem pacientes.
create policy "patients_insert_student"
  on public.patients for insert
  to authenticated
  with check (public.get_my_role() = 'student');

-- ---------- MEDICAL_RECORDS ----------
alter table public.medical_records enable row level security;

-- Leitura: aluno lê os próprios registros; médico lê todos.
create policy "records_select_student_own"
  on public.medical_records for select
  to authenticated
  using (public.get_my_role() = 'student' and student_id = auth.uid());

create policy "records_select_doctor_all"
  on public.medical_records for select
  to authenticated
  using (public.get_my_role() = 'doctor');

-- Inserção: somente aluno, registro próprio e sempre 'pending'.
create policy "records_insert_student_pending"
  on public.medical_records for insert
  to authenticated
  with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and doctor_id is null
    and status = 'pending'
  );

-- Edição: aluno edita apenas os próprios registros ainda 'pending'
-- e não pode alterar o status (o WITH CHECK garante que siga 'pending').
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

-- Edição: médico atualiza registros; o resultado deve estar 'completed'
-- com um plano de conduta preenchido.
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

-- ============================================================
-- Função SECURITY DEFINER: finalização estrita pelo médico
-- O RLS é por linha; para restringir a ÚNICOS colunas
-- (management_plan e status), usa-se função security definer
-- (padrão Supabase). O médico não pode alterar outras colunas.
-- ============================================================
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

-- ============================================================
-- GRANTS (Supabase: cliente autenticado)
-- ============================================================
grant usage on schema public to authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert on public.patients to authenticated;
grant select, insert, update on public.medical_records to authenticated;

grant execute on function public.get_my_role() to authenticated;
grant execute on function public.doctor_complete_record(uuid, text) to authenticated;