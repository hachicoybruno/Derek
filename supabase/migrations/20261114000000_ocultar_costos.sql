-- FLIPDESK · Ocultar costos y ganancias a los vendedores (configurable por el dueño).
--
-- El precio de compra y el monto de los gastos ya no se pueden leer directamente de las tablas:
-- se leen por las vistas autos_resumen y gastos_vista, que devuelven NULL si el usuario no puede ver costos.
-- Los vendedores SÍ pueden escribirlos (registrar una compra o un gasto), pero no leerlos.
-- IMPORTANTE: si se agregan columnas a autos o gastos, hay que darles GRANT SELECT explícito abajo.

alter table public.perfiles add column vendedores_ven_costos boolean not null default false;

create or replace function public.puede_ver_costos()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select public.rol_actual() = 'dueno'
    or coalesce((select p.vendedores_ven_costos from public.perfiles p where p.id = public.cuenta_actual()), false);
$$;
grant execute on function public.puede_ver_costos() to authenticated;

-- Lectura de columnas: todas menos las de costos.
revoke select on public.autos from authenticated;
grant select (
  id, user_id, placa, marca, modelo, anio, version, color, kilometraje, transmision, combustible, estado,
  fecha_compra, precio_venta_objetivo, precio_venta_final, fecha_venta, notas, vendedor_id, comprador_id,
  created_at, updated_at, numero_serie, numero_motor
) on public.autos to authenticated;

revoke select on public.gastos from authenticated;
grant select (id, user_id, auto_id, categoria, fecha, descripcion, created_at) on public.gastos to authenticated;

-- Vistas con dueño postgres (no security_invoker) para poder leer los costos y enmascararlos.
-- Filtran por la cuenta actual explícitamente, igual que haría el RLS.
drop view public.autos_resumen;
create view public.autos_resumen as
select
  a.id, a.user_id, a.placa, a.marca, a.modelo, a.anio, a.version, a.color, a.kilometraje,
  a.transmision, a.combustible, a.estado, a.fecha_compra,
  case when public.puede_ver_costos() then a.precio_compra end as precio_compra,
  a.precio_venta_objetivo, a.precio_venta_final, a.fecha_venta, a.notas,
  a.vendedor_id, a.comprador_id, a.created_at, a.updated_at,
  case when public.puede_ver_costos() then coalesce(g.total, 0)::numeric(12, 2) end as total_gastos,
  a.numero_serie, a.numero_motor
from public.autos a
left join lateral (
  select sum(monto) as total from public.gastos where gastos.auto_id = a.id
) g on true
where a.user_id = public.cuenta_actual();

create view public.gastos_vista as
select
  g.id, g.user_id, g.auto_id, g.categoria,
  case when public.puede_ver_costos() then g.monto end as monto,
  g.fecha, g.descripcion, g.created_at
from public.gastos g
where g.user_id = public.cuenta_actual();

revoke all on public.autos_resumen, public.gastos_vista from anon, public;
grant select on public.autos_resumen, public.gastos_vista to authenticated;

-- El contexto del usuario incluye si puede ver costos.
create or replace function public.mi_contexto()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('cuenta_id', public.cuenta_actual(), 'rol', public.rol_actual(), 'ver_costos', public.puede_ver_costos());
$$;
