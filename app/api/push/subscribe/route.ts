import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const trackingCode = String(body?.trackingCode ?? "");
    const subscription = body?.subscription;
    const endpoint = String(subscription?.endpoint ?? "");
    const p256dh = String(subscription?.keys?.p256dh ?? "");
    const auth = String(subscription?.keys?.auth ?? "");
    const userAgent = body?.userAgent ? String(body.userAgent).slice(0, 300) : null;

    if (!trackingCode || !endpoint || !p256dh || !auth) {
      return Response.json({ ok: false, error: "Suscripción incompleta" }, { status: 400 });
    }

    await supabaseRpc("api_register_push_subscription", {
      p_tracking_code: trackingCode,
      p_endpoint: endpoint,
      p_p256dh: p256dh,
      p_auth: auth,
      p_user_agent: userAgent,
    });

    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo activar la notificación" },
      { status: 400 },
    );
  }
}
