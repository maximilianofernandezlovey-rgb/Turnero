# Flujo del ingresante

## Objetivo

La experiencia pública debe responder una sola pregunta principal por pantalla.

## 1. Selección

Pregunta: **¿En qué podemos ayudarte?**

Opciones V1 de Ingreso:
- Inscripción
- Informes
- Equivalencias externas

Cada opción muestra nombre + descripción breve. No mostrar detalles técnicos del turno.

## 2. Espera

Prioridad visual:
1. Número de turno.
2. Estado `En espera`.
3. Personas antes que el usuario.
4. Espera estimada si existe un dato válido.
5. Mensaje: `Podés mantener esta página abierta. Te avisaremos cuando sea tu turno.`

No mostrar `Volver al inicio` mientras existe un turno activo. Una eventual cancelación debe ser una acción de negocio explícita, no un reset visual.

## 3. Llamado / atención

Cuando el turno pasa a `llamado` o `en_atencion`, ocultar la información vieja de cola.

Prioridad visual:
1. `¡Es tu turno!`
2. Número.
3. Box.
4. `Podés acercarte ahora.`

## 4. Finalización

Primero comunicar el cierre de la atención. El feedback es secundario y opcional.

- `¡Gracias por visitarnos!`
- `Tu atención finalizó correctamente.`
- Comentario opcional.
- Email opcional.
- Acción primaria: `Enviar comentario`.
- Acción secundaria: `No, gracias`.

## Criterio UX

Una pantalla = una decisión o información principal.

Relacionado: [[Estados del turno]], [[Sistema visual]], [[Decisiones de producto]].