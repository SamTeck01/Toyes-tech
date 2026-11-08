-- The owner account is created only via the staff-admin function. Nobody may claim it directly.
revoke execute on function public.claim_super_admin(text, text) from authenticated, anon, public;
