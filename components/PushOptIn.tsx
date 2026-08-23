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

function isIOS() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  // iPadOS 13+ se identifica como "MacIntel" pero con soporte táctil, a
  // diferencia de una Mac de escritorio real.
  return /iP(hone|od|ad)/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isStandalone() {
  if (typeof window === "undefined") return false;
  const nav = window.navigator as Navigator & { standalone?: boolean };
  return window.matchMedia("(display-mode: standalone)").matches || nav.standalone === true;
}

// "checking" y "unsupported" quedaron como estaban; se agrega "ios" para el
// caso específico de iPhone/iPad sin instalar a pantalla de inicio, que
// antes caía dentro de "unsupported" sin distinguirse.
type Status = "idle" | "checking" | "subscribing" | "subscribed" | "unsupported" | "ios" | "denied" | "error";

export default function PushOptIn({ trackingCode }: { trackingCode: string }) {
  const [status, setStatus] = useState<Status>("checking");

  useEffect(() => {
    let active = true;
    async function check() {
      if (!VAPID_PUBLIC_KEY || !("serviceWorker" in navigator) || !("PushManager" in window)) {
        // Antes esto siempre era "unsupported" -> el componente desaparecía
        // sin decir nada, incluso en iPhone, donde en realidad SÍ se puede
        // recibir avisos si el usuario instala el sitio a su pantalla de
        // inicio (sección 3 del pedido original).
        if (isIOS() && !isStandalone()) {
          if (active) setStatus("ios");
        } else {
          if (active) setStatus("unsupported");
        }
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

  if (status === "checking") return null;

  if (status === "ios") {
    return (
      <div className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        <strong>Recibí avisos en iPhone:</strong> agregá este turnero a tu pantalla de inicio (compartir → "Agregar a
        pantalla de inicio") para poder recibir notificaciones.
      </div>
    );
  }

  if (status === "unsupported") {
    return (
      <div className="muted" style={{ marginTop: 16, fontSize: 14 }}>
        <strong>Avisos no disponibles en este navegador.</strong> Mantené esta pantalla abierta para seguir el estado de
        tu turno.
      </div>
    );
  }

  if (status === "subscribed") {
    return (
      <div className="alert alert-success" style={{ marginTop: 16 }}>
        <span aria-hidden="true">🔔</span>
        <div>Avisos activados. Podés minimizar la app.</div>
      </div>
    );
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
