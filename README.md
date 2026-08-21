# Turnero UADE / Turnero Universitario Inteligente

Repositorio oficial de reconstrucción y evolución del Turnero Universitario Inteligente.

## Estado actual

Este repositorio contiene una **base ejecutable en Next.js + TypeScript** preparada para Vercel. No es una extracción literal del código de `chatgpt.site`: es el nuevo baseline fuente, mantenible y versionado, construido a partir de la especificación funcional consolidada.

### Rutas disponibles

- `/gestion` — experiencia alumno / QR.
- `/operadores` — panel operativo.
- `/pantalla` — pantalla pública / TV.
- `/totem` — tótem de autoservicio.
- `/admin` — administración.
- `/api/health` — health check.

## Importante

Las interfaces ya son navegables y desplegables. Las operaciones sensibles todavía están deshabilitadas visualmente hasta conectar el backend real. No se presentan datos demo como si fueran producción.

## Próxima etapa

1. Conectar PostgreSQL/Supabase.
2. Implementar autenticación y RBAC.
3. Implementar motor transaccional de turnos con idempotencia y bloqueo de concurrencia.
4. Realtime para alumno, operadores y TV.
5. QR.
6. IA y base de conocimiento.

## Desarrollo local

```bash
npm install
npm run dev
```

Abrir `http://localhost:3000`.

## Build

```bash
npm run build
```

## PWA y notificaciones push (`/gestion`)

`/gestion` funciona como PWA instalable (manifest + Service Worker propios, sin
afectar el resto de las rutas) con Web Push opcional para avisar al alumno
cuando falten ~3 personas, sea el próximo o lo llamen, aunque tenga la app
minimizada. Requiere:

1. Correr las migraciones de `supabase/migrations/` (ver el README de esa carpeta).
2. Configurar en Vercel `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `VAPID_SUBJECT`.

Sin esos dos pasos, la aplicación sigue funcionando igual que hoy — el botón de
notificaciones simplemente no aparece.

## Seguridad

Nunca subir `.env`, API keys, passwords, service role keys ni tokens. Ver `.env.example`.

La especificación completa está en `docs/CONTEXTO_MAESTRO_SISTEMAS.md`.
