# KeyTrack Pro Enterprise 4.2 — Super Admin Global

Esta versión corrige el motivo por el cual Super Admin mostraba únicamente
la empresa del usuario administrador.

## Por qué ocurría

Las consultas directas a `companies`, `company_members` y `products`
están protegidas por RLS. Por seguridad, Supabase solo devolvía los datos
de la empresa a la que pertenece el usuario actual.

Eso es correcto para los usuarios normales, pero no sirve para el panel
global de Super Admin.

## Solución

Se incluye:

`superadmin-global.sql`

El script crea una función segura `SECURITY DEFINER` que:

1. Comprueba que el usuario esté registrado en `platform_admins`.
2. Solo entonces permite obtener estadísticas globales.
3. No desactiva RLS para los usuarios normales.
4. No expone la service-role key en el navegador.

## Instalación

1. En Supabase → SQL Editor ejecuta **una sola vez**:
   `superadmin-global.sql`
2. En GitHub reemplaza/sube todos los archivos de este ZIP.
3. Espera el deployment de Vercel.
4. Abre la aplicación con Ctrl+Shift+R o en incógnito.
5. En Super Admin pulsa **Actualizar**.

Ahora deben aparecer todas las empresas creadas, no únicamente
KeyTrack Empresa Principal.
