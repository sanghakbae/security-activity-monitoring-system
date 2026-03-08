create or replace function public.sync_execution_record_from_activity_master()
returns trigger
language plpgsql
as $$
begin
  update public.execution_record
  set
    owner_department = new.owner_department,
    partner_department = new.partner_department,
    frequency_label = new.frequency,
    title = new.name,
    description = new.purpose
  where activity_master_id = new.id;

  return new;
end;
$$;

drop trigger if exists trg_sync_execution_record_from_activity_master on public.activity_master;

create trigger trg_sync_execution_record_from_activity_master
after update of name, owner_department, partner_department, frequency, purpose
on public.activity_master
for each row
execute function public.sync_execution_record_from_activity_master();