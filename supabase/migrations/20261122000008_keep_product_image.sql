-- Saving a product without a photo (e.g. re-running the CSV import) keeps the photo it already has.
create or replace function public.keep_product_image() returns trigger language plpgsql as $$
begin
  if new.image is null and old.image is not null then new.image := old.image; end if;
  return new;
end $$;
drop trigger if exists products_keep_image on public.products;
create trigger products_keep_image before update on public.products for each row execute function public.keep_product_image();
