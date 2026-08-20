import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const { searchParams } = new URL(request.url);
    const sectorId = searchParams.get("sectorId") ?? "75942fa8-9bea-4207-93a8-fe4c53484500";
    const data = await supabaseRpc("api_admin_configuration", { p_token:token, p_sector_id:sectorId });
    return Response.json({ ok:true, data }, { headers:{"Cache-Control":"no-store"} });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo cargar la configuración" }, { status:400 });
  }
}
