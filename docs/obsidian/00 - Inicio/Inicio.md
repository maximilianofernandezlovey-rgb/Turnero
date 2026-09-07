# Turnero UADE

Este Vault es la fuente de verdad funcional y de producto del Turnero.

## Principio de trabajo

- **Obsidian** define qué debe hacer el sistema.
- **Diseño/Producto** define lógica funcional, UX, UI y textos.
- **Ingeniería** implementa, valida, prueba y optimiza sin alterar reglas de producto por cuenta propia.
- **GitHub** conserva el código y versiona esta documentación.

## Navegación principal

### Estado y principios
- [[Principios del Turnero]]
- [[Estado actual del proyecto]]
- [[V1]]

### Arquitectura y reglas
- [[Arquitectura general]]
- [[Estados del turno]]
- [[Roles y permisos]]

### Experiencias
- [[Flujo del ingresante]]
- [[Flujo del operador]]
- [[Flujo tótem]]
- [[Dashboard]]
- [[Sistema visual]]

### Calidad y seguimiento
- [[Casos críticos de testing]]
- [[Bugs y hallazgos]]
- [[Decisiones de producto]]

## Cómo usar este Vault

Abrí la carpeta `docs/obsidian` como Vault en Obsidian. La guía completa está en [[README]].

Usá esta portada como punto de entrada. Antes de cambiar una regla funcional, UX crítica, estados o permisos, actualizá la documentación correspondiente.

## Regla de autoridad

Cuando exista una contradicción entre una regla aprobada en este Vault y el comportamiento del código, debe revisarse el código. Si una regla necesita cambiar, primero se modifica y aprueba la documentación de producto.

## Regla de producción

Un cambio documentado o implementado en una rama de trabajo no implica que esté activo en producción. El estado real debe verificarse antes de marcar una decisión, bug o feature como resuelta.
