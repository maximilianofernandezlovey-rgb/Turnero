import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token=(await cookies()).get("turnero_session")?.value;
    if(!token) return Response.json({ok:false,error:"Sesión requerida"},{status:401});
    const body=await request.json();
    const mode=String(body?.mode??"update");
    if(mode==="create"){
      const sectorId=String(body?.sectorId??"");
      const username=String(body?.username??"").trim();
      const displayName=String(body?.displayName??"").trim();
      const password=String(body?.password??"");
      const role=String(body?.role??"operator");
      if(!sectorId||!username||!displayName||!password) return Response.json({ok:false,error:"Completá todos los datos del usuario"},{status:400});
      const data=await supabaseRpc("api_admin_create_user",{p_token:token,p_sector_id:sectorId,p_username:username,p_display_name:displayName,p_password:password,p_role:role});
      return Response.json({ok:true,data});
    }
    const userId=String(body?.userId??"");
    const displayName=String(body?.displayName??"").trim();
    const role=String(body?.role??"operator");
    const active=Boolean(body?.active);
    if(!userId||!displayName) return Response.json({ok:false,error:"Faltan datos del usuario"},{status:400});
    const data=await supabaseRpc("api_admin_update_user",{p_token:token,p_user_id:userId,p_display_name:displayName,p_role:role,p_active:active});
    return Response.json({ok:true,data});
  } catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:"No se pudo guardar el usuario"},{status:400});}
}
