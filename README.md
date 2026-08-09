# KeyTrack Pro Enterprise 4.22 — Wide Nav + Brand Fix

## Barra inferior
La barra tipo app ahora se muestra también en tablet y pantallas anchas:

- Inicio
- Inventario
- Nuevo
- Ventas
- Más

Permanece fija en la parte inferior y se reserva espacio para no tapar contenido.

## Inventario en horizontal
Se fuerza la visualización de todos los campos:

- Marca
- FCC ID
- SKU
- OEM / PN
- Ubicación
- Vehículo
- Stock

Marca y SKU ya no deben desaparecer por reglas responsive antiguas.

## Distribución
- Foto + nombre + stock arriba.
- Marca | FCC | SKU | OEM/PN | Ubicación en una fila.
- Vehículo usa una fila completa.
- Acciones debajo.
- Stock permanece fijo a la derecha.

## Instalación
1. No requiere SQL.
2. Reemplaza todos los archivos del ZIP en GitHub.
3. Espera Vercel.
4. No desinstales KeyTrack Pro.
5. Cierra completamente la PWA y vuelve a abrirla.
