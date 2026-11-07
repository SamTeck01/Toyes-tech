-- Scheduled jobs:
--  * every minute: send any queued WhatsApp alerts (safety net if no till triggers it)
--  * 21:00 Lagos time (20:00 UTC): end-of-day summary for every store
-- The function URL and service key are read from Supabase Vault at run time, so nothing secret
-- lives in this file. At go-live, store them once (see docs/GO_LIVE.md):
--   select vault.create_secret('https://<project-ref>.supabase.co', 'project_url');
--   select vault.create_secret('<service_role key>', 'service_role_key');
create extension if not exists pg_cron;
create extension if not exists pg_net;

create or replace function public.call_notify(p_summary boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare v_url text; v_key text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_key from vault.decrypted_secrets where name = 'service_role_key';
  if v_url is null or v_key is null then return; end if; -- not configured yet: do nothing
  perform net.http_post(
    url := v_url || '/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || v_key),
    body := jsonb_build_object('summary', p_summary)
  );
end $$;

revoke execute on function public.call_notify from anon, authenticated, public;

select cron.unschedule(jobname) from cron.job where jobname in ('toyes-send-alerts', 'toyes-daily-summary');
select cron.schedule('toyes-send-alerts', '* * * * *', $$select public.call_notify(false)$$);
select cron.schedule('toyes-daily-summary', '0 20 * * *', $$select public.call_notify(true)$$);
