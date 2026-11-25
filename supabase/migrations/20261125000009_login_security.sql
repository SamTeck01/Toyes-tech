-- Staff can have a real email (optional). Sign-in accepts the username or that email.
alter table public.staff add column if not exists email text;
create unique index if not exists staff_email_unique on public.staff (lower(email)) where email is not null;

-- Wrong-password lockout, used only by the login function (service role). No one else can read or write it.
create table if not exists public.login_attempts (
  login text primary key,
  fails int not null default 0,
  locked_until timestamptz,
  updated_at timestamptz not null default now()
);
alter table public.login_attempts enable row level security;
revoke all on public.login_attempts from anon, authenticated;
