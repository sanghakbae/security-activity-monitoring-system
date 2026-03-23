alter table public.evidence_file enable row level security;

do $$
declare
  policy_record record;
begin
  for policy_record in
    select policyname
    from pg_policies
    where schemaname = 'public'
      and tablename = 'evidence_file'
  loop
    execute format('drop policy if exists %I on public.evidence_file', policy_record.policyname);
  end loop;
end;
$$;

create policy "evidence_file_authenticated_select"
  on public.evidence_file
  for select
  to authenticated
  using (auth.role() = 'authenticated');

create policy "evidence_file_authenticated_insert"
  on public.evidence_file
  for insert
  to authenticated
  with check (auth.role() = 'authenticated');

create policy "evidence_file_authenticated_update"
  on public.evidence_file
  for update
  to authenticated
  using (auth.role() = 'authenticated')
  with check (auth.role() = 'authenticated');

create policy "evidence_file_authenticated_delete"
  on public.evidence_file
  for delete
  to authenticated
  using (auth.role() = 'authenticated');

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
  using (bucket_id = 'evidence-files' and auth.role() = 'authenticated');

create policy "evidence_files_authenticated_insert"
  on storage.objects
  for insert
  to authenticated
  with check (bucket_id = 'evidence-files' and auth.role() = 'authenticated');

create policy "evidence_files_authenticated_update"
  on storage.objects
  for update
  to authenticated
  using (bucket_id = 'evidence-files' and auth.role() = 'authenticated')
  with check (bucket_id = 'evidence-files' and auth.role() = 'authenticated');

create policy "evidence_files_authenticated_delete"
  on storage.objects
  for delete
  to authenticated
  using (bucket_id = 'evidence-files' and auth.role() = 'authenticated');
