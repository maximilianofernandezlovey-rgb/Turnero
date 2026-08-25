// tests/load/qr-load.js
//
// Prueba de carga real del flujo QR: /gestion -> /api/catalog ->
// /api/turns/create -> /api/turns/status. Reproduce exactamente las
// llamadas que hace un celular real (revisadas en components/GestionClient.tsx).
//
// USO (contra un runtime con red real: Claude Code, tu maquina, un runner de CI):
//
//   k6 run -e VUS=25  -e DURATION=30s tests/load/qr-load.js   # Prueba 1
//   k6 run -e VUS=50  -e DURATION=30s tests/load/qr-load.js   # Prueba 2
//   k6 run -e VUS=100 -e DURATION=45s tests/load/qr-load.js   # Prueba 3
//   k6 run -e VUS=250 -e DURATION=60s tests/load/qr-load.js   # Prueba 4
//   k6 run -e VUS=500 -e DURATION=90s tests/load/qr-load.js   # Prueba 5
//
// Corre cada etapa por separado y mira el resultado antes de avanzar a la
// siguiente -- asi lo pide el instructivo original. No hay un modo "correr
// las 5 de una" a proposito.
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

const BASE_URL = __ENV.BASE_URL || "https://turnero-h91j.vercel.app";
const RUN_ID = __ENV.RUN_ID || `LOADTEST-${Date.now()}`;
const VUS = parseInt(__ENV.VUS || "25", 10);
const DURATION = __ENV.DURATION || "30s";
const CATEGORY_SLUG_ALLOWLIST = ["inscripcion", "informes", "equivalencias-externas"];

export const createDuration = new Trend("turn_create_duration", true);
export const statusDuration = new Trend("turn_status_duration", true);
export const createFailures = new Counter("turn_create_failures");

export const options = {
  scenarios: {
    qr_flow: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "10s", target: VUS },
        { duration: DURATION, target: VUS },
        { duration: "10s", target: 0 },
      ],
      gracefulRampDown: "10s",
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

  console.log(`RUN_ID=${RUN_ID} sectorId=${sector.id} categorias=${categoryIds.length} VUS=${VUS} DURATION=${DURATION}`);
  return { sectorId: sector.id, categoryIds, runId: RUN_ID };
}

export default function (data) {
  const requestId = `${data.runId}-${__VU}-${__ITER}`;
  const categoryId = data.categoryIds[__VU % data.categoryIds.length];

  // 1) Un celular real primero pide la pagina.
  const gestionRes = http.get(`${BASE_URL}/gestion`);
  check(gestionRes, { "/gestion responde 200": (r) => r.status === 200 });

  // 2) Crea el turno con un requestId unico e identificable.
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

  // 3) Igual que un alumno real: deja la pantalla abierta y consulta el estado.
  const trackingCode = createRes.json("turn").tracking_code;
  sleep(1 + Math.random());
  const statusRes = http.get(`${BASE_URL}/api/turns/status?trackingCode=${trackingCode}`, {
    tags: { name: "turns_status" },
  });
  statusDuration.add(statusRes.timings.duration);
  check(statusRes, { "status responde 200": (r) => r.status === 200 });

  sleep(Math.random() * 2);
}

export function teardown(data) {
  console.log(`Corrida terminada. Para limpiar y verificar, usar request_id like '${data.runId}%' -- NUNCA filtrar por fecha/categoria/estado.`);
}
