-- tests/load/fixtures/01_seed_synthetic.sql
--
-- Datos 100% sinteticos para pruebas locales. Ningun dato real. IDs fijos
-- (no gen_random_uuid) para que el workflow y los scripts de prueba
-- puedan referenciarlos de forma predecible.

insert into public.sectors (id, slug, name, prefix, active, sort_order) values
  ('00000000-0000-4000-8000-000000000001', 'ingreso', 'Ingreso (prueba local)', 'ING', true, 1);

insert into public.categories (id, sector_id, slug, name, target_minutes, prefix, active, sort_order) values
  ('00000000-0000-4000-8000-000000000101', '00000000-0000-4000-8000-000000000001', 'inscripcion', 'Inscripción (prueba)', 8, 'INS', true, 1),
  ('00000000-0000-4000-8000-000000000102', '00000000-0000-4000-8000-000000000001', 'informes', 'Informes (prueba)', 5, 'INF', true, 2),
  ('00000000-0000-4000-8000-000000000103', '00000000-0000-4000-8000-000000000001', 'equivalencias-externas', 'Equivalencias externas (prueba)', 12, 'EQE', true, 3);

insert into public.campuses (id, slug, name, active) values
  ('00000000-0000-4000-8000-000000000201', 'campus-prueba', 'Campus de prueba', true);

insert into public.service_points (id, campus_id, sector_id, code, name, active) values
  ('00000000-0000-4000-8000-000000000301', '00000000-0000-4000-8000-000000000201', '00000000-0000-4000-8000-000000000001', 'BOX-T1', 'Box de prueba 1', true);
