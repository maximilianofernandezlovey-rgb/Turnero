-- tests/db/operator_concurrency_repro.sql
--
-- Bloque 2: concurrencia real entre operadores. Setup unico: 1 turno
-- esperando + 2 operadores con sesion real + 2 boxes distintos. Los 3
-- escenarios (llamar, iniciar, finalizar) se corren en secuencia sobre
-- el MISMO turno, siguiendo su ciclo de vida real -- el workflow que
-- invoca este archivo dispara cada escenario de a dos procesos psql
-- en paralelo, entre paso y paso.
--
-- Corre SOLO contra el Postgres efimero de este workflow.

insert into public.service_points (id, campus_id, sector_id, code, name, active) values
  ('00000000-0000-4000-8000-000000000401', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'BOX-CA', 'Box concurrencia A', true),
  ('00000000-0000-4000-8000-000000000402', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'BOX-CB', 'Box concurrencia B', true);

insert into public.app_users (id, username, display_name, password_hash, role, active) values
  ('00000000-0000-4000-8000-000000000411', 'concur2.op.a', 'Concur2 A', extensions.crypt('a', extensions.gen_salt('bf')), 'operator', true),
  ('00000000-0000-4000-8000-000000000412', 'concur2.op.b', 'Concur2 B', extensions.crypt('b', extensions.gen_salt('bf')), 'operator', true);

insert into public.user_sector_memberships (user_id, sector_id) values
  ('00000000-0000-4000-8000-000000000411', '00000000-0000-4000-8000-000000000001'),
  ('00000000-0000-4000-8000-000000000412', '00000000-0000-4000-8000-000000000001');

insert into public.auth_sessions (id, user_id, token_hash, expires_at) values
  ('00000000-0000-4000-8000-000000000413', '00000000-0000-4000-8000-000000000411', extensions.digest('concur2-token-a','sha256'), now() + interval '1 hour'),
  ('00000000-0000-4000-8000-000000000414', '00000000-0000-4000-8000-000000000412', extensions.digest('concur2-token-b','sha256'), now() + interval '1 hour');

insert into public.turns (id, tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, status)
values ('00000000-0000-4000-8000-000000000930', 'CONCUR2-TURN', current_date, 30, 'TEST-CONCUR2', '00000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000101', 'esperando');

select 'setup_listo' as resultado;
