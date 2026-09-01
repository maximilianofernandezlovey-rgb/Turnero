-- tests/db/box_date_scoping_repro.sql
--
-- Reproduccion aislada y acotada del P0: turns_one_active_per_service_point_idx
-- no filtra por queue_date, mientras que las 4 funciones que asignan
-- service_point_id (api_call_next_v2, api_call_next_category,
-- api_call_specific_turn, api_transfer_turn) SI filtran por queue_date en
-- su chequeo de negocio. Resultado: la funcion cree que puede proceder,
-- pero el UPDATE final choca contra el indice global y tira un error
-- crudo de Postgres, no el mensaje de negocio esperado.
--
-- Corre SOLO contra el Postgres efimero de este workflow. Requiere que
-- 00_schema.sql y 01_seed_synthetic.sql ya se hayan aplicado.

\set ON_ERROR_STOP off

-- === PASO 1: preparar el escenario (turno historico ocupando un box) ===
insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status, service_point_id, called_at)
values (
  '00000000-0000-4000-8000-000000000901',
  'REPRO-HIST-BOX',
  current_date - 5,
  1,
  'TEST-HIST-1',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'llamado',
  '00000000-0000-4000-8000-000000000301',
  now() - interval '5 days'
);

insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status)
values (
  '00000000-0000-4000-8000-000000000902',
  'REPRO-HOY-1',
  current_date,
  2,
  'TEST-HOY-1',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'esperando'
);

-- === PASO 2: reproducir el fallo con el indice VIEJO (sin queue_date) ===
-- Replica exactamente lo que hace el UPDATE final de api_call_next_v2.
-- Se espera que esto FALLE con unique_violation (23505).
update public.turns
set status='llamado', called_at=now(), service_point_id='00000000-0000-4000-8000-000000000301'
where id='00000000-0000-4000-8000-000000000902';

-- Verificacion 1: con el indice viejo, el turno de HOY no debe haber
-- quedado asignado al box (el UPDATE de arriba tuvo que fallar).
select
  case when service_point_id is null
    then 'REPRO_OK: fallo como se esperaba, turno de hoy sigue sin box (bug reproducido)'
    else 'REPRO_FALLIDA: el turno de hoy quedo asignado, no se reprodujo el bug'
  end as resultado_paso_2
from public.turns where id='00000000-0000-4000-8000-000000000902';

\set ON_ERROR_STOP on

-- === PASO 3: aplicar el fix propuesto ===
drop index if exists public.turns_one_active_per_service_point_idx;
create unique index turns_one_active_per_service_point_idx
  on public.turns (service_point_id, queue_date)
  where (service_point_id is not null and status in ('llamado','en_atencion'));

-- === PASO 4: reintentar la misma operacion -- ahora debe funcionar ===
update public.turns
set status='llamado', called_at=now(), service_point_id='00000000-0000-4000-8000-000000000301'
where id='00000000-0000-4000-8000-000000000902';

select
  case when service_point_id='00000000-0000-4000-8000-000000000301'
    then 'FIX_OK: el turno de hoy se asigno correctamente al box, pese al turno historico'
    else 'FIX_FALLIDO: el turno de hoy no se pudo asignar'
  end as resultado_paso_4
from public.turns where id='00000000-0000-4000-8000-000000000902';

-- === PASO 5: confirmar que la proteccion REAL (mismo dia) sigue intacta ===
insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status)
values (
  '00000000-0000-4000-8000-000000000903',
  'REPRO-HOY-2',
  current_date,
  3,
  'TEST-HOY-2',
  '00000000-0000-4000-8000-000000000001',
  '00000000-0000-4000-8000-000000000101',
  'esperando'
);

\set ON_ERROR_STOP off
update public.turns
set status='llamado', called_at=now(), service_point_id='00000000-0000-4000-8000-000000000301'
where id='00000000-0000-4000-8000-000000000903';
\set ON_ERROR_STOP on

select
  case when service_point_id is null
    then 'PROTECCION_OK: un segundo turno del MISMO dia no pudo tomar el box ya ocupado hoy'
    else 'PROTECCION_ROTA: dos turnos del mismo dia lograron compartir el box -- CRITICO'
  end as resultado_paso_5
from public.turns where id='00000000-0000-4000-8000-000000000903';

-- === PASO 6: api_transfer_turn REAL contra un box con SOLO historico -> permitido ===
insert into public.app_users (id, username, display_name, password_hash, role, active)
values ('00000000-0000-4000-8000-000000000801', 'repro.test.operator', 'Repro Test', extensions.crypt('repro-test-pass', extensions.gen_salt('bf')), 'operator', true);
insert into public.user_sector_memberships (user_id, sector_id) values ('00000000-0000-4000-8000-000000000801', '00000000-0000-4000-8000-000000000001');
insert into public.auth_sessions (id, user_id, token_hash, expires_at)
values ('00000000-0000-4000-8000-000000000802', '00000000-0000-4000-8000-000000000801', extensions.digest('repro-test-token','sha256'), now() + interval '1 hour');

insert into public.service_points (id, campus_id, sector_id, code, name, active) values
  ('00000000-0000-4000-8000-000000000302', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'BOX-T2', 'Box de prueba 2 (con solo historico)', true),
  ('00000000-0000-4000-8000-000000000303', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'BOX-T3', 'Box de prueba 3 (origen)', true);

insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status, service_point_id, called_at, operator_id)
values ('00000000-0000-4000-8000-000000000904', 'REPRO-XFER-SRC', current_date, 4, 'TEST-XFER-1', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'llamado', '00000000-0000-4000-8000-000000000303', now(), '00000000-0000-4000-8000-000000000801');

update public.turns set service_point_id='00000000-0000-4000-8000-000000000302' where id='00000000-0000-4000-8000-000000000901';

select public.api_transfer_turn('repro-test-token', '00000000-0000-4000-8000-000000000904', null, '00000000-0000-4000-8000-000000000302') as resultado_transferencia_a_box_con_historico;

select
  case when service_point_id='00000000-0000-4000-8000-000000000302'
    then 'XFER_HISTORICO_OK: transferencia a box con solo turno historico fue permitida'
    else 'XFER_HISTORICO_FALLIDO: la transferencia no se aplico'
  end as resultado_paso_6
from public.turns where id='00000000-0000-4000-8000-000000000904';

-- === PASO 7: api_transfer_turn REAL contra un box ocupado HOY -> bloqueado ===
insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status, service_point_id, called_at, operator_id)
values ('00000000-0000-4000-8000-000000000905', 'REPRO-XFER-SRC2', current_date, 5, 'TEST-XFER-2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'llamado', '00000000-0000-4000-8000-000000000303', now(), '00000000-0000-4000-8000-000000000801');

update public.turns set service_point_id='00000000-0000-4000-8000-000000000301' where id='00000000-0000-4000-8000-000000000902';

\set ON_ERROR_STOP off
select public.api_transfer_turn('repro-test-token', '00000000-0000-4000-8000-000000000905', null, '00000000-0000-4000-8000-000000000302') as intento_transferencia_a_box_ocupado_hoy;
\set ON_ERROR_STOP on

select
  case when service_point_id='00000000-0000-4000-8000-000000000303'
    then 'XFER_BLOQUEO_OK: transferencia a box ocupado HOY fue rechazada, turno sigue en su box original'
    else 'XFER_BLOQUEO_FALLIDO: la transferencia se aplico pese a estar el box ocupado -- CRITICO'
  end as resultado_paso_7
from public.turns where id='00000000-0000-4000-8000-000000000905';

delete from public.turn_events where turn_id in ('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000905');
delete from public.turns where id in ('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000905');
delete from public.turns where id in ('00000000-0000-4000-8000-000000000904','00000000-0000-4000-8000-000000000905');
delete from public.auth_sessions where id='00000000-0000-4000-8000-000000000802';
delete from public.user_sector_memberships where user_id='00000000-0000-4000-8000-000000000801';
delete from public.app_users where id='00000000-0000-4000-8000-000000000801';

-- limpieza de este test especifico
delete from public.turns where id in (
  '00000000-0000-4000-8000-000000000901',
  '00000000-0000-4000-8000-000000000902',
  '00000000-0000-4000-8000-000000000903'
);
delete from public.service_points where id in ('00000000-0000-4000-8000-000000000302','00000000-0000-4000-8000-000000000303');
