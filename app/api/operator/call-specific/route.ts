import { cookies } from "next/headers";
import { after } from "next/server";
import { supabaseRpc } from "../../../../lib/supabase-rest";
import { sweepPushNotifications } from "../../../../lib/push";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const body = await request.json();
    const turnId = String(body?.turnId ?? "");
    const servicePointId = String(body?.servicePointId ?? "");
    if (!turnId || !servicePointId) return Response.json({ ok:false, error:"Turno y box son obligatorios" }, { status:400 });
    const data = await supabaseRpc("api_call_specific_turn", { p_token:token, p_turn_id:turnId, p_service_point_id:servicePointId });
    after(() => sweepPushNotifications().catch(() => {}));
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo llamar el turno" }, { status:400 });
  }
}
