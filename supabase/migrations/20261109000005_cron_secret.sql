-- The scheduler authenticates to the notify function with a random secret the database generates
-- and keeps in Vault, so no human ever has to copy a service key.
do $$ begin
  if not exists (select 1 from vault.secrets where name = 'cron_secret') then
    perform vault.create_secret(encode(extensions.gen_random_bytes(32), 'hex'), 'cron_secret');
  end if;
  if not exists (select 1 from vault.secrets where name = 'project_url') then
    perform vault.create_secret('https://iycilijqpphnnuxngxgn.supabase.co', 'project_url');
  end if;
end $$;

create or replace function public.check_cron_secret(p text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from vault.decrypted_secrets where name = 'cron_secret' and decrypted_secret = p)
$$;
revoke execute on function public.check_cron_secret(text) from anon, authenticated, public;
grant execute on function public.check_cron_secret(text) to service_role;

create or replace function public.call_notify(p_summary boolean default false) returns void
language plpgsql security definer set search_path = public as $$
declare v_url text; v_secret text;
begin
  select decrypted_secret into v_url from vault.decrypted_secrets where name = 'project_url';
  select decrypted_secret into v_secret from vault.decrypted_secrets where name = 'cron_secret';
  if v_url is null or v_secret is null then return; end if;
  perform net.http_post(
    url := v_url || '/functions/v1/notify',
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-cron-secret', v_secret),
    body := jsonb_build_object('summary', p_summary)
  );
end $$;
revoke execute on function public.call_notify from anon, authenticated, public;
