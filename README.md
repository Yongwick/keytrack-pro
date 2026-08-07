# KeyTrack Pro Enterprise 3.0 — Stable

Esta versión consolida en un solo paquete las correcciones que se fueron realizando durante el desarrollo.

## Incluye

- Login y creación de cuentas multiempresa
- Inventario sincronizado con Supabase
- Nuevo producto, edición, ficha, historial y movimientos
- Mensaje amigable cuando un SKU ya existe
- Fotografías, imágenes adicionales y documentos PDF
- Dashboard de costo, venta, margen, inventario crítico y actividad
- Menú lateral estable
- Sucursales y ubicaciones jerárquicas
- Clientes
- Proveedores
- Compras
- Ventas
- Panel Super Admin
- Layout de inventario corregido
- Iconos PWA 192, 512 y 1024

## Instalación

### 1. Supabase

Ejecuta **una sola vez**:

`enterprise-v3-stable.sql`

Este script cambia la regla de SKU para que sea único dentro de cada empresa, no en toda la plataforma.

### 2. GitHub

Sube/reemplaza estos archivos:

- `index.html`
- `README.md`
- `manifest.webmanifest`
- `icon-192.png`
- `icon-512.png`
- `icon-1024.png`
- `vercel.json`

Puedes dejar `enterprise-v3-stable.sql` en GitHub como respaldo, pero Vercel no lo necesita.

### 3. Vercel

Espera el despliegue y abre la app con `Ctrl + F5` o en incógnito.

## Prueba recomendada

1. Iniciar sesión.
2. Abrir Inventario y confirmar los productos.
3. Crear un producto con SKU nuevo.
4. Editarlo y guardar.
5. Abrir Ver ficha.
6. Registrar un movimiento.
7. Crear Cliente y Proveedor.
8. Crear Compra y Venta.
9. Abrir Dashboard.
10. Abrir Super Admin.

## Nota

No se incluye `service_role` ni ninguna clave secreta en el navegador. La app continúa usando la clave publicable de Supabase junto con RLS.
