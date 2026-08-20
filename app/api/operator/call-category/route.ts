import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const body = await request.json();
    const sectorId = String(body?.sectorId ?? "75942fa8-9bea-4207-93a8-fe4c53484500");
    const categoryId = String(body?.categoryId ?? "");
    const servicePointId = String(body?.servicePointId ?? "");
    if (!categoryId || !servicePointId) return Response.json({ ok:false, error:"Categoría y box son obligatorios" }, { status:400 });
    const data = await supabaseRpc("api_call_next_category", { p_token:token, p_sector_id:sectorId, p_category_id:categoryId, p_service_point_id:servicePointId });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo llamar por categoría" }, { status:400 });
  }
}
