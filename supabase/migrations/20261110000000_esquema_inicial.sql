-- FLIPDESK · Esquema inicial (Fase 1)
-- Tablas, Row Level Security, vista de resumen y buckets de storage.

-- ─────────────────────────────────────────────────────────────────────────
-- Utilidades
-- ─────────────────────────────────────────────────────────────────────────

-- Fecha de hoy en Lima (la base de datos trabaja en UTC).
create or replace function public.hoy_lima()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Lima')::date;
$$;

create or replace function public.tocar_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────
-- Perfiles (uno por usuario, se crea automáticamente al registrarse)
-- ─────────────────────────────────────────────────────────────────────────

create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text,
  negocio text,
  umbral_verde numeric(5, 2) not null default 15,
  umbral_amarillo numeric(5, 2) not null default 8,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint umbrales_validos check (umbral_amarillo >= 0 and umbral_amarillo < umbral_verde and umbral_verde <= 100)
);

create trigger perfiles_updated_at before update on public.perfiles
  for each row execute function public.tocar_updated_at();

create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  return new;
end;
$$;

create trigger al_crear_usuario after insert on auth.users
  for each row execute function public.crear_perfil_nuevo_usuario();

-- ─────────────────────────────────────────────────────────────────────────
-- Contactos (compradores y vendedores)
-- ─────────────────────────────────────────────────────────────────────────

create table public.contactos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tipo text not null default 'comprador' check (tipo in ('comprador', 'vendedor', 'ambos')),
  nombre text not null check (length(trim(nombre)) > 0),
  dni text check (dni is null or dni ~ '^[0-9A-Za-z-]{6,15}$'),
  telefono text,
  direccion text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create index contactos_user_idx on public.contactos (user_id);
create trigger contactos_updated_at before update on public.contactos
  for each row execute function public.tocar_updated_at();

-- ─────────────────────────────────────────────────────────────────────────
-- Autos
-- ─────────────────────────────────────────────────────────────────────────

create table public.autos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  placa text not null,
  marca text not null check (length(trim(marca)) > 0),
  modelo text not null check (length(trim(modelo)) > 0),
  anio integer not null check (anio between 1950 and 2100),
  version text,
  color text,
  kilometraje integer check (kilometraje >= 0),
  transmision text check (transmision in ('mecanica', 'automatica')),
  combustible text check (combustible in ('gasolina', 'diesel', 'glp', 'gnv', 'hibrido', 'electrico')),
  estado text not null default 'en_stock' check (estado in ('en_evaluacion', 'en_stock', 'reservado', 'vendido')),
  fecha_compra date,
  precio_compra numeric(12, 2) check (precio_compra >= 0),
  precio_venta_objetivo numeric(12, 2) check (precio_venta_objetivo >= 0),
  precio_venta_final numeric(12, 2) check (precio_venta_final >= 0),
  fecha_venta date,
  notas text,
  vendedor_id uuid,
  comprador_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  unique (user_id, placa),
  constraint placa_valida check (placa ~ '^[A-Z0-9]{5,8}$'),
  constraint vendido_completo check (
    estado <> 'vendido' or (precio_venta_final is not null and fecha_venta is not null)
  ),
  constraint venta_despues_de_compra check (
    fecha_venta is null or fecha_compra is null or fecha_venta >= fecha_compra
  ),
  constraint vendedor_mismo_usuario foreign key (vendedor_id, user_id)
    references public.contactos (id, user_id) on delete set null (vendedor_id),
  constraint comprador_mismo_usuario foreign key (comprador_id, user_id)
    references public.contactos (id, user_id) on delete set null (comprador_id)
);

create index autos_user_estado_idx on public.autos (user_id, estado);
create trigger autos_updated_at before update on public.autos
  for each row execute function public.tocar_updated_at();

-- Placa en mayúsculas, sin espacios ni guiones: "abc-123" → "ABC123".
create or replace function public.normalizar_placa()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.placa = upper(regexp_replace(coalesce(new.placa, ''), '[^A-Za-z0-9]', '', 'g'));
  return new;
end;
$$;

create trigger autos_normalizar_placa before insert or update of placa on public.autos
  for each row execute function public.normalizar_placa();

-- ─────────────────────────────────────────────────────────────────────────
-- Gastos
-- ─────────────────────────────────────────────────────────────────────────

create table public.gastos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  auto_id uuid not null,
  categoria text not null check (
    categoria in ('reparacion', 'pintura', 'tramite', 'transporte', 'lavado', 'comision', 'otro')
  ),
  monto numeric(12, 2) not null check (monto > 0),
  fecha date not null default public.hoy_lima(),
  descripcion text,
  created_at timestamptz not null default now(),
  foreign key (auto_id, user_id) references public.autos (id, user_id) on delete cascade
);

create index gastos_auto_idx on public.gastos (auto_id);
create index gastos_user_idx on public.gastos (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Documentos
-- ─────────────────────────────────────────────────────────────────────────

create table public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  auto_id uuid not null,
  tipo text not null check (tipo in ('soat', 'revision_tecnica', 'tarjeta_propiedad', 'otro')),
  fecha_vencimiento date,
  archivo_path text,
  descripcion text,
  created_at timestamptz not null default now(),
  foreign key (auto_id, user_id) references public.autos (id, user_id) on delete cascade
);

create index documentos_auto_idx on public.documentos (auto_id);
create index documentos_user_venc_idx on public.documentos (user_id, fecha_vencimiento);

-- ─────────────────────────────────────────────────────────────────────────
-- Fotos
-- ─────────────────────────────────────────────────────────────────────────

create table public.fotos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  auto_id uuid not null,
  path text not null,
  path_miniatura text,
  orden integer not null default 0,
  created_at timestamptz not null default now(),
  foreign key (auto_id, user_id) references public.autos (id, user_id) on delete cascade
);

create index fotos_auto_idx on public.fotos (auto_id, orden);
create index fotos_user_idx on public.fotos (user_id);

-- ─────────────────────────────────────────────────────────────────────────
-- Row Level Security: cada usuario ve y modifica solo lo suyo
-- ─────────────────────────────────────────────────────────────────────────

alter table public.perfiles enable row level security;
alter table public.contactos enable row level security;
alter table public.autos enable row level security;
alter table public.gastos enable row level security;
alter table public.documentos enable row level security;
alter table public.fotos enable row level security;

create policy "perfil propio: ver" on public.perfiles
  for select to authenticated using (id = (select auth.uid()));
create policy "perfil propio: editar" on public.perfiles
  for update to authenticated using (id = (select auth.uid())) with check (id = (select auth.uid()));

do $$
declare
  t text;
begin
  foreach t in array array['contactos', 'autos', 'gastos', 'documentos', 'fotos'] loop
    execute format(
      'create policy "propios: ver" on public.%I for select to authenticated using (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "propios: crear" on public.%I for insert to authenticated with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "propios: editar" on public.%I for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))', t);
    execute format(
      'create policy "propios: borrar" on public.%I for delete to authenticated using (user_id = (select auth.uid()))', t);
  end loop;
end;
$$;

-- El rol anónimo no tiene acceso a nada.
revoke all on public.perfiles, public.contactos, public.autos, public.gastos, public.documentos, public.fotos from anon;

-- ─────────────────────────────────────────────────────────────────────────
-- Vista de resumen: auto + suma de gastos
-- (las fórmulas de costo, ganancia y margen están en lib/calculos.ts)
-- security_invoker = true → respeta el RLS del usuario que consulta.
-- ─────────────────────────────────────────────────────────────────────────

create view public.autos_resumen
with (security_invoker = true)
as
select
  a.*,
  coalesce(g.total, 0)::numeric(12, 2) as total_gastos
from public.autos a
left join lateral (
  select sum(monto) as total from public.gastos where gastos.auto_id = a.id
) g on true;

revoke all on public.autos_resumen from anon;
grant select on public.autos_resumen to authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Storage: buckets privados con carpeta por usuario
-- Ruta de cada archivo: {user_id}/{auto_id}/{nombre}
-- ─────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('fotos-autos', 'fotos-autos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('documentos', 'documentos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;

create policy "archivos propios: ver" on storage.objects
  for select to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "archivos propios: subir" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "archivos propios: editar" on storage.objects
  for update to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select auth.uid())::text);

create policy "archivos propios: borrar" on storage.objects
  for delete to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select auth.uid())::text);
