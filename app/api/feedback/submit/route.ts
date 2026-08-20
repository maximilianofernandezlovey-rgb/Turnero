import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trackingCode = String(body?.trackingCode ?? "");
    if (!trackingCode) return Response.json({ ok:false, error:"Código de seguimiento requerido" }, { status:400 });

    const rating = body?.rating === null || body?.rating === undefined || body?.rating === "" ? null : Number(body.rating);
    const data = await supabaseRpc("api_submit_turn_feedback", {
      p_tracking_code: trackingCode,
      p_rating: rating,
      p_comment: body?.comment ? String(body.comment) : null,
      p_contact_email: body?.contactEmail ? String(body.contactEmail) : null,
    });
    return Response.json({ ok:true, data });
  } catch (error) {
    return Response.json({ ok:false, error:error instanceof Error?error.message:"No se pudo guardar tu comentario" }, { status:400 });
  }
}
