-- tests/db/rls_feedback_closures_repro.sql
--
-- Reproduce el hallazgo P0 (anon con acceso directo sin RLS a
-- turn_feedback / turn_service_closures) contra el estado ACTUAL del
-- fixture (que replica produccion tal cual esta hoy, vulnerable), y
-- confirma que la migracion 0007 lo corrige, sin romper el patron
-- general de "RLS habilitado sin policies + funciones SECURITY DEFINER
-- siguen funcionando" (verificado con api_create_turn, que ya usa
-- exactamente ese patron sobre la tabla turns).
--
-- Corre SOLO contra el Postgres efimero de este workflow.

insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status)
values ('00000000-0000-4000-8000-000000000940', 'RLS-REPRO-TURN', current_date, 40, 'TEST-RLS', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'esperando');

-- === PASO 1: reproducir el problema -- anon puede escribir DIRECTO ===
set role anon;
\set ON_ERROR_STOP off
insert into public.turn_feedback (turn_id, rating, comment, contact_email)
values ('00000000-0000-4000-8000-000000000940', 5, 'deberia estar bloqueado', 'ataque@ejemplo.com');
\set ON_ERROR_STOP on
reset role;

select
  case when exists(select 1 from public.turn_feedback where comment='deberia estar bloqueado')
    then 'REPRO_OK: anon pudo escribir directo en turn_feedback antes del fix (bug confirmado)'
    else 'REPRO_FALLIDA: anon no pudo escribir -- no se reprodujo el problema'
  end as resultado_paso_1;

-- === PASO 2: aplicar el fix (mismo DDL de 0007) ===
alter table public.turn_feedback enable row level security;
alter table public.turn_service_closures enable row level security;
revoke all on public.turn_feedback from anon, authenticated;
revoke all on public.turn_service_closures from anon, authenticated;

-- limpio la fila que anon logro insertar en el paso 1, antes de reintentar
delete from public.turn_feedback where comment='deberia estar bloqueado';

-- === PASO 3: confirmar que anon YA NO puede, ni con RLS ni con los grants revocados ===
set role anon;
\set ON_ERROR_STOP off
insert into public.turn_feedback (turn_id, rating, comment, contact_email)
values ('00000000-0000-4000-8000-000000000940', 1, 'no deberia poder insertar esto', 'otro@ejemplo.com');
\set ON_ERROR_STOP on
reset role;

select
  case when not exists(select 1 from public.turn_feedback where comment='no deberia poder insertar esto')
    then 'FIX_OK: anon ya no puede escribir directo en turn_feedback tras el fix'
    else 'FIX_FALLIDO: anon todavia pudo escribir -- CRITICO'
  end as resultado_paso_3;

-- lo mismo para turn_service_closures
set role anon;
\set ON_ERROR_STOP off
insert into public.turn_service_closures (turn_id, career_interest)
values ('00000000-0000-4000-8000-000000000940', 'no deberia poder insertar esto');
\set ON_ERROR_STOP on
reset role;

select
  case when not exists(select 1 from public.turn_service_closures where career_interest='no deberia poder insertar esto')
    then 'FIX_OK: anon ya no puede escribir directo en turn_service_closures tras el fix'
    else 'FIX_FALLIDO: anon todavia pudo escribir en turn_service_closures -- CRITICO'
  end as resultado_paso_3b;

-- === PASO 4: el patron general (RLS sin policies + SECURITY DEFINER) sigue funcionando ===
-- Prueba de humo con una funcion real ya existente que usa exactamente
-- este patron sobre la tabla turns (RLS habilitado, cero policies).
-- No reemplaza probar api_submit_turn_feedback/api_save_turn_closure
-- en si (no estan en este fixture); confirma el principio general.
select
  case when (api_create_turn('00000000-0000-4000-8000-000000000001'::uuid,'00000000-0000-4000-8000-000000000101'::uuid,'RLS-SMOKE-TEST')->>'ok')::boolean
    then 'SMOKE_OK: una funcion SECURITY DEFINER real sigue funcionando con RLS sin policies'
    else 'SMOKE_FALLIDO: la funcion fallo tras el fix -- revisar'
  end as resultado_paso_4;

-- limpieza
delete from public.turns where tracking_code in ('RLS-REPRO-TURN') or request_id='RLS-SMOKE-TEST';
delete from public.turn_feedback where turn_id='00000000-0000-4000-8000-000000000940';
delete from public.turn_service_closures where turn_id='00000000-0000-4000-8000-000000000940';
