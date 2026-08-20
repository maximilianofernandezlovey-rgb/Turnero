import { supabaseRpc } from "../../../lib/supabase-rest";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const sector = url.searchParams.get("sector") || "ingreso";
  try {
    const data = await supabaseRpc("api_public_display", { p_sector_slug: sector });
    return Response.json({ ok: true, data }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo cargar la pantalla pública" },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}
