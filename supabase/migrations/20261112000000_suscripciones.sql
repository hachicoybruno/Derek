-- FLIPDESK · Fase 3: planes, suscripciones, pagos y límites por plan.
-- Los límites se validan en la base de datos para que no se puedan saltar llamando a la API directamente.
-- Mantener sincronizado con lib/planes.ts (LIMITE_STOCK_BASICO = 5, DIAS_PRUEBA = 14).

create table public.suscripciones (
  user_id uuid primary key references auth.users (id) on delete cascade,
  plan text not null default 'pro' check (plan in ('basico', 'pro', 'concesionario')),
  estado text not null default 'prueba' check (estado in ('prueba', 'activa', 'cancelada', 'suspendida', 'vencida')),
  proveedor text check (proveedor in ('paypal', 'simulado')),
  proveedor_suscripcion_id text unique,
  prueba_hasta timestamptz,
  periodo_hasta timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger suscripciones_updated_at before update on public.suscripciones
  for each row execute function public.tocar_updated_at();

-- Historial de cobros (lo escribe el servidor al recibir webhooks).
create table public.pagos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  proveedor text not null,
  proveedor_pago_id text not null,
  proveedor_suscripcion_id text,
  plan text,
  monto numeric(12, 2) not null,
  moneda text not null,
  estado text not null check (estado in ('completado', 'fallido', 'reembolsado')),
  fecha timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (proveedor, proveedor_pago_id)
);
create index pagos_user_idx on public.pagos (user_id, fecha desc);

-- Webhooks ya procesados (idempotencia: el proveedor puede reenviar el mismo evento).
create table public.eventos_pago (
  id text primary key,
  proveedor text not null,
  tipo text not null,
  payload jsonb not null,
  recibido_at timestamptz not null default now()
);

-- RLS: el usuario solo LEE su suscripción y sus pagos. Nadie escribe desde el cliente;
-- el servidor usa la clave secreta (service role) al confirmar pagos y procesar webhooks.
alter table public.suscripciones enable row level security;
alter table public.pagos enable row level security;
alter table public.eventos_pago enable row level security;

create policy "propia: ver" on public.suscripciones for select to authenticated using (user_id = (select auth.uid()));
create policy "propios: ver" on public.pagos for select to authenticated using (user_id = (select auth.uid()));

revoke all on public.suscripciones, public.pagos, public.eventos_pago from anon;
revoke insert, update, delete on public.suscripciones, public.pagos from authenticated;
revoke all on public.eventos_pago from authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Plan con el que el usuario tiene acceso hoy (null = sin acceso).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.plan_efectivo(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.estado = 'prueba' and s.prueba_hasta > now() then 'pro'
    -- 5 días de gracia por si un webhook de renovación llega tarde.
    when s.estado = 'activa' and (s.periodo_hasta is null or s.periodo_hasta > now() - interval '5 days') then s.plan
    when s.estado = 'cancelada' and s.periodo_hasta > now() then s.plan
    else null
  end
  from public.suscripciones s
  -- Un usuario solo puede consultar su propio plan (el servidor, sin JWT, puede consultar cualquiera).
  where s.user_id = uid and (auth.uid() is null or auth.uid() = uid);
$$;

revoke all on function public.plan_efectivo(uuid) from public, anon;
grant execute on function public.plan_efectivo(uuid) to authenticated, service_role;

-- ─────────────────────────────────────────────────────────────────────────
-- Límites por plan al crear autos o pasarlos a stock.
--   SIN_PLAN    → la prueba o la suscripción terminó: no se pueden agregar autos ni pasarlos a stock.
--   LIMITE_PLAN → plan Básico con 5 autos en stock (en stock + reservados).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.validar_limite_plan()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_plan text;
  v_en_stock integer;
  v_entra_a_stock boolean;
begin
  v_plan := public.plan_efectivo(new.user_id);
  v_entra_a_stock := new.estado in ('en_stock', 'reservado')
    and (tg_op = 'INSERT' or old.estado not in ('en_stock', 'reservado'));

  if (tg_op = 'INSERT' or v_entra_a_stock) and v_plan is null then
    raise exception 'SIN_PLAN' using hint = 'Tu prueba o suscripción terminó. Elige un plan para seguir agregando autos.';
  end if;

  if v_entra_a_stock and v_plan = 'basico' then
    select count(*) into v_en_stock
    from public.autos
    where user_id = new.user_id and estado in ('en_stock', 'reservado') and id <> new.id;
    if v_en_stock >= 5 then
      raise exception 'LIMITE_PLAN' using hint = 'El plan Básico permite hasta 5 autos en stock.';
    end if;
  end if;

  return new;
end;
$$;

create trigger autos_limite_plan before insert or update of estado on public.autos
  for each row execute function public.validar_limite_plan();

-- ─────────────────────────────────────────────────────────────────────────
-- Prueba gratis de 14 días al registrarse (y para usuarios existentes).
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.crear_perfil_nuevo_usuario()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'));
  insert into public.suscripciones (user_id, plan, estado, prueba_hasta)
  values (new.id, 'pro', 'prueba', now() + interval '14 days');
  return new;
end;
$$;

insert into public.suscripciones (user_id, plan, estado, prueba_hasta)
select id, 'pro', 'prueba', now() + interval '14 days' from auth.users
on conflict (user_id) do nothing;
