-- tests/load/fixtures/00_schema.sql
--
-- Fixture de SOLO ESTRUCTURA para pruebas locales en GitHub Actions.
-- Extraido por lectura (information_schema / pg_proc / pg_constraint /
-- pg_indexes) contra el proyecto real de Supabase, el 25/08. Cero datos
-- reales, cero PII. Esto NO es una migracion de produccion: vive
-- exclusivamente en tests/load/fixtures/ y solo se aplica dentro del
-- Postgres efimero que levanta "supabase start" en el workflow de CI.
--
-- Incluye api_create_turn en su version ORIGINAL (con la race condition
-- de idempotencia ya documentada) a proposito: el workflow la aplica
-- primero, corre la prueba de concurrencia para reproducir el problema,
-- y recien despues aplica supabase/migrations/0004_idempotent_turn_creation.sql
-- para probar que lo corrige. api_get_turn_v2 y api_tag_turn_origin
-- tambien se incluyen porque api_create_turn (version original) depende
-- de la primera, y la ruta /api/turns/create llama a la segunda.

create extension if not exists "uuid-ossp";
create extension if not exists pgcrypto;
create extension if not exists citext;

create table public.app_users (
  id uuid primary key default gen_random_uuid(),
  username citext not null unique,
  display_name text not null,
  password_hash text not null,
  role text not null check (role in ('admin','supervisor','operator')),
  active boolean not null default true,
  must_change_password boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.sectors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  prefix text not null,
  description text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  sector_id uuid not null references public.sectors(id),
  slug text not null,
  name text not null,
  description text,
  active boolean not null default true,
  target_minutes integer not null default 10,
  sort_order integer not null default 0,
  prefix text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (sector_id, slug)
);

create table public.campuses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  address text,
  timezone text not null default 'America/Argentina/Buenos_Aires',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.service_points (
  id uuid primary key default gen_random_uuid(),
  campus_id uuid not null references public.campuses(id),
  sector_id uuid not null references public.sectors(id),
  code text not null,
  name text not null,
  floor text,
  location_description text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.qr_points (
  id uuid primary key default gen_random_uuid(),
  public_code text not null unique,
  campus_id uuid not null references public.campuses(id),
  sector_id uuid not null references public.sectors(id),
  service_point_id uuid references public.service_points(id),
  label text not null,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_sector_memberships (
  user_id uuid not null references public.app_users(id),
  sector_id uuid not null references public.sectors(id),
  primary key (user_id, sector_id)
);

create table public.auth_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id),
  token_hash bytea not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now(),
  user_agent text,
  revoked_at timestamptz
);

create table public.turns (
  id uuid primary key default gen_random_uuid(),
  tracking_code text not null unique,
  queue_date date not null default current_date,
  sequence_number integer not null,
  visible_number text not null,
  sector_id uuid not null references public.sectors(id),
  category_id uuid not null references public.categories(id),
  status text not null default 'esperando' check (status in ('esperando','proximo','llamado','en_atencion','finalizado','cancelado','ausente','transferido')),
  priority smallint not null default 0 check (priority >= 0 and priority <= 9),
  created_at timestamptz not null default now(),
  called_at timestamptz,
  started_at timestamptz,
  finished_at timestamptz,
  operator_id uuid references public.app_users(id),
  derived_from_turn_id uuid references public.turns(id),
  notes text,
  qr_point_id uuid references public.qr_points(id),
  service_point_id uuid references public.service_points(id),
  origin text not null default 'web',
  request_id text,
  unique (sector_id, category_id, queue_date, sequence_number),
  unique (sector_id, queue_date, visible_number)
);

create unique index turns_request_id_unique_idx on public.turns using btree (request_id) where (request_id is not null);
create unique index turns_request_id_unique on public.turns using btree (request_id) where (request_id is not null);
create index turns_queue_idx on public.turns using btree (sector_id, queue_date, status, priority desc, created_at);
create index turns_operator_idx on public.turns using btree (operator_id, created_at desc);
create index turns_service_point_idx on public.turns using btree (service_point_id) where (service_point_id is not null);
create unique index turns_one_active_per_service_point_idx on public.turns using btree (service_point_id) where (service_point_id is not null and status in ('llamado','en_atencion'));
create index turns_qr_point_idx on public.turns using btree (qr_point_id) where (qr_point_id is not null);

create table public.turn_events (
  id bigint generated always as identity primary key,
  turn_id uuid not null references public.turns(id),
  sector_id uuid not null references public.sectors(id),
  event_type text not null,
  from_status text,
  to_status text,
  user_id uuid references public.app_users(id),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- RLS habilitado, sin politicas permisivas: igual que en produccion, todo
-- el acceso pasa por funciones SECURITY DEFINER, nunca por REST directo.
alter table public.app_users enable row level security;
alter table public.sectors enable row level security;
alter table public.categories enable row level security;
alter table public.campuses enable row level security;
alter table public.service_points enable row level security;
alter table public.qr_points enable row level security;
alter table public.user_sector_memberships enable row level security;
alter table public.auth_sessions enable row level security;
alter table public.turns enable row level security;
alter table public.turn_events enable row level security;

-- api_create_turn: version ORIGINAL (con la race condition de
-- idempotencia). El workflow la reemplaza mas tarde aplicando 0004.
CREATE OR REPLACE FUNCTION public.api_create_turn(p_sector_id uuid, p_category_id uuid, p_request_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare s public.sectors%rowtype; c public.categories%rowtype; seq int; code text; tid uuid; ahead int; eta int; prefix text;
begin
  if p_request_id is not null then
    select id into tid from public.turns where request_id=p_request_id limit 1;
    if tid is not null then return public.api_get_turn_v2((select tracking_code from public.turns where id=tid)); end if;
  end if;
  select * into s from public.sectors where id=p_sector_id and active;
  select * into c from public.categories where id=p_category_id and sector_id=p_sector_id and active;
  if s.id is null or c.id is null then raise exception 'Sector o categoría inválidos'; end if;
  prefix:=coalesce(nullif(c.prefix,''),s.prefix);
  perform pg_advisory_xact_lock(hashtextextended(p_category_id::text||current_date::text,0));
  select coalesce(max(sequence_number),0)+1 into seq from public.turns where sector_id=p_sector_id and category_id=p_category_id and queue_date=current_date;
  code:=upper(substr(encode(extensions.gen_random_bytes(8),'hex'),1,12));
  insert into public.turns(tracking_code,queue_date,sequence_number,visible_number,sector_id,category_id,request_id)
  values(code,current_date,seq,prefix||'-'||lpad(seq::text,3,'0'),p_sector_id,p_category_id,p_request_id) returning id into tid;
  insert into public.turn_events(turn_id,sector_id,event_type,to_status,metadata) values(tid,p_sector_id,'created','esperando',jsonb_build_object('request_id',p_request_id));
  select count(*) into ahead from public.turns t where t.sector_id=p_sector_id and t.queue_date=current_date and t.status='esperando' and t.created_at<(select created_at from public.turns where id=tid);
  eta:=(ahead+1)*c.target_minutes;
  return jsonb_build_object('id',tid,'tracking_code',code,'visible_number',prefix||'-'||lpad(seq::text,3,'0'),'status','esperando','people_ahead',ahead,'estimated_wait_minutes',eta,'sector',s.name,'category',c.name);
end;
$function$;

CREATE OR REPLACE FUNCTION public.api_get_turn_v2(p_tracking_code text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  t public.turns%rowtype;
  child public.turns%rowtype;
  ahead int;
  target int;
  active_ops int;
  hops int:=0;
begin
  select * into t from public.turns
  where tracking_code=upper(trim(p_tracking_code)) and queue_date>=current_date-1
  order by created_at desc limit 1;
  if t.id is null then return null; end if;

  loop
    exit when hops>=10;
    select * into child from public.turns where derived_from_turn_id=t.id order by created_at desc limit 1;
    exit when child.id is null;
    t:=child;
    child:=null;
    hops:=hops+1;
  end loop;

  if t.status='esperando' then
    select count(*) into ahead from public.turns x
    where x.sector_id=t.sector_id and x.queue_date=t.queue_date and x.status='esperando'
      and (x.priority>t.priority or (x.priority=t.priority and x.created_at<t.created_at));
  else ahead:=0; end if;

  select target_minutes into target from public.categories where id=t.category_id;
  select count(distinct usm.user_id) into active_ops
    from public.user_sector_memberships usm
    join public.auth_sessions sess on sess.user_id=usm.user_id
    where usm.sector_id=t.sector_id and sess.revoked_at is null and sess.expires_at>now() and sess.last_seen_at>now()-interval '15 minutes';

  return jsonb_build_object(
    'id',t.id,
    'visible_number',t.visible_number,
    'tracking_code',t.tracking_code,
    'status',t.status,
    'people_ahead',ahead,
    'estimated_wait_minutes',case when t.status='esperando' then greatest(1,ceil(((ahead+1)*coalesce(target,8))::numeric/greatest(active_ops,1)))::int else 0 end,
    'created_at',t.created_at,
    'called_at',t.called_at,
    'started_at',t.started_at,
    'finished_at',t.finished_at,
    'sector',(select name from public.sectors where id=t.sector_id),
    'category',(select name from public.categories where id=t.category_id),
    'campus',(select c.name from public.qr_points q join public.campuses c on c.id=q.campus_id where q.id=t.qr_point_id),
    'location',(select q.label from public.qr_points q where q.id=t.qr_point_id),
    'service_point',(select sp.name from public.service_points sp where sp.id=t.service_point_id),
    'origin',t.origin,
    'was_derived',(t.derived_from_turn_id is not null)
  );
end;
$function$;

CREATE OR REPLACE FUNCTION public.api_tag_turn_origin(p_tracking_code text, p_origin text)
 RETURNS void
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  update public.turns
  set origin = p_origin
  where tracking_code = p_tracking_code;
$function$;

CREATE OR REPLACE FUNCTION public.api_public_catalog()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select jsonb_build_object(
  'sectors',coalesce((select jsonb_agg(jsonb_build_object('id',s.id,'slug',s.slug,'name',s.name,'description',s.description,'prefix',s.prefix) order by s.sort_order,s.name) from public.sectors s where s.active),'[]'::jsonb),
  'categories',coalesce((select jsonb_agg(jsonb_build_object('id',c.id,'sector_id',c.sector_id,'slug',c.slug,'name',c.name,'description',c.description,'target_minutes',c.target_minutes,'prefix',c.prefix) order by c.sort_order,c.name) from public.categories c where c.active),'[]'::jsonb)
 );
$function$;

create schema if not exists private;

CREATE OR REPLACE FUNCTION private."session_user"(p_token text)
 RETURNS TABLE(user_id uuid, role text, display_name text, must_change_password boolean)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select u.id,u.role,u.display_name,u.must_change_password
 from public.auth_sessions s join public.app_users u on u.id=s.user_id
 where s.token_hash=extensions.digest(p_token,'sha256') and s.revoked_at is null and s.expires_at>now() and u.active limit 1;
$function$;

CREATE OR REPLACE FUNCTION private.can_access_sector(p_user uuid, p_role text, p_sector uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO ''
AS $function$
 select p_role='admin' or exists(select 1 from public.user_sector_memberships m where m.user_id=p_user and m.sector_id=p_sector);
$function$;

CREATE OR REPLACE FUNCTION public.api_transfer_turn(p_token text, p_turn_id uuid, p_target_category_id uuid DEFAULT NULL::uuid, p_target_service_point_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare su record; src public.turns%rowtype; target_cat public.categories%rowtype; sp public.service_points%rowtype; created jsonb; child_id uuid; old_status text;
begin
 select * into su from private.session_user(p_token); if su.user_id is null then raise exception 'Sesión inválida'; end if;
 select * into src from public.turns where id=p_turn_id for update;
 if src.id is null or not private.can_access_sector(su.user_id,su.role,src.sector_id) then raise exception 'Acceso denegado'; end if;
 if src.status not in('llamado','en_atencion') then raise exception 'Solo se puede transferir un turno activo'; end if;
 old_status:=src.status;
 if p_target_category_id is null then
   if p_target_service_point_id is null then raise exception 'Elegí una categoría o un box de destino'; end if;
   select * into sp from public.service_points where id=p_target_service_point_id and sector_id=src.sector_id and active;
   if sp.id is null then raise exception 'Box de destino inválido'; end if;
   if sp.id=src.service_point_id then raise exception 'Elegí otro box'; end if;
   if exists(select 1 from public.turns where service_point_id=sp.id and queue_date=current_date and status in('llamado','en_atencion')) then raise exception 'El box de destino está ocupado'; end if;
   update public.turns set status='llamado',called_at=clock_timestamp(),started_at=null,operator_id=null,service_point_id=sp.id where id=src.id returning * into src;
   insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id,metadata) values(src.id,src.sector_id,'transfer_box',old_status,'llamado',su.user_id,jsonb_build_object('target_service_point_id',sp.id,'target_service_point',sp.name));
   return jsonb_build_object('mode','box','turn',jsonb_build_object('id',src.id,'visible_number',src.visible_number,'status',src.status,'service_point',sp.name));
 end if;
 select * into target_cat from public.categories where id=p_target_category_id and active;
 if target_cat.id is null then raise exception 'Categoría de destino inválida'; end if;
 created:=public.api_create_turn(target_cat.sector_id,target_cat.id,'transfer:'||src.id::text||':'||extract(epoch from clock_timestamp())::bigint::text);
 child_id:=(created->>'id')::uuid;
 update public.turns set status='transferido',finished_at=clock_timestamp() where id=src.id;
 update public.turns set derived_from_turn_id=src.id,origin='operator',priority=src.priority where id=child_id;
 if p_target_service_point_id is not null then
   select * into sp from public.service_points where id=p_target_service_point_id and sector_id=target_cat.sector_id and active;
   if sp.id is null then raise exception 'Box de destino inválido'; end if;
   if exists(select 1 from public.turns where service_point_id=sp.id and queue_date=current_date and status in('llamado','en_atencion')) then raise exception 'El box de destino está ocupado'; end if;
   update public.turns set status='llamado',called_at=clock_timestamp(),service_point_id=sp.id,operator_id=null where id=child_id;
 end if;
 insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id,metadata) values(src.id,src.sector_id,'transfer_category',old_status,'transferido',su.user_id,jsonb_build_object('target_category_id',target_cat.id,'derived_turn_id',child_id,'target_service_point_id',p_target_service_point_id));
 return jsonb_build_object('mode','category','source_turn',src.visible_number,'derived_turn',public.api_get_turn_v2(created->>'tracking_code'));
end;
$function$;

CREATE OR REPLACE FUNCTION public.api_call_next_category(p_token text, p_sector_id uuid, p_category_id uuid, p_service_point_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare su record; t public.turns%rowtype; sp public.service_points%rowtype;
begin
 select * into su from private.session_user(p_token);
 if su.user_id is null or not private.can_access_sector(su.user_id,su.role,p_sector_id) then raise exception 'Acceso denegado'; end if;
 if not exists(select 1 from public.categories where id=p_category_id and sector_id=p_sector_id and active) then raise exception 'Categoría inválida'; end if;
 select * into sp from public.service_points where id=p_service_point_id and sector_id=p_sector_id and active;
 if sp.id is null then raise exception 'Seleccioná un box válido'; end if;
 if exists(select 1 from public.turns where service_point_id=sp.id and queue_date=current_date and status in('llamado','en_atencion')) then raise exception 'Ese box ya tiene un turno activo'; end if;
 select * into t from public.turns where sector_id=p_sector_id and category_id=p_category_id and queue_date=current_date and status='esperando' order by priority desc,created_at for update skip locked limit 1;
 if t.id is null then return null; end if;
 update public.turns set status='llamado',called_at=clock_timestamp(),operator_id=su.user_id,service_point_id=sp.id where id=t.id returning * into t;
 insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id,metadata) values(t.id,t.sector_id,'called_category','esperando','llamado',su.user_id,jsonb_build_object('service_point_id',sp.id,'service_point',sp.name,'category_id',p_category_id));
 return jsonb_build_object('id',t.id,'visible_number',t.visible_number,'status',t.status,'category',(select name from public.categories where id=t.category_id),'service_point',sp.name,'tracking_code',t.tracking_code);
end;
$function$;

CREATE OR REPLACE FUNCTION public.api_call_specific_turn(p_token text, p_turn_id uuid, p_service_point_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare su record; t public.turns%rowtype; sp public.service_points%rowtype;
begin
 select * into su from private.session_user(p_token); if su.user_id is null then raise exception 'Sesión inválida'; end if;
 select * into t from public.turns where id=p_turn_id for update;
 if t.id is null or t.status<>'esperando' or not private.can_access_sector(su.user_id,su.role,t.sector_id) then raise exception 'El turno ya no está disponible'; end if;
 select * into sp from public.service_points where id=p_service_point_id and sector_id=t.sector_id and active;
 if sp.id is null then raise exception 'Box inválido'; end if;
 if exists(select 1 from public.turns where service_point_id=sp.id and queue_date=current_date and status in('llamado','en_atencion')) then raise exception 'Ese box ya tiene un turno activo'; end if;
 update public.turns set status='llamado',called_at=clock_timestamp(),operator_id=su.user_id,service_point_id=sp.id where id=t.id returning * into t;
 insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id,metadata) values(t.id,t.sector_id,'manual_call','esperando','llamado',su.user_id,jsonb_build_object('service_point_id',sp.id,'service_point',sp.name));
 return jsonb_build_object('id',t.id,'visible_number',t.visible_number,'status',t.status,'category',(select name from public.categories where id=t.category_id),'service_point',sp.name,'tracking_code',t.tracking_code);
end;
$function$;

CREATE OR REPLACE FUNCTION public.api_turn_action(p_token text, p_turn_id uuid, p_action text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare su record; t public.turns%rowtype; old text;
begin
 select * into su from private.session_user(p_token); if su.user_id is null then raise exception 'Sesión inválida'; end if;
 select * into t from public.turns where id=p_turn_id for update; if t.id is null or not private.can_access_sector(su.user_id,su.role,t.sector_id) then raise exception 'Acceso denegado'; end if; old:=t.status;
 if p_action='recall' and t.status='llamado' then update public.turns set called_at=clock_timestamp() where id=t.id;
 elsif p_action='start' and t.status='llamado' then update public.turns set status='en_atencion',started_at=coalesce(started_at,clock_timestamp()),operator_id=su.user_id where id=t.id;
 elsif p_action='finish' and t.status='en_atencion' then update public.turns set status='finalizado',finished_at=clock_timestamp() where id=t.id;
 elsif p_action='absent' and t.status in('llamado','en_atencion') then update public.turns set status='ausente',finished_at=clock_timestamp() where id=t.id;
 elsif p_action='cancel' and t.status not in('finalizado','cancelado','ausente','transferido') then update public.turns set status='cancelado',finished_at=clock_timestamp() where id=t.id;
 else raise exception 'Acción no válida para el estado actual'; end if;
 select * into t from public.turns where id=p_turn_id;
 insert into public.turn_events(turn_id,sector_id,event_type,from_status,to_status,user_id) values(t.id,t.sector_id,p_action,old,t.status,su.user_id);
 return jsonb_build_object('id',t.id,'visible_number',t.visible_number,'status',t.status,'called_at',t.called_at,'started_at',t.started_at,'finished_at',t.finished_at);
end;
$function$;

grant usage on schema public to anon, authenticated;
grant execute on function public.api_create_turn(uuid,uuid,text) to anon, authenticated;
grant execute on function public.api_get_turn_v2(text) to anon, authenticated;
grant execute on function public.api_tag_turn_origin(text,text) to anon, authenticated;
grant execute on function public.api_public_catalog() to anon, authenticated;
