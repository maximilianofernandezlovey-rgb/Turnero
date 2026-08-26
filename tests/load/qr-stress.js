// tests/load/qr-stress.js
//
// SOLO correr si la Prueba 5 (500 VUs, ver qr-load.js) salio estable.
// Progresion 500 -> 750 -> 1000 con abort-thresholds mas estrictos para
// cortar la corrida sola si empieza a degradar, en vez de esperar al
// reporte final. NO superar 1000 VUs sin autorizacion explicita.
//
// USO (una corrida por escalon, mirando el resultado antes de seguir):
//   k6 run -e VUS=500  -e DURATION=90s  tests/load/qr-stress.js
//   k6 run -e VUS=750  -e DURATION=90s  tests/load/qr-stress.js
//   k6 run -e VUS=1000 -e DURATION=90s  tests/load/qr-stress.js
//
// Los thresholds de abort-on-fail cortan la corrida automaticamente si:
//   - la tasa de fallos supera 5%;
//   - el p95 de creacion de turno supera 5 segundos.
// Igual hay que mirarlo correr: un corte automatico no reemplaza
// supervision humana en vivo contra produccion real sin staging.

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
const RUN_ID = __ENV.RUN_ID || `LOADTEST-STRESS-${Date.now()}`;
const VUS = parseInt(__ENV.VUS || "500", 10);
const DURATION = __ENV.DURATION || "90s";
const CATEGORY_SLUG_ALLOWLIST = ["inscripcion", "informes", "equivalencias-externas"];

if (VUS > 1000) {
  throw new Error("qr-stress.js no debe correrse con mas de 1000 VUs sin autorizacion explicita.");
}

export const createDuration = new Trend("turn_create_duration", true);
export const createFailures = new Counter("turn_create_failures");

export const options = {
  scenarios: {
    stress: {
      executor: "ramping-vus",
      startVUs: 0,
      stages: [
        { duration: "20s", target: VUS },
        { duration: DURATION, target: VUS },
        { duration: "15s", target: 0 },
      ],
      gracefulRampDown: "15s",
    },
  },
  thresholds: {
    http_req_failed: [{ threshold: "rate<0.05", abortOnFail: true }],
    turn_create_duration: [{ threshold: "p(95)<5000", abortOnFail: true }],
  },
};

export function setup() {
  const catalogRes = http.get(`${BASE_URL}/api/catalog`);
  const catalog = catalogRes.json("catalog");
  const sector = catalog.sectors.find((s) => s.slug === "ingreso");
  const categoryIds = catalog.categories
    .filter((c) => c.sector_id === sector.id && CATEGORY_SLUG_ALLOWLIST.includes(c.slug))
    .map((c) => c.id);
  console.log(`STRESS RUN_ID=${RUN_ID} VUS=${VUS} DURATION=${DURATION}`);
  return { sectorId: sector.id, categoryIds, runId: RUN_ID };
}

export default function (data) {
  const requestId = `${data.runId}-${__VU}-${__ITER}`;
  const categoryId = data.categoryIds[__VU % data.categoryIds.length];

  const createRes = http.post(
    `${BASE_URL}/api/turns/create`,
    JSON.stringify({ sectorId: data.sectorId, categoryId, requestId, origin: "qr" }),
    { headers: { "Content-Type": "application/json" } },
  );
  createDuration.add(createRes.timings.duration);
  const ok = check(createRes, { "turno creado": (r) => r.status === 200 && r.json("ok") === true });
  if (!ok) createFailures.add(1);

  sleep(Math.random());
}

export function teardown(data) {
  console.log(`Limpiar con: request_id like '${data.runId}%'. Verificar 0 filas despues.`);
}
