// tests/load/qr-load.js
//
// Prueba de carga real del flujo QR: /gestion -> /api/catalog ->
// /api/turns/create -> /api/turns/status. Reproduce exactamente las
// llamadas que hace un celular real (revisadas en components/GestionClient.tsx).
//
// MODELO DE ITERACION (corregido): cada VU crea su turno UNA sola vez
// (executor per-vu-iterations, iterations=1) -- no un loop indefinido que
// termine generando miles de turnos. VUS=500 crea exactamente ~500 turnos
// (menos los que fallen). El polling de /api/turns/status si se repite,
// con un intervalo realista, simulando a alguien con la pantalla abierta
// esperando que lo llamen -- eso es lo que de verdad pasa en produccion.
//
// USO (contra un runtime con red real: Claude Code, tu maquina, un runner de CI):
//
//   k6 run -e VUS=25  tests/load/qr-load.js   # Prueba 1
//   k6 run -e VUS=50  tests/load/qr-load.js   # Prueba 2
//   k6 run -e VUS=100 tests/load/qr-load.js   # Prueba 3
//   k6 run -e VUS=250 tests/load/qr-load.js   # Prueba 4
//   k6 run -e VUS=500 tests/load/qr-load.js   # Prueba 5
//
// Corre cada etapa por separado y mira el resultado antes de avanzar a la
// siguiente. No hay un modo "correr las 5 de una" a proposito.
//
// IDENTIFICACION: cada turno creado usa requestId = `${RUN_ID}-${VU}-${ITER}`.
// RUN_ID por defecto es LOADTEST-<timestamp epoch>, pero se puede fijar con
// -e RUN_ID=... para que quede igual en todo el reporte.
//
// LIMPIEZA (correr en el SQL editor de Supabase despues de cada etapa,
// jamas por fecha/categoria/estado):
//
//   select count(*) from turns where request_id like 'LOADTEST-<runid>%';
//   delete from turn_events   where turn_id in (select id from turns where request_id like 'LOADTEST-<runid>%');
//   delete from turns         where request_id like 'LOADTEST-<runid>%';
//   -- confirmar 0 filas:
//   select count(*) from turns where request_id like 'LOADTEST-<runid>%';

import http from "k6/http";
import { check, sleep } from "k6";
import { Trend, Counter } from "k6/metrics";

const PRODUCTION_HOSTS = ["turnero-h91j.vercel.app"];
if (!__ENV.BASE_URL) {
  throw new Error("BASE_URL es obligatorio. Pasalo con -e BASE_URL=https://tu-staging.example.com (nunca produccion).");
}
const BASE_URL = __ENV.BASE_URL;
if (PRODUCTION_HOSTS.some((h) => BASE_URL.includes(h))) {
  throw new Error(`BASE_URL (${BASE_URL}) apunta a produccion. Este script no puede correr contra produccion. Abortando antes de generar trafico.`);
}
const RUN_ID = __ENV.RUN_ID || `LOADTEST-${Date.now()}`;
const VUS = parseInt(__ENV.VUS || "25", 10);
// Cuantas veces cada VU consulta /api/turns/status despues de crear su
// turno, y cada cuanto -- simula a alguien con la pantalla abierta, NO
// un poll infinito.
const POLL_COUNT = parseInt(__ENV.POLL_COUNT || "5", 10);
const POLL_INTERVAL_S = parseFloat(__ENV.POLL_INTERVAL_S || "4");
const CATEGORY_SLUG_ALLOWLIST = ["inscripcion", "informes", "equivalencias-externas"];

export const createDuration = new Trend("turn_create_duration", true);
export const statusDuration = new Trend("turn_status_duration", true);
export const createFailures = new Counter("turn_create_failures");

export const options = {
  scenarios: {
    qr_flow: {
      // Cada VU ejecuta el flujo completo (crear + pollear) UNA sola vez.
      // Esto es lo que garantiza "VUS turnos creados", no "VUS turnos por
      // segundo durante toda la corrida".
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "5m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.005"],
    turn_create_duration: ["p(95)<2000"],
  },
};

export function setup() {
  const catalogRes = http.get(`${BASE_URL}/api/catalog`);
  const okCatalog = check(catalogRes, {
    "catalog responde 200": (r) => r.status === 200,
    "catalog ok:true": (r) => r.json("ok") === true,
  });
  if (!okCatalog) throw new Error("No se pudo cargar /api/catalog en el setup; abortando la corrida.");

  const catalog = catalogRes.json("catalog");
  const sector = catalog.sectors.find((s) => s.slug === "ingreso");
  if (!sector) throw new Error("No se encontro el sector 'ingreso' en el catalogo.");
  const categoryIds = catalog.categories
    .filter((c) => c.sector_id === sector.id && CATEGORY_SLUG_ALLOWLIST.includes(c.slug))
    .map((c) => c.id);
  if (categoryIds.length === 0) throw new Error("No se encontraron categorias activas para 'ingreso'.");

  console.log(`RUN_ID=${RUN_ID} sectorId=${sector.id} categorias=${categoryIds.length} VUS=${VUS} (1 turno por VU) POLL_COUNT=${POLL_COUNT}`);
  return { sectorId: sector.id, categoryIds, runId: RUN_ID };
}

export default function (data) {
  const requestId = `${data.runId}-${__VU}-${__ITER}`;
  const categoryId = data.categoryIds[__VU % data.categoryIds.length];

  // 1) Un celular real primero pide la pagina.
  const gestionRes = http.get(`${BASE_URL}/gestion`);
  check(gestionRes, { "/gestion responde 200": (r) => r.status === 200 });

  // 2) Crea el turno UNA vez -- esta es la unica iteracion de creacion
  // para este VU, no un loop.
  const createRes = http.post(
    `${BASE_URL}/api/turns/create`,
    JSON.stringify({ sectorId: data.sectorId, categoryId, requestId, origin: "qr" }),
    { headers: { "Content-Type": "application/json" }, tags: { name: "turns_create" } },
  );
  createDuration.add(createRes.timings.duration);

  const created = check(createRes, {
    "turno creado (200 + ok:true)": (r) => r.status === 200 && r.json("ok") === true,
    "trae tracking_code": (r) => !!(r.json("turn") && r.json("turn").tracking_code),
  });
  if (!created) {
    createFailures.add(1);
    return;
  }

  // 3) Igual que un alumno real: deja la pantalla abierta y consulta el
  // estado un numero acotado de veces, no indefinidamente.
  const trackingCode = createRes.json("turn").tracking_code;
  for (let i = 0; i < POLL_COUNT; i++) {
    sleep(POLL_INTERVAL_S + Math.random());
    const statusRes = http.get(`${BASE_URL}/api/turns/status?trackingCode=${trackingCode}`, {
      tags: { name: "turns_status" },
    });
    statusDuration.add(statusRes.timings.duration);
    check(statusRes, { "status responde 200": (r) => r.status === 200 });
  }
}

export function teardown(data) {
  console.log(`Corrida terminada. Para limpiar y verificar, usar request_id like '${data.runId}%' -- NUNCA filtrar por fecha/categoria/estado.`);
}
