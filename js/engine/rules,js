/* Reglas de bola 8 (WPA simplificadas). Funciones puras: estado + resultado del tiro -> estado nuevo.
   Sin "tronera cantada" en esta versiÃ³n: cualquier tronera vale. */
(function (root) {
  "use strict";
  const groupOf = id => (id >= 1 && id <= 7 ? "solids" : id >= 9 ? "stripes" : null);
  const other = g => (g === "solids" ? "stripes" : "solids");

  function newGame(opts) {
    return {
      turn: (opts && opts.firstTurn) || 0, groups: [null, null], phase: "break",
      ballInHand: true, pocketed: [], over: false, winner: null, rerack: false,
      lastFoul: null, message: "break"
    };
  }

  const remaining = (s, g) => (g === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).filter(id => s.pocketed.indexOf(id) < 0);

  /* ev = { firstContact, pocketed[], railAfterContact, cushionIds[] } (de physics.js) */
  function applyShot(prev, ev) {
    if (prev.over) throw new Error("game_over");
    const s = JSON.parse(JSON.stringify(prev));
    const me = s.turn, opp = 1 - me;
    const pk = ev.pocketed, scratch = pk.indexOf(0) >= 0, eight = pk.indexOf(8) >= 0;
    const objs = pk.filter(id => id !== 0 && id !== 8);
    s.rerack = false; s.lastFoul = null; s.ballInHand = false;

    if (s.phase === "break" && eight) {              // 8 en el saque: se vuelve a colocar el triÃ¡ngulo
      s.rerack = true; s.message = "rerack"; return s;
    }

    let foul = null;
    if (s.phase === "break") {
      if (scratch) foul = "scratch";
      else if (ev.firstContact === null) foul = "noContact";
      else if (!objs.length && ev.cushionIds.length < 4) foul = "illegalBreak";
    } else {
      const g = s.groups[me];
      if (scratch) foul = "scratch";
      else if (ev.firstContact === null) foul = "noContact";
      else if (s.phase === "open" && ev.firstContact === 8) foul = "wrongBall";
      else if (s.phase === "play") {
        const target = remaining(s, g).length === 0 ? 8 : null;
        const ok = target === 8 ? ev.firstContact === 8 : groupOf(ev.firstContact) === g;
        if (!ok) foul = "wrongBall";
      }
      if (!foul && !objs.length && !eight && !ev.railAfterContact) foul = "noRail";
    }

    s.pocketed.push.apply(s.pocketed, objs);
    if (eight) s.pocketed.push(8);

    if (eight) {                                     // resoluciÃ³n de la bola 8
      const g = s.groups[me];
      const cleared = s.phase === "play" && g && remaining(prev, g).length === 0;
      s.over = true; s.winner = (!foul && cleared) ? me : opp;
      s.lastFoul = foul; s.message = s.winner === me ? "win8" : (foul ? "lose8foul" : "lose8early");
      return s;
    }

    if (!foul && objs.length && s.phase === "open") {  // asignaciÃ³n de grupos
      s.groups[me] = groupOf(objs[0]); s.groups[opp] = other(s.groups[me]); s.phase = "play";
    }
    if (!foul && s.phase === "break") s.phase = "open";

    let keep = false;
    if (!foul && objs.length) keep = s.phase === "open" || objs.some(id => groupOf(id) === s.groups[me]);
    if (foul) { s.lastFoul = foul; s.ballInHand = true; s.message = "foul"; }
    else s.message = keep ? "again" : "turnChange";
    if (!keep) s.turn = opp;
    return s;
  }

  const api = { groupOf, newGame, applyShot, remaining };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.DMR = root.DMR || {}; root.DMR.rules = api; }
})(typeof window !== "undefined" ? window : globalThis);
