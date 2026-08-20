import { cookies, headers } from "next/headers";
import { supabaseRpc } from "../../../../lib/supabase-rest";

type LoginResult = {
  token: string;
  expires_at: string;
  user: { id: string; display_name: string; role: string; must_change_password: boolean };
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const username = String(body?.username ?? "").trim();
    const password = String(body?.password ?? "");
    if (!username || !password) {
      return Response.json({ ok: false, error: "Completá usuario y contraseña" }, { status: 400 });
    }

    const h = await headers();
    const result = await supabaseRpc<LoginResult>("api_login", {
      p_username: username,
      p_password: password,
      p_user_agent: h.get("user-agent") ?? null,
    });

    const jar = await cookies();
    jar.set("turnero_session", result.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 8,
    });

    return Response.json({ ok: true, user: result.user, expiresAt: result.expires_at });
  } catch (error) {
    return Response.json({ ok: false, error: error instanceof Error ? error.message : "No se pudo iniciar sesión" }, { status: 401 });
  }
}
