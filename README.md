# KeyTrack Pro · Corrección para guardar productos

Esta versión corrige el formulario de producto.

## Cambios

- Guarda primero el producto y después intenta subir fotografías/PDF.
- Si falla una fotografía, el producto sí queda guardado.
- Muestra el error dentro del formulario.
- Evita pulsaciones dobles mientras está guardando.
- Corrige las políticas de Storage para fotografías y documentos.

## Instalación

1. Ejecuta `guardar-producto-fix.sql` en Supabase SQL Editor.
2. Reemplaza en GitHub solamente:
   - `index.html`
   - `README.md`
3. Espera el despliegue de Vercel.
4. Recarga con `Ctrl + F5`.

No necesitas volver a ejecutar los demás archivos SQL.
