-- Each store keeps its own product list. A product with no store is shared by every store.
alter table public.products add column if not exists store_id uuid references public.stores (id) on delete cascade;
create index if not exists products_store on public.products (store_id);

-- Staff only see shared products and their own store's products. The owner sees everything.
drop policy if exists products_read on public.products;
create policy products_read on public.products for select to authenticated
  using (public.is_super_admin() or (active and (store_id is null or public.can_access_store(store_id))));
drop policy if exists products_read_public on public.products;
create policy products_read_public on public.products for select to anon using (active and store_id is null);

-- One step for the "Add product" form: save the product, its price at the store, and opening stock.
-- Managers can add/edit products for their own store; the owner for any store or for all stores.
create or replace function public.save_store_product(p jsonb) returns public.products
language plpgsql security definer set search_path = public as $$
declare
  v public.products;
  v_existing public.products;
  v_store uuid := nullif(p->>'store_id', '')::uuid;
  v_id text := coalesce(nullif(p->>'id', ''), 'prd-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));
  v_price numeric := coalesce((p->>'price')::numeric, 0);
  v_add int := coalesce((p->>'add_qty')::int, 0);
begin
  if coalesce(trim(p->>'name'), '') = '' then raise exception 'Enter the product name'; end if;
  if v_price < 0 then raise exception 'Price cannot be negative'; end if;
  if v_add < 0 then raise exception 'Quantity cannot be negative'; end if;

  select * into v_existing from public.products where id = v_id;
  if found then
    -- Editing: you must be allowed to manage the store it belongs to (shared products: owner only).
    if v_existing.store_id is null and not public.is_super_admin() then raise exception 'Only the owner can edit shared products'; end if;
    if v_existing.store_id is not null and not public.can_manage_store(v_existing.store_id) then raise exception 'You can only edit your own store''s products'; end if;
    v_store := v_existing.store_id; -- a product doesn't move between stores
  else
    if v_store is null and not public.is_super_admin() then raise exception 'Choose a store'; end if;
    if v_store is not null and not public.can_manage_store(v_store) then raise exception 'You can only add products to your own store'; end if;
  end if;

  insert into public.products (id, name, brand, category, subcategory, condition, base_price, image, barcode, active, store_id, updated_at)
  values (v_id, trim(p->>'name'), nullif(trim(p->>'brand'), ''), coalesce(nullif(p->>'category', ''), 'Gadgets'), nullif(trim(p->>'subcategory'), ''),
          nullif(p->>'condition', ''), v_price, nullif(p->>'image', ''), nullif(trim(p->>'barcode'), ''), coalesce((p->>'active')::boolean, true), v_store, now())
  on conflict (id) do update set name = excluded.name, brand = excluded.brand, category = excluded.category, subcategory = excluded.subcategory,
    condition = excluded.condition, base_price = excluded.base_price, image = excluded.image, barcode = excluded.barcode,
    active = excluded.active, updated_at = now()
  returning * into v;

  -- Store price follows the product price for store products.
  if v_store is not null then
    insert into public.inventory (store_id, product_id, qty, price) values (v_store, v_id, 0, v_price)
    on conflict (store_id, product_id) do update set price = v_price, updated_at = now();
    if v_add > 0 then
      update public.inventory set qty = qty + v_add, updated_at = now() where store_id = v_store and product_id = v_id;
      insert into public.stock_movements (store_id, product_id, delta, reason, staff_id, note)
      values (v_store, v_id, v_add, 'receive', auth.uid(), 'Added with product');
    end if;
  end if;

  insert into public.audit_log (staff_id, store_id, action, details)
  values (auth.uid(), v_store, case when v_existing.id is null then 'add_product' else 'edit_product' end,
          jsonb_build_object('product', v_id, 'name', v.name, 'price', v_price, 'added_qty', v_add));
  return v;
end $$;

revoke execute on function public.save_store_product(jsonb) from anon, public;
grant execute on function public.save_store_product(jsonb) to authenticated;
