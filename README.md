# KeyTrack Pro Enterprise 4.21 — Wide Layout Rebuild

## Cambio principal
En vez de seguir parchando el layout ancho, esta versión lo reestructura:

### Pantalla horizontal / tablet
- Fila 1: Foto + Nombre + Stock.
- Fila 2: Marca + FCC ID + SKU + OEM/PN + Ubicación.
- Fila 3: Vehículo ocupa todo el ancho disponible.
- Fila 4: ± + Ficha + Historial + Editar.

## Correcciones
- Stock siempre visible arriba a la derecha.
- Stock bajo y sin existencia siguen mostrando advertencia.
- Vehículo ya no comparte columna angosta con otros campos.
- Vehículo no debe cortarse lateralmente.
- Título no invade el stock.
- Ubicación queda compacta.
- Marca, FCC, SKU y OEM/PN siguen separados.
- Conserva todos los cambios anteriores de v4.19/v4.20.

## Instalación
1. No requiere SQL.
2. Reemplaza todos los archivos en GitHub.
3. Espera Vercel.
4. No desinstales la PWA.
5. Cierra completamente KeyTrack Pro y vuelve a abrirla.
