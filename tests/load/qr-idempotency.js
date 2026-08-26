// tests/load/qr-idempotency.js
//
// Prueba de idempotencia: N VUs disparan /api/turns/create al mismo
// tiempo con EXACTAMENTE el mismo requestId, cada VU exactamente una
// vez (per-vu-iterations, iterations: 1).
//
// UNICO resultado aceptable por respuesta: HTTP 200, ok:true, y un
// objeto turn con id, tracking_code y visible_number presentes. Un 503
// (o cualquier otro codigo) hace fallar la prueba -- no es un resultado
// tolerado, es la señal de que la migracion 0004 no esta aplicada o no
// funciono.
//
// Por que "1 fila en la base" alcanza para demostrar "todas las
// respuestas devuelven la misma terna": si exactamente 1 fila existe
// para ese request_id, cualquier respuesta 200 solo puede reflejar los
// datos de esa unica fila (no hay otra fuente posible). La verificacion
// cruzada entre VUs se hace por SQL despues de la corrida, no
// comparando manualmente cada respuesta dentro de k6.
//
// NO EJECUTAR TODAVIA. BASE_URL es obligatorio (sin valor por
// defecto) y el script aborta si BASE_URL apunta a produccion.
//
// USO (una vez que exista un ambiente de staging real):
//   k6 run -e BASE_URL=https://<tu-staging>.vercel.app -e VUS=20 tests/load/qr-idempotency.js
//
// VERIFICACION SQL OBLIGATORIA despues de la corrida (con el RUN_ID que
// imprime la consola):
//
//   select count(*) as filas from turns where request_id = '<runid>-SHARED';
//   -- exigido: filas = 1
//
//   select count(*) as eventos_created
//   from turn_events te join turns t on t.id = te.turn_id
//   where t.request_id = '<runid>-SHARED' and te.event_type = 'created';
//   -- exigido: eventos_created = 1
//
// 0 errores unique_violation esperados en los logs de Postgres/Vercel
// para esta corrida (antes del fix, ese era justamente el error que
// rompia al perdedor de la carrera).
//
// LIMPIEZA:
//   delete from turn_events where turn_id in (select id from turns where request_id = '<runid>-SHARED');
//   delete from turns where request_id = '<runid>-SHARED';

import http from "k6/http";
import { check, fail } from "k6";

const PRODUCTION_HOSTS = ["turnero-h91j.vercel.app"];

if (!__ENV.BASE_URL) {
  throw new Error("BASE_URL es obligatorio. Pasalo con -e BASE_URL=https://tu-staging.example.com (nunca produccion).");
}
const BASE_URL = __ENV.BASE_URL;
if (PRODUCTION_HOSTS.some((h) => BASE_URL.includes(h))) {
  throw new Error(`BASE_URL (${BASE_URL}) apunta a produccion. Este script no puede correr contra produccion. Abortando antes de generar trafico.`);
}

const RUN_ID = __ENV.RUN_ID || `LOADTEST-${Date.now()}`;
const SHARED_REQUEST_ID = `${RUN_ID}-SHARED`;
const VUS = parseInt(__ENV.VUS || "20", 10);

export const options = {
  scenarios: {
    same_request_id_race: {
      executor: "per-vu-iterations",
      vus: VUS,
      iterations: 1,
      maxDuration: "30s",
    },
  },
};

export function setup() {
  const catalogRes = http.get(`${BASE_URL}/api/catalog`);
  const catalog = catalogRes.json("catalog");
  const sector = catalog.sectors.find((s) => s.slug === "ingreso");
  const category = catalog.categories.find((c) => c.sector_id === sector.id);
  if (!sector || !category) throw new Error("No se pudo resolver sector/categoria de 'ingreso'.");
  console.log(`RUN_ID=${RUN_ID} SHARED_REQUEST_ID=${SHARED_REQUEST_ID} VUS=${VUS} BASE_URL=${BASE_URL}`);
  return { sectorId: sector.id, categoryId: category.id };
}

export default function (data) {
  const res = http.post(
    `${BASE_URL}/api/turns/create`,
    JSON.stringify({ sectorId: data.sectorId, categoryId: data.categoryId, requestId: SHARED_REQUEST_ID, origin: "qr" }),
    { headers: { "Content-Type": "application/json" } },
  );

  const ok = check(res, {
    "HTTP 200 (no 503, no otro codigo)": (r) => r.status === 200,
    "ok:true": (r) => r.status === 200 && r.json("ok") === true,
    "trae turn.id": (r) => r.status === 200 && !!r.json("turn") && !!r.json("turn").id,
    "trae turn.tracking_code": (r) => r.status === 200 && !!r.json("turn") && !!r.json("turn").tracking_code,
    "trae turn.visible_number": (r) => r.status === 200 && !!r.json("turn") && !!r.json("turn").visible_number,
  });

  if (!ok) {
    fail(`VU ${__VU} recibio una respuesta invalida (status ${res.status}): ${res.body}`);
  }
}

export function teardown(data) {
  console.log(`Verificar en Supabase (exigido, no opcional):`);
  console.log(`  select count(*) from turns where request_id = '${SHARED_REQUEST_ID}'; -- debe ser exactamente 1`);
  console.log(`  select count(*) from turn_events te join turns t on t.id=te.turn_id where t.request_id='${SHARED_REQUEST_ID}' and te.event_type='created'; -- debe ser exactamente 1`);
}
