-- Lets the owner queue a test WhatsApp message from the admin.
create or replace function public.queue_test_alert() returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can send test alerts'; end if;
  insert into public.notifications (kind, message)
  values ('sale', E'✅ Test from Toyes Tech POS\nWhatsApp alerts are working. You will get a message like this for every sale.');
end $$;

revoke execute on function public.queue_test_alert from anon, public;
grant execute on function public.queue_test_alert to authenticated;
