-- 0006_expire_stale_turns.sql
--
-- ESTADO: NO aplicada todavia en produccion. Preparada y probada en un
-- Postgres efimero (rama ci/free-local-loadtest).
--
-- Prioridad 2 de la jornada: politica de cierre automatico de turnos de
-- jornadas anteriores que nunca se cerraron.
--
-- Verificado contra el codigo real antes de disenar esto:
-- - Los 8 estados validos de turns.status son: esperando, proximo,
--   llamado, en_atencion, finalizado, cancelado, ausente, transferido.
-- - api_turn_action (el camino humano real para marcar ausente/cancelar)
--   ya hace exactamente lo mismo que esta funcion: status=... ,
--   finished_at=clock_timestamp(). Esta automatizacion es consistente
--   con ese patron existente, no inventa uno nuevo.
-- - api_admin_summary (el unico calculo de metricas que existe) filtra
--   TODO por queue_date=current_date. Ningun turno de una jornada
--   anterior -- tocado por este job o no -- entra jamas en ese calculo.
--   Por eso este job no puede distorsionar metricas historicas.
--
-- Politica (3 casos):
-- 1) esperando de jornadas anteriores -> cancelado (nadie continuo el
--    proceso).
-- 2) llamado de jornadas anteriores -> ausente (fue llamado, nunca se
--    presento).
-- 3) en_atencion de jornadas anteriores -> NO se cierra automaticamente.
--    Es el unico caso ambiguo (podria ser una atencion real que el
--    operador olvido cerrar, o un abandono a mitad de atencion) y
--    cerrarlo solo como "finalizado" inflaria falsamente las metricas
--    de atenciones completadas. Queda visible en una vista dedicada
--    para revision humana.

begin;

create extension if not exists pg_cron;

create or replace function public.api_expire_stale_turns()
 returns jsonb
 language plpgsql
 security definer
 set search_path to ''
as $function$
declare
  v_run_id uuid := gen_random_uuid();
  v_cancelled_count int := 0;
  v_absent_count int := 0;
  v_pending_review_count int := 0;
begin
  with updated as (
    update public.turns
    set status = 'cancelado', finished_at = clock_timestamp()
    where status = 'esperando' and queue_date < current_date
    returning id, sector_id
  ),
  logged as (
    insert into public.turn_events(turn_id, sector_id, event_type, from_status, to_status, metadata)
    select id, sector_id, 'auto_expired', 'esperando', 'cancelado',
      jsonb_build_object('run_id', v_run_id, 'reason', 'jornada_anterior_sin_llamar')
    from updated
    returning 1
  )
  select count(*) into v_cancelled_count from logged;

  with updated as (
    update public.turns
    set status = 'ausente', finished_at = clock_timestamp()
    where status = 'llamado' and queue_date < current_date
    returning id, sector_id
  ),
  logged as (
    insert into public.turn_events(turn_id, sector_id, event_type, from_status, to_status, metadata)
    select id, sector_id, 'auto_expired', 'llamado', 'ausente',
      jsonb_build_object('run_id', v_run_id, 'reason', 'jornada_anterior_no_se_presento')
    from updated
    returning 1
  )
  select count(*) into v_absent_count from logged;

  select count(*) into v_pending_review_count
  from public.turns
  where status = 'en_atencion' and queue_date < current_date;

  return jsonb_build_object(
    'run_id', v_run_id,
    'ran_at', clock_timestamp(),
    'cancelados', v_cancelled_count,
    'ausentes', v_absent_count,
    'en_atencion_pendientes_revision', v_pending_review_count
  );
end;
$function$;

-- Vista para que un supervisor identifique de un vistazo los turnos
-- en_atencion de jornadas anteriores que quedaron sin cerrar -- el
-- unico caso que este job deliberadamente no toca.
create or replace view public.v_turns_pending_manual_review as
select id, tracking_code, visible_number, sector_id, category_id,
  service_point_id, operator_id, queue_date, created_at, started_at
from public.turns
where status = 'en_atencion' and queue_date < current_date;

-- Disparo: pg_cron, una corrida diaria a las 06:00 UTC (03:00 hora
-- Argentina, horario de bajo trafico real segun lo verificado durante
-- las pruebas de carga de esta misma jornada).
select cron.schedule(
  'expire-stale-turns-daily',
  '0 6 * * *',
  $$select public.api_expire_stale_turns();$$
);

commit;

-- === ROLLBACK ===
-- Desactivar el disparo automatico (deja intactos los turnos ya
-- cerrados por corridas anteriores del job -- esto NO revierte datos,
-- solo detiene corridas futuras):
--
-- select cron.unschedule('expire-stale-turns-daily');
-- drop view if exists public.v_turns_pending_manual_review;
-- drop function if exists public.api_expire_stale_turns();
--
-- Si hiciera falta revertir los cambios de UNA corrida especifica del
-- job (por ejemplo, si se detecta que cerro turnos incorrectamente),
-- cada evento que genero queda etiquetado con su run_id en
-- turn_events.metadata. Para encontrar y revertir una corrida puntual:
--
-- select turn_id, from_status, to_status, metadata->>'run_id' as run_id
-- from turn_events where event_type='auto_expired'
-- and metadata->>'run_id' = '<run_id a revertir>';
--
-- -- y despues, por cada turn_id encontrado:
-- update turns set status=<from_status de esa fila>, finished_at=null
-- where id=<turn_id>;
--
-- Este es un rollback de datos puntual, no generico -- requiere el
-- run_id exacto de la corrida que se quiere deshacer.
