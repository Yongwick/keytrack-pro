# KeyTrack Pro Enterprise 4.13 — Camera Scanner Fix

Corrige la pantalla negra del escáner en móvil/PWA.

## Mejoras
- Solicita permiso de cámara correctamente.
- Intenta usar la cámara trasera.
- Si falla la selección trasera, intenta una cámara disponible.
- Espera a que el video esté listo y ejecuta `video.play()`.
- Video configurado con `autoplay`, `muted` y `playsinline`.
- Muestra estado de carga.
- Muestra mensajes claros si:
  - cámara bloqueada
  - cámara ocupada
  - no existe cámara
  - el navegador no permite cámara
- Botón **Reintentar cámara**.
- Ayuda para permisos.
- Detiene la cámara al cerrar el escáner.
- Detiene la cámara si la PWA pasa a segundo plano.
- Marco visual de escaneo.
- Conserva ingreso manual.
- Conserva todas las funciones de v4.12.

## Instalación
1. No requiere SQL.
2. Reemplaza todos los archivos del ZIP en GitHub.
3. Espera Vercel.
4. No desinstales KeyTrack Pro.
5. Cierra completamente la PWA y vuelve a abrirla.
6. La primera vez, acepta el permiso de cámara.
