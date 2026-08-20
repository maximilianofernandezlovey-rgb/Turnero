import { supabaseRpc } from "../../../lib/supabase-rest";

export async function GET() {
  try {
    const catalog = await supabaseRpc("api_public_catalog");
    return Response.json({ ok: true, catalog });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "Catalog unavailable" }, { status: 503 });
  }
}
