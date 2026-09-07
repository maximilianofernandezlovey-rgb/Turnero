# Casos críticos de testing

## Objetivo

Definir pruebas mínimas que deben pasar antes de considerar estable una versión del Turnero.

## Creación de turno
- crear un turno válido;
- impedir duplicaciones por doble envío cuando aplique;
- preservar número visible y tracking únicos;
- confirmar comportamiento bajo concurrencia.

## Operadores y boxes
- llamar siguiente;
- llamar por categoría;
- llamar turno específico;
- rellamar;
- iniciar atención;
- finalizar atención;
- llamar otro turno después de finalizar;
- impedir que dos operadores tomen el mismo turno;
- impedir dos turnos activos del mismo día en el mismo box;
- permitir reutilizar el mismo box en otra jornada aunque haya históricos pendientes.

## Estados
Validar transiciones permitidas:

`esperando -> llamado -> en_atencion -> finalizado`

Ramas:

`esperando -> cancelado`

`llamado -> ausente`

No deben aceptarse saltos arbitrarios de estado sin regla explícita.

## Jornada
- filtros por `queue_date` correctos;
- históricos no afectan métricas ni cola actual;
- cierres automáticos, cuando estén habilitados, no modifican `en_atencion` sin regla aprobada.

## Carga
Escenarios de referencia ya trabajados:
- 25 concurrentes;
- 50 concurrentes;
- 100 concurrentes;
- pruebas superiores solo con autorización y control del entorno.

La prueba de carga debe medir éxito, latencias, duplicados y residuos de prueba.

## UI
- mobile ingresante;
- tótem táctil;
- operador desktop;
- administración responsive;
- estados vacíos y errores;
- accesibilidad básica y jerarquía visual.

## Criterio de cierre P0
Un P0 no se considera cerrado solo porque desapareció el mensaje de error. Debe probarse la causa raíz, la regresión y las protecciones de concurrencia relacionadas.

## Relacionado

- [[Bugs y hallazgos]]
- [[Arquitectura general]]
- [[Flujo del operador]]
