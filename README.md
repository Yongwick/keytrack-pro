# KeyTrack Pro Enterprise 4.27 — Landscape Structure Fix

## Qué cambia
Esta versión corrige el problema de fondo en celular horizontal.

Ya no intenta mover internamente Marca/FCC y SKU/OEM con CSS.

Se crea una fila horizontal REAL e independiente con:

**MARCA | FCC ID | SKU | OEM / PN**

Los campos originales se ocultan únicamente en celular horizontal, evitando:
- Marca desaparecida
- SKU desplazado al extremo derecho
- OEM / PN duplicado
- espacios vacíos enormes

## Layout horizontal
1. Foto + nombre + stock
2. Marca | FCC ID | SKU | OEM/PN
3. Vehículo ~70% | Ubicación ~30%
4. ± | Ficha | Historial | Editar

La barra inferior permanece fija.

## Instalación
No requiere SQL.
Reemplaza los archivos en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
