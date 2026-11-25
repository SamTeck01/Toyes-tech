-- Staff emails are private: only the owner (all) and managers (their own store) can see them, via staff_emails().
revoke select on public.staff from authenticated;
grant select (id, full_name, username, role, store_id, pin_hash, active, created_at) on public.staff to authenticated;

create or replace function public.staff_emails() returns table (id uuid, email text)
language sql stable security definer set search_path = public as $$
  select s.id, s.email from public.staff s
  where s.id = auth.uid() or public.is_super_admin() or (s.store_id is not null and public.can_manage_store(s.store_id));
$$;
revoke execute on function public.staff_emails() from anon, public;
grant execute on function public.staff_emails() to authenticated;
