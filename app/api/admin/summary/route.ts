import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function GET() {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const data = await supabaseRpc("api_admin_summary", { p_token: token });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo cargar el resumen" }, { status:400 });
  }
}
