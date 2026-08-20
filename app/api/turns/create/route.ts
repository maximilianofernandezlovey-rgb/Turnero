import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const sectorId = String(body?.sectorId ?? "");
    const categoryId = String(body?.categoryId ?? "");
    const requestId = String(body?.requestId ?? "");

    if (!sectorId || !categoryId || !requestId) {
      return Response.json({ ok: false, error: "Faltan datos obligatorios" }, { status: 400 });
    }

    const turn = await supabaseRpc("api_create_turn", {
      p_sector_id: sectorId,
      p_category_id: categoryId,
      p_request_id: requestId,
    });

    return Response.json({ ok: true, turn });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo crear el turno" },
      { status: 503 },
    );
  }
}
