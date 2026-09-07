# Roles y permisos

## Objetivo

Definir qué puede hacer cada tipo de usuario y evitar que la interfaz sea la única barrera de seguridad.

## Roles funcionales

### Ingresante / visitante
Puede:
- crear su turno mediante los flujos públicos habilitados;
- consultar el estado de su propio turno;
- completar feedback cuando se ofrezca.

No debe poder:
- acceder a datos operativos internos;
- modificar estados administrativos;
- enumerar turnos ajenos;
- invocar acciones reservadas a operadores o administradores.

### Operador
Puede:
- trabajar con la cola habilitada;
- llamar, rellamar, iniciar y finalizar atención según reglas de negocio;
- registrar datos de atención permitidos.

No debe poder:
- administrar permisos globales;
- alterar configuración sensible;
- eludir restricciones de concurrencia.

### Administrador
Puede:
- visualizar operación y métricas;
- gestionar configuración habilitada;
- administrar operadores/boxes según alcance definido;
- revisar información necesaria para supervisión.

## Principios de seguridad

- La autorización se valida en backend, no solo ocultando botones.
- RLS y RPC deben revisarse en conjunto.
- `SECURITY DEFINER` solo cuando esté justificado y con `search_path` controlado.
- Ningún secreto sensible debe exponerse al navegador.
- Endpoints administrativos requieren autenticación y autorización explícitas.
- Las acciones críticas deben ser auditables.

## Pendientes de auditoría técnica

- RLS de tablas operativas.
- permisos de rol `anon` y usuarios autenticados;
- exposición de RPC públicas;
- sesiones/cookies;
- almacenamiento y validación de credenciales de operadores;
- endpoints de administración;
- variables públicas de entorno.

Estas verificaciones pertenecen a Ingeniería. Los cambios de producto o roles deben documentarse primero acá.

## Relacionado

- [[Arquitectura general]]
- [[Flujo del operador]]
- [[Casos críticos de testing]]
