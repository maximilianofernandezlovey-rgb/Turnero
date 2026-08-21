import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token=(await cookies()).get("turnero_session")?.value;
    if(!token) return Response.json({ok:false,error:"Sesión requerida"},{status:401});
    const body=await request.json();
    const categoryId=String(body?.categoryId??"");
    const name=String(body?.name??"").trim();
    const prefix=String(body?.prefix??"").trim();
    const targetMinutes=Number(body?.targetMinutes??0);
    const active=Boolean(body?.active);
    if(!categoryId||!name||!prefix||!Number.isFinite(targetMinutes)) return Response.json({ok:false,error:"Faltan datos de la categoría"},{status:400});
    const data=await supabaseRpc("api_admin_update_category",{
      p_token:token,p_category_id:categoryId,p_name:name,p_prefix:prefix,p_target_minutes:targetMinutes,p_active:active,
    });
    return Response.json({ok:true,data});
  } catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:"No se pudo actualizar la categoría"},{status:400});}
}
