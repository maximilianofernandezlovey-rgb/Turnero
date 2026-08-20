# Recuperación del código fuente original

## Aplicación de referencia

`https://turnero-ingreso.maximilianofer790203.chatgpt.site/gestion`

## Objetivo

Obtener el código fuente exacto que genera esa aplicación y convertirlo en el baseline oficial.

## No sirve como código fuente

No se debe utilizar como sustituto:

- Guardar la página HTML desde el navegador.
- Copiar solamente el HTML renderizado.
- Hacer screenshots.
- Reconstruir visualmente otra aplicación.
- Utilizar prototipos posteriores como si fueran el original.

## Se necesita recuperar, según la tecnología real

Ejemplos:

- `package.json`
- `src/`
- `app/`
- `pages/`
- `components/`
- `public/`
- archivos de configuración
- migraciones
- schema de base de datos
- tests existentes
- lockfile
- configuración de build

## Procedimiento recomendado

1. Abrir el proyecto original desde el entorno donde fue creado.
2. Buscar opción de exportación/descarga de proyecto o código.
3. Descargar el proyecto completo.
4. Revisar que no incluya secretos.
5. Incorporar los archivos en este repositorio.
6. Ejecutar instalación de dependencias.
7. Ejecutar el proyecto localmente.
8. Comparar contra el sitio original.
9. Crear tag o commit `baseline-original`.
10. Recién después comenzar mejoras.

## Validación del baseline

Debe comprobarse como mínimo:

- acceso a `/gestion`;
- generación de turnos;
- panel de operadores;
- administración;
- datos persistentes;
- rutas;
- autenticación;
- refresh sin pérdida de estado.

Si una función no está realmente implementada, documentarla como pendiente en vez de simularla.
