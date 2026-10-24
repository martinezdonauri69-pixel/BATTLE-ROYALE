# Zona Final · Lobby (Parte 1)

Lobby de Battle Royale FPS hecho con HTML, CSS y JavaScript + Three.js (sin instalación ni compilación).

## Estructura
```
zona-final-lobby/
├── index.html      ← pantalla principal (HTML)
├── css/style.css   ← diseño y adaptación a móvil/PC
└── js/
    ├── data.js     ← mapas, modos, armas, skins, tienda, misiones
    ├── scene.js    ← escena 3D: soldado, base, helicóptero, atardecer
    └── ui.js       ← botones, pantallas, guardado y pantalla de carga
```

## Ejecutar
Los módulos de JavaScript necesitan un servidor local (no abras el archivo con doble clic):
```
cd zona-final-lobby
python3 -m http.server 8000
```
Abre http://localhost:8000 (necesita internet para cargar Three.js y la fuente).

## Publicar en GitHub Pages
1. Crea un repositorio y sube la carpeta (Add file → Upload files).
2. Settings → Pages → Branch: main, carpeta / (root) → Save.
3. Abre la URL que te muestra GitHub.

## Comprobar que todo funciona
- Arrastra sobre el soldado: gira. Rueda del ratón: zoom.
- Mapas y modos: se marcan y se recuerdan al recargar.
- FPP/TPP: cambia el encuadre y se guarda.
- INICIAR: carga simulada, sin jugadores falsos.
- Pase, Tienda, Eventos, Misiones, Clan, Amigos, Mensajes, Armas, Personaje, Inventario, Rango y Ajustes abren su pantalla.

## Errores comunes
- Pantalla negra: abre la consola (F12). Si dice "Failed to resolve module", estás abriendo con file://; usa el servidor.
- Sin fuente o sin 3D: revisa tu conexión a internet.
