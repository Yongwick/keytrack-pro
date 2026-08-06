# KeyTrack Pro · Sincronización robusta

Esta versión evita que un error en Clientes, Proveedores, Compras, Ventas o Movimientos deje vacío el inventario.

## Cambio principal

1. Carga y muestra primero los productos.
2. Después carga los módulos secundarios.
3. Si un módulo secundario falla, el inventario continúa visible.
4. Los detalles del módulo que falle quedan registrados en la consola como advertencia.

## Instalación

1. Reemplaza en GitHub solamente:
   - `index.html`
   - `README.md`
2. No ejecutes ningún archivo SQL.
3. Espera el despliegue de Vercel.
4. Recarga con `Ctrl + F5` o abre la aplicación en incógnito.
