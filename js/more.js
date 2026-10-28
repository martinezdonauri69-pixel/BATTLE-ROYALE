/* Panel Â«MÃ¡sÂ»: solo opciones secundarias. Cada una abre su pantalla con botÃ³n de regreso. */
(function () {
  "use strict";
  const es = () => DMR.i18n.lang === "es";
  const b = (e, s) => es() ? e : s;
  const el = (tag, cls, txt) => { const n = document.createElement(tag); if (cls) n.className = cls; if (txt != null) n.textContent = txt; return n; };
  const p = txt => el("p", "about", txt);
  const ST = () => DMR.store.get("stats", { games: 0, p1wins: 0 });
  const HI = () => DMR.store.get("history", []);
  const empty = txt => { const d = el("div", "empty"); d.append(el("p", "soon", txt)); return d; };

  const ITEMS = [
    ["stats", "chart", ["EstadÃ­sticas detalladas", "Detailed statistics"], () => { const s = ST(); const d = el("div"); d.append(p(b("Partidas locales terminadas: ", "Finished local games: ") + s.games), p(b("Victorias del Jugador 1: ", "Player 1 wins: ") + s.p1wins), p(b("Las estadÃ­sticas de precisiÃ³n y en lÃ­nea necesitan el sistema de cuentas.", "Accuracy and online stats need the accounts system."))); return d; }],
    ["history", "clipboard", ["Historial de partidas", "Match history"], () => { const h = HI(); if (!h.length) return empty(b("AÃºn no hay partidas.", "No matches yet.")); const d = el("div"); h.forEach(m => d.append(p(new Date(m.at).toLocaleString() + " Â· " + b("GanÃ³ Jugador ", "Winner: Player ") + (m.winner + 1)))); return d; }],
    ["rewardsHist", "gift", ["Historial de recompensas", "Reward history"], () => empty(b("Sin recompensas todavÃ­a: el sistema de recompensas aÃºn no existe.", "No rewards yet: the rewards system isn't built."))],
    ["titles", "star", ["TÃ­tulos y medallas", "Titles and medals"], () => empty(b("Pendiente: requiere el sistema de logros.", "Pending: needs the achievements system."))],
    ["promo", "tag", ["CÃ³digos promocionales", "Promo codes"], () => empty(b("Pendiente: requiere un servidor que valide los cÃ³digos.", "Pending: needs a server to validate codes."))],
    ["help", "clipboard", ["Centro de ayuda", "Help center"], () => { const d = el("div"); [b("Arrastra el dedo o el ratÃ³n sobre la mesa para apuntar.", "Drag your finger or mouse on the table to aim."), b("Ajusta la fuerza con la barra y pulsa TIRAR.", "Set power with the slider and press SHOOT."), b("Emboca tu grupo (lisas o rayadas) y por Ãºltimo la bola 8.", "Pocket your group (solids or stripes), then the 8-ball."), b("Una falta da bola en mano al rival.", "A foul gives your opponent ball in hand.")].forEach(t => d.append(p("â€¢ " + t))); return d; }],
    ["tutorial", "play", ["Tutorial y prÃ¡ctica guiada", "Tutorial and guided practice"], () => { const d = empty(b("El tutorial interactivo estÃ¡ pendiente. Mientras tanto, la ayuda explica los controles.", "The interactive tutorial is pending. Meanwhile, Help explains the controls.")); return d; }],
    ["news", "globe", ["Noticias y novedades", "News and updates"], () => empty(b("No hay noticias publicadas.", "No news published."))],
    ["credits", "crown", ["CrÃ©ditos", "Credits"], () => p("DMR POOL EMPIRE Â· v" + DMR.config.version)],
    ["legal", "lock", ["InformaciÃ³n, privacidad y condiciones", "Info, privacy and terms"], () => p(b("Esta versiÃ³n guarda solo tu nombre, idioma, sonido y estadÃ­sticas en este dispositivo. No envÃ­a datos a ningÃºn servidor. Los textos legales definitivos estÃ¡n pendientes.", "This version stores only your name, language, sound and stats on this device. It sends nothing to any server. Final legal texts are pending."))]
  ];

  function show(it) {
    const body = el("div"), back = el("button", "primary btn", "â† " + b("Volver", "Back"));
    back.addEventListener("click", open);
    body.append(back, it[3]());
    DMR.ui.openModal(it[2][es() ? 0 : 1], it[1], body);
  }
  function open() {
    const grid = el("div", "menugrid");
    ITEMS.forEach(it => {
      const btn = el("button", "mg btn"); btn.innerHTML = '<svg class="ic"><use href="#i-' + it[1] + '"/></svg>';
      btn.append(it[2][es() ? 0 : 1]); btn.addEventListener("click", () => show(it)); grid.append(btn);
    });
    DMR.ui.openModal(b("MÃ¡s", "More"), "more", grid);
  }
  DMR.more = { open };
})();
