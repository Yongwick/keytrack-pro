# KeyTrack Pro Enterprise 4.15 — Action Buttons Fix

Corrige el problema visible en v4.14 donde los botones ±, Ficha, Historial,
Editar y Borrar podían comprimirse hasta mostrar las letras verticalmente.

## Cambios
- Botones siempre horizontales.
- En celular: acciones en 2 columnas.
- En pantallas móviles más anchas: hasta 4 columnas cuando caben.
- Borrar ya no se convierte en una columna angosta.
- Eliminado espacio vacío innecesario debajo de las acciones.
- Conserva el diseño compacto de Marca/FCC + SKU/OEM.
- Conserva cámara, Excel, PWA, ventas, Super Admin y datos existentes.

## Instalación
No requiere SQL ni desinstalar la PWA.
Reemplaza todos los archivos en GitHub, espera el deploy de Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
