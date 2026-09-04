# Decisiones de producto

## D-001 — Ausente que vuelve

**Estado:** Pendiente

¿Qué ocurre si una persona marcada como `ausente` vuelve después del llamado?

Opciones a evaluar:
- sacar un turno nuevo;
- reincorporación manual por operador;
- reincorporación con prioridad controlada.

No implementar reincorporación automática hasta decidirlo.

## D-002 — Cancelación desde el celular

**Estado:** Pendiente de implementación técnica

Dirección de producto: reemplazar el antiguo `Volver al inicio` por una cancelación real únicamente cuando el turno esté `esperando`. Hasta que exista endpoint/regla validada, no mostrar un botón que simule cancelar haciendo solo reset local.

## D-003 — Tiempo estimado

**Estado:** En revisión

Mostrar el valor solo cuando exista un cálculo válido. Preferir lenguaje aproximado (`~ 15 minutos`) y evitar promesas de precisión falsa.

## D-004 — Polling

**Estado:** Auditoría técnica en curso

La estrategia final debe equilibrar frescura del llamado y carga sostenida. Producto prioriza actualización más rápida cerca del llamado y menor frecuencia cuando el usuario está lejos en la cola o la pestaña está oculta.