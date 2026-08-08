-- ============================================================
-- KEYTRACK PRO ENTERPRISE 4.5 — STABLE
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.
--
-- Corrige un error importante:
-- Cotizaciones / pendientes / canceladas YA NO descuentan inventario.
-- Solo una venta con estado "Completada" descuenta stock y crea salida.
-- ============================================================

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
  v_completed boolean := lower(coalesce(p_status,'')) = lower('Completada');
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

  -- Validar productos y calcular subtotal.
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

    -- Solo exigir existencia si realmente se completa la venta.
    if v_completed and coalesce(v_product.quantity,0) < v_qty then
      raise exception 'Existencia insuficiente para %', v_product.name;
    end if;

    v_subtotal := v_subtotal
      + greatest((v_price * v_qty) - v_line_discount, 0);
  end loop;

  v_total := greatest(
    v_subtotal - coalesce(p_discount,0) + coalesce(p_tax,0),
    0
  );

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

  -- Guardar partidas.
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

    -- SOLO una venta completada afecta inventario.
    if v_completed then
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
    end if;
  end loop;

  return v_sale_id;
end;
$$;

revoke all
on function public.create_inventory_sale(uuid,uuid,text,text,text,numeric,numeric,jsonb)
from public;

grant execute
on function public.create_inventory_sale(uuid,uuid,text,text,text,numeric,numeric,jsonb)
to authenticated;

notify pgrst, 'reload schema';
