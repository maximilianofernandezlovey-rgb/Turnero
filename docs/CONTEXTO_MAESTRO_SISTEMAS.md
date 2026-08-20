# TURNERO UNIVERSITARIO INTELIGENTE
## Documento maestro de contexto, alcance, arquitectura, validaciones y criterios de aceptación

**Destino:** Área de Sistemas / Desarrollo / Arquitectura / Seguridad / Infraestructura / Producto  
**Estado:** Documento de handoff funcional y técnico  
**Fecha de consolidación:** 20/08/2026  
**Aplicación base oficial a continuar:** `https://turnero-ingreso.maximilianofer790203.chatgpt.site/gestion`

---

# 0. PROPÓSITO DE ESTE DOCUMENTO

Este documento consolida el contexto completo del proyecto **Turnero Universitario Inteligente**, incluyendo:

- la idea original del turnero presencial;
- el tótem de autoservicio;
- el panel de operadores;
- la pantalla pública de llamados;
- el panel administrativo;
- la evolución hacia un turnero móvil iniciado mediante QR;
- la incorporación de Inteligencia Artificial;
- la conexión futura con información académica del alumno;
- la base de conocimiento institucional;
- el aprendizaje supervisado;
- la separación entre sectores;
- métricas y analítica;
- seguridad;
- arquitectura;
- tiempo real;
- validaciones funcionales;
- validaciones técnicas;
- pruebas de concurrencia;
- pruebas de recuperación;
- pruebas de autenticación y autorización;
- controles de privacidad;
- manejo de errores;
- contingencia;
- criterios de aceptación;
- riesgos y deuda técnica.

El objetivo es que el Área de Sistemas pueda recibir este archivo sin depender de conversaciones previas y comprender con precisión:

1. qué problema se quiere resolver;
2. qué funcionalidades son obligatorias;
3. qué comportamientos no son aceptables;
4. qué validaciones deben existir;
5. cómo debería evolucionar la arquitectura;
6. qué debe probarse antes de considerar el sistema apto para uso real.

> **Regla de proyecto:** no se considera terminada una funcionalidad únicamente porque se visualiza en pantalla. Debe existir backend, persistencia, seguridad, validación, manejo de errores y prueba de funcionamiento extremo a extremo.

---

# 1. VISIÓN DEL PRODUCTO

El proyecto comenzó como un **sistema de turnos para la atención presencial del sector de Ingreso de una universidad**.

La primera versión conceptual incluía tres experiencias sincronizadas en tiempo real:

1. **Tótem de autoservicio.**
2. **Panel de operadores.**
3. **Pantalla pública de llamados.**

Luego se agregó un cuarto componente:

4. **Panel de administración.**

Posteriormente, el producto evolucionó hacia una plataforma de atención universitaria más amplia que incorpora:

- acceso mediante QR;
- fila virtual;
- seguimiento móvil;
- tiempo estimado de espera;
- posibilidad de esperar sin permanecer físicamente en una fila;
- asistente académico con IA;
- respuestas personalizadas;
- conexión futura con expediente académico;
- derivación a humanos sin perder contexto;
- base de conocimiento validada;
- aprendizaje supervisado;
- auditoría;
- métricas;
- control de vigencia de información;
- separación entre diferentes sectores de atención.

La visión final **no es crear solamente un sistema para sacar números**.

La visión es crear una:

> **Plataforma inteligente de atención universitaria capaz de resolver consultas simples automáticamente, administrar la espera presencial, asistir a operadores y mantener trazabilidad de las consultas complejas.**

---

# 2. OBJETIVOS DE NEGOCIO Y EXPERIENCIA

El sistema debe disminuir:

- tiempo de espera físico;
- congestión en los sectores de atención;
- consultas repetitivas;
- cantidad de derivaciones innecesarias;
- tiempo que un operador dedica a buscar información;
- cantidad de alumnos que llegan a ventanilla por trámites que podían resolverse digitalmente;
- errores de información;
- recontactos;
- abandono de la fila;
- incertidumbre respecto del tiempo de espera.

El sistema debe mejorar:

- experiencia del alumno;
- calidad de atención;
- velocidad;
- trazabilidad;
- conocimiento institucional;
- consistencia de las respuestas;
- productividad del operador;
- visibilidad operativa;
- capacidad de planificación;
- información para decisiones de gestión.

---

# 3. PRINCIPIOS NO NEGOCIABLES

## 3.1 Confiabilidad

La aplicación podría utilizarse para atención real de alumnos.

Antes de implementar cualquier funcionalidad se debe responder:

1. ¿Puede fallar?
2. ¿Qué ocurre si falla?
3. ¿Se pierde información?
4. ¿Puede recuperarse?
5. ¿El error queda registrado?
6. ¿El usuario sabe qué ocurrió?
7. ¿Existe riesgo de duplicar una operación?
8. ¿Existe riesgo de ejecutar una acción dos veces?

---

## 3.2 No inventar funcionalidades

No se aceptan:

- botones sin backend;
- rutas que no funcionan;
- información simulada presentada como real;
- datos de ejemplo visibles como si fueran producción;
- componentes visuales sin persistencia;
- acciones que no tengan confirmación del servidor.

---

## 3.3 La IA nunca inventa información institucional

Esta es una regla crítica.

Si el sistema no posee una fuente válida, vigente y suficiente para responder, la IA debe:

1. reconocer que no dispone de información suficiente;
2. no completar la respuesta con conocimiento general;
3. registrar la consulta;
4. derivar a un operador o circuito humano;
5. conservar el contexto de la conversación.

---

## 3.4 El backend controla permisos

No alcanza con ocultar botones.

Toda acción sensible debe validarse en backend:

- rol;
- sector;
- sesión;
- permisos;
- estado del turno;
- ownership cuando corresponda.

---

## 3.5 Separación por sector

Toda entidad relevante debe contemplar `sector_id` o equivalente.

Aplicar como mínimo a:

- usuarios;
- operadores;
- turnos;
- categorías;
- colas;
- consultas;
- conversaciones;
- métricas;
- conocimiento;
- configuración;
- boxes/puestos cuando corresponda;
- reportes.

**Nunca deben mezclarse datos entre sectores por error de interfaz, API o consulta SQL.**

---

# 4. APLICACIÓN BASE OFICIAL

Se decidió volver a utilizar como base la aplicación original:

`https://turnero-ingreso.maximilianofer790203.chatgpt.site/gestion`

Esta debe considerarse **la referencia funcional a continuar**.

## Importante para Sistemas

El presente documento describe el alcance funcional y técnico esperado, pero el código real que se encuentra detrás de ese sitio debe ser auditado por Sistemas para identificar:

- framework;
- repositorio;
- infraestructura;
- backend;
- base de datos;
- autenticación;
- rutas;
- despliegue;
- variables de entorno;
- integraciones actuales;
- componentes reutilizables;
- deuda técnica;
- cobertura de pruebas.

**No se debe asumir que todas las funcionalidades documentadas existen actualmente en el código.**

Antes de modificar el proyecto:

1. extraer el código fuente;
2. versionarlo en un repositorio institucional;
3. identificar la versión desplegada;
4. generar inventario de dependencias;
5. realizar backup de base de datos;
6. generar mapa de rutas;
7. revisar variables de entorno;
8. documentar proceso de despliegue.

---

# 5. ALCANCE ORIGINAL: TURNERO DE INGRESO

## 5.1 Tótem de autoservicio

Interfaz para pantalla táctil y modo fullscreen.

### Categorías originales

- **Inscripción**
- **Informes**
- **Visita**
- **Equivalencias externas**

### Numeración esperada

- Inscripción → `INS-001`
- Informes → `INF-001`
- Visita → `VIS-001`
- Equivalencias externas → `EQE-001`

Cada categoría mantiene su propia secuencia.

### Flujo del tótem

1. Usuario toca una categoría.
2. Backend recibe la solicitud.
3. Backend valida categoría activa.
4. Se genera número de turno.
5. Se registra:
   - ID interno;
   - número;
   - categoría;
   - sector;
   - fecha;
   - hora;
   - estado;
   - origen.
6. Se agrega a la cola.
7. Se muestra:
   - número asignado;
   - mensaje “Aguarde a ser llamado”.
8. Opcionalmente se imprime ticket.
9. Tras algunos segundos vuelve a inicio.

### Validaciones obligatorias del tótem

- No permitir categorías inactivas.
- La generación de número debe ocurrir en backend.
- No calcular el próximo número solamente en frontend.
- Operación atómica.
- No permitir números duplicados.
- Reinicio de secuencia por día sin borrar historial.
- Cada categoría debe respetar su propia secuencia cuando el modelo funcional así lo requiera.
- Un doble toque no puede generar dos turnos involuntarios.
- Implementar idempotencia mediante `request_id` o equivalente.
- Timeout de UI no debe cancelar la transacción ya confirmada.
- Si falla la impresión, el turno debe seguir existiendo.
- Si la impresora no está disponible, la aplicación debe seguir funcionando.
- Si la base de datos no confirma la creación, no mostrar un número como válido.
- Registrar error de impresora de forma independiente del error de generación.

---

# 6. EVOLUCIÓN: INGRESO POR CÓDIGO QR

El modelo futuro prioriza QR + dispositivo móvil.

## Principio UX

> El estudiante no debería ingresar manualmente información que el QR, su legajo o el sistema institucional ya conocen.

## 6.1 Flujo QR

1. Alumno llega físicamente al campus.
2. Escanea QR.
3. QR contiene o resuelve un identificador público.
4. Backend determina:
   - campus;
   - sector;
   - punto de ingreso;
   - cola;
   - origen;
   - configuración correspondiente.
5. Alumno elige el trámite.
6. Si corresponde, la IA intenta resolver antes de crear el turno.
7. Si requiere atención humana:
   - crea turno;
   - muestra número;
   - posición;
   - estimación;
   - sector;
   - estado.
8. Alumno espera desde el celular.
9. Se actualiza en tiempo real.
10. Cuando es llamado:
   - cambia estado;
   - muestra box/puesto;
   - puede vibrar;
   - puede emitir alerta visual.
11. Se completa atención.
12. Opcionalmente se solicita feedback.

---

# 7. DISEÑO DEL QR

## 7.1 El QR no debe contener datos sensibles

Se recomienda que contenga un identificador opaco:

`https://turnos.universidad.edu/q/ABC78X`

El backend resuelve:

- `campus_id`;
- `sector_id`;
- `service_point_id`;
- `queue_id`;
- `qr_id`;
- estado activo/inactivo;
- configuración.

## 7.2 Variables de contexto

Como mínimo:

- `qr_id`;
- `campus_id`;
- `sector_id`;
- `service_point_id` o punto físico;
- `queue_id`;
- `source = physical_qr`;
- timestamp del acceso registrado en servidor;
- versión/configuración del QR si se implementan QR dinámicos.

## 7.3 Validaciones del QR

- Código existente.
- Código activo.
- Código no vencido si posee expiración.
- Sector asociado activo.
- Campus activo.
- Cola activa.
- Evitar exponer IDs internos innecesariamente.
- El QR nunca debe incluir:
  - legajo;
  - DNI;
  - email;
  - tokens de sesión;
  - API keys.
- Rate limiting ante abuso.
- Registrar escaneo separadamente de creación de turno.
- Un escaneo no debe equivaler automáticamente a un turno hasta que el alumno confirme el trámite.
- Si se utilizan QR rotativos:
  - validar firma/nonce;
  - controlar expiración;
  - prevenir replay cuando aplique.

---

# 8. PORTAL PÚBLICO DEL ALUMNO

Diseñado principalmente para móvil.

Debe ser:

- claro;
- rápido;
- accesible;
- moderno;
- con botones grandes;
- con pocos pasos;
- sin formularios innecesarios.

## Funciones esperadas

El alumno puede:

1. ingresar por QR;
2. identificar el trámite;
3. obtener turno;
4. ver número;
5. ver personas adelante;
6. ver rango/estimación de espera;
7. saber si está próximo;
8. saber si está siendo llamado;
9. conocer box/puesto;
10. cancelar turno;
11. consultar turno por código;
12. conversar con IA durante la espera.

## No debe requerir cuenta de ChatGPT

La experiencia de IA debe estar integrada en la propia aplicación.

No debe:

- abrir ChatGPT;
- pedir cuenta de ChatGPT;
- pedir contraseña de OpenAI;
- mostrar flujos de autenticación externos innecesarios.

---

# 9. PANTALLAS MÓVILES CLAVE

## 9.1 Pantalla 1 — Contexto / identificación

El QR ya informa campus y sector.

Mostrar discretamente:

- campus;
- sector;
- punto de atención.

Si se integra identidad académica:

- permitir legajo/DNI o SSO institucional;
- no solicitar datos ya disponibles.

---

## 9.2 Pantalla 2 — Selección de trámite

Tarjetas grandes.

Ejemplo para Oficina de Alumnos:

- Altas y bajas.
- Facturación.
- Gestión académica.
- Exámenes.
- Documentación.
- WebCampus.
- Otro.

Para Ingreso, preservar inicialmente:

- Inscripción.
- Informes.
- Visita.
- Equivalencias externas.

La taxonomía definitiva debe salir de datos reales.

---

## 9.3 Pantalla 3 — Espera activa

Conceptualmente:

- ~55% turno;
- ~45% asistente IA.

### Parte superior

Prioridad visual:

1. número;
2. estado;
3. tiempo estimado;
4. personas adelante;
5. sector;
6. box cuando sea asignado.

Ejemplo:

`A-047`

`ESPERANDO`

`≈ 12 min`

`3 personas antes que vos`

### Parte inferior

Asistente académico:

- entrada de chat;
- sugerencias contextualizadas;
- no competir visualmente con el turno.

Cuando el estado pasa a `llamado`, el turno debe tomar prioridad total.

---

# 10. ESTADOS DEL TURNO

Estados funcionales consolidados:

- `esperando`;
- `proximo`;
- `llamado`;
- `en_atencion`;
- `finalizado`;
- `ausente`;
- `cancelado`;
- `transferido` / derivado, según modelo de datos.

Si una transferencia crea un nuevo turno relacionado, debe existir relación explícita.

## Validaciones de transición

### `esperando → llamado`

Permitido si:

- turno está en espera;
- operador está autenticado;
- operador tiene permiso sobre sector;
- box válido;
- operador no tiene conflicto de turno activo según política.

### `llamado → en_atencion`

Solo turno actualmente llamado.

### `llamado → ausente`

Permitido según política.

### `en_atencion → finalizado`

Solo turno en atención.

### `esperando/llamado → cancelado`

Debe definirse qué roles pueden hacerlo.

### Transiciones inválidas

Ejemplos que deben rechazarse:

- finalizar un turno que nunca se inició;
- iniciar un turno ya finalizado;
- llamar un turno cancelado;
- cancelar dos veces;
- finalizar dos veces;
- cambiar un turno de sector sin registrar derivación.

---

# 11. DATOS MÍNIMOS DE UN TURNO

- `id` UUID.
- `tracking_code`.
- `queue_date`.
- `sequence_number`.
- `visible_number`.
- `sector_id`.
- `category_id`.
- `status`.
- `priority`.
- `created_at`.
- `called_at`.
- `started_at`.
- `finished_at`.
- `cancelled_at` si se separa.
- `operator_id`.
- `service_point_id`.
- `origin`.
- `qr_point_id`.
- `request_id`.
- `derived_from_turn_id`.
- notas si corresponde.

## Campos derivados

- tiempo de espera real;
- duración de atención;
- personas adelante;
- estimación actual.

Preferir calcular métricas desde timestamps/eventos o persistir campos derivados con estrategia clara.

---

# 12. CONCURRENCIA — VALIDACIÓN CRÍTICA

## Problema

Dos operadores pueden presionar “Llamar siguiente” al mismo tiempo.

No puede ocurrir:

- Operador 1 → INS-023
- Operador 2 → INS-023

## Solución

La elección del próximo turno debe realizarse en una transacción de base de datos.

Patrón recomendado PostgreSQL:

```sql
SELECT ...
FROM turns
WHERE status = 'esperando'
ORDER BY priority DESC, created_at ASC
FOR UPDATE
SKIP LOCKED
LIMIT 1;
```

Después se actualiza el estado dentro de la misma transacción.

## Validaciones de concurrencia

- Prueba con 2 operadores simultáneos.
- Prueba con 10 llamadas concurrentes.
- Cada turno solo puede ser adjudicado una vez.
- No deben aparecer deadlocks no controlados.
- En caso de retry:
  - operación debe ser idempotente;
  - evitar doble cambio de estado.

---

# 13. IDEMPOTENCIA

Toda operación susceptible a repetirse por:

- doble clic;
- mala conexión;
- retry automático;
- refresh;
- timeout;

debe contemplar idempotencia.

Ejemplo:

`request_id UUID UNIQUE`

Si el frontend repite una solicitud con el mismo `request_id`, el servidor devuelve la operación existente en vez de crear una nueva.

Aplicar como mínimo a:

- crear turno;
- confirmar transacciones sensibles;
- integraciones externas;
- eventualmente envío de notificaciones.

---

# 14. PANEL DE OPERADORES

La experiencia del operador debe ser muy directa.

## Ingreso

1. autenticación;
2. resolución de rol;
3. resolución de sector permitido;
4. selección/asignación de box.

## Ingreso — boxes

El alcance original establece **13 boxes, numerados del 1 al 13**.

El operador debe tener:

- box asignado; o
- selección de box al iniciar jornada.

## Información principal

### Turnos esperando

Mostrar:

- número;
- categoría;
- hora;
- tiempo esperando;
- prioridad.

### Totales por categoría

Ejemplo:

- INS: 12
- INF: 4
- VIS: 2
- EQE: 1

### Turno actual

Mostrar destacado:

- número;
- categoría;
- hora de ingreso;
- tiempo de espera;
- consulta previa de IA si existe;
- contexto relevante.

### Estado de boxes

Mostrar qué turno está atendiendo cada box.

---

# 15. ACCIONES DEL OPERADOR

Obligatorias:

- llamar siguiente global según reglas;
- llamar próximo de una categoría;
- volver a llamar;
- comenzar atención;
- finalizar;
- ausente;
- cancelar;
- transferir a categoría;
- transferir a otro box;
- llamada manual de un turno específico;
- consultar historial/contexto.

## Validaciones por acción

### Llamar siguiente

- operador autenticado;
- sector autorizado;
- box activo;
- turno elegible;
- bloqueo transaccional;
- un operador no puede tomar más turnos activos que los permitidos.

### Volver a llamar

- turno debe estar en estado `llamado`;
- actualizar `called_at` o generar evento `recall`;
- no crear turno nuevo.

### Iniciar atención

- validar ownership o política;
- turno llamado;
- registrar timestamp.

### Finalizar

- turno en atención;
- registrar timestamp;
- liberar box;
- actualizar métricas.

### Ausente

- estado permitido;
- registrar evento;
- definir regla de reingreso si existiera.

### Cancelar

- registrar quién canceló;
- motivo opcional/obligatorio según regla;
- no borrar fila histórica.

### Llamada manual

- turno existe;
- turno elegible;
- sector correcto;
- validar concurrencia;
- auditar que fue llamada manual.

---

# 16. TRANSFERENCIAS

Se requiere transferencia:

- a otra categoría;
- a otro box;
- potencialmente a otro sector.

## Principios

La transferencia no debe:

- perder contexto;
- borrar historial;
- hacer desaparecer la atención anterior;
- resetear arbitrariamente la antigüedad del alumno.

Si la arquitectura crea un turno nuevo:

- conservar `derived_from_turn_id`;
- conservar tracking del caso;
- registrar evento de transferencia;
- definir política de prioridad.

Recomendación de experiencia:

> Una transferencia no debería enviar automáticamente al alumno al final absoluto de otra cola si el error de clasificación no fue suyo.

La política exacta debe definirse institucionalmente.

---

# 17. PANTALLA PÚBLICA / TV

Modo pantalla completa.

Debe mostrar:

- último turno llamado;
- box;
- categoría;
- últimos llamados.

Ejemplo:

**INS-023 — Dirigirse al Box 7**

## Comportamiento

- actualización automática;
- sin refresh manual;
- animación del último llamado;
- sonido;
- voz opcional.

## Privacidad

La TV **nunca debe mostrar**:

- nombre;
- DNI;
- legajo;
- email;
- motivo sensible;
- datos académicos.

Solo códigos anónimos.

## Voz

Si se implementa Web Speech API:

- botón inicial “Activar sonido/voz” si el navegador exige interacción;
- fallback a sonido;
- manejo si TTS no está disponible.

---

# 18. TIEMPO REAL

Tecnología recomendada:

- WebSockets;
- Supabase Realtime Broadcast;
- Socket.IO;
- equivalente.

## Principio

> PostgreSQL es la fuente de verdad. WebSocket comunica cambios, no decide el estado.

Flujo:

```text
Operador realiza acción
→ backend valida
→ transacción PostgreSQL
→ commit
→ evento realtime
→ alumno / TV / dashboard actualizan
```

## Fallback

No depender exclusivamente del WebSocket.

Agregar:

- reconexión automática;
- re-suscripción;
- polling de recuperación (p. ej. 30–60 s);
- fetch de estado actual después de reconectar.

---

# 19. VALIDACIONES DE TIEMPO REAL

Probar:

- desconectar internet;
- reconectar;
- reiniciar navegador;
- cerrar pestaña;
- abrir otra pestaña;
- evento perdido;
- websocket reconectado;
- operador llama durante desconexión del alumno.

Al recuperar conexión, el usuario debe obtener **estado actual**, no solamente eventos futuros.

---

# 20. PÉRDIDA DE CONECTIVIDAD

## Alumno

Guardar localmente:

- tracking code;
- último estado conocido;
- timestamp del último sync.

Mostrar:

> “Sin conexión. Mostrando el último estado disponible.”

Al recuperar:

1. consultar backend;
2. reconciliar;
3. mostrar estado real.

## Operadores

Debe existir estrategia de contingencia.

No permitir que una UI offline modifique estados localmente y luego los sincronice sin control.

Definir:

- modo de solo lectura;
- contingencia operativa local;
- protocolo manual;
- recuperación posterior.

---

# 21. PANEL ADMINISTRATIVO

Problema UX detectado:

> El panel administrativo original resultaba demasiado cargado.

## Dashboard principal

Debe mostrar solo lo esencial:

- turnos atendidos;
- personas esperando;
- espera promedio;
- atención promedio;
- operadores activos;
- consultas IA pendientes;
- % resuelto automáticamente;
- alertas operativas.

No mostrar 20 indicadores simultáneos.

## Navegación modular

- Resumen.
- Atención.
- Turnos.
- Operadores.
- Boxes.
- Sectores.
- Categorías.
- Inteligencia Artificial.
- Base de conocimiento.
- Estadísticas.
- Configuración.

---

# 22. ADMINISTRACIÓN DE BOXES

Debe poder:

- crear box;
- editar nombre/código;
- activar;
- desactivar;
- ver estado;
- asignar sector;
- asignar categorías compatibles;
- asignar operador si aplica.

Para Ingreso:

- inicializar 13 boxes.

## Validaciones

- código único;
- no borrar físicamente box con historial;
- usar desactivación;
- no asignar turno a box inactivo;
- impedir que dos operadores reclamen el mismo box si la política exige exclusividad;
- auditar cambios.

---

# 23. ADMINISTRACIÓN DE CATEGORÍAS

Debe permitir:

- crear;
- modificar;
- activar/desactivar;
- descripción;
- sector;
- prefijo;
- duración objetivo;
- orden visual;
- compatibilidad con IA/autoservicio.

## Validaciones

- slug/código único dentro de sector;
- prefijo válido;
- cambios de prefijo no deben modificar números históricos;
- no borrar físicamente categorías con historial;
- duración objetivo en rango razonable;
- sector obligatorio.

---

# 24. OPERADORES Y ROLES

Roles mínimos:

## Administrador

Acceso completo.

## Supervisor

- métricas;
- atención;
- revisión de consultas;
- aprobación;
- supervisión;
- gestión de capacidad.

## Operador

- turnos;
- consultas derivadas;
- conocimiento;
- solamente sectores permitidos.

## Usuario público

Solo experiencia pública.

## Roles futuros útiles

- responsable de conocimiento;
- auditor;
- administrador técnico.

---

# 25. AUTENTICACIÓN

Áreas internas requieren autenticación.

Requisitos:

- passwords hasheadas;
- sesiones;
- expiración;
- rotación/revocación;
- bloqueo/limitación ante intentos;
- permisos backend;
- logout;
- cambio obligatorio de contraseña temporal.

## No permitido

- contraseñas en JS;
- contraseñas en HTML;
- contraseñas en repositorio;
- passwords en logs;
- tokens en URLs;
- API keys en frontend.

## Recomendación

Para producción preferir:

- SSO institucional; o
- proveedor de identidad institucional;
- Supabase Auth / OAuth / OpenID Connect según arquitectura.

---

# 26. SESIONES

Validar:

- expiración;
- revocación;
- logout;
- cambio de contraseña invalida sesiones previas según política;
- usuario desactivado no puede continuar;
- token manipulado se rechaza;
- token expirado se rechaza;
- sesión no debe otorgar acceso a sectores no asignados.

Para aplicaciones sensibles, preferir cookie:

- `HttpOnly`;
- `Secure`;
- `SameSite`.

Evitar almacenar sesiones sensibles únicamente en `localStorage` en la versión final.

---

# 27. INTELIGENCIA ARTIFICIAL — OBJETIVO

La IA funciona como primera capa.

Debe:

- responder consultas simples;
- responder consultas personalizadas cuando existan datos;
- clasificar intención;
- recuperar conocimiento;
- usar información académica autorizada;
- derivar cuando no puede responder;
- conservar contexto;
- entregar contexto al operador.

Objetivo de negocio orientativo:

> Resolver automáticamente una proporción alta de dudas antes de la llegada a ventanilla, sin sacrificar precisión.

No debe fijarse “80%” como requisito rígido de producción sin medición.

---

# 28. SYSTEM PROMPT — REGLAS MAESTRAS

La IA debe operar bajo reglas equivalentes a las siguientes:

## Rol

Asistente Académico Digital de la universidad.

## Prioridad

Brindar información institucional correcta.

## Fuentes permitidas

1. conocimiento institucional aprobado y vigente;
2. datos académicos autorizados;
3. contexto de conversación;
4. herramientas internas autorizadas.

## Prohibiciones

- no inventar fechas;
- no inventar requisitos;
- no inventar aranceles;
- no inventar correlatividades;
- no inventar políticas;
- no inventar estados académicos;
- no inferir excepciones.

## Personalización

Usar datos disponibles para responder “en tu caso”.

## Derivación obligatoria

Derivar si:

- falta información;
- fuentes contradictorias;
- contenido vencido;
- requiere excepción;
- hay error aparente en cuenta;
- se requiere cambio manual;
- reclamo;
- autoridad;
- impacto económico sin evidencia suficiente;
- inconsistencia entre sistema y alumno;
- política no documentada.

## Regla final

Ante duda entre:

A. responder posiblemente mal;  
B. derivar;

elegir **B**.

---

# 29. GUARDRAILS DE IA

No usar “confianza del modelo 95%” como única validación.

La decisión de responder debe depender de evidencia verificable:

- cantidad/calidad de fuentes;
- vigencia;
- coincidencia;
- versión;
- reglas estructuradas;
- datos necesarios presentes;
- ausencia de contradicción.

## Gating recomendado

```text
¿hay evidencia aprobada?
NO → derivar

¿está vigente?
NO → derivar

¿coincide con sector/plan/período?
NO → derivar

¿requiere acción humana?
SÍ → explicar + derivar

¿datos académicos necesarios disponibles?
NO → solicitar dato mínimo o derivar

SÍ → responder
```

---

# 30. DATOS DEL ALUMNO PARA PERSONALIZACIÓN

La IA no debe recibir todo el expediente indiscriminadamente.

## Identidad contextual mínima

- `student_id`;
- nombre;
- carrera;
- plan;
- campus;
- estado;
- período.

## Historia académica según intención

- materias aprobadas;
- cursadas;
- en curso;
- final pendiente;
- equivalencias;
- promociones;
- correlativas.

## Inscripción

- materias;
- comisión;
- modalidad;
- horarios;
- altas;
- bajas;
- timestamps.

## Exámenes

- mesas;
- inscripción;
- requisitos;
- condición;
- correlativas;
- fechas.

## Documentación

- documentos requeridos;
- presentados;
- pendientes;
- vencimientos.

## Administrativa

Solo si la consulta lo requiere:

- facturación;
- conceptos;
- movimientos;
- ajustes;
- estado administrativo.

---

# 31. MINIMIZACIÓN DE DATOS

No hacer:

```text
pregunta
→ cargar ficha completa
→ enviar todo al LLM
```

Hacer:

```text
pregunta
→ clasificar intención
→ definir datos requeridos
→ consultar backend
→ devolver mínimo contexto
→ recuperar conocimiento
→ generar respuesta
```

Aplicar principios de:

- minimización;
- least privilege;
- purpose limitation.

---

# 32. HISTORIAL DE CHAT IA

Separar:

## `ai_conversations`

- id;
- alumno;
- turno opcional;
- sector;
- categoría;
- inicio;
- último mensaje;
- estado;
- `resolved_by`;
- `human_handoff`.

## `ai_messages`

- id;
- conversation_id;
- role;
- content;
- timestamp;
- intención;
- tema;
- modelo;
- versión de prompt;
- tokens;
- latencia;
- derivación;
- motivo.

## `ai_evidence`

- message_id;
- source;
- article_id;
- relevancia;
- vigencia.

## `ai_tool_calls`

- herramienta;
- latencia;
- éxito/error;
- metadata no sensible.

---

# 33. PRIVACIDAD DEL CHAT

Definir explícitamente:

- qué se guarda;
- cuánto tiempo;
- quién accede;
- si se anonimiza;
- cómo se elimina;
- qué se envía al proveedor LLM.

No registrar en logs:

- secretos;
- tokens;
- contraseñas;
- datos completos innecesarios.

Si se usa OpenAI API:

- `OPENAI_API_KEY` únicamente backend;
- evaluar `store:false` según política de privacidad;
- revisar contrato institucional;
- revisar tratamiento de datos;
- evitar enviar información que no sea necesaria.

---

# 34. BANDEJA DE CONSULTAS PENDIENTES

Debe contener:

- pregunta;
- fecha;
- sector;
- categoría detectada;
- intento de IA;
- motivo de derivación;
- evidencia;
- contexto relevante;
- nivel de riesgo.

Operador puede agregar:

- respuesta;
- observaciones;
- excepciones;
- vigencia;
- categoría;
- keywords.

---

# 35. APRENDIZAJE SUPERVISADO

Una respuesta de operador **no debe convertirse automáticamente en conocimiento aprobado**.

Estados sugeridos:

- pendiente;
- propuesta;
- aprobada;
- rechazada;
- requiere revisión;
- vencida.

Flujo:

```text
IA no responde
→ operador resuelve
→ propuesta de conocimiento
→ revisión
→ aprobación
→ publicación
```

---

# 36. BASE DE CONOCIMIENTO

Cada artículo:

- id;
- título;
- contenido;
- sector;
- categoría;
- keywords;
- preguntas relacionadas;
- fuente;
- versión;
- creado por;
- aprobado por;
- creación;
- actualización;
- última revisión;
- próxima revisión;
- `valid_from`;
- `valid_until`;
- estado.

Estados:

- draft/pendiente;
- revisión;
- activo;
- vencido;
- archivado.

---

# 37. VERSIONADO DE CONOCIMIENTO

Nunca sobrescribir información institucional sin historial.

`knowledge_versions`:

- article_id;
- versión;
- contenido;
- autor;
- fecha;
- motivo de cambio.

Debe poder responderse:

> “¿Qué información estaba vigente el día X?”

---

# 38. CONTROL DE VIGENCIA

Información sensible al tiempo:

- fechas;
- documentación;
- requisitos;
- aranceles;
- facturación;
- inscripciones;
- bajas;
- exámenes;
- modalidades;
- reglamentos.

Crear sección mensual:

**Información que requiere revisión**

Criterios:

- venció;
- por vencer;
- no revisada;
- tema de alta volatilidad;
- feedback negativo.

Acciones:

- vigente;
- modificar;
- archivar.

---

# 39. INGESTA DE HELP INSTITUCIONAL

No guardar páginas enteras indiscriminadamente.

Proceso:

1. identificar contenido relevante;
2. extraer procedimiento/política;
3. estructurar;
4. asignar sector;
5. categoría;
6. fuente;
7. vigencia;
8. responsable;
9. validar;
10. publicar.

Links internos deben recorrerse cuando formen parte del procedimiento.

---

# 40. CALIDAD DE RESPUESTAS

Evitar:

> “Comunicate con Administración.”

si la base contiene la respuesta.

La IA debe:

1. contestar lo preguntado;
2. explicar regla relevante;
3. adaptar al caso;
4. indicar acción siguiente.

Ejemplo:

“Di de baja una materia el 2 de agosto pero me apareció facturada.”

La respuesta debe explicar:

- cierre/período de facturación;
- fecha efectiva de baja;
- impacto temporal;
- reglas correspondientes;
- qué verificar si el resultado no coincide.

---

# 41. CONTEXTO CONVERSACIONAL

La IA debe comprender continuaciones.

Ejemplo:

Alumno:
> ¿Hasta cuándo puedo darme de baja?

Luego:
> ¿Y si ya cursé más del 75%?

La segunda pregunta hereda contexto de baja de materia.

---

# 42. FEEDBACK IA

Opciones simples:

- 👍 Me sirvió
- 👎 No resolvió

Registrar feedback.

Contenido con alta tasa negativa:

- debe aparecer en revisión;
- identificar artículo/evidencia;
- analizar patrón.

---

# 43. MÉTRICAS DE IA

Como mínimo:

- consultas;
- resueltas IA;
- derivadas;
- no respondidas;
- intenciones;
- temas frecuentes;
- feedback negativo;
- conocimiento creado;
- resolución;
- latencia;
- errores;
- costo/tokens;
- porcentaje de escalamiento correcto;
- respuestas correctas vs. incorrectas mediante auditoría.

No medir solamente “contención”.

---

# 44. MÉTRICAS DEL TURNERO

- turnos por día;
- hora;
- sector;
- categoría;
- espera media;
- mediana;
- P90;
- máxima;
- atención media;
- atención por categoría;
- operador;
- cantidad atendida;
- no-show;
- cancelación;
- transferencias;
- recontacto;
- abandono;
- demanda por día.

---

# 45. ESTIMACIÓN DE ESPERA

No usar solamente:

`personas × 10 minutos`

Modelo progresivo:

```text
trabajo pendiente
÷
capacidad efectiva
```

Considerar:

- personas esperando;
- categorías;
- duración histórica;
- operadores activos;
- atención en curso;
- boxes;
- prioridades;
- transferencias;
- ausencias;
- no-show.

## Recomendación UX

Mostrar rango:

> 20–30 minutos

en lugar de una falsa precisión:

> 23 min 17 s

---

# 46. OPERADORES ACTIVOS

No inferir capacidad solamente porque un usuario tiene sesión abierta.

Necesitar estado operativo:

- available;
- busy;
- paused;
- offline.

Considerar:

- sector;
- box;
- categorías/habilidades.

---

# 47. ALERTAS OPERATIVAS

Alertar cuando:

- alumno supera SLA de espera;
- cola supera límite;
- sector saturado;
- no hay operadores;
- espera aumenta;
- porcentaje de no-show anormal;
- fallas realtime;
- errores de API;
- demasiados turnos sin resolver.

Alertas configurables.

---

# 48. PANTALLA DEL ADMINISTRADOR

Debe entender en <10 segundos:

- cuántos esperan;
- dónde;
- qué sector está saturado;
- operadores activos;
- espera actual;
- problemas pendientes.

---

# 49. REPORTES

Filtros:

- fecha;
- sector;
- categoría;
- box;
- operador;
- estado.

Exportar:

- CSV;
- Excel.

## Validaciones

- permisos;
- rango de fechas;
- paginación;
- evitar exportaciones ilimitadas sin control;
- zona horaria consistente;
- campos personales mínimos.

---

# 50. AUDITORÍA

Registrar:

- actor;
- acción;
- objeto;
- timestamp;
- estado anterior;
- estado posterior;
- metadata relevante;
- request/correlation ID.

Eventos importantes:

- login;
- cambios de rol;
- creación/desactivación de usuario;
- cambios de categoría;
- box;
- transferencia;
- llamada manual;
- cancelación;
- conocimiento;
- aprobación/rechazo;
- configuración.

Los logs de auditoría deben ser difíciles de modificar por usuarios normales.

---

# 51. LOGS TÉCNICOS

Implementar:

- errores globales;
- API;
- DB;
- Realtime;
- IA;
- autenticación;
- integraciones.

Cada request debería poder tener:

`correlation_id`

No registrar:

- passwords;
- API keys;
- tokens completos;
- datos personales innecesarios.

---

# 52. MANEJO DE ERRORES

No mostrar mensajes técnicos al usuario.

Ejemplo incorrecto:

`type citext does not exist`

Ejemplo correcto:

> “No pudimos iniciar sesión. Intentá nuevamente. Si continúa, contactá soporte.”

Mientras tanto, en servidor:

- stack trace;
- código;
- correlation ID;
- usuario si corresponde;
- endpoint.

---

# 53. VALIDACIÓN DE INPUT

Backend debe validar:

- tipos;
- UUID;
- longitud;
- enums;
- formato;
- rangos;
- ownership;
- estado.

Nunca confiar en HTML `required`.

---

# 54. BASE DE DATOS RECOMENDADA

**PostgreSQL**.

Razones:

- transacciones;
- consistencia;
- relaciones;
- constraints;
- locking;
- auditoría;
- SQL analítico.

Supabase puede actuar como plataforma para:

- PostgreSQL;
- Auth;
- Realtime;
- Storage;
- Edge Functions.

Pero Sistemas debe decidir la infraestructura institucional.

---

# 55. TABLAS PRINCIPALES

## Núcleo

- `users`
- `roles`
- `sectors`
- `categories`
- `campuses`
- `service_points`
- `queues`
- `turns`
- `turn_events`

## QR

- `qr_points`
- `qr_scans`

## Operación

- `operator_sector_memberships`
- `operator_sessions`

## IA

- `ai_conversations`
- `ai_messages`
- `ai_evidence`
- `ai_tool_calls`
- `consultations`

## Conocimiento

- `knowledge_articles`
- `knowledge_versions`
- `feedback`

## Infra

- `settings`
- `audit_logs`

---

# 56. STUDENTS / DATOS ACADÉMICOS

Si se incorpora personalización:

`students`

- id;
- academic_id;
- legajo;
- nombre;
- apellido;
- email institucional;
- career_id;
- curriculum_id;
- campus_id;
- status;
- sync timestamp.

Evitar duplicar toda la fuente maestra si existe un sistema académico central.

---

# 57. MATERIAS Y CORRELATIVIDADES

Tablas posibles:

- `careers`;
- `curriculums`;
- `courses`;
- `curriculum_courses`;
- `student_courses`;
- `course_prerequisites`.

Correlatividad debe ser estructurada.

La IA no debe inventarla.

---

# 58. RESTRICCIONES DE BASE DE DATOS

Ejemplos:

```sql
UNIQUE (sector_id, queue_date, sequence_number)
```

```sql
UNIQUE (request_id)
WHERE request_id IS NOT NULL
```

Índices:

- sector + fecha + estado;
- tracking;
- operator;
- service point;
- category;
- timestamps de reportes.

---

# 59. NUMERACIÓN

Debe definirse formalmente.

Para modelo original Ingreso:

- `INS-001`
- `INF-001`
- `VIS-001`
- `EQE-001`

## Validaciones

- reinicio diario;
- historial permanece;
- no duplicar;
- secuencia atómica;
- zona horaria institucional;
- comportamiento a medianoche;
- evitar que múltiples instancias generen mismo número.

---

# 60. ZONA HORARIA

No depender de timezone del navegador.

Definir timezone institucional.

Argentina:

`America/Argentina/Buenos_Aires`

Todos los timestamps internos preferentemente `TIMESTAMPTZ`.

Reportes convierten a zona institucional.

---

# 61. FECHA DE COLA

Validar qué ocurre si:

- atención se extiende después de medianoche;
- turno creado 23:59;
- transferencia 00:01;
- sesión de operador abierta durante cambio de día.

Las reglas deben definirse antes de producción.

---

# 62. SEGURIDAD DE BASE DE DATOS

Si se usa Supabase:

- RLS en tablas expuestas;
- no exponer `service_role`;
- funciones privilegiadas con mínimo permiso;
- revisar `SECURITY DEFINER`;
- `search_path` fijo;
- revocar EXECUTE público cuando no corresponda.

---

# 63. API

Separar:

- API pública;
- API interna;
- IA;
- administración.

## API pública

Permite solo:

- catálogo;
- crear turno;
- ver turno con tracking;
- cancelar propio turno mediante mecanismo seguro;
- chat público vinculado a sesión/turno.

No permitir listar colas completas públicamente.

---

# 64. RATE LIMITING

Aplicar a:

- login;
- creación de turnos;
- consulta de tracking;
- chat IA;
- recuperación;
- endpoints públicos.

Prevenir:

- scraping;
- brute force;
- flood de turnos;
- abuso de IA.

---

# 65. TRACKING CODE

Debe tener entropía suficiente.

No usar secuencias predecibles como único mecanismo de acceso si el endpoint devuelve datos sensibles.

Puede utilizarse visible number para TV, pero tracking privado diferente.

---

# 66. PRIVACIDAD EN API_GET_TURN

La consulta pública por tracking debe devolver solo:

- número;
- estado;
- posición;
- ETA;
- categoría;
- sector;
- box.

No devolver datos personales.

---

# 67. DISEÑO VISUAL

Concepto:

**Minimalismo contextual.**

Principios:

- espacio;
- jerarquía;
- pocas acciones;
- tarjetas grandes;
- tipografía limpia;
- colores consistentes;
- responsive.

Evitar:

- dashboards técnicos;
- tablas gigantes;
- saturación;
- información irrelevante.

---

# 68. IDENTIDAD VISUAL

Se solicitó que el header superior utilice **logo/wordmark UADE**.

No utilizar slogans innecesarios en la pantalla principal.

QR debe ser:

- grande;
- visible;
- escaneable desde distancia;
- alto contraste.

---

# 69. ACCESIBILIDAD

Mínimo:

- WCAG AA;
- contraste;
- navegación teclado;
- lector de pantalla;
- labels;
- focus visible;
- botones ≥44x44px;
- texto escalable;
- no depender solo de color;
- lenguaje claro.

No depender exclusivamente de smartphone:

- tótem;
- opción impresa;
- asistencia presencial.

---

# 70. MICROINTERACCIONES

Usar con moderación.

Al crear turno:

- animación breve;
- confirmación clara;
- haptic si disponible.

Al estar próximo:

- cambio visual;
- vibración opcional.

Al llamado:

- prioridad total;
- vibración;
- box grande.

No usar animaciones continuas que aumenten ansiedad.

---

# 71. EXPERIENCIA “ESPERA ACTIVA”

Durante espera:

- turno siempre visible;
- IA disponible;
- no bloquear navegación;
- actualizaciones en tiempo real.

Si cambia a próximo:

> “Falta poco. Hay una persona antes que vos.”

Si llamado:

> “Es tu turno. Dirigite al Box 4.”

Chat pasa a segundo plano.

---

# 72. AUTOSERVICIO ANTES DE GENERAR TURNO

Si la consulta puede resolverse digitalmente:

> “Podés resolver esto ahora sin esperar.”

Ofrecer acción directa.

El alumno puede elegir:

- resolver online;
- igualmente pedir atención humana, si corresponde.

No usar IA como barrera obligatoria para atención.

---

# 73. PHYGTIAL / PRESENCIA

Para evitar abuso de fila remota:

Opciones:

- QR rotativo;
- QR por ubicación;
- check-in posterior;
- ventana temporal.

Evitar GPS si no es necesario.

---

# 74. ALEJAMIENTO DEL EDIFICIO

Diseño posible:

- permitir moverse;
- preaviso;
- ventana de regreso;
- check-in.

Ejemplo:

- aviso ~20 min;
- aviso “próximo”;
- 10–15 min de ventana;
- extensión accesibilidad.

Esto requiere política institucional.

---

# 75. NOTIFICACIONES

Posibles canales:

- Web Push;
- notificación PWA;
- SMS;
- email;
- WebCampus;
- WhatsApp institucional si existiera.

Para MVP puede bastar app abierta + vibración, pero producción debería analizar notificación robusta.

---

# 76. SERVICE WORKER / PWA

Recomendado para móvil:

- manifest;
- service worker;
- asset cache;
- offline shell;
- reanudación.

No cachear datos sensibles sin estrategia.

---

# 77. IMPRESORA TÉRMICA

Arquitectura desacoplada.

Generar turno primero.

Después intentar impresión.

Si impresión falla:

- turno no se pierde;
- mensaje al usuario;
- opción reimpresión administrativa si se necesita.

---

# 78. DATOS DE PRUEBA

Ambiente de test debe incluir:

- categorías;
- 13 boxes;
- operadores;
- múltiples sectores;
- turnos en estados variados;
- IA conocida/desconocida;
- conocimiento vigente/vencido.

Nunca mezclar datos de test con producción.

---

# 79. AMBIENTES

Mínimo:

- development;
- staging/test;
- production.

Cada uno:

- base distinta;
- claves distintas;
- dominios distintos.

No probar migraciones destructivas en producción.

---

# 80. MIGRACIONES

Toda modificación de esquema:

- versionada;
- revisada;
- reversible cuando sea posible;
- probada en staging;
- backup antes de cambio sensible.

---

# 81. BACKUPS

Definir:

- frecuencia;
- retención;
- restauración;
- pruebas de restore.

Una copia que nunca se restauró no es un backup validado.

---

# 82. OBSERVABILIDAD

Dashboard técnico:

- error rate;
- latencia;
- DB;
- realtime;
- IA;
- autenticación;
- colas;
- jobs;
- consumo.

Alertar sobre:

- 5xx;
- latencia alta;
- conexiones DB;
- realtime degradado;
- OpenAI error rate.

---

# 83. PERFORMANCE

Metas iniciales orientativas:

- API común p95 < 500 ms cuando no depende de IA;
- actualización realtime perceptualmente inmediata;
- UI móvil interactiva rápidamente;
- chat IA puede tener latencia mayor pero debe mostrar estado de generación.

Hacer pruebas reales.

---

# 84. ESCALABILIDAD

MVP:

- PostgreSQL;
- backend stateless;
- realtime;
- CDN.

No introducir Redis sin necesidad.

Futuro:

- Redis cache;
- streams;
- workers;
- queue system.

PostgreSQL sigue siendo fuente de verdad.

---

# 85. SEGURIDAD DE IA

Prevenir prompt injection desde:

- usuario;
- contenido ingestando;
- documentos.

No permitir que instrucciones contenidas en knowledge cambien el system prompt.

Separar:

- datos;
- instrucciones.

---

# 86. TOOL CALLS DE IA

Herramientas con permisos mínimos:

Ejemplos:

- `get_student_courses`;
- `get_enrollment`;
- `get_document_status`;
- `get_exam_dates`.

No permitir al LLM ejecutar SQL arbitrario.

---

# 87. ACCIONES DE IA

En primera etapa, IA principalmente read-only.

Para operaciones:

- baja;
- inscripción;
- pagos;
- cambios;

exigir confirmación explícita y reglas institucionales antes de automatizar.

---

# 88. DATOS SENSIBLES

Realizar clasificación institucional.

Posibles datos:

- académicos;
- administrativos;
- identidad.

Aplicar:

- cifrado en tránsito;
- cifrado en reposo;
- control de acceso;
- auditoría;
- minimización.

Revisar legislación argentina aplicable y políticas internas; si existe tratamiento internacional, evaluar requisitos correspondientes.

---

# 89. RETENCIÓN

No está definida completamente y debe decidirse con Sistemas/Legal.

Definir retención para:

- turnos;
- conversaciones IA;
- logs;
- auditoría;
- QR scans;
- feedback;
- tokens;
- archivos.

---

# 90. BORRADO Y ANONIMIZACIÓN

Definir:

- qué puede anonimizarse;
- qué debe conservarse por auditoría;
- qué relaciones deben mantenerse.

Evitar cascades destructivos accidentales.

---

# 91. PRUEBAS MÍNIMAS ORIGINALES

## Caso 1

Usuario selecciona Inscripción.

Resultado:

`INS-001`.

## Caso 2

Turno aparece inmediatamente a operadores.

## Caso 3

Operador Box 4 llama.

## Caso 4

TV muestra:

`INS-001 — Box 4`.

## Caso 5

Otro operador intenta llamar simultáneamente.

No obtiene INS-001.

## Caso 6

Operador finaliza.

Turno sale de pendientes y permanece en historial.

## Caso 7

Se refresca/cierra la página.

Información persiste.

---

# 92. PRUEBAS FUNCIONALES DE TURNOS

Probar:

- crear;
- consultar;
- cancelar;
- llamar;
- recall;
- iniciar;
- finalizar;
- ausente;
- transferir;
- llamada manual;
- prioridad;
- cambio de día;
- duplicación;
- concurrencia.

---

# 93. PRUEBAS DE AUTENTICACIÓN

- login correcto;
- password incorrecto;
- usuario inexistente;
- usuario inactivo;
- logout;
- sesión vencida;
- sesión revocada;
- rol;
- cambio de contraseña;
- brute force;
- token manipulado.

---

# 94. PRUEBAS DE AUTORIZACIÓN

### Operador Ingreso

No puede acceder a datos de Alumnos.

### Operador Alumnos

No puede acceder a Ingreso.

### Supervisor

Solo alcance autorizado.

### Público

No puede llamar turnos.

### TV

Solo lectura de datos necesarios.

### Tótem

Solo creación.

---

# 95. PRUEBA CRÍTICA DE AISLAMIENTO DE SECTORES

Crear simultáneamente:

- turnos Ingreso;
- turnos Alumnos.

Verificar:

- APIs;
- panel;
- métricas;
- exports;
- realtime;
- IA;
- knowledge.

Nunca debe aparecer información cruzada.

---

# 96. PRUEBAS DE IA

## Pregunta conocida

Debe responder con evidencia vigente.

## Desconocida

Debe derivar.

## Ambigua

Debe pedir aclaración mínima o derivar.

## Fuente vencida

No responder como vigente.

## Fuente contradictoria

Derivar.

## Error OpenAI

No perder consulta.

## Timeout

Mostrar error recuperable.

## Operador valida respuesta

No publicar automáticamente sin flujo de aprobación.

---

# 97. PRUEBAS DE KNOWLEDGE

- crear;
- editar;
- versionar;
- aprobar;
- rechazar;
- vencer;
- archivar;
- revisar;
- reactivar;
- recuperar versión histórica.

---

# 98. PRUEBAS DE QR

- válido;
- inválido;
- inactivo;
- vencido;
- manipulado;
- sin categoría;
- categoría de otro sector;
- doble creación;
- scanner repetido.

---

# 99. PRUEBAS OFFLINE

Alumno:

1. obtiene turno;
2. pierde conexión;
3. operador lo llama;
4. alumno recupera conexión;
5. UI debe mostrar estado llamado y box.

---

# 100. PRUEBAS DE LOAD

Simular:

- 100 alumnos;
- 1.000 conexiones;
- picos de creación;
- múltiples operadores;
- TV;
- realtime.

Medir:

- latencia;
- locks;
- errores;
- CPU;
- DB connections.

Los valores concretos deben alinearse al volumen esperado.

---

# 101. PRUEBAS DE SEGURIDAD

- SQL injection;
- XSS;
- CSRF si cookies;
- brute force;
- session fixation;
- IDOR;
- privilege escalation;
- rate limiting;
- secrets exposure;
- dependency scanning;
- headers;
- CORS.

---

# 102. PRUEBAS DE ACCESIBILIDAD

- teclado;
- screen reader;
- zoom 200%;
- contraste;
- mobile;
- orientación;
- labels;
- focus.

---

# 103. PRUEBAS DE NAVEGADOR

Definir soporte:

- Chrome;
- Edge;
- Safari iOS;
- Chrome Android.

La TV/tótem deben probarse en dispositivo real.

---

# 104. CRITERIOS DE ACEPTACIÓN PARA MVP

No se acepta MVP si:

- hay botones falsos;
- se pierden turnos;
- existen duplicados;
- hay mezcla de sectores;
- login puede saltarse;
- TV muestra datos personales;
- IA inventa políticas;
- refresh pierde estado;
- error no se registra;
- no hay backup;
- secretos quedan expuestos.

---

# 105. CRITERIOS DE “NO PRODUCCIÓN”

Bloqueadores:

- credenciales hardcodeadas;
- sin RLS/authorization;
- sin auditoría;
- race condition;
- sin recuperación;
- datos sensibles al LLM sin revisión;
- falta política de retención;
- logs con secretos;
- sin pruebas;
- sin staging;
- endpoints administrativos públicos.

---

# 106. KPI DE ÉXITO

Tres indicadores principales recomendados:

## 1. Reducción de espera

Medir mediana y P90.

Meta piloto orientativa:

P90 ≤ 20 min.

No es promesa; debe ajustarse al baseline.

## 2. Resolución correcta antes de ventanilla

Porcentaje de consultas resueltas por autoservicio/IA sin recontacto y verificadas como correctas.

## 3. Resolución en primer contacto

Meta inicial orientativa:

≥75%.

Complementarios:

- estimación dentro del rango ≥80%;
- transferencias <10%;
- recontacto -30%;
- abandono -40%;
- satisfacción ≥4.5/5.

Estas metas son orientativas y requieren línea base.

---

# 107. HOJA DE RUTA

## Fase 0 — Auditoría

- código;
- infraestructura;
- datos;
- procesos;
- métricas actuales.

## Fase 1 — Estabilizar turnero original

- tótem;
- operadores;
- 13 boxes;
- TV;
- admin;
- concurrencia;
- persistencia;
- logs;
- auth.

## Fase 2 — QR + fila móvil

- QR;
- portal móvil;
- seguimiento;
- tiempo real;
- cancelación;
- notificaciones.

## Fase 3 — Base de conocimiento

- artículos;
- versionado;
- revisión;
- Help institucional.

## Fase 4 — IA con derivación

- chat;
- RAG;
- guardrails;
- consultas pendientes.

## Fase 5 — Datos académicos

- integración;
- personalización;
- correlativas;
- documentación.

## Fase 6 — Aprendizaje supervisado

- feedback;
- propuestas;
- aprobaciones;
- revisión mensual.

## Fase 7 — Optimización

- ETA avanzado;
- autoservicio;
- capacity management;
- BI.

---

# 108. ARQUITECTURA TECNOLÓGICA OBJETIVO

Una opción recomendada:

## Frontend

- React / Next.js.
- PWA para alumno.
- interfaces específicas:
  - alumno;
  - operador;
  - TV;
  - tótem;
  - administración.

## Backend

- Node.js / Next.js server / API service.
- funciones transaccionales para turnos.

## DB

- PostgreSQL.

## Realtime

- WebSocket / Supabase Broadcast.

## IA

- OpenAI API desde backend.

## Search/RAG

- PostgreSQL + pgvector o motor equivalente.

## Auth

- identidad institucional / Supabase Auth / OIDC.

## Observabilidad

- logs;
- error tracking;
- métricas.

---

# 109. ARQUITECTURA LÓGICA

```text
ALUMNO QR / TÓTEM
        │
        ▼
      FRONTEND
        │
        ▼
   BACKEND / API
   ├─ Turn Engine
   ├─ Auth
   ├─ Academic Integration
   ├─ AI Orchestrator
   ├─ Knowledge Service
   ├─ Notifications
   └─ Reporting
        │
        ▼
    POSTGRESQL
        │
        ├── Realtime → alumno / TV / operador
        └── Audit / Metrics
```

---

# 110. DEPENDENCIAS INSTITUCIONALES A DEFINIR

Sistemas debe confirmar:

- fuente de estudiantes;
- API de alumnos;
- SSO;
- sistema de materias;
- correlatividades;
- exámenes;
- documentación;
- facturación;
- WebCampus;
- notificaciones;
- hosting;
- dominio;
- política de privacidad;
- seguridad;
- retención.

---

# 111. DECISIONES DE PRODUCTO TODAVÍA ABIERTAS

1. ¿Alumno debe identificarse siempre o puede sacar turno anónimo?
2. ¿Qué categorías requieren identidad?
3. ¿Qué datos exactos puede leer IA?
4. ¿Se usa QR estático o dinámico?
5. ¿Cuánto puede alejarse?
6. ¿Existe check-in?
7. ¿Cuál es la política de prioridad?
8. ¿Transferencia mantiene posición?
9. ¿Cuál es la ventana de no-show?
10. ¿Qué notificaciones se habilitan?
11. ¿Cuál es retención de chats?
12. ¿Qué integraciones pueden ejecutar acciones?
13. ¿Quién aprueba conocimiento?
14. ¿Quién es dueño de cada artículo?
15. ¿SLA por categoría?

---

# 112. RIESGOS IDENTIFICADOS

## P0 — Críticos

- doble llamado por concurrencia;
- turnos duplicados;
- autenticación insuficiente;
- permisos solo frontend;
- mezcla entre sectores;
- IA sin evidencia;
- exposición de datos;
- pérdida de estado;
- secretos en cliente.

## P1 — Altos

- ETA incorrecto;
- transferencias mal modeladas;
- falta de auditoría;
- falta de retención;
- falta de idempotencia;
- notificaciones perdidas;
- dependencia realtime sin fallback.

## P2 — Mejora

- accesibilidad;
- métricas avanzadas;
- BI;
- optimización de UI;
- IA de operador.

---

# 113. DEUDA TÉCNICA A EVITAR

- lógica de negocio en frontend;
- SQL desde cliente;
- sectores hardcodeados;
- categorías hardcodeadas;
- passwords hardcodeadas;
- múltiples deployments sin repositorio único;
- duplicación de componentes;
- URLs dispersas;
- migrations no versionadas;
- funciones sin tests.

---

# 114. GOBIERNO DEL PROYECTO

Roles recomendados:

- Product Owner de atención.
- Responsable Sistemas.
- Responsable Seguridad.
- Responsable Datos/Integraciones.
- Responsable de conocimiento.
- Supervisores operativos.
- QA.
- Legal/Privacidad cuando corresponda.

---

# 115. FLUJO DE TURNO OBJETIVO — EXTREMO A EXTREMO

```text
Alumno llega
→ escanea QR
→ backend determina contexto
→ alumno elige motivo
→ IA intenta resolver
→ si se resuelve: autoservicio
→ si no: generar turno
→ DB confirma
→ alumno ve número + ETA
→ operador ve cola
→ operador selecciona box
→ llamar siguiente
→ DB lock evita duplicación
→ realtime
→ TV actualiza
→ alumno actualiza
→ iniciar atención
→ operador recibe contexto
→ resolver / transferir
→ finalizar
→ persistir historial
→ feedback
→ métricas
```

---

# 116. FLUJO DE CONSULTA IA → OPERADOR

```text
Alumno pregunta
→ guardar pregunta
→ clasificar
→ recuperar datos mínimos
→ recuperar conocimiento
→ validar evidencia
→ responder
```

Si falla evidencia:

```text
→ crear consulta pendiente
→ mostrar mensaje honesto
→ operador recibe:
   - pregunta
   - contexto
   - turno
   - fuentes consultadas
→ operador responde
→ propuesta de conocimiento
→ aprobación
```

---

# 117. FLUJO DE TRANSFERENCIA

```text
Turno en atención
→ operador elige transferir
→ backend valida destino
→ registrar evento
→ mantener vínculo
→ actualizar categoría/cola o crear turno hijo
→ definir prioridad
→ realtime alumno
→ realtime operadores
→ histórico intacto
```

---

# 118. CHECKLIST DE AUDITORÍA DEL CÓDIGO ORIGINAL

Sistemas debe entregar:

- [ ] repositorio identificado;
- [ ] commit de producción;
- [ ] framework;
- [ ] package/dependencies;
- [ ] mapa de rutas;
- [ ] DB;
- [ ] schema;
- [ ] migrations;
- [ ] variables;
- [ ] secrets;
- [ ] auth;
- [ ] permisos;
- [ ] endpoints;
- [ ] websocket/realtime;
- [ ] hosting;
- [ ] logs;
- [ ] tests;
- [ ] CI/CD;
- [ ] backup;
- [ ] monitoring.

---

# 119. CHECKLIST DE VALIDACIONES PRE-PRODUCCIÓN

## Turnos

- [ ] generación atómica;
- [ ] secuencia diaria;
- [ ] secuencia por categoría;
- [ ] request id;
- [ ] concurrencia;
- [ ] transition guards;
- [ ] tracking seguro;
- [ ] cancelación;
- [ ] transferencia;
- [ ] manual call.

## Operadores

- [ ] 13 boxes;
- [ ] box activo;
- [ ] asignación;
- [ ] sector;
- [ ] rol;
- [ ] sesión;
- [ ] auditoría.

## TV

- [ ] realtime;
- [ ] privacidad;
- [ ] sonido;
- [ ] voz;
- [ ] recuperación.

## QR

- [ ] validación;
- [ ] no sensitive info;
- [ ] rate limit;
- [ ] idempotencia.

## IA

- [ ] backend key;
- [ ] RAG;
- [ ] evidence;
- [ ] vigencia;
- [ ] derivación;
- [ ] contexto;
- [ ] privacidad;
- [ ] error handling.

## Seguridad

- [ ] RLS;
- [ ] RBAC;
- [ ] secret scan;
- [ ] rate limit;
- [ ] XSS;
- [ ] CSRF;
- [ ] IDOR;
- [ ] logs.

## Operación

- [ ] backups;
- [ ] restore;
- [ ] staging;
- [ ] monitoring;
- [ ] runbook;
- [ ] contingencia.

---

# 120. PRUEBA DE ACEPTACIÓN MAESTRA

Esta prueba debe realizarse antes de cualquier piloto:

1. Tótem/QR genera `INS-001`.
2. Turno existe en DB.
3. Aparece inmediatamente al operador.
4. Dos operadores intentan tomarlo.
5. Solamente uno puede.
6. Se asigna Box 4.
7. TV muestra `INS-001 — Box 4`.
8. Alumno recibe estado llamado.
9. Se inicia atención.
10. Operador ve contexto previo.
11. Se transfiere a Informes.
12. Historial conserva origen.
13. Alumno recibe nuevo estado.
14. Segundo operador continúa gestión.
15. Se finaliza.
16. Turno/caso queda en historial.
17. Dashboard actualiza métricas.
18. Export lo incluye.
19. Audit log permite reconstruir la secuencia.
20. Refresh de todas las interfaces conserva estado.

---

# 121. CASOS DE ERROR DE ACEPTACIÓN

## DB caída durante crear turno

Esperado:

- no mostrar número falso;
- mensaje recuperable;
- log.

## Realtime caído

Esperado:

- backend sigue operando;
- polling recupera;
- TV/alumno eventualmente sincronizan.

## OpenAI caído

Esperado:

- turnero continúa funcionando;
- chat informa indisponibilidad;
- consulta puede derivarse.

## Impresora caída

Esperado:

- turno existe;
- informar;
- no rollback del turno.

## Operador pierde internet

Esperado:

- no acciones fantasma;
- al volver obtiene estado actual.

---

# 122. SEPARACIÓN FUTURA EN DOS APLICACIONES

Aunque hoy puede existir un backend compartido, debe ser posible tener:

### Aplicación A
Ingreso.

### Aplicación B
Alumnos.

Para lograrlo:

- `sector_id`;
- configuración;
- dominio modular;
- rutas;
- autorización;
- módulos reutilizables;
- no `if sector == "ingreso"` por todas partes.

---

# 123. ESTRATEGIA RECOMENDADA PARA SISTEMAS

No reconstruir todo sin revisar la aplicación original.

Orden:

1. versionar código original;
2. levantarlo en staging;
3. crear suite de pruebas del flujo original;
4. corregir fallas;
5. formalizar DB;
6. formalizar auth;
7. estabilizar realtime;
8. incorporar QR;
9. incorporar IA;
10. integrar datos académicos.

---

# 124. DEFINICIÓN DE TERMINADO

Una historia se considera Done si:

- UX implementada;
- API implementada;
- DB implementada;
- validaciones;
- permisos;
- error handling;
- logging;
- test unit/integration;
- test E2E cuando corresponda;
- documentación;
- aceptación funcional.

---

# 125. RESUMEN EJECUTIVO PARA SISTEMAS

El sistema requerido combina cuatro productos operativos y una capa inteligente:

### 1. Gestión física
Tótem + operadores + boxes + TV.

### 2. Fila móvil
QR + seguimiento + ETA + notificaciones.

### 3. Administración
Usuarios + categorías + boxes + métricas + reportes.

### 4. Gestión de conocimiento
Artículos + vigencia + auditoría + aprobación.

### 5. IA
Chat contextual + datos académicos + guardrails + escalamiento.

La prioridad debe ser:

> **Primero asegurar que el turnero no falle. Después hacerlo inteligente.**

La IA nunca debe compensar problemas de operación o datos.

El primer milestone real debe ser que el flujo original de atención funcione de manera consistente, auditable y segura.

---

# 126. FUENTES DE CONTEXTO DEL PROYECTO

Este documento consolida:

- especificación maestra del Turnero Inteligente de Atención Universitaria;
- requerimiento original del turnero de Ingreso;
- requerimientos posteriores de QR;
- requerimientos UX del ticket móvil;
- diseño del chat IA;
- arquitectura de IA;
- diseño de datos;
- decisiones sobre WebSockets/PostgreSQL;
- requisitos de 13 boxes;
- categorías originales INS/INF/VIS/EQE;
- solicitudes de separación de sectores;
- rediseño administrativo;
- controles de seguridad;
- aprendizaje supervisado;
- control mensual de vigencia;
- experiencia de espera activa;
- análisis de riesgos técnicos surgidos durante prototipos;
- requerimiento de retomar la aplicación original como base.

---

# 127. NOTA FINAL PARA EL ÁREA DE SISTEMAS

Este documento debe utilizarse como **especificación de producto y checklist de arquitectura/QA**, no como sustituto de una auditoría del repositorio real.

La primera actividad técnica recomendada es recuperar el código exacto correspondiente al sitio:

`https://turnero-ingreso.maximilianofer790203.chatgpt.site/gestion`

y crear un baseline reproducible.

No se recomienda continuar construyendo funciones nuevas hasta contar con:

1. repositorio único;
2. build reproducible;
3. staging;
4. base de datos documentada;
5. suite de pruebas del flujo principal;
6. política de seguridad;
7. observabilidad.

Una vez estabilizado ese baseline, toda la evolución QR + IA puede incorporarse progresivamente sin volver a romper el núcleo operativo.

