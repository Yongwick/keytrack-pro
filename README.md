# KeyTrack Pro Enterprise 5.0 — Clean Responsive Rebuild

## Base
Esta versión parte de **v4.19**, elegida como base estable.

## Conserva de v4.19
- Ficha contextual desde cada producto.
- Indicadores de stock.
- Inventario y ventas estables.
- Estructura de datos existente.
- Sin cambios SQL.

## Reconstrucción responsive
Se crea una única tarjeta de inventario:

- Foto
- Nombre
- Stock
- Marca
- FCC ID
- SKU
- OEM / PN
- Vehículo
- Ubicación
- ±
- Ficha
- Historial
- Editar

### Vertical
- Tarjetas compactas.
- Sin datos duplicados.
- Sin campos cruzados.
- Stock arriba a la derecha.

### Horizontal / tablet
- Marca | FCC | SKU | OEM en cuatro columnas.
- Vehículo ~70% | Ubicación ~30%.
- Stock separado.
- Acciones separadas.
- Sin columnas colapsadas.
- Sin espacios gigantes.

### Navegación
- Barra inferior fija.
- Celular horizontal sigue usando shell móvil.
- El menú lateral solo funciona como drawer en teléfono horizontal.

## Instalación
No requiere SQL.
Reemplaza todos los archivos del ZIP en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
