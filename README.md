# KeyTrack Pro Enterprise 4.1 — Stable

Esta versión estabiliza Enterprise 4.0 y elimina la dependencia de
`public.admin_company_overview`.

## Cambio principal

**Super Admin ya NO usa vistas (`VIEW`) de Supabase.**

Los datos se calculan directamente desde estas tablas:

- `companies`
- `company_members`
- `products`
- `profiles`
- `company_subscriptions`
- `subscription_plans`

Las tablas opcionales de planes y suscripciones no bloquean el panel si están vacías.

## Estructura simplificada

Todos los archivos están en la raíz del repositorio:

- `index.html`
- `app.css`
- `app.js`
- `core.js`
- `auth.js`
- `inventory.js`
- `dashboard.js`
- `products.js`
- `operations.js`
- `branches.js`
- `scanner.js`
- `superadmin.js`
- `sw.js`
- `manifest.webmanifest`

Esto coincide con la forma en que actualmente estás subiendo los archivos a GitHub
y evita errores 404 de `/js/app.js` y `/css/app.css`.

## Instalación

1. **No ejecutes SQL nuevo.**
2. Descomprime este ZIP.
3. En GitHub reemplaza/sube todos los archivos del paquete.
4. Verifica que `app.js`, `app.css`, `superadmin.js`, etc. estén en la raíz.
5. Espera el nuevo deployment de Vercel.
6. Abre primero en incógnito o haz `Ctrl + Shift + R`.

## Importante

La versión 4.1 ya no consulta:

`admin_company_overview`

Por lo tanto no debes crear esa vista para que Super Admin funcione.
