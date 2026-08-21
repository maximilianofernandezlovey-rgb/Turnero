# Migraciones pendientes

Estos archivos **no se aplican solos**. No hay credenciales de Supabase disponibles
en este entorno de desarrollo, así que hay que correrlos manualmente:

1. Abrir el proyecto en https://supabase.com/dashboard → SQL Editor.
2. Ejecutar `0001_turn_origin.sql` y luego `0002_push_subscriptions.sql`, en ese orden.
3. Ambos son idempotentes (se pueden volver a correr sin romper nada) y puramente
   aditivos: no borran columnas, tablas ni funciones existentes.

Sin aplicarlos, el resto de la aplicación sigue funcionando exactamente igual que
hoy. Lo único que queda deshabilitado son las notificaciones push (fallan en
silencio, sin romper la creación/seguimiento de turnos) y el tag de `origin` en
los turnos generados desde el tótem en papel.
