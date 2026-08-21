import { supabaseRpc } from "../../../../lib/supabase-rest";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const endpoint = String(body?.endpoint ?? "");
    if (!endpoint) return Response.json({ ok: false, error: "Endpoint requerido" }, { status: 400 });

    await supabaseRpc("api_remove_push_subscription", { p_endpoint: endpoint });
    return Response.json({ ok: true });
  } catch (error) {
    return Response.json(
      { ok: false, error: error instanceof Error ? error.message : "No se pudo desactivar la notificación" },
      { status: 400 },
    );
  }
}
