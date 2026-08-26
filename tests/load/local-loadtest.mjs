// tests/load/local-loadtest.mjs
//
// Prueba de concurrencia real con Node.js puro (fetch + Promise.all), sin
// k6. Pensada para correr EXCLUSIVAMENTE contra un Supabase + Next.js
// levantados en localhost dentro de un runner de GitHub Actions.
//
// SEGURIDAD: BASE_URL es obligatorio y pasa por una ALLOWLIST explicita
// de hosts (no una lista de bloqueo). Si el host no es exactamente
// "localhost" o "127.0.0.1", el script aborta antes de mandar un solo
// request.
//
// MODOS (env MODE):
//   same        -> N requests concurrentes con el MISMO requestId.
//                  Exige: todas 200+ok:true, un unico id, un unico
//                  tracking_code, un unico visible_number.
//   distinct    -> N requests concurrentes con requestId distintos.
//                  Exige: N turnos, N tracking_code unicos, N
//                  visible_number unicos, cero errores.
//   mismatch    -> reusa un requestId ya usado pero con OTRA categoria.
//                  Exige que la API lo rechace (no 200+ok:true) y que
//                  el turno original no haya cambiado.
//   progressive -> N "usuarios", una creacion cada uno (sin loop), para
//                  las etapas de 25/50/100/250/500. Reporta p50/p95/max.
//
// Uso:
//   BASE_URL=http://127.0.0.1:3000 SECTOR_ID=... CATEGORY_ID=... \
//     MODE=same COUNT=50 node tests/load/local-loadtest.mjs

const ALLOWED_HOSTS = new Set(["localhost", "127.0.0.1"]);

function requireEnv(name) {
  const v = process.env[name];
  if (!v) {
    console.error(`ABORT: falta la variable de entorno obligatoria ${name}.`);
    process.exit(1);
  }
  return v;
}

const BASE_URL = requireEnv("BASE_URL");
let parsedUrl;
try {
  parsedUrl = new URL(BASE_URL);
} catch {
  console.error(`ABORT: BASE_URL "${BASE_URL}" no es una URL valida.`);
  process.exit(1);
}
if (!ALLOWED_HOSTS.has(parsedUrl.hostname)) {
  console.error(`ABORT: BASE_URL apunta a "${parsedUrl.hostname}", que no esta en la allowlist de localhost (${[...ALLOWED_HOSTS].join(", ")}). No se envio ningun request.`);
  process.exit(1);
}

const MODE = requireEnv("MODE");
const SECTOR_ID = requireEnv("SECTOR_ID");
const CATEGORY_ID = requireEnv("CATEGORY_ID");
const COUNT = parseInt(process.env.COUNT || "10", 10);
const RUN_ID = process.env.RUN_ID || `LOCALTEST-${Date.now()}`;

async function createTurn(requestId, categoryId = CATEGORY_ID) {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${BASE_URL}/api/turns/create`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sectorId: SECTOR_ID, categoryId, requestId, origin: "qr" }),
    });
    const durationMs = Date.now() - startedAt;
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = null;
    }
    return { status: res.status, body, durationMs };
  } catch (err) {
    return { status: 0, body: null, durationMs: Date.now() - startedAt, error: String(err) };
  }
}

function percentile(sortedArr, p) {
  if (sortedArr.length === 0) return 0;
  const idx = Math.min(sortedArr.length - 1, Math.ceil((p / 100) * sortedArr.length) - 1);
  return sortedArr[Math.max(0, idx)];
}

function fail(message) {
  console.error(`FALLO: ${message}`);
  process.exitCode = 1;
}

async function runSame() {
  const requestId = `${RUN_ID}-SAME`;
  console.log(`[same] ${COUNT} requests concurrentes con requestId=${requestId}`);
  const results = await Promise.all(Array.from({ length: COUNT }, () => createTurn(requestId)));

  const nonOk = results.filter((r) => !(r.status === 200 && r.body && r.body.ok === true));
  if (nonOk.length > 0) {
    fail(`${nonOk.length}/${COUNT} respuestas no fueron 200+ok:true. Ejemplo: status=${nonOk[0].status} body=${JSON.stringify(nonOk[0].body)} error=${nonOk[0].error || "-"}`);
  } else {
    console.log(`[same] ${COUNT}/${COUNT} respuestas 200 + ok:true`);
  }

  const ids = new Set(results.map((r) => r.body?.turn?.id).filter(Boolean));
  const codes = new Set(results.map((r) => r.body?.turn?.tracking_code).filter(Boolean));
  const numbers = new Set(results.map((r) => r.body?.turn?.visible_number).filter(Boolean));

  if (ids.size !== 1) fail(`se esperaba exactamente 1 id unico, se obtuvieron ${ids.size}: ${[...ids].join(", ")}`);
  else console.log(`[same] id unico confirmado: ${[...ids][0]}`);

  if (codes.size !== 1) fail(`se esperaba exactamente 1 tracking_code unico, se obtuvieron ${codes.size}: ${[...codes].join(", ")}`);
  else console.log(`[same] tracking_code unico confirmado: ${[...codes][0]}`);

  if (numbers.size !== 1) fail(`se esperaba exactamente 1 visible_number unico, se obtuvieron ${numbers.size}: ${[...numbers].join(", ")}`);
  else console.log(`[same] visible_number unico confirmado: ${[...numbers][0]}`);

  console.log(`REQUEST_ID_PARA_VERIFICAR_SQL=${requestId}`);
}

async function runDistinct() {
  console.log(`[distinct] ${COUNT} requests concurrentes con requestId distintos`);
  const results = await Promise.all(
    Array.from({ length: COUNT }, (_, i) => createTurn(`${RUN_ID}-DISTINCT-${i}`)),
  );

  const nonOk = results.filter((r) => !(r.status === 200 && r.body && r.body.ok === true));
  if (nonOk.length > 0) {
    fail(`${nonOk.length}/${COUNT} respuestas no fueron 200+ok:true. Ejemplo: status=${nonOk[0].status} body=${JSON.stringify(nonOk[0].body)}`);
  } else {
    console.log(`[distinct] ${COUNT}/${COUNT} respuestas 200 + ok:true`);
  }

  const codes = results.map((r) => r.body?.turn?.tracking_code).filter(Boolean);
  const numbers = results.map((r) => r.body?.turn?.visible_number).filter(Boolean);
  const uniqueCodes = new Set(codes);
  const uniqueNumbers = new Set(numbers);

  if (uniqueCodes.size !== COUNT) fail(`se esperaban ${COUNT} tracking_code unicos, hay ${uniqueCodes.size} (duplicados: ${codes.length - uniqueCodes.size})`);
  else console.log(`[distinct] ${COUNT} tracking_code unicos confirmados`);

  if (uniqueNumbers.size !== COUNT) fail(`se esperaban ${COUNT} visible_number unicos, hay ${uniqueNumbers.size} (duplicados: ${numbers.length - uniqueNumbers.size})`);
  else console.log(`[distinct] ${COUNT} visible_number unicos confirmados`);

  console.log(`RUN_ID_PARA_VERIFICAR_SQL=${RUN_ID}-DISTINCT-%`);
}

async function runMismatch() {
  const CATEGORY_ID_2 = requireEnv("CATEGORY_ID_2");
  const requestId = `${RUN_ID}-MISMATCH`;
  console.log(`[mismatch] creando turno original con requestId=${requestId} en categoria ${CATEGORY_ID}`);
  const first = await createTurn(requestId, CATEGORY_ID);
  if (!(first.status === 200 && first.body?.ok === true)) {
    fail(`no se pudo crear el turno original para la prueba de mismatch: status=${first.status} body=${JSON.stringify(first.body)}`);
    return;
  }
  const originalTrackingCode = first.body.turn.tracking_code;
  console.log(`[mismatch] turno original: ${originalTrackingCode}. Reutilizando el mismo requestId con categoria distinta (${CATEGORY_ID_2})...`);

  const second = await createTurn(requestId, CATEGORY_ID_2);
  const wasRejected = !(second.status === 200 && second.body?.ok === true);
  if (!wasRejected) {
    fail(`se esperaba que la reutilizacion con categoria distinta fuera rechazada, pero devolvio 200+ok:true: ${JSON.stringify(second.body)}`);
  } else {
    console.log(`[mismatch] rechazado correctamente: status=${second.status} body=${JSON.stringify(second.body)}`);
  }
  console.log(`ORIGINAL_TRACKING_CODE_PARA_VERIFICAR=${originalTrackingCode}`);
}

async function runProgressive() {
  console.log(`[progressive] ${COUNT} "usuarios", una creacion cada uno (sin loop)`);
  const results = await Promise.all(
    Array.from({ length: COUNT }, (_, i) => createTurn(`${RUN_ID}-PROG-${COUNT}-${i}`)),
  );
  const ok = results.filter((r) => r.status === 200 && r.body?.ok === true);
  const failed = results.length - ok.length;
  const durations = results.map((r) => r.durationMs).sort((a, b) => a - b);
  const p50 = percentile(durations, 50);
  const p95 = percentile(durations, 95);
  const max = durations[durations.length - 1] || 0;

  const codes = new Set(ok.map((r) => r.body.turn.tracking_code));
  const numbers = new Set(ok.map((r) => r.body.turn.visible_number));

  console.log(`ETAPA=${COUNT} solicitadas=${COUNT} creadas=${ok.length} errores=${failed} p50_ms=${p50} p95_ms=${p95} max_ms=${max} tracking_code_unicos=${codes.size} visible_number_unicos=${numbers.size}`);

  if (failed > 0) fail(`${failed}/${COUNT} solicitudes fallaron en la etapa de ${COUNT} usuarios`);
  if (codes.size !== ok.length) fail(`hay tracking_code duplicados en la etapa de ${COUNT} usuarios`);
  if (numbers.size !== ok.length) fail(`hay visible_number duplicados en la etapa de ${COUNT} usuarios`);
  if (failed === 0 && codes.size === ok.length && numbers.size === ok.length) {
    console.log(`ETAPA_${COUNT}_RESULTADO=APROBADA`);
  } else {
    console.log(`ETAPA_${COUNT}_RESULTADO=RECHAZADA`);
  }
}

const modes = { same: runSame, distinct: runDistinct, mismatch: runMismatch, progressive: runProgressive };
const fn = modes[MODE];
if (!fn) {
  console.error(`ABORT: MODE="${MODE}" invalido. Valores validos: ${Object.keys(modes).join(", ")}.`);
  process.exit(1);
}

await fn();
if (process.exitCode === 1) {
  console.error("RESULTADO_FINAL=RECHAZADO");
} else {
  console.log("RESULTADO_FINAL=APROBADO");
}
