type RpcBody = Record<string, unknown>;

function config() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error("Supabase no está configurado en el entorno");
  }
  return { url: url.replace(/\/$/, ""), key };
}

export async function supabaseRpc<T>(name: string, body: RpcBody = {}): Promise<T> {
  const { url, key } = config();
  const response = await fetch(`${url}/rest/v1/rpc/${name}`, {
    method: "POST",
    headers: {
      apikey: key,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
    cache: "no-store",
  });

  let data: unknown = null;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      typeof data === "object" && data && "message" in data
        ? String((data as { message?: unknown }).message ?? "Error de Supabase")
        : `Error de Supabase (${response.status})`;
    throw new Error(message);
  }

  return data as T;
}
