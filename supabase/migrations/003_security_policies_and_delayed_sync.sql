create or replace function public.mark_delayed_execution_records()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  updated_count integer;
begin
  update public.execution_record
  set status = '지연'
  where status <> '완료'
    and due_date < date_trunc('month', now())::date
    and status <> '지연';

  get diagnostics updated_count = row_count;
  return updated_count;
end;
$$;

grant execute on function public.mark_delayed_execution_records() to authenticated, service_role;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_activity_master_frequency'
  ) then
    alter table public.activity_master
      add constraint chk_activity_master_frequency
      check (frequency in ('수시', '월간', '분기', '반기', '연 1회'));
  end if;
end;
$$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'chk_execution_record_status'
  ) then
    alter table public.execution_record
      add constraint chk_execution_record_status
      check (status in ('예약', '진행중', '완료', '지연'));
  end if;
end;
$$;

create index if not exists idx_execution_record_due_date on public.execution_record (due_date);
create index if not exists idx_execution_record_status on public.execution_record (status);
create index if not exists idx_execution_record_activity_master_id on public.execution_record (activity_master_id);
create index if not exists idx_evidence_file_execution_record_id on public.evidence_file (execution_record_id);

alter table public.activity_master enable row level security;
alter table public.execution_record enable row level security;
alter table public.evidence_file enable row level security;

drop policy if exists "activity_master_authenticated_select" on public.activity_master;
drop policy if exists "activity_master_authenticated_insert" on public.activity_master;
drop policy if exists "activity_master_authenticated_update" on public.activity_master;
drop policy if exists "activity_master_authenticated_delete" on public.activity_master;

create policy "activity_master_authenticated_select"
  on public.activity_master
  for select
  to authenticated
  using (true);

create policy "activity_master_authenticated_insert"
  on public.activity_master
  for insert
  to authenticated
  with check (true);

create policy "activity_master_authenticated_update"
  on public.activity_master
  for update
  to authenticated
  using (true)
  with check (true);

create policy "activity_master_authenticated_delete"
  on public.activity_master
  for delete
  to authenticated
  using (true);

drop policy if exists "execution_record_authenticated_select" on public.execution_record;
drop policy if exists "execution_record_authenticated_insert" on public.execution_record;
drop policy if exists "execution_record_authenticated_update" on public.execution_record;
drop policy if exists "execution_record_authenticated_delete" on public.execution_record;

create policy "execution_record_authenticated_select"
  on public.execution_record
  for select
  to authenticated
  using (true);

create policy "execution_record_authenticated_insert"
  on public.execution_record
  for insert
  to authenticated
  with check (true);

create policy "execution_record_authenticated_update"
  on public.execution_record
  for update
  to authenticated
  using (true)
  with check (true);

create policy "execution_record_authenticated_delete"
  on public.execution_record
  for delete
  to authenticated
  using (true);

drop policy if exists "evidence_file_authenticated_select" on public.evidence_file;
drop policy if exists "evidence_file_authenticated_insert" on public.evidence_file;
drop policy if exists "evidence_file_authenticated_update" on public.evidence_file;
drop policy if exists "evidence_file_authenticated_delete" on public.evidence_file;

create policy "evidence_file_authenticated_select"
  on public.evidence_file
  for select
  to authenticated
  using (true);

create policy "evidence_file_authenticated_insert"
  on public.evidence_file
  for insert
  to authenticated
  with check (true);

create policy "evidence_file_authenticated_update"
  on public.evidence_file
  for update
  to authenticated
  using (true)
  with check (true);

create policy "evidence_file_authenticated_delete"
  on public.evidence_file
  for delete
  to authenticated
  using (true);

insert into storage.buckets (id, name, public)
values ('evidence-files', 'evidence-files', false)
on conflict (id) do nothing;

drop policy if exists "evidence_files_authenticated_select" on storage.objects;
drop policy if exists "evidence_files_authenticated_insert" on storage.objects;
drop policy if exists "evidence_files_authenticated_update" on storage.objects;
drop policy if exists "evidence_files_authenticated_delete" on storage.objects;

create policy "evidence_files_authenticated_select"
  on storage.objects
  for select
  to authenticated
  using (bucket_id = 'evidence-files');

create policy "evidence_files_authenticated_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'evidence-files');

create policy "evidence_files_authenticated_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'evidence-files')
  with check (bucket_id = 'evidence-files');

create policy "evidence_files_authenticated_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'evidence-files');
