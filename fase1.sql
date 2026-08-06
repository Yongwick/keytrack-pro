-- KEYTRACK PRO · FASE 1
-- Ejecuta este archivo una sola vez en Supabase SQL Editor.

-- 1) Promueve al primer usuario registrado como administrador.
update public.profiles
set role = 'admin'
where id = (
  select id
  from public.profiles
  order by created_at asc
  limit 1
);

-- 2) Bucket público para fotografías.
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

-- 3) Políticas de fotografías.
drop policy if exists "Authenticated users can view product images" on storage.objects;
create policy "Authenticated users can view product images"
on storage.objects for select
to authenticated
using (bucket_id = 'product-images');

drop policy if exists "Authenticated users can upload product images" on storage.objects;
create policy "Authenticated users can upload product images"
on storage.objects for insert
to authenticated
with check (
  bucket_id = 'product-images'
  and (storage.foldername(name))[1] = (select auth.uid())::text
);

drop policy if exists "Users can update own product images" on storage.objects;
create policy "Users can update own product images"
on storage.objects for update
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())
)
with check (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())
);

drop policy if exists "Users can delete own product images" on storage.objects;
create policy "Users can delete own product images"
on storage.objects for delete
to authenticated
using (
  bucket_id = 'product-images'
  and owner_id = (select auth.uid())
);

-- 4) Permisos: solo admin y manager pueden borrar productos.
drop policy if exists "Authenticated users can delete products" on public.products;
create policy "Managers can delete products"
on public.products
for delete
to authenticated
using (
  exists (
    select 1 from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.role in ('admin', 'manager')
  )
);

-- 5) Habilita Realtime para productos y movimientos.
do $$
begin
  alter publication supabase_realtime add table public.products;
exception when duplicate_object then null;
end $$;

do $$
begin
  alter publication supabase_realtime add table public.inventory_movements;
exception when duplicate_object then null;
end $$;
