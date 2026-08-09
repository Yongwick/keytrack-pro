# KeyTrack Pro Enterprise 4.28 — Layout Separation Fix

## Qué corrige

### Vertical
- Marca/FCC y SKU/OEM vuelven a usar solamente la estructura original.
- Vehículo muestra únicamente compatibilidad del vehículo.
- Ubicación muestra únicamente ubicación.
- Ya no se repiten Marca/FCC/SKU/OEM dentro de Vehículo.
- Ya no aparece el vehículo dentro de Ubicación.

### Horizontal en celular
- Se usan exclusivamente estructuras dedicadas para horizontal.
- Marca | FCC ID | SKU | OEM/PN en una fila real.
- Vehículo y Ubicación usan bloques propios.
- Se ocultan por completo los bloques antiguos para evitar duplicados.
- Stock mantiene su propia columna y no se superpone con Editar.
- Acciones quedan separadas del stock.

## Instalación
No requiere SQL.
Reemplaza todos los archivos en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
