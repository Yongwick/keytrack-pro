-- ============================================================
-- KEYTRACK PRO ENTERPRISE 4.2
-- SUPER ADMIN GLOBAL: VER TODAS LAS EMPRESAS
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor.
-- ============================================================

create or replace function public.superadmin_company_overview()
returns table (
  company_id uuid,
  company_name text,
  owner_email text,
  member_count bigint,
  product_count bigint,
  unit_count bigint,
  created_at timestamptz
)
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  -- Seguridad: solamente usuarios registrados como platform_admins.
  if not exists (
    select 1
    from public.platform_admins pa
    where pa.user_id = auth.uid()
  ) then
    raise exception 'Acceso restringido: se requiere Super Admin';
  end if;

  return query
  select
    c.id as company_id,
    c.name as company_name,
    coalesce(
      (
        select u.email::text
        from public.company_members cm_owner
        join auth.users u on u.id = cm_owner.user_id
        where cm_owner.company_id = c.id
          and cm_owner.role = 'owner'
        order by cm_owner.created_at asc
        limit 1
      ),
      (
        select u2.email::text
        from public.company_members cm_any
        join auth.users u2 on u2.id = cm_any.user_id
        where cm_any.company_id = c.id
        order by cm_any.created_at asc
        limit 1
      ),
      'Sin propietario'
    ) as owner_email,
    (
      select count(*)
      from public.company_members cm
      where cm.company_id = c.id
        and coalesce(cm.status,'active') = 'active'
    )::bigint as member_count,
    (
      select count(*)
      from public.products p
      where p.company_id = c.id
    )::bigint as product_count,
    (
      select coalesce(sum(p2.quantity),0)
      from public.products p2
      where p2.company_id = c.id
    )::bigint as unit_count,
    c.created_at
  from public.companies c
  order by c.created_at asc;
end;
$$;

revoke all on function public.superadmin_company_overview() from public;
grant execute on function public.superadmin_company_overview() to authenticated;

-- Prueba: devuelve todas las empresas únicamente si el usuario que ejecuta
-- está registrado en public.platform_admins.
select * from public.superadmin_company_overview();
