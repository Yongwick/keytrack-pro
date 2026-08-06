# KeyTrack Pro Multiempresa

Esta versión permite crear cuentas completamente independientes.

Cada empresa tiene sus propios:

- Productos e inventario
- Sucursales
- Clientes
- Proveedores
- Compras
- Ventas
- Movimientos
- Usuarios y roles

Las políticas RLS de Supabase impiden que una empresa consulte o modifique los datos de otra.

## Instalación

1. Ejecuta `multiempresa.sql` completo en Supabase SQL Editor.
2. Reemplaza en GitHub:
   - `index.html`
   - `manifest.webmanifest`
   - `icon.svg`
   - `vercel.json`
   - `README.md`
3. Espera el despliegue de Vercel.
4. Para probar:
   - Conserva tu cuenta actual como Empresa Principal.
   - Crea otra cuenta desde modo incógnito.
   - Escribe un nombre de empresa diferente.
   - Los inventarios aparecerán completamente separados.

## Importante

Los registros de la base de datos quedan aislados por empresa. Los buckets de imágenes permanecen públicos para conservar las fotografías existentes; las nuevas cargas quedan organizadas en carpetas separadas por empresa.
