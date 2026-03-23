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
