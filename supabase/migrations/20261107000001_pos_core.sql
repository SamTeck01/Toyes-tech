-- Toyes Tech multi-store POS: core schema, security (RLS) and money-handling functions.
-- Every write that touches money or stock goes through a SECURITY DEFINER function so it runs
-- in one transaction with permission checks. Clients can read (per RLS) but never write tables directly.

create extension if not exists pgcrypto;

-- ───────────────────────── Types ─────────────────────────
do $$ begin
  create type public.staff_role as enum ('super_admin', 'manager', 'cashier');
exception when duplicate_object then null; end $$;

-- ───────────────────────── Tables ─────────────────────────
create table if not exists public.stores (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[A-Z0-9]{2,6}$'),
  name text not null,
  address text,
  phone text,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null,
  username text not null unique,
  role public.staff_role not null,
  store_id uuid references public.stores (id),
  pin_hash text,               -- sha256(pin || id), lets cashiers switch on a till while offline
  active boolean not null default true,
  created_at timestamptz not null default now(),
  constraint store_required check (role = 'super_admin' or store_id is not null)
);

create table if not exists public.products (
  id text primary key,
  name text not null,
  brand text,
  category text not null default 'Gadgets',
  subcategory text,
  condition text,
  base_price numeric(14, 2) not null default 0 check (base_price >= 0),
  image text,
  barcode text unique,
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

create table if not exists public.inventory (
  store_id uuid not null references public.stores (id) on delete cascade,
  product_id text not null references public.products (id) on delete cascade,
  qty integer not null default 0,            -- may go negative after offline sales sync; flagged, never blocks
  price numeric(14, 2) check (price >= 0),   -- store price; null = use product base_price
  low_stock_at integer not null default 2,
  updated_at timestamptz not null default now(),
  primary key (store_id, product_id)
);

create table if not exists public.devices (
  id uuid primary key,
  store_id uuid not null references public.stores (id),
  code text not null,                         -- short code used in receipt numbers, e.g. L1
  name text,
  last_seen_at timestamptz,
  unique (store_id, code)
);

create table if not exists public.sales (
  id uuid primary key,                        -- generated on the till: retries can never duplicate
  receipt_no text not null unique,
  store_id uuid not null references public.stores (id),
  device_id uuid references public.devices (id),
  cashier_id uuid not null references public.staff (id),
  created_at timestamptz not null,            -- time on the till when the sale was made
  synced_at timestamptz not null default now(),
  offline boolean not null default false,     -- made while the till had no internet
  subtotal numeric(14, 2) not null check (subtotal >= 0),
  discount numeric(14, 2) not null default 0 check (discount >= 0),
  total numeric(14, 2) not null check (total >= 0),
  change_given numeric(14, 2) not null default 0 check (change_given >= 0),
  payments jsonb not null,                    -- [{method: cash|transfer|card, amount}]
  customer_name text,
  customer_phone text,
  status text not null default 'completed' check (status in ('completed', 'refunded')),
  refunded_at timestamptz,
  refunded_by uuid references public.staff (id),
  refund_reason text
);

create table if not exists public.sale_lines (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales (id) on delete cascade,
  product_id text references public.products (id),   -- null = quick sale (item not in inventory)
  name text not null,
  unit_price numeric(14, 2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0)
);

create table if not exists public.stock_movements (
  id bigserial primary key,
  store_id uuid not null references public.stores (id),
  product_id text not null references public.products (id),
  delta integer not null,
  reason text not null check (reason in ('sale', 'refund', 'receive', 'transfer_in', 'transfer_out', 'adjust')),
  ref_id uuid,
  staff_id uuid references public.staff (id),
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.shifts (
  id uuid primary key,
  store_id uuid not null references public.stores (id),
  device_id uuid references public.devices (id),
  cashier_id uuid not null references public.staff (id),
  opened_at timestamptz not null,
  opening_cash numeric(14, 2) not null default 0,
  closed_at timestamptz,
  expected_cash numeric(14, 2),
  counted_cash numeric(14, 2),
  note text
);

create table if not exists public.notifications (
  id bigserial primary key,
  kind text not null check (kind in ('sale', 'refund', 'low_stock', 'quick_sale', 'daily_summary', 'negative_stock', 'shift_short')),
  store_id uuid references public.stores (id),
  ref_id uuid,
  message text not null,
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed', 'skipped')),
  attempts integer not null default 0,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz
);

create table if not exists public.audit_log (
  id bigserial primary key,
  staff_id uuid references public.staff (id),
  store_id uuid references public.stores (id),
  action text not null,
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

create index if not exists sales_store_created on public.sales (store_id, created_at desc);
create index if not exists sale_lines_sale on public.sale_lines (sale_id);
create index if not exists movements_store_product on public.stock_movements (store_id, product_id, created_at desc);
create index if not exists notifications_pending on public.notifications (status, created_at) where status = 'pending';

-- ───────────────────────── Helpers ─────────────────────────
create or replace function public.current_staff() returns public.staff
language sql stable security definer set search_path = public as $$
  select * from public.staff where id = auth.uid() and active
$$;

create or replace function public.is_super_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.staff where id = auth.uid() and active and role = 'super_admin')
$$;

create or replace function public.can_access_store(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and active and (role = 'super_admin' or store_id = p_store)
  )
$$;

create or replace function public.can_manage_store(p_store uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.staff
    where id = auth.uid() and active and (role = 'super_admin' or (role = 'manager' and store_id = p_store))
  )
$$;

-- ───────────────────────── Row Level Security ─────────────────────────
alter table public.stores enable row level security;
alter table public.staff enable row level security;
alter table public.products enable row level security;
alter table public.inventory enable row level security;
alter table public.devices enable row level security;
alter table public.sales enable row level security;
alter table public.sale_lines enable row level security;
alter table public.stock_movements enable row level security;
alter table public.shifts enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_log enable row level security;
alter table public.app_settings enable row level security;

-- Reads only. All writes go through the functions below.
drop policy if exists stores_read on public.stores;
create policy stores_read on public.stores for select to authenticated using (public.can_access_store(id));

drop policy if exists staff_read on public.staff;
create policy staff_read on public.staff for select to authenticated
  using (id = auth.uid() or public.is_super_admin() or (store_id is not null and public.can_access_store(store_id)));

drop policy if exists products_read on public.products;
create policy products_read on public.products for select to anon, authenticated using (active or public.is_super_admin());

drop policy if exists inventory_read on public.inventory;
create policy inventory_read on public.inventory for select to authenticated using (public.can_access_store(store_id));

drop policy if exists devices_read on public.devices;
create policy devices_read on public.devices for select to authenticated using (public.can_access_store(store_id));

drop policy if exists sales_read on public.sales;
create policy sales_read on public.sales for select to authenticated using (public.can_access_store(store_id));

drop policy if exists sale_lines_read on public.sale_lines;
create policy sale_lines_read on public.sale_lines for select to authenticated
  using (exists (select 1 from public.sales s where s.id = sale_id and public.can_access_store(s.store_id)));

drop policy if exists movements_read on public.stock_movements;
create policy movements_read on public.stock_movements for select to authenticated using (public.can_manage_store(store_id));

drop policy if exists shifts_read on public.shifts;
create policy shifts_read on public.shifts for select to authenticated using (public.can_access_store(store_id));

drop policy if exists notifications_read on public.notifications;
create policy notifications_read on public.notifications for select to authenticated using (public.is_super_admin());

drop policy if exists audit_read on public.audit_log;
create policy audit_read on public.audit_log for select to authenticated using (public.is_super_admin());

drop policy if exists settings_read on public.app_settings;
create policy settings_read on public.app_settings for select to authenticated using (public.is_super_admin());

-- ───────────────────────── Money & stock functions ─────────────────────────

-- First person to call this becomes super admin (the CEO). Fails once a super admin exists.
create or replace function public.claim_super_admin(p_full_name text, p_username text) returns public.staff
language plpgsql security definer set search_path = public as $$
declare v public.staff;
begin
  if auth.uid() is null then raise exception 'Not signed in'; end if;
  if exists (select 1 from public.staff where role = 'super_admin') then
    raise exception 'A super admin already exists';
  end if;
  insert into public.staff (id, full_name, username, role) values (auth.uid(), p_full_name, lower(p_username), 'super_admin')
  returning * into v;
  insert into public.audit_log (staff_id, action, details) values (auth.uid(), 'claim_super_admin', jsonb_build_object('name', p_full_name));
  return v;
end $$;

-- Register a till (laptop) for a store; returns its device code for receipt numbers.
create or replace function public.register_device(p_device_id uuid, p_store_id uuid, p_name text) returns public.devices
language plpgsql security definer set search_path = public as $$
declare v public.devices; v_code text; n int;
begin
  if not public.can_access_store(p_store_id) then raise exception 'No access to this store'; end if;
  select * into v from public.devices where id = p_device_id;
  if found then
    update public.devices set last_seen_at = now(), name = coalesce(p_name, name) where id = p_device_id returning * into v;
    return v;
  end if;
  select count(*) + 1 into n from public.devices where store_id = p_store_id;
  v_code := 'T' || n;
  while exists (select 1 from public.devices where store_id = p_store_id and code = v_code) loop
    n := n + 1; v_code := 'T' || n;
  end loop;
  insert into public.devices (id, store_id, code, name, last_seen_at) values (p_device_id, p_store_id, v_code, p_name, now())
  returning * into v;
  return v;
end $$;

-- Record a sale from a till. Idempotent: sending the same sale twice returns the first result.
-- Stock is decremented but never blocks a sale (an offline sale has already happened in the shop).
create or replace function public.submit_sale(p jsonb) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  v_id uuid := (p->>'id')::uuid;
  v_store uuid := (p->>'store_id')::uuid;
  v_cashier uuid := (p->>'cashier_id')::uuid;
  v_line jsonb;
  v_subtotal numeric := 0;
  v_paid numeric := 0;
  v_total numeric;
  v_discount numeric := coalesce((p->>'discount')::numeric, 0);
  v_change numeric;
  v_store_name text;
  v_cashier_name text;
  v_items text;
  v_qty int;
  v_new_qty int;
  v_low int;
  v_has_quick boolean := false;
begin
  if exists (select 1 from public.sales where id = v_id) then
    return jsonb_build_object('id', v_id, 'status', 'duplicate');
  end if;
  if not public.can_access_store(v_store) then raise exception 'No access to this store'; end if;
  if not exists (select 1 from public.staff where id = v_cashier and active and (role = 'super_admin' or store_id = v_store)) then
    raise exception 'Cashier does not belong to this store';
  end if;
  if jsonb_array_length(coalesce(p->'lines', '[]')) = 0 then raise exception 'Sale has no items'; end if;

  -- Recompute totals on the server; never trust client arithmetic for money.
  for v_line in select * from jsonb_array_elements(p->'lines') loop
    if (v_line->>'quantity')::int <= 0 or (v_line->>'unit_price')::numeric < 0 then raise exception 'Invalid line'; end if;
    v_subtotal := v_subtotal + (v_line->>'unit_price')::numeric * (v_line->>'quantity')::int;
  end loop;
  if v_discount < 0 or v_discount > v_subtotal then raise exception 'Invalid discount'; end if;
  v_total := v_subtotal - v_discount;
  select coalesce(sum((x->>'amount')::numeric), 0) into v_paid from jsonb_array_elements(p->'payments') x;
  if v_paid < v_total then raise exception 'Payment (%) is less than total (%)', v_paid, v_total; end if;
  v_change := v_paid - v_total;

  insert into public.sales (id, receipt_no, store_id, device_id, cashier_id, created_at, offline, subtotal, discount, total,
                            change_given, payments, customer_name, customer_phone)
  values (v_id, p->>'receipt_no', v_store, nullif(p->>'device_id', '')::uuid, v_cashier,
          coalesce((p->>'created_at')::timestamptz, now()), coalesce((p->>'offline')::boolean, false),
          v_subtotal, v_discount, v_total, v_change, p->'payments', nullif(p->>'customer_name', ''), nullif(p->>'customer_phone', ''));

  for v_line in select * from jsonb_array_elements(p->'lines') loop
    v_qty := (v_line->>'quantity')::int;
    insert into public.sale_lines (sale_id, product_id, name, unit_price, quantity)
    values (v_id, nullif(v_line->>'product_id', ''), v_line->>'name', (v_line->>'unit_price')::numeric, v_qty);

    if nullif(v_line->>'product_id', '') is null then
      v_has_quick := true;
    else
      insert into public.inventory (store_id, product_id, qty) values (v_store, v_line->>'product_id', -v_qty)
      on conflict (store_id, product_id) do update set qty = public.inventory.qty - v_qty, updated_at = now()
      returning qty, low_stock_at into v_new_qty, v_low;
      insert into public.stock_movements (store_id, product_id, delta, reason, ref_id, staff_id)
      values (v_store, v_line->>'product_id', -v_qty, 'sale', v_id, v_cashier);
      if v_new_qty < 0 then
        insert into public.notifications (kind, store_id, ref_id, message)
        select 'negative_stock', v_store, v_id,
               format('⚠️ Stock check needed · %s · %s is at %s after an offline sale', s.name, v_line->>'name', v_new_qty)
        from public.stores s where s.id = v_store;
      elsif v_new_qty <= v_low then
        insert into public.notifications (kind, store_id, ref_id, message)
        select 'low_stock', v_store, v_id, format('📦 Low stock · %s · %s: %s left', s.name, v_line->>'name', v_new_qty)
        from public.stores s where s.id = v_store;
      end if;
    end if;
  end loop;

  select name into v_store_name from public.stores where id = v_store;
  select full_name into v_cashier_name from public.staff where id = v_cashier;
  select string_agg(format('%s ×%s', x->>'name', x->>'quantity'), ', ') into v_items from jsonb_array_elements(p->'lines') x;

  insert into public.notifications (kind, store_id, ref_id, message)
  values (case when v_has_quick then 'quick_sale' else 'sale' end, v_store, v_id,
    format(E'🛒 New sale · %s\n₦%s · %s\nPaid: %s · Cashier: %s\nReceipt %s%s',
      v_store_name, to_char(v_total, 'FM999,999,999,990'), v_items,
      (select string_agg(initcap(x->>'method'), ' + ') from jsonb_array_elements(p->'payments') x),
      v_cashier_name, p->>'receipt_no',
      case when coalesce((p->>'offline')::boolean, false)
        then format(E'\n(made offline at %s)', to_char(((p->>'created_at')::timestamptz) at time zone 'Africa/Lagos', 'HH12:MIam'))
        else '' end));

  return jsonb_build_object('id', v_id, 'status', 'created', 'total', v_total, 'change', v_change);
end $$;

-- Refund a sale: managers of the store or the super admin. Puts items back into stock.
create or replace function public.refund_sale(p_sale uuid, p_reason text) returns public.sales
language plpgsql security definer set search_path = public as $$
declare v public.sales; l record;
begin
  select * into v from public.sales where id = p_sale for update;
  if not found then raise exception 'Sale not found'; end if;
  if not public.can_manage_store(v.store_id) then raise exception 'Only a manager or the owner can refund'; end if;
  if v.status = 'refunded' then return v; end if;
  for l in select * from public.sale_lines where sale_id = p_sale and product_id is not null loop
    update public.inventory set qty = qty + l.quantity, updated_at = now() where store_id = v.store_id and product_id = l.product_id;
    insert into public.stock_movements (store_id, product_id, delta, reason, ref_id, staff_id)
    values (v.store_id, l.product_id, l.quantity, 'refund', p_sale, auth.uid());
  end loop;
  update public.sales set status = 'refunded', refunded_at = now(), refunded_by = auth.uid(), refund_reason = p_reason
  where id = p_sale returning * into v;
  insert into public.notifications (kind, store_id, ref_id, message)
  select 'refund', v.store_id, p_sale,
    format(E'↩️ Refund · %s\n₦%s · Receipt %s\nBy: %s%s', s.name, to_char(v.total, 'FM999,999,999,990'), v.receipt_no,
           (select full_name from public.staff where id = auth.uid()), coalesce(E'\nReason: ' || nullif(p_reason, ''), ''))
  from public.stores s where s.id = v.store_id;
  insert into public.audit_log (staff_id, store_id, action, details)
  values (auth.uid(), v.store_id, 'refund_sale', jsonb_build_object('sale', p_sale, 'receipt', v.receipt_no, 'reason', p_reason));
  return v;
end $$;

-- Stock in, adjustments and price changes (manager or owner).
create or replace function public.adjust_stock(p_store uuid, p_product text, p_delta int, p_reason text, p_note text default null)
returns public.inventory
language plpgsql security definer set search_path = public as $$
declare v public.inventory;
begin
  if not public.can_manage_store(p_store) then raise exception 'Only a manager or the owner can change stock'; end if;
  if p_reason not in ('receive', 'adjust') then raise exception 'Invalid reason'; end if;
  insert into public.inventory (store_id, product_id, qty) values (p_store, p_product, p_delta)
  on conflict (store_id, product_id) do update set qty = public.inventory.qty + p_delta, updated_at = now()
  returning * into v;
  insert into public.stock_movements (store_id, product_id, delta, reason, staff_id, note)
  values (p_store, p_product, p_delta, p_reason, auth.uid(), p_note);
  insert into public.audit_log (staff_id, store_id, action, details)
  values (auth.uid(), p_store, 'adjust_stock', jsonb_build_object('product', p_product, 'delta', p_delta, 'reason', p_reason, 'note', p_note));
  return v;
end $$;

create or replace function public.set_store_price(p_store uuid, p_product text, p_price numeric, p_low_stock_at int default null)
returns public.inventory
language plpgsql security definer set search_path = public as $$
declare v public.inventory; v_old numeric;
begin
  if not public.can_manage_store(p_store) then raise exception 'Only a manager or the owner can change prices'; end if;
  if p_price is not null and p_price < 0 then raise exception 'Price cannot be negative'; end if;
  select price into v_old from public.inventory where store_id = p_store and product_id = p_product;
  insert into public.inventory (store_id, product_id, qty, price, low_stock_at) values (p_store, p_product, 0, p_price, coalesce(p_low_stock_at, 2))
  on conflict (store_id, product_id) do update
    set price = p_price, low_stock_at = coalesce(p_low_stock_at, public.inventory.low_stock_at), updated_at = now()
  returning * into v;
  insert into public.audit_log (staff_id, store_id, action, details)
  values (auth.uid(), p_store, 'set_price', jsonb_build_object('product', p_product, 'from', v_old, 'to', p_price));
  return v;
end $$;

-- Move stock between stores (owner only), in one transaction.
create or replace function public.transfer_stock(p_from uuid, p_to uuid, p_product text, p_qty int, p_note text default null)
returns void
language plpgsql security definer set search_path = public as $$
declare v_ref uuid := gen_random_uuid();
begin
  if not public.is_super_admin() then raise exception 'Only the owner can transfer stock'; end if;
  if p_qty <= 0 or p_from = p_to then raise exception 'Invalid transfer'; end if;
  insert into public.inventory (store_id, product_id, qty) values (p_from, p_product, -p_qty)
  on conflict (store_id, product_id) do update set qty = public.inventory.qty - p_qty, updated_at = now();
  insert into public.inventory (store_id, product_id, qty) values (p_to, p_product, p_qty)
  on conflict (store_id, product_id) do update set qty = public.inventory.qty + p_qty, updated_at = now();
  insert into public.stock_movements (store_id, product_id, delta, reason, ref_id, staff_id, note) values
    (p_from, p_product, -p_qty, 'transfer_out', v_ref, auth.uid(), p_note),
    (p_to, p_product, p_qty, 'transfer_in', v_ref, auth.uid(), p_note);
  insert into public.audit_log (staff_id, action, details)
  values (auth.uid(), 'transfer_stock', jsonb_build_object('from', p_from, 'to', p_to, 'product', p_product, 'qty', p_qty));
end $$;

-- Owner-only catalogue edits.
create or replace function public.upsert_product(p jsonb) returns public.products
language plpgsql security definer set search_path = public as $$
declare v public.products;
begin
  if not public.is_super_admin() then raise exception 'Only the owner can edit the catalogue'; end if;
  insert into public.products (id, name, brand, category, subcategory, condition, base_price, image, barcode, active, updated_at)
  values (p->>'id', p->>'name', p->>'brand', coalesce(p->>'category', 'Gadgets'), p->>'subcategory', p->>'condition',
          coalesce((p->>'base_price')::numeric, 0), p->>'image', nullif(p->>'barcode', ''), coalesce((p->>'active')::boolean, true), now())
  on conflict (id) do update set name = excluded.name, brand = excluded.brand, category = excluded.category,
    subcategory = excluded.subcategory, condition = excluded.condition, base_price = excluded.base_price,
    image = excluded.image, barcode = excluded.barcode, active = excluded.active, updated_at = now()
  returning * into v;
  return v;
end $$;

create or replace function public.upsert_store(p_id uuid, p_code text, p_name text, p_address text, p_phone text, p_active boolean default true)
returns public.stores
language plpgsql security definer set search_path = public as $$
declare v public.stores;
begin
  if not public.is_super_admin() then raise exception 'Only the owner can manage stores'; end if;
  insert into public.stores (id, code, name, address, phone, active)
  values (coalesce(p_id, gen_random_uuid()), upper(p_code), p_name, p_address, p_phone, p_active)
  on conflict (id) do update set code = excluded.code, name = excluded.name, address = excluded.address,
    phone = excluded.phone, active = excluded.active
  returning * into v;
  return v;
end $$;

-- Shifts: opening and closing the cash drawer. Expected cash is computed on the server.
create or replace function public.save_shift(p jsonb) returns public.shifts
language plpgsql security definer set search_path = public as $$
declare v public.shifts; v_expected numeric; v_store uuid := (p->>'store_id')::uuid;
begin
  if not public.can_access_store(v_store) then raise exception 'No access to this store'; end if;
  insert into public.shifts (id, store_id, device_id, cashier_id, opened_at, opening_cash)
  values ((p->>'id')::uuid, v_store, nullif(p->>'device_id', '')::uuid, (p->>'cashier_id')::uuid,
          (p->>'opened_at')::timestamptz, coalesce((p->>'opening_cash')::numeric, 0))
  on conflict (id) do nothing;
  if p ? 'closed_at' and p->>'closed_at' is not null then
    select s.opening_cash + coalesce((
      select sum((x->>'amount')::numeric) from public.sales sa, jsonb_array_elements(sa.payments) x
      where sa.store_id = s.store_id and sa.cashier_id = s.cashier_id and sa.status = 'completed'
        and x->>'method' = 'cash' and sa.created_at between s.opened_at and (p->>'closed_at')::timestamptz), 0)
      - coalesce((select sum(sa.change_given) from public.sales sa where sa.store_id = s.store_id and sa.cashier_id = s.cashier_id
        and sa.status = 'completed' and sa.created_at between s.opened_at and (p->>'closed_at')::timestamptz), 0)
    into v_expected from public.shifts s where s.id = (p->>'id')::uuid;
    update public.shifts set closed_at = (p->>'closed_at')::timestamptz, counted_cash = (p->>'counted_cash')::numeric,
      expected_cash = v_expected, note = p->>'note'
    where id = (p->>'id')::uuid and closed_at is null;
    if (p->>'counted_cash')::numeric < v_expected - 500 then
      insert into public.notifications (kind, store_id, ref_id, message)
      select 'shift_short', v_store, (p->>'id')::uuid,
        format(E'💰 Cash short · %s\nExpected ₦%s, counted ₦%s\nCashier: %s', st.name, to_char(v_expected, 'FM999,999,999,990'),
               to_char((p->>'counted_cash')::numeric, 'FM999,999,999,990'), (select full_name from public.staff where id = (p->>'cashier_id')::uuid))
      from public.stores st where st.id = v_store;
    end if;
  end if;
  select * into v from public.shifts where id = (p->>'id')::uuid;
  return v;
end $$;

create or replace function public.set_setting(p_key text, p_value jsonb) returns void
language plpgsql security definer set search_path = public as $$
begin
  if not public.is_super_admin() then raise exception 'Only the owner can change settings'; end if;
  insert into public.app_settings (key, value) values (p_key, p_value)
  on conflict (key) do update set value = excluded.value, updated_at = now();
end $$;

-- Lock down: functions callable by signed-in users only; tables not writable by clients.
revoke all on all tables in schema public from anon, authenticated;
grant select on all tables in schema public to authenticated;
grant select on public.products to anon;
revoke execute on all functions in schema public from anon, public;
grant execute on function public.claim_super_admin, public.register_device, public.submit_sale, public.refund_sale,
  public.adjust_stock, public.set_store_price, public.transfer_stock, public.upsert_product, public.upsert_store,
  public.save_shift, public.set_setting, public.current_staff, public.is_super_admin, public.can_access_store,
  public.can_manage_store to authenticated;
