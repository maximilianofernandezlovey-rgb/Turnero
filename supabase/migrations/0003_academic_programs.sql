-- 0003_academic_programs.sql
--
-- ESTADO: ya aplicada directamente sobre la base de producción
-- (seudafbngbvyqlktlaoc) el 24/08/2026, incluida la carga de 71
-- carreras. Este archivo queda como registro de lo que se corrió,
-- para que "supabase db reset" / un ambiente nuevo puedan
-- reproducir el mismo esquema. Es idempotente (create table/index
-- if not exists, create or replace function) y puramente aditiva:
-- no borra ni modifica columnas, tablas ni funciones existentes,
-- salvo agregar una columna nueva a turn_service_closures y un
-- parámetro nuevo (con default null) a api_save_turn_closure.
--
-- Fuente del catálogo: https://www.uade.edu.ar/carreras/ y páginas
-- oficiales de facultad/área. La carga de datos (71 filas) no está
-- en este archivo por su tamaño; ver el catálogo documentado en el
-- chat que generó este cambio si hace falta re-sembrar desde cero.

create table if not exists public.academic_programs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  faculty text not null,
  program_type text not null default 'grado' check (program_type in ('grado','tecnicatura')),
  campus text not null default 'Buenos Aires',
  modality text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_academic_programs_active_name
  on public.academic_programs (active, name);

alter table public.academic_programs enable row level security;

create or replace function public.api_search_academic_programs(p_query text default '')
returns table (id uuid, name text, faculty text, program_type text)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_needle text;
begin
  v_needle := translate(lower(coalesce(trim(p_query), '')), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN');
  return query
  select ap.id, ap.name, ap.faculty, ap.program_type
  from public.academic_programs ap
  where ap.active = true
    and (
      v_needle = ''
      or translate(lower(ap.name), 'áéíóúüñÁÉÍÓÚÜÑ', 'aeiouunAEIOUUN') like '%' || v_needle || '%'
    )
  order by ap.name
  limit 15;
end;
$$;

comment on table public.academic_programs is
  'Catálogo de carreras oficiales de UADE (grado + tecnicaturas), fuente: uade.edu.ar/carreras/. Usado para el autocomplete de carrera de interés en el cierre de atención de /operadores.';

alter table public.turn_service_closures
  add column if not exists academic_program_id uuid references public.academic_programs(id);

CREATE OR REPLACE FUNCTION public.api_save_turn_closure(p_token text, p_turn_id uuid, p_career_interest text DEFAULT NULL::text, p_residence_interest boolean DEFAULT NULL::boolean, p_scholarship_interest boolean DEFAULT NULL::boolean, p_operator_comment text DEFAULT NULL::text, p_academic_program_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare su record; t public.turns%rowtype; c public.turn_service_closures%rowtype;
begin
  select * into su from private.session_user(p_token);
  if su.user_id is null then raise exception 'Sesión inválida'; end if;
  select * into t from public.turns where id=p_turn_id;
  if t.id is null or not private.can_access_sector(su.user_id,su.role,t.sector_id) then raise exception 'Acceso denegado'; end if;
  if t.status <> 'finalizado' then raise exception 'El turno debe estar finalizado para guardar el cierre'; end if;

  insert into public.turn_service_closures(turn_id,operator_id,career_interest,residence_interest,scholarship_interest,operator_comment,academic_program_id)
  values(t.id,su.user_id,nullif(trim(p_career_interest),''),p_residence_interest,p_scholarship_interest,nullif(trim(p_operator_comment),''),p_academic_program_id)
  on conflict(turn_id) do update set
    operator_id=excluded.operator_id,
    career_interest=excluded.career_interest,
    residence_interest=excluded.residence_interest,
    scholarship_interest=excluded.scholarship_interest,
    operator_comment=excluded.operator_comment,
    academic_program_id=excluded.academic_program_id,
    updated_at=now()
  returning * into c;

  insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id,metadata)
  values(t.id,t.sector_id,'closure_saved',t.status,t.status,su.user_id,jsonb_build_object('closure_id',c.id));

  return jsonb_build_object('id',c.id,'turn_id',c.turn_id,'career_interest',c.career_interest,'residence_interest',c.residence_interest,'scholarship_interest',c.scholarship_interest,'operator_comment',c.operator_comment,'academic_program_id',c.academic_program_id);
end;
$function$;
