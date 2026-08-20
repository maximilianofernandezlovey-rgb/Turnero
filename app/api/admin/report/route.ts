import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const sectorId = searchParams.get("sectorId");
    if (!from || !to) return Response.json({ ok:false, error:"Fechas requeridas" }, { status:400 });
    const data = await supabaseRpc("api_admin_turn_report", {
      p_token: token,
      p_from: from,
      p_to: to,
      p_sector_id: sectorId || null,
    });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo cargar el informe" }, { status:400 });
  }
}
