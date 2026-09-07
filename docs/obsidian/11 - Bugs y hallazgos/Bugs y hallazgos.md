# Bugs y hallazgos

## Objetivo

Registrar problemas reales, causa raíz, impacto, estado y criterio de cierre. Esta nota no reemplaza issues técnicos, pero conserva el contexto funcional del producto.

## P0 — boxes bloqueados por turnos históricos

### Síntoma
Al intentar llamar un turno aparece:

`duplicate key value violates unique constraint "turns_one_active_per_service_point_idx"`

### Causa raíz confirmada
Las RPC de llamado validan ocupación de box por jornada (`queue_date=current_date`), pero el índice histórico de unicidad estaba definido globalmente por `service_point_id` para estados `llamado` y `en_atencion`.

Resultado: un turno viejo podía bloquear el mismo box días después.

### Impacto observado
Se detectaron 6 boxes bloqueados por turnos históricos. El fallo impedía el llamado normal aun cuando no había turnos activos de la jornada actual.

### Fix diseñado
La exclusividad debe ser por:

`(service_point_id, queue_date)`

para estados `llamado` y `en_atencion`.

Esto mantiene la protección de concurrencia dentro de una misma jornada sin permitir que históricos bloqueen jornadas futuras.

### Estado
**Pendiente de confirmar cierre en producción.**

No marcar como resuelto hasta tener:
- migración aplicada correctamente;
- definición final del índice verificada;
- pruebas de llamado, atención y concurrencia aprobadas.

## Hallazgo — turnos históricos sin cierre

Existen turnos antiguos en estados `esperando`, `llamado` y `en_atencion` que no se cerraron automáticamente.

La solución de expiración automática está diseñada por separado. No debe mezclarse con el P0 del índice.

Regla propuesta:
- históricos `esperando` -> `cancelado`;
- históricos `llamado` -> `ausente`;
- históricos `en_atencion` -> revisión manual.

## Hallazgo — polling público

La pantalla pública del ingresante consulta periódicamente el estado. El esquema actual usa polling frecuente y debe ser auditado para carga sostenida.

No cambiar UX ni reglas sin evaluación técnica y de producto.

## Regla de registro

Cada bug crítico debe documentar:
1. síntoma;
2. causa raíz;
3. impacto;
4. fix;
5. pruebas;
6. estado real de producción.

## Relacionado

- [[Casos críticos de testing]]
- [[Arquitectura general]]
- [[Estados del turno]]
