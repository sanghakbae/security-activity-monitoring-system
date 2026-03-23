create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;

create or replace function public.invoke_send_delayed_alert()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://gfybyxbrmkwbzuyhyqiv.supabase.co/functions/v1/send-delayed-alert',
    headers := jsonb_build_object('Content-Type', 'application/json'),
    body := '{}'::jsonb
  );
end;
$$;

grant execute on function public.invoke_send_delayed_alert() to postgres;

do $$
declare
  existing_job_id bigint;
begin
  select jobid
    into existing_job_id
  from cron.job
  where jobname = 'send-delayed-alert-every-5m';

  if existing_job_id is not null then
    perform cron.unschedule(existing_job_id);
  end if;

  perform cron.schedule(
    'send-delayed-alert-every-5m',
    '*/5 * * * *',
    'select public.invoke_send_delayed_alert();'
  );
end;
$$;
