-- Product photos: public to view (the website and tills show them), uploads by the owner and managers only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set public = true, file_size_limit = 5242880, allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "product images: staff upload" on storage.objects;
create policy "product images: staff upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'product-images' and exists (
    select 1 from public.staff where id = auth.uid() and active and role in ('super_admin', 'manager')));

drop policy if exists "product images: staff replace" on storage.objects;
create policy "product images: staff replace" on storage.objects for update to authenticated
  using (bucket_id = 'product-images' and exists (
    select 1 from public.staff where id = auth.uid() and active and role in ('super_admin', 'manager')));
