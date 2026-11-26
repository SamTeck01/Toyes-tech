-- Test alert text now talks about email (alerts moved from WhatsApp to email).
create or replace function public.queue_test_alert() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can send test alerts'; end if;
  insert into public.notifications (kind, message)
  values ('sale', E'✅ Test from Toyes Tech POS\nEmail alerts are working. You will get an email like this for the alerts you chose.');
end $$;
