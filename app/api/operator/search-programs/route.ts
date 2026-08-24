import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const token = (await cookies()).get("turnero_session")?.value;
    if (!token) return Response.json({ ok:false, error:"Sesión requerida" }, { status:401 });
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") || "";
    const data = await supabaseRpc("api_search_academic_programs", { p_query: q });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo buscar" }, { status:400 });
  }
}
