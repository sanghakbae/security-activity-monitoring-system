create table if not exists public.security_setting (
  id uuid primary key default gen_random_uuid(),
  allowed_email_domain text not null default 'muhayu.com',
  session_timeout_minutes integer not null default 60,
  google_chat_alert_times text[] not null default array['14:00', '19:00'],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint chk_security_setting_session_timeout
    check (session_timeout_minutes >= 5 and session_timeout_minutes <= 10080)
);

create or replace function public.set_updated_at_security_setting()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_set_updated_at_security_setting on public.security_setting;

create trigger trg_set_updated_at_security_setting
before update on public.security_setting
for each row
execute function public.set_updated_at_security_setting();

insert into public.security_setting (
  allowed_email_domain,
  session_timeout_minutes,
  google_chat_alert_times
)
select
  'muhayu.com',
  60,
  array['14:00', '19:00']
where not exists (
  select 1 from public.security_setting
);

alter table public.security_setting enable row level security;

drop policy if exists "security_setting_authenticated_select" on public.security_setting;
drop policy if exists "security_setting_authenticated_insert" on public.security_setting;
drop policy if exists "security_setting_authenticated_update" on public.security_setting;

create policy "security_setting_authenticated_select"
  on public.security_setting
  for select
  to authenticated
  using (true);

create policy "security_setting_authenticated_insert"
  on public.security_setting
  for insert
  to authenticated
  with check (true);

create policy "security_setting_authenticated_update"
  on public.security_setting
  for update
  to authenticated
  using (true)
  with check (true);
