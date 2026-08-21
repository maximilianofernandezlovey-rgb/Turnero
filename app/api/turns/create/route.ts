import { supabaseRpc } from "../../../../lib/supabase-rest";

const ALLOWED_ORIGINS = new Set(["qr", "totem"]);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sectorId = String(body?.sectorId ?? "");
    const categoryId = String(body?.categoryId ?? "");
    const requestId = String(body?.requestId ?? "");
    const origin = ALLOWED_ORIGINS.has(String(body?.origin ?? "")) ? String(body.origin) : "qr";

    if (!sectorId || !categoryId || !requestId) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const turn = await supabaseRpc<{ tracking_code?: string }>("api_create_turn", {
      p_sector_id: sectorId,
      p_category_id: categoryId,
      p_request_id: requestId,
    });

    if (turn?.tracking_code) {
      try {
        await supabaseRpc("api_tag_turn_origin", { p_tracking_code: turn.tracking_code, p_origin: origin });
      } catch {
        // Best-effort: si la migración todavía no se aplicó, el turno igual se crea normalmente.
      }
    }

    return Response.json({ ok: true, turn });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear el turno" },
      { status: 503 },
    );
  }
}
