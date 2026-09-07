# Flujo del operador

## Objetivo

La interfaz del operador debe priorizar velocidad, claridad y prevención de errores. No debe competir visualmente con la tarea principal: atender personas.

## Flujo base

### 1. Ingreso
- El operador inicia sesión.
- Tiene un box asignado o selecciona uno según la regla vigente.
- El sistema debe impedir ocupaciones incompatibles del mismo box.

### 2. Sin turno activo
El operador debe ver:
- cantidad de personas esperando;
- próximo turno disponible;
- acción principal: **Llamar siguiente**;
- opciones secundarias, cuando correspondan: llamada por categoría o turno específico.

### 3. Turno llamado
El operador debe ver con máxima jerarquía:
- número del turno;
- categoría;
- estado `llamado`;
- acción principal: **Iniciar atención**;
- posibilidad de rellamada cuando corresponda.

### 4. En atención
El operador debe ver:
- número de turno;
- tiempo de atención;
- campos operativos necesarios;
- carrera de interés cuando corresponda;
- observaciones;
- acción principal: **Finalizar atención**.

### 5. Finalización
Al finalizar correctamente:
- el turno pasa a `finalizado`;
- el box queda disponible para otro turno de la misma jornada;
- el operador vuelve al estado sin turno activo.

## Reglas críticas

- Dos operadores no pueden tomar el mismo turno.
- Dos turnos de la misma jornada no pueden ocupar simultáneamente el mismo box.
- Un turno histórico no debe bloquear el box en la jornada actual.
- Un doble clic no debe generar dos efectos.
- La UI solo debe mostrar éxito cuando backend confirmó la acción.

## UX

La pantalla debe ser operacional, no decorativa. Debe evitar modales innecesarios, textos largos y controles secundarios que distraigan.

## Relacionado

- [[Estados del turno]]
- [[Arquitectura general]]
- [[Casos críticos de testing]]
- [[Bugs y hallazgos]]
