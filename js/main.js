/* Punto de entrada */
document.addEventListener("DOMContentLoaded", function () {
  DMR.ui.init();

  /* ---- Puntos de integración con el resto del juego ----
     Cuando tengas el servidor y la mesa de juego, escucha estos eventos:

     document.addEventListener("dmr:quick-match", e => { ...e.detail = datos de la partida... });
     document.addEventListener("dmr:private-room", e => { ...e.detail = { roomCode } ... });
  */
});