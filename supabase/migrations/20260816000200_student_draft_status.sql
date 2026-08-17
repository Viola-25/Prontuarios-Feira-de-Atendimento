-- ============================================================
-- Migration: status 'draft' + cancelamento do chamado do preceptor
-- O aluno só pode editar um prontuário 'draft' (rascunho). Um
-- prontuário 'pending' (enviado ao preceptor) fica somente leitura:
-- para atualizar, o aluno cancela o chamado (volta para 'draft'),
-- edita e reenviar para 'pending'.
-- Idempotente.
-- ============================================================

-- 1. Status aceita 'draft'
alter table public.medical_records drop constraint if exists medical_records_status_check;
alter table public.medical_records
  add constraint medical_records_status_check
  check (status in ('draft', 'pending', 'completed'));

-- 2. Máximo um prontuário ativo por aluno (draft OU pending)
drop index if exists medical_records_one_pending_per_student;
create unique index medical_records_one_pending_per_student
  on public.medical_records (student_id)
  where status in ('draft', 'pending');

-- 3. RLS: aluno edita apenas 'draft'
drop policy if exists "records_update_student_pending" on public.medical_records;
drop policy if exists "records_update_student_draft" on public.medical_records;
create policy "records_update_student_draft"
  on public.medical_records for update
  to authenticated
  using (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and status = 'draft'
  )
  with check (
    public.get_my_role() = 'student'
    and student_id = auth.uid()
    and doctor_id is null
    and status in ('draft', 'pending')
  );

-- 4. Função: aluno cancela o chamado do preceptor (pending -> draft)
create or replace function public.student_cancel_pending(record_id uuid)
returns void
language sql
security definer
set search_path = public
as $$
  update public.medical_records
  set status = 'draft'
  where id = record_id
    and student_id = auth.uid()
    and doctor_id is null
    and status = 'pending';
$$;

grant execute on function public.student_cancel_pending(uuid) to authenticated;

-- 5. Função do médico agora falha com erro claro se o registro saiu do
-- estado 'pending' (aluno cancelou o chamado) ou se o plano está vazio,
-- em vez de atualizar 0 linhas silenciosamente (falso "sucesso").
create or replace function public.doctor_complete_record(
  record_id uuid,
  plan_text text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_rows int;
begin
  if plan_text is null or length(trim(plan_text)) = 0 then
    raise exception 'O plano de conduta é obrigatório.';
  end if;

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

  get diagnostics updated_rows = row_count;

  if updated_rows = 0 then
    raise exception 'Atendimento indisponível (foi cancelado ou já finalizado pelo preceptor).';
  end if;
end;
$$;

grant execute on function public.doctor_complete_record(uuid, text) to authenticated;