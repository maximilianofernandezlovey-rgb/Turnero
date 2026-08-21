-- Etiqueta el origen del turno (qr | totem) sin tocar api_create_turn existente.
-- 100% aditivo: agrega una columna nullable y una función nueva.
-- Seguro de correr más de una vez (IF NOT EXISTS / CREATE OR REPLACE).

alter table public.turns
  add column if not exists origin text;

create or replace function public.api_tag_turn_origin(p_tracking_code text, p_origin text)
returns void
language sql
security definer
set search_path = public
as $$
  update public.turns
  set origin = p_origin
  where tracking_code = p_tracking_code;
$$;

revoke all on function public.api_tag_turn_origin(text, text) from public;
grant execute on function public.api_tag_turn_origin(text, text) to anon, authenticated;
