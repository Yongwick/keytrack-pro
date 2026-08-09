# KeyTrack Pro Enterprise 5.1 — Div Card Inventory

## Cambio principal
El inventario deja de usar completamente:
- table
- tr
- td

Cada producto ahora se renderiza como una tarjeta DIV independiente.

Esto elimina el problema de:
- tarjetas con altura gigantesca
- contenido desplazado al fondo
- columnas que colapsan
- comportamiento extraño al rotar el celular

## Layout
### Vertical
- Foto + nombre + stock
- Marca
- FCC ID
- SKU
- OEM / PN
- Vehículo
- Ubicación
- ± | Ficha | Historial | Editar

### Horizontal / tablet
- Foto + nombre + stock
- Marca | FCC | SKU | OEM
- Vehículo ~70% | Ubicación ~30%
- Acciones separadas

## Instalación
No requiere SQL.
Reemplaza todos los archivos del ZIP en GitHub, espera Vercel,
cierra completamente KeyTrack Pro y vuelve a abrirla.
