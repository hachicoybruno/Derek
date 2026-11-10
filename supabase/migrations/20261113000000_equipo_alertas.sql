-- FLIPDESK · Fase 4: equipo (dueño y vendedores) y alertas por correo/WhatsApp.
--
-- Modelo de cuentas: el id del DUEÑO es el id de la cuenta. Todas las filas de datos
-- (autos, gastos, …) guardan en user_id la cuenta a la que pertenecen. Un vendedor es un
-- usuario con una fila en `miembros` que apunta a la cuenta del dueño.
-- Un usuario pertenece a una sola cuenta.

-- ─────────────────────────────────────────────────────────────────────────
-- Plan de una cuenta sin restricción (uso interno). plan_efectivo sigue siendo la versión pública.
-- ─────────────────────────────────────────────────────────────────────────
create or replace function public.plan_de_cuenta(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when s.estado = 'prueba' and s.prueba_hasta > now() then 'pro'
    when s.estado = 'activa' and (s.periodo_hasta is null or s.periodo_hasta > now() - interval '5 days') then s.plan
    when s.estado = 'cancelada' and s.periodo_hasta > now() then s.plan
    else null
  end
  from public.suscripciones s
  where s.user_id = uid;
$$;
revoke all on function public.plan_de_cuenta(uuid) from public, anon, authenticated;

-- ─────────────────────────────────────────────────────────────────────────
-- Miembros e invitaciones
-- ─────────────────────────────────────────────────────────────────────────
create table public.miembros (
  user_id uuid primary key references auth.users (id) on delete cascade,
  cuenta_id uuid not null references auth.users (id) on delete cascade,
  rol text not null default 'vendedor' check (rol in ('vendedor')),
  created_at timestamptz not null default now(),
  check (user_id <> cuenta_id)
);
create index miembros_cuenta_idx on public.miembros (cuenta_id);

-- Cuenta con la que trabaja el usuario actual. La membresía solo vale si la cuenta tiene plan Concesionario.
create or replace function public.cuenta_actual()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(
    (select m.cuenta_id from public.miembros m
      where m.user_id = auth.uid() and public.plan_de_cuenta(m.cuenta_id) = 'concesionario'),
    auth.uid()
  );
$$;

create or replace function public.rol_actual()
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when public.cuenta_actual() = auth.uid() then 'dueno' else 'vendedor' end;
$$;

grant execute on function public.cuenta_actual(), public.rol_actual() to authenticated;

-- Contexto en una sola llamada para el servidor.
create or replace function public.mi_contexto()
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object('cuenta_id', public.cuenta_actual(), 'rol', public.rol_actual());
$$;
grant execute on function public.mi_contexto() to authenticated;

-- plan_efectivo: el usuario puede consultar el plan de SU cuenta (dueño o vendedor).
create or replace function public.plan_efectivo(uid uuid)
returns text
language sql
stable
security definer
set search_path = ''
as $$
  select case when auth.uid() is null or uid = public.cuenta_actual() then public.plan_de_cuenta(uid) end;
$$;

-- El trigger de límites usa la versión interna (el vendedor inserta en la cuenta del dueño).
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
  v_plan := public.plan_de_cuenta(new.user_id);
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

create table public.invitaciones (
  id uuid primary key default gen_random_uuid(),
  cuenta_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  email text not null check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  rol text not null default 'vendedor' check (rol in ('vendedor')),
  token text not null unique default replace(gen_random_uuid()::text || gen_random_uuid()::text, '-', ''),
  expira_at timestamptz not null default now() + interval '7 days',
  aceptada_at timestamptz,
  aceptada_por uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);
create index invitaciones_cuenta_idx on public.invitaciones (cuenta_id);

-- Máximo 5 usuarios (dueño + 4 vendedores) y solo con plan Concesionario. Sincronizar con lib/planes.ts.
create or replace function public.validar_cupo_equipo(p_cuenta uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.plan_de_cuenta(p_cuenta) is distinct from 'concesionario' then
    raise exception 'PLAN_SIN_EQUIPO' using hint = 'Los usuarios adicionales están en el plan Concesionario.';
  end if;
  if (select count(*) from public.miembros where cuenta_id = p_cuenta) >= 4 then
    raise exception 'LIMITE_USUARIOS' using hint = 'El plan Concesionario permite hasta 5 usuarios.';
  end if;
end;
$$;
revoke all on function public.validar_cupo_equipo(uuid) from public, anon, authenticated;

create or replace function public.antes_de_invitar()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if public.rol_actual() <> 'dueno' or new.cuenta_id <> auth.uid() then
    raise exception 'SOLO_DUENO';
  end if;
  new.email := lower(trim(new.email));
  perform public.validar_cupo_equipo(new.cuenta_id);
  return new;
end;
$$;
create trigger invitaciones_validar before insert on public.invitaciones
  for each row execute function public.antes_de_invitar();

-- Datos públicos de una invitación (para la página de aceptación).
create or replace function public.ver_invitacion(p_token text)
returns json
language sql
stable
security definer
set search_path = ''
as $$
  select json_build_object(
    'email', i.email,
    'negocio', coalesce(p.negocio, p.nombre, 'un negocio en FLIPDESK'),
    'dueno', p.nombre,
    'vigente', i.aceptada_at is null and i.expira_at > now()
  )
  from public.invitaciones i
  left join public.perfiles p on p.id = i.cuenta_id
  where i.token = p_token;
$$;
grant execute on function public.ver_invitacion(text) to anon, authenticated;

create or replace function public.aceptar_invitacion(p_token text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_inv public.invitaciones%rowtype;
begin
  select * into v_inv from public.invitaciones where token = p_token for update;
  if not found or v_inv.aceptada_at is not null or v_inv.expira_at <= now() then
    raise exception 'INVITACION_INVALIDA';
  end if;
  if lower(coalesce(auth.jwt() ->> 'email', '')) <> v_inv.email then
    raise exception 'INVITACION_OTRO_CORREO';
  end if;
  if auth.uid() = v_inv.cuenta_id or exists (select 1 from public.miembros where user_id = auth.uid()) then
    raise exception 'YA_ES_MIEMBRO';
  end if;
  if exists (select 1 from public.autos where user_id = auth.uid()) then
    raise exception 'TIENE_DATOS';
  end if;
  perform public.validar_cupo_equipo(v_inv.cuenta_id);

  insert into public.miembros (user_id, cuenta_id, rol) values (auth.uid(), v_inv.cuenta_id, v_inv.rol);
  update public.invitaciones set aceptada_at = now(), aceptada_por = auth.uid() where id = v_inv.id;
  return v_inv.cuenta_id;
end;
$$;
grant execute on function public.aceptar_invitacion(text) to authenticated;

-- Miembros de la cuenta actual (con correo, que vive en auth.users).
create or replace function public.listar_miembros()
returns table (user_id uuid, email text, nombre text, rol text, desde timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select u.id, u.email::text, p.nombre, 'dueno', u.created_at
  from auth.users u left join public.perfiles p on p.id = u.id
  where u.id = public.cuenta_actual()
  union all
  select u.id, u.email::text, p.nombre, m.rol, m.created_at
  from public.miembros m
  join auth.users u on u.id = m.user_id
  left join public.perfiles p on p.id = u.id
  where m.cuenta_id = public.cuenta_actual();
$$;
grant execute on function public.listar_miembros() to authenticated;

alter table public.miembros enable row level security;
alter table public.invitaciones enable row level security;

create policy "miembros: ver" on public.miembros for select to authenticated
  using (cuenta_id = (select public.cuenta_actual()) or user_id = (select auth.uid()));
-- El dueño quita vendedores; un vendedor puede salir del equipo.
create policy "miembros: quitar" on public.miembros for delete to authenticated
  using (cuenta_id = (select auth.uid()) or user_id = (select auth.uid()));

create policy "invitaciones: ver" on public.invitaciones for select to authenticated
  using (cuenta_id = (select auth.uid()));
create policy "invitaciones: crear" on public.invitaciones for insert to authenticated
  with check (cuenta_id = (select auth.uid()));
create policy "invitaciones: borrar" on public.invitaciones for delete to authenticated
  using (cuenta_id = (select auth.uid()));
revoke all on public.miembros, public.invitaciones from anon;

-- ─────────────────────────────────────────────────────────────────────────
-- RLS por cuenta: dueño y vendedores ven los mismos datos; solo el dueño borra.
-- ─────────────────────────────────────────────────────────────────────────
do $$
declare
  t text;
begin
  foreach t in array array['contactos', 'autos', 'gastos', 'documentos', 'fotos'] loop
    execute format('drop policy "propios: ver" on public.%I', t);
    execute format('drop policy "propios: crear" on public.%I', t);
    execute format('drop policy "propios: editar" on public.%I', t);
    execute format('drop policy "propios: borrar" on public.%I', t);
    execute format('alter table public.%I alter column user_id set default public.cuenta_actual()', t);
    execute format(
      'create policy "cuenta: ver" on public.%I for select to authenticated using (user_id = (select public.cuenta_actual()))', t);
    execute format(
      'create policy "cuenta: crear" on public.%I for insert to authenticated with check (user_id = (select public.cuenta_actual()))', t);
    execute format(
      'create policy "cuenta: editar" on public.%I for update to authenticated using (user_id = (select public.cuenta_actual())) with check (user_id = (select public.cuenta_actual()))', t);
    execute format(
      'create policy "cuenta: borrar (dueño)" on public.%I for delete to authenticated using (user_id = (select public.cuenta_actual()) and (select public.rol_actual()) = ''dueno'')', t);
  end loop;
end;
$$;

-- Plantillas: todos las leen (para generar PDF); solo el dueño las edita.
drop policy "propios: ver" on public.plantillas;
drop policy "propios: crear" on public.plantillas;
drop policy "propios: editar" on public.plantillas;
drop policy "propios: borrar" on public.plantillas;
alter table public.plantillas alter column user_id set default public.cuenta_actual();
create policy "cuenta: ver" on public.plantillas for select to authenticated using (user_id = (select public.cuenta_actual()));
create policy "dueño: crear" on public.plantillas for insert to authenticated
  with check (user_id = (select auth.uid()) and (select public.rol_actual()) = 'dueno');
create policy "dueño: editar" on public.plantillas for update to authenticated
  using (user_id = (select auth.uid()) and (select public.rol_actual()) = 'dueno')
  with check (user_id = (select auth.uid()));
create policy "dueño: borrar" on public.plantillas for delete to authenticated
  using (user_id = (select auth.uid()) and (select public.rol_actual()) = 'dueno');

-- Perfiles: cada uno edita el suyo; los vendedores leen el del dueño (datos del negocio y umbrales).
drop policy "perfil propio: ver" on public.perfiles;
create policy "perfil: ver propio y del negocio" on public.perfiles for select to authenticated
  using (id = (select auth.uid()) or id = (select public.cuenta_actual()));

-- Suscripción: la ven dueño y vendedores (para saber el plan); los pagos, solo el dueño.
drop policy "propia: ver" on public.suscripciones;
create policy "cuenta: ver" on public.suscripciones for select to authenticated using (user_id = (select public.cuenta_actual()));

-- Storage: carpeta de la cuenta; solo el dueño borra archivos.
drop policy "archivos propios: ver" on storage.objects;
drop policy "archivos propios: subir" on storage.objects;
drop policy "archivos propios: editar" on storage.objects;
drop policy "archivos propios: borrar" on storage.objects;

create policy "archivos cuenta: ver" on storage.objects for select to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select public.cuenta_actual())::text);
create policy "archivos cuenta: subir" on storage.objects for insert to authenticated
  with check (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select public.cuenta_actual())::text);
create policy "archivos cuenta: editar" on storage.objects for update to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select public.cuenta_actual())::text)
  with check (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select public.cuenta_actual())::text);
create policy "archivos cuenta: borrar (dueño)" on storage.objects for delete to authenticated
  using (bucket_id in ('fotos-autos', 'documentos') and (storage.foldername(name))[1] = (select public.cuenta_actual())::text
         and (select public.rol_actual()) = 'dueno');

-- ─────────────────────────────────────────────────────────────────────────
-- Alertas por correo y WhatsApp
-- ─────────────────────────────────────────────────────────────────────────
alter table public.perfiles
  add column alertas_email boolean not null default true,
  add column alertas_whatsapp boolean not null default false,
  add column correo_alertas text check (correo_alertas is null or correo_alertas ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  add column whatsapp text check (whatsapp is null or whatsapp ~ '^\+[1-9][0-9]{7,14}$');

-- Registro de avisos enviados (evita repetir el mismo aviso). Solo lo usa el servidor.
create table public.alertas_enviadas (
  documento_id uuid not null references public.documentos (id) on delete cascade,
  umbral integer not null,
  canal text not null check (canal in ('email', 'whatsapp')),
  enviado_at timestamptz not null default now(),
  primary key (documento_id, umbral, canal)
);
alter table public.alertas_enviadas enable row level security;
revoke all on public.alertas_enviadas from anon, authenticated;
