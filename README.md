# KeyTrack Pro Enterprise 4.26 — Landscape Meta Pairs Fix

## Corrección principal
En Chrome Android horizontal, `display:contents` aplicado a los TD agrupados
podía hacer desaparecer Marca y SKU.

v4.26 elimina ese método en horizontal y usa dos contenedores reales:

- MARCA | FCC ID
- SKU | OEM / PN

Los cuatro campos se muestran de forma independiente y aprovechan el ancho.

## Layout horizontal
- Foto + nombre + stock arriba.
- Marca | FCC ID | SKU | OEM/PN.
- Vehículo aproximadamente 70% y Ubicación aproximadamente 30%.
- ± | Ficha | Historial | Editar sin texto cortado.
- Barra inferior fija conservada.

## Instalación
No requiere SQL.
Reemplaza todos los archivos en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
