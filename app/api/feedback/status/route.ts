import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingCode = searchParams.get("trackingCode") ?? "";
    if (!trackingCode) return Response.json({ ok:false, error:"Código de seguimiento requerido" }, { status:400 });
    const data = await supabaseRpc("api_turn_feedback_status", { p_tracking_code: trackingCode });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo consultar la encuesta" }, { status:400 });
  }
}
