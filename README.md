# Turnero UADE / Turnero Universitario Inteligente

## Estado de este repositorio

Este paquete es un **handoff inicial para GitHub y el Área de Sistemas**.

**IMPORTANTE:** este ZIP NO contiene todavía el código fuente original correspondiente a:

`https://turnero-ingreso.maximilianofer790203.chatgpt.site/gestion`

Ese código debe recuperarse/exportarse desde el proyecto original y agregarse a este repositorio antes de comenzar modificaciones de producción.

## Objetivo

Centralizar en un único repositorio:

- Código fuente oficial.
- Documentación funcional y técnica.
- Migraciones de base de datos.
- Tests.
- Variables de entorno de ejemplo.
- Historial de cambios mediante Git.
- Integración futura con CI/CD y hosting.

## Estructura

```text
Turnero/
├── README.md
├── .gitignore
├── .env.example
├── docs/
│   ├── CONTEXTO_MAESTRO_SISTEMAS.md
│   └── RECUPERAR_CODIGO_ORIGINAL.md
├── src/
├── database/
│   └── migrations/
└── tests/
```

## Regla principal

No desarrollar una nueva aplicación paralela.

Primero se debe recuperar el código exacto del turnero original, versionarlo y lograr un build reproducible en staging.

## Flujo Git recomendado

- `main`: producción estable.
- `develop`: integración y pruebas.
- ramas `feature/*`: funcionalidades individuales.
- Pull Request antes de pasar cambios a `main`.

## Seguridad

Nunca subir:

- `.env`
- API keys reales
- passwords
- service role keys
- tokens
- credenciales de base de datos

Usar `.env.example` solo con nombres de variables y valores ficticios.
