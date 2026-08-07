# KeyTrack Pro Enterprise 4.4 — POS con inventario

Esta actualización convierte **Nueva Venta** en un punto de venta real.

## Incluye

- Buscar producto por nombre, SKU, código, FCC ID u OEM.
- Agregar múltiples productos a una venta.
- Precio unitario editable.
- Cantidad.
- Descuento por línea.
- Descuento general.
- Impuestos.
- Métodos de pago.
- Cliente registrado o venta general.
- Total automático.
- Validación de existencia.
- Descuento automático del inventario.
- Movimiento de salida automático por cada producto.
- Tabla `sale_items` para conservar el detalle de lo vendido.

## Instalación

### 1. Supabase

Ejecuta **una sola vez**:

`pos-v4-4.sql`

### 2. GitHub

Reemplaza/sube todos los archivos de este ZIP.

### 3. Vercel

Espera el deployment y abre con `Ctrl + Shift + R`.

## Importante

La venta y el descuento del inventario ocurren en una función transaccional de Supabase.
Si una partida no tiene suficiente existencia, no se guarda una venta parcial.
