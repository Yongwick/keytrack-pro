# KeyTrack Pro Enterprise 4.5 — Stable

Esta actualización mejora la versión 4.4 actual sin reconstruir la aplicación.

## Correcciones importantes

- Una **Cotización**, **Pendiente** o **Cancelada** ya NO descuenta inventario.
- Solo el estado **Completada** crea salida de inventario.
- Se conserva la operación transaccional: si falta stock, no se guarda una venta parcial.

## Mejoras

- Pantalla de Ventas con tarjetas profesionales.
- Cada venta muestra:
  - folio corto
  - fecha/hora
  - cliente
  - método de pago
  - número de partidas
  - unidades
  - total
  - estado
- Botón **Ver detalle**.
- Detalle completo de productos vendidos.
- Botón **Imprimir** desde el detalle.
- Historial de producto más legible:
  - ya no muestra solo el UUID completo
  - muestra folio corto de venta, precio y método de pago
- Movimientos más claros.
- Escáner USB/Bluetooth: al escribir un SKU/código exacto y enviar Enter, agrega el producto directamente al carrito.

## Instalación

1. En Supabase ejecuta UNA VEZ:
   `upgrade-v4-5.sql`
2. En GitHub reemplaza/sube todos los archivos del ZIP.
3. Espera Vercel.
4. Recarga con `Ctrl + Shift + R`.

No borres los datos existentes.
