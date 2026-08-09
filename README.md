# KeyTrack Pro Enterprise 4.29 — Clean Responsive Cards

## Cambio importante
Se dejó de usar la estructura antigua de celdas agrupadas para el inventario.
Cada producto ahora usa una única estructura estable:

- Foto
- Nombre
- Marca
- FCC ID
- SKU
- OEM / PN
- Vehículo
- Ubicación
- Stock
- Acciones

## Vertical
- Marca, FCC, SKU y OEM aparecen una sola vez.
- Vehículo contiene únicamente vehículos.
- Ubicación contiene únicamente ubicación.
- Stock queda arriba a la derecha.
- Sin columnas colapsadas ni datos duplicados.

## Horizontal
- Marca | FCC ID | SKU | OEM/PN en cuatro columnas reales.
- Vehículo 70% | Ubicación 30%.
- Stock tiene su propia columna.
- ± | Ficha | Historial | Editar quedan separados del stock.
- No hay nombre de producto en una letra por línea.
- Se eliminan los grandes espacios vacíos generados por los layouts anteriores.

## Instalación
No requiere SQL.
Reemplaza todos los archivos en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
