// tests/load/qr-idempotency.js
//
// Prueba especifica de idempotencia: N VUs disparan /api/turns/create al
// mismo tiempo con EXACTAMENTE el mismo requestId. Un mismo requestId
// nunca deberia generar dos turnos distintos.
//
// HALLAZGO YA CONFIRMADO POR LECTURA DE CODIGO (sin correr esta prueba):
// api_create_turn() hace "select ... where request_id=p_request_id" y
// solo DESPUES toma el advisory lock e inserta. Dos requests con el mismo
// requestId pueden pasar ese chequeo antes de que ninguno haya insertado
// todavia -> ambos insertan -> dos turnos reales con tracking_code y
// visible_number distintos, mismo request_id. Ademas no existe ningun
// constraint unique sobre turns.request_id (verificado contra
// pg_constraint). Esta prueba deberia reproducirlo bajo concurrencia real.
//
// USO:
//   k6 run -e VUS=20 tests/load/qr-idempotency.js
//
// VERIFICACION (correr en Supabase despues, con el RUN_ID que imprime la
// consola al final de la corrida):
//
//   select count(*), count(distinct tracking_code)
//   from turns where request_id = '<runid>-SHARED';
//   -- si count(*) > 1, la race condition se reprodujo.
//
// LIMPIEZA:
//   delete from turn_events where turn_id in (select id from turns where request_id = '<runid>-SHARED');
//   delete from turns where request_id = '<runid>-SHARED';

import http from "k6/http";
import { check } from "k6";

const BASE_URL = __ENV.BASE_URL || "https://turnero-h91j.vercel.app";
const RUN_ID = __ENV.RUN_ID || `LOADTEST-${Date.now()}`;
const SHARED_REQUEST_ID = `${RUN_ID}-SHARED`;
const VUS = parseInt(__ENV.VUS || "20", 10);

export const options = {
  scenarios: {
    same_request_id_race: {
      executor: "shared-iterations",
      vus: VUS,
      iterations: VUS,
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
  console.log(`RUN_ID=${RUN_ID} SHARED_REQUEST_ID=${SHARED_REQUEST_ID} VUS=${VUS}`);
  return { sectorId: sector.id, categoryId: category.id };
}

export default function (data) {
  const res = http.post(
    `${BASE_URL}/api/turns/create`,
    JSON.stringify({ sectorId: data.sectorId, categoryId: data.categoryId, requestId: SHARED_REQUEST_ID, origin: "qr" }),
    { headers: { "Content-Type": "application/json" } },
  );
  check(res, {
    "respuesta 200 o 503 (nunca otro codigo)": (r) => r.status === 200 || r.status === 503,
  });
}

export function teardown(data) {
  console.log(`Verificar en Supabase: select count(*), count(distinct tracking_code) from turns where request_id = '${SHARED_REQUEST_ID}';`);
  console.log("Esperado por el pedido original: count(*) = 1. Si es mayor, la race condition se confirmo bajo carga real.");
}
