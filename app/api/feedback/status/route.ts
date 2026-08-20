import { supabaseRpc } from "../../../../lib/supabase-rest";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const trackingCode = searchParams.get("trackingCode") ?? "";
    if (!trackingCode) {
      return Response.json(
        { ok:false, error:"Código de seguimiento requerido" },
        { status:400, headers:{ "Cache-Control":"no-store, max-age=0" } }
      );
    }

    const data = await supabaseRpc("api_turn_feedback_status", { p_tracking_code: trackingCode });
    return Response.json(
      { ok:true, data },
      { headers:{ "Cache-Control":"no-store, max-age=0" } }
    );
  } catch (error) {
    return Response.json(
      { ok:false, error:error instanceof Error?error.message:"No se pudo consultar la encuesta" },
      { status:400, headers:{ "Cache-Control":"no-store, max-age=0" } }
    );
  }
}
