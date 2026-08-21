import { cookies } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const token=(await cookies()).get("turnero_session")?.value;
    if(!token) return Response.json({ok:false,error:"Sesión requerida"},{status:401});
    const body=await request.json();
    const servicePointId=String(body?.servicePointId??"");
    const name=String(body?.name??"").trim();
    const active=Boolean(body?.active);
    if(!servicePointId||!name) return Response.json({ok:false,error:"Faltan datos del box"},{status:400});
    const data=await supabaseRpc("api_admin_update_box",{
      p_token:token,p_service_point_id:servicePointId,p_name:name,p_active:active,
      p_floor:body?.floor?String(body.floor):null,p_location:body?.location?String(body.location):null,
    });
    return Response.json({ok:true,data});
  } catch(error){return Response.json({ok:false,error:error instanceof Error?error.message:"No se pudo actualizar el box"},{status:400});}
}
