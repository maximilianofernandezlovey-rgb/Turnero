# Principios del Turnero

1. **El frontend representa el estado; la base decide el estado.**
2. **Una acción lógica debe producir como máximo un efecto.** Doble click, refresh o reintentos no deben duplicar turnos ni acciones.
3. **La jornada actual está aislada de jornadas anteriores.** Ningún turno viejo puede bloquear boxes, alterar la cola o distorsionar métricas del día.
4. **Toda transición relevante debe quedar auditada.**
5. **Un box solo puede tener un turno activo por jornada.**
6. **La interfaz muestra solo lo necesario para la acción actual.** Una pantalla = una decisión o información principal.
7. **La experiencia pública prioriza claridad y tranquilidad.** La experiencia del operador prioriza velocidad y prevención de errores.
8. **Las reglas de negocio no se inventan durante la implementación.** Las decisiones pendientes se documentan antes de programarse.
9. **Los estados ambiguos no se resuelven automáticamente con información falsa.** Un `en_atencion` histórico requiere revisión humana.
10. **Los cambios de alto riesgo se prueban fuera de producción antes de aplicarse.**

Relacionado: [[Estados del turno]], [[Jornada]], [[Boxes]], [[Decisiones de producto]].