-- 0005_box_scoping_by_queue_date.sql
--
-- ESTADO: NO aplicada todavia en produccion. Preparada y probada
-- exhaustivamente en un Postgres efimero (rama ci/free-local-loadtest,
-- workflow .github/workflows/box-scoping-repro.yml, corridas #1 a #13).
--
-- CAUSA RAIZ (confirmada leyendo el codigo real, no supuesta):
-- turns_one_active_per_service_point_idx es UNIQUE(service_point_id)
-- WHERE status IN ('llamado','en_atencion') -- SIN fecha. Es global,
-- no por jornada.
--
-- Las 4 funciones que asignan un box (api_call_next_v2,
-- api_call_next_category, api_call_specific_turn, api_transfer_turn)
-- SI filtran su chequeo de negocio ("Ese box ya tiene un turno activo")
-- por queue_date=current_date. Por eso, cuando un box quedo con un
-- turno de un dia anterior sin cerrar (ver hallazgo de los 56 turnos
-- historicos), la funcion cree que puede proceder -- pero el UPDATE
-- final choca contra el indice global y el operador recibe un error
-- crudo de Postgres (duplicate key), no el mensaje de negocio.
--
-- CONFIRMADO CONTRA PRODUCCION: 6 boxes activos (Box 1, 2, 5, 8, 9, 10)
-- tienen hoy un turno historico de dias anteriores todavia en
-- llamado/en_atencion, ocupando ese indice.
--
-- FIX: la unicidad debe aplicarse por (service_point_id, queue_date),
-- no solo por service_point_id. Ningun cambio de codigo de aplicacion
-- es necesario -- las 4 funciones ya estan escritas asumiendo ese
-- modelo "por jornada"; solo el indice estaba desalineado.
--
-- EVIDENCIA (5 verificaciones, cada una reproducida con datos sinteticos
-- en un Postgres real, no simulada):
-- 1) Turno historico en un box + turno de hoy en el MISMO box -> PERMITIDO.
-- 2) Dos turnos activos del MISMO dia en el mismo box -> BLOQUEADO
--    (el DETAIL del error ahora incluye la fecha, confirmando que es
--    el indice nuevo el que actua).
-- 3) Dos operadores reales llamando al MISMO box a la vez (concurrencia
--    genuina, dos procesos psql en paralelo) -> exactamente uno gana;
--    el que pierde recibe el mensaje de negocio limpio "Ese box ya
--    tiene un turno activo" (no un error crudo); la base queda con
--    exactamente 1 turno activo en ese box.
-- 4) api_transfer_turn hacia un box ocupado HOY -> BLOQUEADO, con el
--    mismo mensaje de negocio limpio.
-- 5) api_transfer_turn hacia un box que solo tiene un turno historico
--    ocupandolo -> PERMITIDO.
--
-- NO se tocan los 56 turnos historicos reales. No se modifica ninguna
-- de las 4 funciones -- su logica ya era correcta.

begin;

drop index if exists public.turns_one_active_per_service_point_idx;

create unique index turns_one_active_per_service_point_idx
  on public.turns (service_point_id, queue_date)
  where (service_point_id is not null and status in ('llamado', 'en_atencion'));

commit;

-- === ROLLBACK ===
-- Si hiciera falta revertir esta migracion (por ejemplo, si aparece un
-- efecto secundario no previsto), ejecutar en una transaccion separada:
--
-- begin;
-- drop index if exists public.turns_one_active_per_service_point_idx;
-- create unique index turns_one_active_per_service_point_idx
--   on public.turns (service_point_id)
--   where (service_point_id is not null and status in ('llamado', 'en_atencion'));
-- commit;
--
-- Riesgo del rollback: en el momento de revertir, si alguno de los 6
-- boxes ya tiene un turno de HOY asignado gracias a este fix, y ese
-- mismo box todavia tiene tambien el turno historico viejo sin cerrar,
-- el CREATE UNIQUE INDEX del rollback puede fallar por violar la
-- unicidad vieja (dos filas con el mismo service_point_id). En ese
-- caso, el rollback requeriria primero cerrar manualmente (marcar
-- ausente/finalizado) los turnos historicos de esos boxes especificos
-- antes de poder recrear el indice viejo -- exactamente la Prioridad 2
-- de esta jornada.
