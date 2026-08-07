-- ============================================================
-- KEYTRACK PRO ENTERPRISE 4.4 — POS / VENTAS CON INVENTARIO
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.
-- ============================================================

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid not null references public.products(id),
  product_name text not null,
  sku text,
  unit_price numeric(12,2) not null default 0,
  quantity integer not null check (quantity > 0),
  discount numeric(12,2) not null default 0,
  subtotal numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists sale_items_company_idx
on public.sale_items(company_id);

create index if not exists sale_items_sale_idx
on public.sale_items(sale_id);

create index if not exists sale_items_product_idx
on public.sale_items(product_id);

alter table public.sale_items enable row level security;

drop policy if exists "Company members can read sale items" on public.sale_items;
create policy "Company members can read sale items"
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.company_members cm
    where cm.company_id = sale_items.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  )
);

drop policy if exists "Company members can insert sale items" on public.sale_items;
create policy "Company members can insert sale items"
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.company_members cm
    where cm.company_id = sale_items.company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  )
);

-- RPC transaccional:
-- 1) valida membresía
-- 2) valida existencias
-- 3) crea la venta
-- 4) crea partidas
-- 5) descuenta inventario
-- 6) crea movimientos de salida
create or replace function public.create_inventory_sale(
  p_company_id uuid,
  p_customer_id uuid,
  p_status text,
  p_payment_method text,
  p_notes text,
  p_discount numeric,
  p_tax numeric,
  p_items jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_sale_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_price numeric(12,2);
  v_line_discount numeric(12,2);
  v_subtotal numeric(12,2) := 0;
  v_total numeric(12,2) := 0;
begin
  if not exists (
    select 1
    from public.company_members cm
    where cm.company_id = p_company_id
      and cm.user_id = auth.uid()
      and coalesce(cm.status,'active') = 'active'
  ) then
    raise exception 'No tienes acceso a esta empresa';
  end if;

  if jsonb_array_length(coalesce(p_items,'[]'::jsonb)) = 0 then
    raise exception 'La venta debe contener al menos un producto';
  end if;

  -- Primera pasada: validar y calcular subtotal.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select *
      into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and company_id = p_company_id
     for update;

    if not found then
      raise exception 'Producto no encontrado';
    end if;

    v_qty := greatest((v_item->>'quantity')::integer, 1);
    v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    v_line_discount := coalesce((v_item->>'discount')::numeric, 0);

    if coalesce(v_product.quantity,0) < v_qty then
      raise exception 'Existencia insuficiente para %', v_product.name;
    end if;

    v_subtotal := v_subtotal + greatest((v_price * v_qty) - v_line_discount, 0);
  end loop;

  v_total := greatest(v_subtotal - coalesce(p_discount,0) + coalesce(p_tax,0), 0);

  insert into public.sales (
    company_id,
    customer_id,
    status,
    total,
    payment_method,
    notes,
    created_by
  )
  values (
    p_company_id,
    p_customer_id,
    coalesce(nullif(p_status,''),'Completada'),
    v_total,
    p_payment_method,
    p_notes,
    auth.uid()
  )
  returning id into v_sale_id;

  -- Segunda pasada: partidas + stock + movimiento.
  for v_item in select * from jsonb_array_elements(p_items)
  loop
    select *
      into v_product
      from public.products
     where id = (v_item->>'product_id')::uuid
       and company_id = p_company_id
     for update;

    v_qty := greatest((v_item->>'quantity')::integer, 1);
    v_price := coalesce((v_item->>'unit_price')::numeric, 0);
    v_line_discount := coalesce((v_item->>'discount')::numeric, 0);

    insert into public.sale_items (
      company_id,
      sale_id,
      product_id,
      product_name,
      sku,
      unit_price,
      quantity,
      discount,
      subtotal
    )
    values (
      p_company_id,
      v_sale_id,
      v_product.id,
      v_product.name,
      v_product.sku,
      v_price,
      v_qty,
      v_line_discount,
      greatest((v_price * v_qty) - v_line_discount,0)
    );

    update public.products
       set quantity = coalesce(quantity,0) - v_qty
     where id = v_product.id
       and company_id = p_company_id;

    insert into public.inventory_movements (
      company_id,
      product_id,
      movement_type,
      quantity,
      note,
      created_by
    )
    values (
      p_company_id,
      v_product.id,
      'out',
      v_qty,
      'Venta ' || v_sale_id::text,
      auth.uid()
    );
  end loop;

  return v_sale_id;
end;
$$;

revoke all on function public.create_inventory_sale(uuid,uuid,text,text,text,numeric,numeric,jsonb) from public;
grant execute on function public.create_inventory_sale(uuid,uuid,text,text,text,numeric,numeric,jsonb) to authenticated;

-- Refrescar API schema cache.
notify pgrst, 'reload schema';
