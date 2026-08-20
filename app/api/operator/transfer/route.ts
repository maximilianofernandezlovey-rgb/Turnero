import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const body = await request.json();
    const turnId = String(body?.turnId ?? "");
    const targetCategoryId = body?.targetCategoryId ? String(body.targetCategoryId) : null;
    const targetServicePointId = body?.targetServicePointId ? String(body.targetServicePointId) : null;
    if (!turnId) return Response.json({ ok:false, error:"Turno requerido" }, { status:400 });
    if (!targetCategoryId && !targetServicePointId) return Response.json({ ok:false, error:"Elegí una categoría o box de destino" }, { status:400 });
    const data = await supabaseRpc("api_transfer_turn", { p_token:token, p_turn_id:turnId, p_target_category_id:targetCategoryId, p_target_service_point_id:targetServicePointId });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo transferir el turno" }, { status:400 });
  }
}
