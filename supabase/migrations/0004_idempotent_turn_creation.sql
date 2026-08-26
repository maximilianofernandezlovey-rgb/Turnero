-- 0004_idempotent_turn_creation.sql
--
-- ESTADO: NO aplicada todavia en ningun lado (ni produccion ni staging).
--
-- CONTEXTO REAL (precheck completo, corregido tras revision propia):
-- turns.request_id YA tiene proteccion de unicidad a nivel de Postgres:
-- dos indices unicos parciales identicos, turns_request_id_unique y
-- turns_request_id_unique_idx (ambos "UNIQUE (request_id) WHERE
-- request_id IS NOT NULL"). Esta version NO toca ninguno de los dos --
-- esa limpieza queda para despues, por separado.
--
-- El problema real no es duplicacion de datos (el indice ya la impide):
-- es que api_create_turn no manejaba el conflicto, asi que la
-- transaccion que pierde la carrera recibia un error crudo de Postgres
-- en vez del turno original.
--
-- DISEÑO (sin xmax, con FOUND explicito):
-- 1) Fast-path: si el request_id ya existe al entrar, se usa ese turno
--    directamente (optimizacion, no la unica proteccion).
-- 2) Si no existe, se toma el advisory lock (igual que antes, mismo
--    orden y misma clave), se calcula sequence_number, y se hace
--    INSERT ... ON CONFLICT (request_id) WHERE request_id IS NOT NULL
--    DO NOTHING ... RETURNING. Nunca un UPDATE sobre la fila existente.
-- 3) Se usa FOUND (no xmax) para decidir si la insercion fue real. Si
--    FOUND es true: es un turno nuevo, se loguea UN evento 'created'.
--    Si FOUND es false: alguien mas gano la carrera; se hace un SELECT
--    explicito del turno real por request_id.
-- 4) Antes de responder, se compara sector_id/category_id del turno
--    encontrado (por cualquiera de los 3 caminos) contra los
--    parametros recibidos. Si no coinciden, se rechaza explicitamente
--    con una excepcion -- nunca se devuelve informacion mezclada.
-- 5) p_request_id NULL o vacio ahora se rechaza a nivel de funcion,
--    ademas de la validacion que ya existia en la API. No se toca
--    ninguna fila historica: el unico turno existente con request_id
--    NULL (cancelado, origen "web", del 20/08) queda exactamente igual,
--    esta regla solo aplica a nuevas llamadas.
--
-- Sin cambios: SECURITY DEFINER, search_path='', RLS de turns, grants,
-- y el contrato de respuesta (mismas claves en el jsonb devuelto).

begin;

CREATE OR REPLACE FUNCTION public.api_create_turn(p_sector_id uuid, p_category_id uuid, p_request_id text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare
  s public.sectors%rowtype;
  c public.categories%rowtype;
  seq int;
  code text;
  prefix text;
  ahead int;
  eta int;
  v_id uuid;
  v_tracking_code text;
  v_visible_number text;
  v_status text;
  v_created_at timestamptz;
  v_sector_id uuid;
  v_category_id uuid;
begin
  if p_request_id is null or length(trim(p_request_id)) = 0 then
    raise exception 'request_id es obligatorio';
  end if;

  -- Fast-path: evita tomar el lock cuando no hace falta. No es la unica
  -- proteccion contra duplicados -- esa la da el indice unico de abajo.
  select id, tracking_code, visible_number, status, created_at, sector_id, category_id
    into v_id, v_tracking_code, v_visible_number, v_status, v_created_at, v_sector_id, v_category_id
    from public.turns
    where request_id = p_request_id;

  if v_id is null then
    select * into s from public.sectors where id = p_sector_id and active;
    select * into c from public.categories where id = p_category_id and sector_id = p_sector_id and active;
    if s.id is null or c.id is null then
      raise exception 'Sector o categoría inválidos';
    end if;
    prefix := coalesce(nullif(c.prefix, ''), s.prefix);

    perform pg_advisory_xact_lock(hashtextextended(p_category_id::text || current_date::text, 0));
    select coalesce(max(sequence_number), 0) + 1 into seq
      from public.turns
      where sector_id = p_sector_id and category_id = p_category_id and queue_date = current_date;
    code := upper(substr(encode(extensions.gen_random_bytes(8), 'hex'), 1, 12));

    insert into public.turns (tracking_code, queue_date, sequence_number, visible_number, sector_id, category_id, request_id)
    values (code, current_date, seq, prefix || '-' || lpad(seq::text, 3, '0'), p_sector_id, p_category_id, p_request_id)
    on conflict (request_id) where request_id is not null
    do nothing
    returning id, tracking_code, visible_number, status, created_at, sector_id, category_id
    into v_id, v_tracking_code, v_visible_number, v_status, v_created_at, v_sector_id, v_category_id;

    if found then
      insert into public.turn_events (turn_id, sector_id, event_type, to_status, metadata)
      values (v_id, p_sector_id, 'created', 'esperando', jsonb_build_object('request_id', p_request_id));
    else
      -- Perdimos la carrera: otra transaccion ya inserto este request_id
      -- entre el fast-path y este INSERT. Traemos el turno real, sin
      -- tocarlo.
      select id, tracking_code, visible_number, status, created_at, sector_id, category_id
        into v_id, v_tracking_code, v_visible_number, v_status, v_created_at, v_sector_id, v_category_id
        from public.turns
        where request_id = p_request_id;
    end if;
  else
    -- Ya existia desde antes de entrar a la funcion (reintento normal).
    select * into s from public.sectors where id = v_sector_id;
    select * into c from public.categories where id = v_category_id;
  end if;

  if v_sector_id is distinct from p_sector_id or v_category_id is distinct from p_category_id then
    raise exception 'El request_id % ya fue usado para otro sector/categoría y no puede reutilizarse aquí', p_request_id;
  end if;

  select count(*) into ahead
    from public.turns t
    where t.sector_id = v_sector_id and t.queue_date = current_date and t.status = 'esperando'
      and t.created_at < v_created_at;
  eta := (ahead + 1) * c.target_minutes;

  return jsonb_build_object(
    'id', v_id,
    'tracking_code', v_tracking_code,
    'visible_number', v_visible_number,
    'status', v_status,
    'people_ahead', ahead,
    'estimated_wait_minutes', eta,
    'sector', s.name,
    'category', c.name
  );
end;
$function$;

commit;
