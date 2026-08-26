-- 0004_idempotent_turn_creation.sql
--
-- ESTADO: NO aplicada todavia en ningun lado (ni produccion ni staging).
-- Escrita para revision. No correr sin antes verificar en un branch aislado
-- de Supabase, segun lo pedido explicitamente.
--
-- CONTEXTO REAL (precheck completo hecho antes de escribir esto):
-- turns.request_id YA tenia proteccion de unicidad a nivel de Postgres:
-- dos indices unicos parciales identicos, turns_request_id_unique y
-- turns_request_id_unique_idx (ambos "UNIQUE (request_id) WHERE request_id
-- IS NOT NULL"), probablemente creados por error dos veces en algun momento.
-- Mi analisis anterior (en el chat, no en este repo) decia que dos requests
-- concurrentes con el mismo request_id podian crear DOS turnos distintos.
-- Eso era incorrecto: el indice ya lo impide. Lo que SI es real: como
-- api_create_turn no tiene manejo de excepciones alrededor del INSERT, la
-- transaccion que pierde la carrera no recibe el turno original -- recibe
-- un error crudo de Postgres (unique_violation), que la ruta API convierte
-- en un 503 generico. O sea: cero corrupcion de datos, pero la promesa de
-- "todas las solicitudes reciben los mismos datos del turno original" no
-- se cumple en la ventana de carrera. Este archivo corrige exactamente eso,
-- sin necesidad de agregar una constraint que de hecho ya existe.
--
-- CAMBIOS:
-- 1) Elimina turns_request_id_unique (duplicado exacto de
--    turns_request_id_unique_idx) -- limpieza, no cambia ninguna garantia.
-- 2) Reemplaza api_create_turn: el INSERT ahora usa
--    ON CONFLICT (request_id) WHERE request_id IS NOT NULL DO UPDATE,
--    que hace que la operacion sea atomica y siempre devuelva una fila
--    (la nueva si no habia conflicto, la existente si lo habia) via
--    RETURNING, en vez de depender solo del SELECT previo. Se conserva:
--    - el SELECT previo (ahora es solo un fast-path, ya no la unica
--      proteccion);
--    - el advisory lock que protege sequence_number/visible_number, sin
--      tocar su orden ni su clave;
--    - el contrato de respuesta exacto de la funcion (mismas claves en el
--      jsonb devuelto);
--    - SECURITY DEFINER y search_path='' identicos a como estaban.
--    El evento en turn_events solo se inserta cuando la fila es
--    realmente nueva (detectado con xmax=0), para no loguear un
--    "created" falso cuando la request ya existia.
-- No se agrega NOT NULL en request_id: el indice ya es parcial
-- (permite multiples NULL) y hay al menos 1 turno historico real con
-- request_id NULL (turno cancelado, origen "web", previo a este flujo).
-- Agregar NOT NULL hoy rompería ese registro y cualquier fila similar
-- que exista.

begin;

drop index if exists public.turns_request_id_unique;

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
  v_was_inserted boolean;
begin
  -- Fast-path: evita tomar el lock y gastar un sequence_number cuando la
  -- request ya existe y no hay ninguna carrera en curso. No es la unica
  -- proteccion (esa la da el indice unico + ON CONFLICT de mas abajo).
  if p_request_id is not null then
    select id into v_id from public.turns where request_id = p_request_id limit 1;
    if v_id is not null then
      return public.api_get_turn_v2((select tracking_code from public.turns where id = v_id));
    end if;
  end if;

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
  do update set request_id = excluded.request_id
  returning id, tracking_code, visible_number, status, created_at, (xmax = 0)
  into v_id, v_tracking_code, v_visible_number, v_status, v_created_at, v_was_inserted;

  if v_was_inserted then
    insert into public.turn_events (turn_id, sector_id, event_type, to_status, metadata)
    values (v_id, p_sector_id, 'created', 'esperando', jsonb_build_object('request_id', p_request_id));
  end if;

  select count(*) into ahead
    from public.turns t
    where t.sector_id = p_sector_id and t.queue_date = current_date and t.status = 'esperando'
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
