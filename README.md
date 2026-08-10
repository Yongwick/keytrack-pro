# KeyTrack Pro Enterprise 5.8 — Cropped Scan ROI

Cambios:
- El detector ya NO analiza todo el frame de la cámara.
- Se recorta digitalmente exactamente la franja central visible.
- BarcodeDetector recibe solo esa zona.
- Se mantienen 3 lecturas consecutivas iguales.
- Se mantienen enfoque continuo, zoom y linterna.
- No requiere SQL.
