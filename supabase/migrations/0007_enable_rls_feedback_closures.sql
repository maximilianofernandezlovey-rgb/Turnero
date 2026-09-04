-- 0007_enable_rls_feedback_closures.sql
--
-- ESTADO: NO aplicada todavia en produccion. Bloque 3 (seguridad) de la
-- jornada de ingenieria.
--
-- HALLAZGO P0 (confirmado contra produccion, no supuesto):
-- De las 22 tablas de public, 20 tienen RLS habilitado con CERO
-- policies -- el patron deliberado de este sistema: RLS activo sin
-- policies BLOQUEA todo acceso directo via anon/authenticated, forzando
-- que todo pase por funciones SECURITY DEFINER (que corren como el
-- dueno de la funcion, no como el rol que hizo el request).
--
-- Dos tablas quedaron AFUERA de ese patron: turn_feedback y
-- turn_service_closures. Ambas tienen RLS deshabilitado, Y ademas
-- 'anon' (cualquier visitante sin autenticar, con solo la clave publica)
-- tiene grants directos de SELECT, INSERT, UPDATE, DELETE y TRUNCATE
-- sobre las dos -- confirmado via information_schema.role_table_grants.
--
-- Impacto real verificado: cualquier persona, sin autenticarse, podria
-- leer/modificar/borrar el feedback de turnos de otros usuarios
-- (2 filas actuales) y los cierres de atencion (30 filas actuales) --
-- incluyendo vaciar las tablas por completo (TRUNCATE).
--
-- Verificado que el fix NO rompe el flujo real de la app: existen
-- api_submit_turn_feedback y api_save_turn_closure, ambas SECURITY
-- DEFINER, que ya son el camino real por el que la aplicacion escribe
-- en estas tablas. El grant directo de anon/authenticated nunca fue
-- necesario para que la app funcione -- es un boquete sin proposito
-- funcional.

begin;

alter table public.turn_feedback enable row level security;
alter table public.turn_service_closures enable row level security;

revoke all on public.turn_feedback from anon, authenticated;
revoke all on public.turn_service_closures from anon, authenticated;

commit;

-- === ROLLBACK ===
-- begin;
-- alter table public.turn_feedback disable row level security;
-- alter table public.turn_service_closures disable row level security;
-- grant select, insert, update, delete, truncate, references, trigger
--   on public.turn_feedback to anon, authenticated;
-- grant select, insert, update, delete, truncate, references, trigger
--   on public.turn_service_closures to anon, authenticated;
-- commit;
--
-- Riesgo del rollback: reabre exactamente el boquete que esta migracion
-- cierra. Solo deberia usarse si se detecta que alguna ruta legitima de
-- la aplicacion dependia del acceso directo (no encontrada en esta
-- auditoria).
