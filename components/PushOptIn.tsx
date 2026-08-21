"use client";

import { useEffect, useState } from "react";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || "";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; i++) outputArray[i] = rawData.charCodeAt(i);
  return outputArray;
}

type Status = "idle" | "checking" | "subscribing" | "subscribed" | "unsupported" | "denied" | "error";

export default function PushOptIn({ trackingCode }: { trackingCode: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    async function check() {
      if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (active) setStatus("unsupported");
        return;
      }
      if (Notification.permission === "denied") {
        if (active) setStatus("denied");
        return;
      }
      try {
        const registration = await navigator.serviceWorker.getRegistration("/gestion");
        const existing = await registration?.pushManager.getSubscription();
        if (active) setStatus(existing ? "subscribed" : "idle");
      } catch {
        if (active) setStatus("idle");
      }
    }
    check();
    return () => {
      active = false;
    };
  }, []);

  async function subscribe() {
    setStatus("subscribing");
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setStatus(permission === "denied" ? "denied" : "idle");
        return;
      }
      const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/gestion" });
      await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });
      const response = await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingCode, subscription, userAgent: navigator.userAgent }),
      });
      const data = await response.json();
      if (!response.ok || !data?.ok) throw new Error(data?.error || "No se pudo activar la notificación");
      setStatus("subscribed");
    } catch {
      setStatus("error");
    }
  }

  if (status === "unsupported" || status === "checking") return null;

  if (status === "subscribed") {
    return <div className="alert alert-success" style={{ marginTop: 16 }}><span aria-hidden="true">🔔</span><div>Avisos activados. Podés minimizar la app.</div></div>;
  }

  if (status === "denied") {
    return (
      <div className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        Bloqueaste las notificaciones para este sitio. Podés activarlas desde la configuración del navegador.
      </div>
    );
  }

  return (
    <button
      type="button"
      className="btn btn-secondary btn-block"
      style={{ marginTop: 16 }}
      onClick={subscribe}
      disabled={status === "subscribing"}
    >
      {status === "subscribing" ? "Activando…" : "🔔 Activar avisos de mi turno"}
    </button>
  );
}
