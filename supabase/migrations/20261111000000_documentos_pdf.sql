-- FLIPDESK · Fase 2: datos para contratos y plantillas editables.

-- Datos del revendedor para figurar en contratos y recibos.
alter table public.perfiles
  add column dni text check (dni is null or dni ~ '^[0-9A-Za-z-]{6,15}$'),
  add column telefono text,
  add column direccion text,
  add column ciudad text not null default 'Lima';

-- Datos del vehículo que piden los contratos.
alter table public.autos
  add column numero_serie text,
  add column numero_motor text;

-- La vista expone las columnas nuevas de autos (a.* se fija al crearla).
create or replace view public.autos_resumen
with (security_invoker = true)
as
select
  a.id, a.user_id, a.placa, a.marca, a.modelo, a.anio, a.version, a.color, a.kilometraje,
  a.transmision, a.combustible, a.estado, a.fecha_compra, a.precio_compra,
  a.precio_venta_objetivo, a.precio_venta_final, a.fecha_venta, a.notas,
  a.vendedor_id, a.comprador_id, a.created_at, a.updated_at,
  coalesce(g.total, 0)::numeric(12, 2) as total_gastos,
  a.numero_serie, a.numero_motor
from public.autos a
left join lateral (
  select sum(monto) as total from public.gastos where gastos.auto_id = a.id
) g on true;

-- Plantillas de documentos editadas por el usuario (si no existe, se usa la original).
create table public.plantillas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null check (tipo in ('contrato', 'recibo', 'entrega')),
  contenido text not null check (length(contenido) between 1 and 20000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, tipo)
);

create trigger plantillas_updated_at before update on public.plantillas
  for each row execute function public.tocar_updated_at();

alter table public.plantillas enable row level security;

create policy "propios: ver" on public.plantillas for select to authenticated using (user_id = (select auth.uid()));
create policy "propios: crear" on public.plantillas for insert to authenticated with check (user_id = (select auth.uid()));
create policy "propios: editar" on public.plantillas for update to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "propios: borrar" on public.plantillas for delete to authenticated using (user_id = (select auth.uid()));

revoke all on public.plantillas from anon;
