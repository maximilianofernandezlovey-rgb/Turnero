import webpush from "web-push";
import { supabaseRpc } from "./supabase-rest";

type TurnStatus = {
  visible_number?: string;
  status?: string;
  people_ahead?: number;
  box?: string | null;
};

type ActiveCode = { tracking_code: string };

type ClaimedSubscription = {
  endpoint: string;
  p256dh: string;
  auth: string;
  tracking_code: string;
  stage: string;
};

type Stage = "near3" | "near1" | "called";

const TERMINAL_STATUSES = new Set(["finalizado", "ausente", "cancelado", "transferido"]);
const BATCH_SIZE = 8;

export function isPushConfigured(): boolean {
  return Boolean(
    process.env.VAPID_PRIVATE_KEY &&
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY &&
    process.env.VAPID_SUBJECT,
  );
}

function stageFor(status: TurnStatus): Stage | null {
  if (status.status === "llamado") return "called";
  if (TERMINAL_STATUSES.has(status.status || "")) return null;
  const peopleAhead = status.people_ahead ?? Infinity;
  if (peopleAhead <= 1) return "near1";
  if (peopleAhead <= 3) return "near3";
  return null;
}

function notificationFor(stage: Stage, status: TurnStatus) {
  const visible = status.visible_number || "Tu turno";
  if (stage === "called") {
    return {
      title: "Te están llamando",
      body: `${visible} — Dirigite al Box ${status.box || "asignado"}`,
    };
  }
  if (stage === "near1") {
    return {
      title: `${visible}: sos el próximo`,
      body: "Quedó 1 persona antes que vos. Acercate al sector.",
    };
  }
  return {
    title: `${visible}: se acerca tu turno`,
    body: "Quedan pocas personas antes que vos.",
  };
}

async function inBatches<T, R>(items: T[], size: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = [];
  for (let i = 0; i < items.length; i += size) {
    const chunk = items.slice(i, i + size);
    const settled = await Promise.allSettled(chunk.map(fn));
    for (const s of settled) if (s.status === "fulfilled") results.push(s.value);
  }
  return results;
}

export async function sweepPushNotifications(): Promise<void> {
  if (!isPushConfigured()) return;

  try {
    webpush.setVapidDetails(
      process.env.VAPID_SUBJECT as string,
      process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY as string,
      process.env.VAPID_PRIVATE_KEY as string,
    );

    const codes = await supabaseRpc<ActiveCode[]>("api_push_active_codes");
    if (!codes?.length) return;

    const statuses = await inBatches(codes, BATCH_SIZE, async (c) => {
      const status = await supabaseRpc<TurnStatus>("api_public_turn_status", { p_tracking_code: c.tracking_code });
      return { tracking_code: c.tracking_code, status };
    });

    const updates = statuses
      .map(({ tracking_code, status }) => ({ tracking_code, stage: stageFor(status), status }))
      .filter((u) => u.stage !== null);

    if (!updates.length) return;

    const claimed = await supabaseRpc<ClaimedSubscription[]>("api_push_claim_notifications", {
      p_updates: updates.map((u) => ({ tracking_code: u.tracking_code, stage: u.stage })),
    });
    if (!claimed?.length) return;

    const statusByCode = new Map(updates.map((u) => [u.tracking_code, u.status]));

    await inBatches(claimed, BATCH_SIZE, async (sub) => {
      const status = statusByCode.get(sub.tracking_code);
      if (!status) return;
      const payload = notificationFor(sub.stage as Stage, status);
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
          JSON.stringify({ ...payload, trackingCode: sub.tracking_code, url: `/gestion?trackingCode=${encodeURIComponent(sub.tracking_code)}` }),
        );
      } catch (error) {
        const statusCode = (error as { statusCode?: number })?.statusCode;
        if (statusCode === 404 || statusCode === 410) {
          await supabaseRpc("api_remove_push_subscription", { p_endpoint: sub.endpoint }).catch(() => {});
        }
      }
    });
  } catch {
    // Best-effort: un fallo del barrido de notificaciones nunca debe afectar
    // la acción del operador que lo disparó.
  }
}
