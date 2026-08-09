# KeyTrack Pro Enterprise 4.18 — Mobile Fields + Delete Confirm

## Correcciones incluidas
- En móvil, Marca, FCC ID, SKU y OEM / PN son cuatro secciones independientes.
- En pantallas anchas, Marca, FCC, SKU y OEM son cuatro columnas independientes.
- Vehículo recibe más espacio y ya no debe desbordarse hacia la derecha.
- Ubicación conserva una columna compacta.

## Eliminar producto
- Ya no aparece "Zona de peligro" permanentemente.
- El botón rojo **Eliminar producto** aparece abajo a la izquierda, a la misma altura que Cancelar y Guardar.
- Solo aparece al editar un producto existente.
- Al tocarlo se abre una confirmación con:
  - “Eliminar este producto es una acción permanente y no se puede deshacer.”
  - Nombre del producto
  - SKU
  - OEM / PN
  - Cancelar
  - Sí, eliminar producto

## Instalación
No requiere SQL ni desinstalar la PWA.
Reemplaza todos los archivos en GitHub, espera el deploy de Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
