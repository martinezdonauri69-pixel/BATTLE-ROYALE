# DMR POOL EMPIRE â€” MenÃº principal

MenÃº principal del videojuego de billar **DMR POOL EMPIRE**, hecho con HTML5 + CSS + JavaScript puro (sin librerÃ­as, sin instalar nada).
Funciona en Android (Chrome), iPhone, tablets y ordenadores.

## CÃ³mo probarlo

**OpciÃ³n rÃ¡pida (sin instalar nada):** abre `index.html` con doble clic en el ordenador. En el mÃ³vil, pÃ¡salo al telÃ©fono y Ã¡brelo con Chrome.

**OpciÃ³n recomendada (servidor local):**
```bash
cd dmr-pool-empire
python3 -m http.server 8080
```
Abre `http://localhost:8080`. Desde el mÃ³vil (misma wifi): `http://IP-DE-TU-PC:8080`.

**Ver la tienda con artÃ­culos de ejemplo:** aÃ±ade `?demo=1` a la direcciÃ³n (`http://localhost:8080/?demo=1`). Son datos falsos solo para ver el diseÃ±o.

### Lista de comprobaciÃ³n
1. El menÃº aparece con la misma distribuciÃ³n que la imagen de referencia (la pantalla se escala sola).
2. En el mÃ³vil, gÃ­ralo en **horizontal**. En vertical sale un aviso para girarlo.
3. Pulsa cada botÃ³n: todos abren una ventana (tienda, perfil, ajustes, mÃ¡s) o un aviso "PrÃ³ximamente" con lo que falta por conectar.
4. Perfil â†’ escribe tu nombre â†’ Guardar: el nombre cambia en la cabecera y se conserva al recargar.
5. Abajo a la derecha, o en Ajustes, cambia el idioma entre los 10 disponibles.
6. Tienda â†’ pestaÃ±as Tacos / Bolas / Mesas. Sin `?demo=1` el catÃ¡logo estÃ¡ vacÃ­o a propÃ³sito.
7. `Esc` o clic fuera de una ventana la cierra.

## Publicarlo en GitHub (gratis, con enlace para el mÃ³vil)
1. Crea un repositorio en GitHub y sube todo el contenido de esta carpeta (`index.html` debe quedar en la raÃ­z).
2. Repositorio â†’ **Settings â†’ Pages** â†’ Source: *Deploy from a branch* â†’ rama `main`, carpeta `/ (root)` â†’ Save.
3. En un minuto tendrÃ¡s un enlace `https://TU-USUARIO.github.io/NOMBRE-REPO/`. Ãbrelo en el mÃ³vil y usa "AÃ±adir a pantalla de inicio".

## Estructura
```
index.html          Estructura del menÃº (posiciones y botones)
manifest.json       Datos para instalar como app (horizontal, pantalla completa)
css/style.css       Estilo: negro, dorado y azul elÃ©ctrico; animaciones y efectos
js/config.js        Ajustes (nombre, versiÃ³n, avisos para desarrolladores)
js/store.js         Guardado local (idioma y nombre)
js/i18n.js          Textos en 10 idiomas
js/services.js      Puntos de conexiÃ³n con sistemas reales (hoy: sin implementar)
js/catalog.js       CatÃ¡logo de la tienda (hoy: vacÃ­o)
js/ui.js            LÃ³gica de los botones y ventanas
js/main.js          Arranque
assets/             Logo, avatar, fondo y mesa (SVG propios, reemplazables)
tools/make-art.py   Genera el fondo y la mesa
```

## Idiomas
EspaÃ±ol, inglÃ©s, francÃ©s, alemÃ¡n, portuguÃ©s, italiano, chino, japonÃ©s, coreano y ruso. Se detecta el idioma del telÃ©fono y se recuerda la elecciÃ³n. Para aÃ±adir un texto: una lÃ­nea nueva en `js/i18n.js` con las 10 traducciones.

## QuÃ© estÃ¡ funcionando y quÃ© falta
**Funciona ahora:** diseÃ±o completo, escalado a cualquier pantalla, todos los botones, tienda (estructura), perfil (nombre local), ajustes (idioma), 10 idiomas, animaciones.

**No se inventÃ³ nada.** Hasta que exista el sistema real, esto se muestra como "â€”", vacÃ­o o "PrÃ³ximamente":
monedas y moneda premium, nivel/experiencia/rango, jugadores en lÃ­nea, Ãºltimos ganadores, ranking, pase de temporada, misiones, ofertas, compras, recompensas y torneos.

**Falta por construir (cada cosa tiene su punto de conexiÃ³n en `js/services.js`):**

| Sistema | QuÃ© hace falta |
|---|---|
| Juego de billar | La mesa jugable: fÃ­sicas, reglas del 8 ball, controles tÃ¡ctiles |
| Partida rÃ¡pida (JUGAR / JUEGA AHORA) | Servidor en tiempo real + emparejamiento 1 vs 1 |
| Amistoso | Salas privadas con cÃ³digo, invitaciones, y si quieres modo contra la IA |
| Torneos | Backend de inscripciÃ³n, cuadros, calendario y premios |
| Cuentas | Inicio de sesiÃ³n (Firebase, Supabase, PlayFab o servidor propio) |
| Monedas y compras | Monedero en servidor + Google Play Billing (para pagos reales en Android) |
| Inventario | QuÃ© tacos, bolas y mesas posee cada jugador |
| Ranking, amigos, mensajes, rangos, logros, pase, misiones, ofertas, eventos | Backend para cada uno |

Cuando conectes uno, el menÃº lo muestra solo. Ejemplo para el monedero, en `js/main.js`:
```js
DMR.services.wallet.getBalance = async () => {
  const r = await fetch("https://tu-servidor/api/wallet");
  return { ok: true, data: await r.json() };   // { coins: 1200, gems: 30 }
};
DMR.services.wallet.implemented = true;
DMR.ui.refresh();
```
Para iniciar partidas, escucha estos eventos:
```js
document.addEventListener("dmr:quick-match",  e => { /* e.detail = datos de la partida */ });
document.addEventListener("dmr:private-room", e => { /* e.detail = { roomCode } */ });
```
Para quitar los avisos de "Falta integrar" antes de publicar: `showDevNotices: false` en `js/config.js`.

## Notas
- El logo, avatar, fondo y mesa son dibujos propios hechos para este proyecto. Puedes reemplazar los archivos de `assets/` por tus imÃ¡genes con el mismo nombre.
- Los pagos reales con dinero requieren validaciÃ³n en servidor; nunca guardes monedas solo en el dispositivo.
