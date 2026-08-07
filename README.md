# KeyTrack Pro Enterprise 4.0 — Modular

Esta versión reemplaza el frontend monolítico por módulos separados.

## Estructura

- `index.html`
- `css/app.css`
- `js/core.js`
- `js/auth.js`
- `js/inventory.js`
- `js/dashboard.js`
- `js/products.js`
- `js/operations.js`
- `js/branches.js`
- `js/superadmin.js`
- `js/scanner.js`
- `js/app.js`
- `sw.js`

## Incluye

- Login y multiempresa
- Inventario, búsqueda, CSV y filtros
- Nuevo / Editar / Ficha / Historial / Movimientos
- Dashboard
- Sucursales y ubicaciones
- Clientes y proveedores
- Compras y ventas
- Super Admin
- Escáner de cámara cuando el navegador soporta `BarcodeDetector`
- PWA con service worker

## Instalación

1. **No ejecutes SQL nuevo.** Usa la misma base de datos que ya tienes.
2. En GitHub, elimina/reemplaza el frontend anterior y sube **toda la estructura de este ZIP**, incluidas las carpetas `css` y `js`.
3. Conserva `fase1.sql` u otros SQL solo como respaldo; Vercel no los necesita.
4. Espera el deployment de Vercel.
5. Abre en incógnito primero. Después puedes instalar la PWA.

## Importante

En esta versión no debes subir solo `index.html`: los archivos dentro de `js/` y `css/` son parte obligatoria de la aplicación.
