# KeyTrack Pro Enterprise 4.23 — Mobile Landscape Fix

## Problema corregido
Al girar un celular a horizontal, la app estaba entrando en reglas de tablet/escritorio:
- aparecía el menú lateral ocupando espacio;
- se ocultaban Marca/SKU;
- stock y ubicación podían quedar fuera;
- las tarjetas se desacomodaban.

## Nuevo comportamiento
En celular horizontal:
- se mantiene el menú como drawer;
- la barra inferior permanece visible;
- el inventario ocupa todo el ancho;
- Marca, FCC ID, SKU y OEM/PN permanecen visibles;
- Vehículo ocupa una fila completa;
- Ubicación ocupa una fila completa;
- Stock permanece arriba a la derecha;
- acciones quedan en una sola fila.

## Instalación
1. No requiere SQL.
2. Reemplaza todos los archivos en GitHub.
3. Espera Vercel.
4. No desinstales KeyTrack Pro.
5. Cierra completamente la PWA y vuelve a abrirla.
