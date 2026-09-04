# Dashboard de Administración

## Objetivo
Administración debe funcionar como un tablero operativo y ejecutivo, no como una colección de formularios técnicos.

## Resumen inicial
La primera vista debe permitir responder en segundos:
- ¿Cuántos turnos hubo hoy?
- ¿Cuántos están esperando?
- ¿Cuál es la espera promedio?
- ¿Cuál es el tiempo promedio de atención?
- ¿Cuántos boxes están activos?
- ¿Cuántos turnos terminaron como ausentes o cancelados?

## Visualizaciones
Usar los datos reales ya disponibles para mostrar:
- Distribución de turnos por trámite.
- Atención por franja horaria.
- Estado operativo en vivo: esperando, llamados y en atención.
- Ocupación de boxes.

No inventar métricas que todavía no exponga el backend.

## Jerarquía visual
1. KPIs del día.
2. Gráficos de volumen y horario.
3. Atención en vivo.
4. Navegación hacia turnos, operadores, boxes, postulantes, comentarios y reportes.

## Principios
- Lectura rápida.
- Colores con significado operativo, no decorativo.
- Tablas para detalle; gráficos para patrones.
- Alertas solo cuando requieren atención.
- Mantener configuración separada del monitoreo diario.

## Evolución futura
Cuando backend lo permita, evaluar:
- comparación contra día/semana anterior;
- pico horario;
- cumplimiento del tiempo objetivo por trámite;
- tasa de abandono/ausencia;
- productividad por box u operador con criterios acordados previamente.