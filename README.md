# KeyTrack Pro · Reparar inventario visible

El Panel Super Admin cuenta los productos usando una función administrativa, pero la pantalla de Inventario los consulta bajo las políticas RLS de la empresa. Esta actualización repara esas políticas y vuelve a cargar el inventario al pulsar **Inventario**.

## Instalación

1. Ejecuta `reparar-inventario.sql` en Supabase SQL Editor.
2. El resultado final debe mostrar la empresa, `4` productos y `20` unidades.
3. Reemplaza en GitHub:
   - `index.html`
   - `README.md`
4. Espera el despliegue de Vercel.
5. Recarga con `Ctrl + F5` y pulsa **Inventario**.

No borra ningún producto.
