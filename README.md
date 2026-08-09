# KeyTrack Pro Enterprise 4.19 — Context Detail + Stock Alerts

## Ficha de producto
- Se elimina **Ficha de producto** del menú principal.
- La ficha sigue disponible desde el botón **Ficha** de cada producto.
- Se abre como vista contextual del producto seleccionado.
- Incluye botón **← Volver al inventario**.

## Stock
Cada tarjeta vuelve a mostrar claramente la cantidad arriba a la derecha:

- Verde: cantidad normal + **En stock**
- Amarillo: cantidad igual o menor al mínimo + **⚠ Stock bajo**
- Rojo: cantidad 0 + **⚠ Sin existencia**

Las tarjetas superiores de Inventario bajo y Sin existencia continúan funcionando como filtros.

## Diseño
- Marca, FCC ID, SKU y OEM / PN siguen como secciones separadas.
- En pantallas anchas se restauran todos esos campos usando todo el ancho.
- Vehículo conserva un espacio amplio.
- Ubicación permanece compacta.
- Cantidad no desaparece en tablet/pantalla horizontal.

## Instalación
1. No requiere SQL.
2. Reemplaza todos los archivos del ZIP en GitHub.
3. Espera Vercel.
4. No desinstales la PWA.
5. Cierra completamente KeyTrack Pro y vuelve a abrirla.
