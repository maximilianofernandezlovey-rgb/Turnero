# Estado actual del proyecto

## Estado general

El Turnero está en desarrollo activo. El código productivo permanece separado de la rama de rediseño y documentación.

## Prioridad actual

Existe un incidente P0 en producción relacionado con el llamado de turnos y el índice `turns_one_active_per_service_point_idx`. La corrección técnica debe resolverse y validarse antes de mezclar cambios de diseño con producción.

## Diseño

La rama `design/obsidian-ui-v2` contiene el rediseño en curso del flujo móvil, Tótem y Administración, además de este Vault.

## Reglas de trabajo

- No mezclar fixes técnicos P0 con rediseño visual.
- No hacer merge a `main` sin validación y autorización.
- No cambiar slugs técnicos por cambios de copy visual.
- Documentar aquí las decisiones funcionales antes de implementarlas.

## Próximos frentes

- Resolver y validar el P0 de llamado.
- Completar el copy visible `Informes generales` en todas las superficies pertinentes.
- Continuar el rediseño de Administración, Tótem y flujo del ingresante.
- Completar arquitectura, operadores, seguridad, testing, bugs y roadmap dentro del Vault.
