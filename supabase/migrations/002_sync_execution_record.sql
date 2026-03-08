create or replace function public.sync_execution_record_from_activity_master()
returns trigger
language plpgsql
as $$
begin
  update public.execution_record
  set
    frequency_label = new.frequency,
    department = new.department,
    title = new.name
  where activity_master_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_sync_execution_record_from_activity_master
on public.activity_master;

create trigger trg_sync_execution_record_from_activity_master
after update of name, department, frequency
on public.activity_master
for each row
execute function public.sync_execution_record_from_activity_master();