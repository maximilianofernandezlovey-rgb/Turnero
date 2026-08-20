import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok: false, error: "Sesión requerida" }, { status: 401 });
    const body = await request.json();
    const turnId = String(body?.turnId ?? "");
    const action = String(body?.action ?? "");
    if (!turnId || !action) return Response.json({ ok: false, error: "Faltan datos de la acción" }, { status: 400 });

    const data = await supabaseRpc("api_turn_action", {
      p_token: token,
      p_turn_id: turnId,
      p_action: action,
    });
    return Response.json({ ok: true, data });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo ejecutar la acción" }, { status: 400 });
  }
}
