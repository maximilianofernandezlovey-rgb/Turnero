// tests/load/qr-load-PRODUCTION-danger.mjs
//
// PREPARADO, NO EJECUTADO. Este script existe solo como entregable de
// planificacion. No lo corrio nadie todavia.
//
// A diferencia de qr-load.js / qr-idempotency.js / qr-stress.js (que
// BLOQUEAN explicitamente turnero-h91j.vercel.app), este script esta
// pensado para el unico caso donde realmente hace falta apuntar a
// produccion: no existe un Supabase Cloud de staging, asi que "probar
// contra la nube real" significa, sin eufemismos, generar trafico
// contra la base y el deployment que usan estudiantes reales ahora mismo.
//
// Por eso este script exige una confirmacion explicita, separada de
// BASE_URL, que nadie va a escribir por accidente:
//
//   I_UNDERSTAND_THIS_HITS_REAL_PRODUCTION=yes-i-checked-the-time-window-and-the-plan-tier
//
// Sin esa variable exacta, aborta antes de mandar un solo request.
//
// USO (recien cuando el usuario autorice explicitamente, etapa por etapa):
//   BASE_URL=https://turnero-h91j.vercel.app \
//   I_UNDERSTAND_THIS_HITS_REAL_PRODUCTION=yes-i-checked-the-time-window-and-the-plan-tier \
//   COUNT=25 node tests/load/qr-load-PRODUCTION-danger.mjs
//
// Progresion recomendada: 25, mirar el panel de operadores en vivo,
// recien despues 50, 100, 250, 500 -- una autorizacion por etapa, no
// todas de una.
//
// LIMPIEZA OBLIGATORIA DESPUES DE CADA ETAPA (correr contra la base real,
// filtrando exclusivamente por request_id, nunca por fecha/categoria/estado):
//
//   select count(*) from turns where request_id like 'LOADTEST-<runid>%';
//   delete from turn_events where turn_id in (select id from turns where request_id like 'LOADTEST-<runid>%');
//   delete from turns where request_id like 'LOADTEST-<runid>%';
//   -- confirmar 0 filas:
//   select count(*) from turns where request_id like 'LOADTEST-<runid>%';

const CONFIRMATION_VALUE = "yes-i-checked-the-time-window-and-the-plan-tier";

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`ABORT: falta la variable de entorno obligatoria ${name}.`);
    process.exit(1);
  }
  return v;
}

if (process.env.I_UNDERSTAND_THIS_HITS_REAL_PRODUCTION !== CONFIRMATION_VALUE) {
  console.error("ABORT: este script apunta a produccion real (no hay staging). No corre sin la confirmacion explicita exacta en I_UNDERSTAND_THIS_HITS_REAL_PRODUCTION. No se envio ningun request.");
  process.exit(1);
}

const BASE_URL = requireEnv("BASE_URL");
const SECTOR_ID = requireEnv("SECTOR_ID");
const CATEGORY_ID = requireEnv("CATEGORY_ID");
const COUNT = parseInt(requireEnv("COUNT"), 10);
if (!(COUNT > 0 && COUNT <= 500)) {
  console.error("ABORT: COUNT debe ser mayor a 0 y no superar 500 en este script.");
  process.exit(1);
}
const RUN_ID = process.env.RUN_ID || `LOADTEST-PROD-${Date.now()}`;

async function createTurn(requestId) {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/turns/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectorId: SECTOR_ID, categoryId: CATEGORY_ID, requestId, origin: "qr" }),
    });
    let body = null;
    try { body = await res.json(); } catch {}
    return { status: res.status, body, durationMs: Date.now() - startedAt };
  } catch (err) {
    return { status: 0, body: null, durationMs: Date.now() - startedAt, error: String(err) };
  }
}

console.log(`ATENCION: generando ${COUNT} turnos REALES contra ${BASE_URL} con RUN_ID=${RUN_ID}.`);
console.log(`Limpiar despues con: request_id like '${RUN_ID}%' -- exclusivamente por ese filtro.`);

const results = await Promise.all(
  Array.from({ length: COUNT }, (_, i) => createTurn(`${RUN_ID}-${i}`)),
);

const ok = results.filter((r) => r.status === 200 && r.body?.ok === true);
const failed = results.length - ok.length;
const ids = ok.map((r) => r.body.turn.id);
const codes = ok.map((r) => r.body.turn.tracking_code);
const numbers = ok.map((r) => r.body.turn.visible_number);
const uniqueIds = new Set(ids);
const uniqueCodes = new Set(codes);
const uniqueNumbers = new Set(numbers);

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.ceil((p / 100) * sortedArr.length) - 1);
  return sortedArr[Math.max(0, idx)];
}
const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
const p50 = percentile(durations, 50);
const p95 = percentile(durations, 95);
const p99 = percentile(durations, 99);

if (failed > 0) {
  const byStatus = {};
  for (const r of results) {
    if (r.status === 200 && r.body?.ok === true) continue;
    const key = r.status === 0 ? "sin_respuesta(fetch_error)" : `http_${r.status}`;
    byStatus[key] = (byStatus[key] || 0) + 1;
  }
  console.log(`desglose_de_fallos=${JSON.stringify(byStatus)}`);
}

console.log(`ETAPA=${COUNT} exitosas=${ok.length} fallidas=${failed} p50_ms=${p50} p95_ms=${p95} p99_ms=${p99}`);
console.log(`duplicados_id=${ids.length - uniqueIds.size} duplicados_tracking_code=${codes.length - uniqueCodes.size} duplicados_visible_number=${numbers.length - uniqueNumbers.size}`);
console.log(`RUN_ID=${RUN_ID} -- usar este valor exacto para la limpieza SQL.`);
