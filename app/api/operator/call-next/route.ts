import { cookies } from "next/headers";
import { after } from "next/server";
import { supabaseRpc } from "../../../../lib/supabase-rest";
import { sweepPushNotifications } from "../../../../lib/push";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok: false, error: "Sesión requerida" }, { status: 401 });
    const body = await request.json();
    const sectorId = String(body?.sectorId ?? "75942fa8-9bea-4207-93a8-fe4c53484500");
    const servicePointId = String(body?.servicePointId ?? "");
    if (!servicePointId) return Response.json({ ok: false, error: "Seleccioná un box" }, { status: 400 });

    const data = await supabaseRpc("api_call_next_v2", {
      p_token: token,
      p_sector_id: sectorId,
      p_service_point_id: servicePointId,
    });
    after(() => sweepPushNotifications().catch(() => {}));
    return Response.json({ ok: true, data });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo llamar el siguiente turno" }, { status: 400 });
  }
}
