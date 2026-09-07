# Arquitectura general

## Objetivo

El Turnero UADE debe separar con claridad experiencia de usuario, reglas de negocio, persistencia y despliegue.

## Capas

### Frontend
- Next.js.
- Experiencia pública del ingresante.
- Interfaz de operadores.
- Administración.
- Tótem.
- Pantalla pública.

El frontend representa el estado y solicita acciones. No decide por sí solo reglas críticas de concurrencia.

### Backend y datos
- Supabase/PostgreSQL.
- Las funciones/RPC y restricciones de base son la autoridad para cambios de estado críticos.
- Las restricciones deben estar alineadas con las reglas documentadas en este Vault.

### Despliegue
- Vercel aloja la aplicación.
- Producción y previews deben mantenerse separados.
- Ningún preview de diseño implica automáticamente un cambio en producción.

## Principios técnicos

1. Un turno de una jornada anterior nunca debe bloquear la jornada actual.
2. Una acción lógica debe producir como máximo un efecto.
3. La base de datos protege concurrencia e integridad.
4. El frontend no debe simular cancelaciones, llamados o cierres que no hayan sido confirmados por backend.
5. Las transiciones importantes deben poder auditarse.

## Relación con otras notas

- [[Estados del turno]]
- [[Flujo del operador]]
- [[Roles y permisos]]
- [[Casos críticos de testing]]
- [[Bugs y hallazgos]]
