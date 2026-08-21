-- Tabla y funciones para Web Push, completamente nuevas y aisladas del
-- esquema existente (no dependen de columnas de turns/service_points/categories).
-- Seguro de correr más de una vez (IF NOT EXISTS / CREATE OR REPLACE).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  last_notified_stage text,
  last_notified_at timestamptz,
  revoked_at timestamptz
);

alter table public.push_subscriptions enable row level security;
-- Sin policies para anon/authenticated a nivel tabla: todo el acceso pasa
-- exclusivamente por las funciones SECURITY DEFINER de abajo (mismo patrón
-- que el resto del proyecto, que nunca expone tablas via PostgREST directo).

create index if not exists push_subscriptions_active_idx
  on public.push_subscriptions (tracking_code)
  where revoked_at is null;

-- Alta / renovación de una suscripción. Idempotente por endpoint.
create or replace function public.api_register_push_subscription(
  p_tracking_code text,
  p_endpoint text,
  p_p256dh text,
  p_auth text,
  p_user_agent text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_tracking_code is null or p_tracking_code = '' then
    raise exception 'tracking_code requerido';
  end if;
  if p_endpoint is null or p_p256dh is null or p_auth is null then
    raise exception 'Suscripción push incompleta';
  end if;

  insert into public.push_subscriptions (tracking_code, endpoint, p256dh, auth, user_agent)
  values (p_tracking_code, p_endpoint, p_p256dh, p_auth, p_user_agent)
  on conflict (endpoint) do update
    set tracking_code = excluded.tracking_code,
        p256dh = excluded.p256dh,
        auth = excluded.auth,
        user_agent = excluded.user_agent,
        revoked_at = null,
        last_notified_stage = null,
        last_notified_at = null;
end;
$$;

-- Baja de una suscripción (soft delete).
create or replace function public.api_remove_push_subscription(p_endpoint text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions
  set revoked_at = now()
  where endpoint = p_endpoint
    and revoked_at is null;
$$;

-- Códigos de seguimiento con suscripción activa reciente (acotado a 2 días
-- para no barrer indefinidamente turnos ya finalizados).
create or replace function public.api_push_active_codes()
returns table(tracking_code text)
language sql
security definer
set search_path = public
as $$
  select distinct ps.tracking_code
  from public.push_subscriptions ps
  where ps.revoked_at is null
    and ps.created_at > now() - interval '2 days'
  limit 500;
$$;

-- Reclama atómicamente el envío de notificaciones: dado un lote
-- [{"tracking_code":"...","stage":"called|near1|near3"}, ...], actualiza
-- last_notified_stage solo para las filas cuyo stage cambió y devuelve
-- las credenciales de esas suscripciones (una fila por endpoint/dispositivo).
-- El chequeo "stage IS DISTINCT FROM last_notified_stage" evita reenvíos
-- duplicados si dos invocaciones concurrentes barren al mismo tiempo.
create or replace function public.api_push_claim_notifications(p_updates jsonb)
returns table(endpoint text, p256dh text, auth text, tracking_code text, stage text)
language sql
security definer
set search_path = public
as $$
  update public.push_subscriptions ps
  set last_notified_stage = u.stage,
      last_notified_at = now()
  from jsonb_to_recordset(p_updates) as u(tracking_code text, stage text)
  where ps.tracking_code = u.tracking_code
    and u.stage is not null
    and ps.revoked_at is null
    and ps.last_notified_stage is distinct from u.stage
  returning ps.endpoint, ps.p256dh, ps.auth, ps.tracking_code, ps.last_notified_stage;
$$;

revoke all on function public.api_register_push_subscription(text, text, text, text, text) from public;
revoke all on function public.api_remove_push_subscription(text) from public;
revoke all on function public.api_push_active_codes() from public;
revoke all on function public.api_push_claim_notifications(jsonb) from public;

grant execute on function public.api_register_push_subscription(text, text, text, text, text) to anon, authenticated;
grant execute on function public.api_remove_push_subscription(text) to anon, authenticated;
grant execute on function public.api_push_active_codes() to anon, authenticated;
grant execute on function public.api_push_claim_notifications(jsonb) to anon, authenticated;
