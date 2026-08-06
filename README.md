# KeyTrack Pro · Corrección de inicio de sesión y guardado

Esta versión corrige dos problemas:

- El inicio de sesión no avanzaba porque faltaban funciones de `Super Admin` y el JavaScript se detenía.
- El guardado de productos ahora crea primero el producto y después intenta subir fotos y PDF.

## Instalación

1. Reemplaza en GitHub solamente:
   - `index.html`
   - `README.md`
2. No ejecutes ningún archivo SQL adicional.
3. Espera el despliegue de Vercel.
4. Abre la aplicación en incógnito o recarga con `Ctrl + F5`.

El archivo `guardar-producto-fix.sql` solo debe ejecutarse si todavía no se ejecutó anteriormente.
