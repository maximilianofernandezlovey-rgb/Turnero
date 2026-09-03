-- tests/db/expire_stale_turns_repro.sql
--
-- Verifica el job de expiracion automatica (Prioridad 2) contra un
-- escenario real: turnos de HOY y de AYER en cada estado relevante.
-- Corre SOLO contra el Postgres efimero de este workflow. Requiere que
-- 00_schema.sql, 01_seed_synthetic.sql y la migracion 0006 ya se hayan
-- aplicado.

-- === Escenario: 3 pares (ayer / hoy) en cada estado relevante ===
insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status)
values
  ('00000000-0000-4000-8000-000000000920', 'EXP-ESP-AYER', current_date - 1, 20, 'TEST-EXP-1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'esperando'),
  ('00000000-0000-4000-8000-000000000921', 'EXP-ESP-HOY',  current_date,     21, 'TEST-EXP-2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'esperando'),
  ('00000000-0000-4000-8000-000000000922', 'EXP-LLA-AYER', current_date - 1, 22, 'TEST-EXP-3', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'llamado'),
  ('00000000-0000-4000-8000-000000000923', 'EXP-LLA-HOY',  current_date,     23, 'TEST-EXP-4', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'llamado'),
  ('00000000-0000-4000-8000-000000000924', 'EXP-ATE-AYER', current_date - 1, 24, 'TEST-EXP-5', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'en_atencion'),
  ('00000000-0000-4000-8000-000000000925', 'EXP-ATE-HOY',  current_date,     25, 'TEST-EXP-6', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'en_atencion');

-- === PRIMERA CORRIDA ===
select public.api_expire_stale_turns() as resultado_primera_corrida;

-- CHEQUEO 1 y 2: solo jornadas anteriores, nunca hoy
select
  id, status,
  case
    when id='00000000-0000-4000-8000-000000000920' and status='cancelado' then 'OK: esperando de ayer -> cancelado'
    when id='00000000-0000-4000-8000-000000000921' and status='esperando' then 'OK: esperando de HOY intacto'
    when id='00000000-0000-4000-8000-000000000922' and status='ausente' then 'OK: llamado de ayer -> ausente'
    when id='00000000-0000-4000-8000-000000000923' and status='llamado' then 'OK: llamado de HOY intacto'
    when id='00000000-0000-4000-8000-000000000924' and status='en_atencion' then 'OK: en_atencion de ayer NO se toco (queda para revision)'
    when id='00000000-0000-4000-8000-000000000925' and status='en_atencion' then 'OK: en_atencion de HOY intacto'
    else 'FALLO: estado inesperado para ' || id
  end as resultado_chequeo_1_2
from public.turns
where id in (
  '00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000921',
  '00000000-0000-4000-8000-000000000922','00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924','00000000-0000-4000-8000-000000000925'
)
order by id;

-- CHEQUEO 4: auditoria -- deben existir exactamente 2 eventos auto_expired
-- para este run_id (uno por cada turno realmente cerrado), con from/to
-- correctos.
select event_type, from_status, to_status, metadata->>'reason' as reason
from public.turn_events
where turn_id in ('00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000922')
and event_type='auto_expired'
order by turn_id;

select
  case when count(*)=2 then 'OK: exactamente 2 eventos de auditoria auto_expired registrados'
  else 'FALLO: se esperaban 2 eventos auto_expired, hay ' || count(*)
  end as resultado_chequeo_4
from public.turn_events
where turn_id in ('00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000922')
and event_type='auto_expired';

-- CHEQUEO 6: los en_atencion viejos son detectables via la vista dedicada
select
  case when exists(select 1 from public.v_turns_pending_manual_review where id='00000000-0000-4000-8000-000000000924')
  then 'OK: el en_atencion de ayer aparece en v_turns_pending_manual_review'
  else 'FALLO: no aparece en la vista de revision manual'
  end as resultado_chequeo_6_incluido;

select
  case when not exists(select 1 from public.v_turns_pending_manual_review where id='00000000-0000-4000-8000-000000000925')
  then 'OK: el en_atencion de HOY NO aparece en la vista (correcto, no es una jornada anterior)'
  else 'FALLO: el turno de hoy aparecio incorrectamente en la vista'
  end as resultado_chequeo_6_excluido;

-- === SEGUNDA CORRIDA (idempotencia) -- UNA sola invocacion adicional,
-- guardada en una tabla temporal para no volver a invocar la funcion
-- al momento de chequear su resultado ===
create temp table temp_segunda_corrida as
select public.api_expire_stale_turns() as resultado;

select resultado as resultado_segunda_corrida from temp_segunda_corrida;

-- CHEQUEO 3: la segunda corrida no debe encontrar nada nuevo que cerrar
select
  case when (resultado->>'cancelados')::int = 0 and (resultado->>'ausentes')::int = 0
  then 'OK: segunda corrida no cerro nada nuevo (idempotente)'
  else 'FALLO: la segunda corrida volvio a cerrar turnos -- no es idempotente'
  end as resultado_chequeo_3
from temp_segunda_corrida;

-- CHEQUEO 3b: tampoco debe haber duplicado los eventos de auditoria
select
  case when count(*)=2 then 'OK: siguen siendo exactamente 2 eventos, no se duplicaron'
  else 'FALLO: los eventos se duplicaron, hay ' || count(*)
  end as resultado_chequeo_3b
from public.turn_events
where turn_id in ('00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000922')
and event_type='auto_expired';

-- limpieza de este test especifico
delete from public.turn_events where turn_id in (
  '00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000921',
  '00000000-0000-4000-8000-000000000922','00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924','00000000-0000-4000-8000-000000000925'
);
delete from public.turns where id in (
  '00000000-0000-4000-8000-000000000920','00000000-0000-4000-8000-000000000921',
  '00000000-0000-4000-8000-000000000922','00000000-0000-4000-8000-000000000923',
  '00000000-0000-4000-8000-000000000924','00000000-0000-4000-8000-000000000925'
);
