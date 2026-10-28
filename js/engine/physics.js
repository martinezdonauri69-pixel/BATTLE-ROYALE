/* Motor de f\u00edsica de DMR POOL EMPIRE. Sin DOM: funciona en navegador y en Node.
   Unidades: mil\u00edmetros y segundos. Paso fijo para resultados deterministas. */
(function (root) {
  "use strict";
  const T = { W: 2540, H: 1270, R: 28.575 };
  const POCKETS = [
    { x: 0, y: 0, r: 64 }, { x: T.W / 2, y: 0, r: 56 }, { x: T.W, y: 0, r: 64 },
    { x: 0, y: T.H, r: 64 }, { x: T.W / 2, y: T.H, r: 56 }, { x: T.W, y: T.H, r: 64 }
  ];
  const C = {
    STEP: 1 / 240, MAX_SPEED: 6500, ROLL_C: 220, ROLL_K: 0.25, STOP: 6,
    E_BALL: 0.96, E_WALL: 0.72, MAX_TIME: 45
  };

  const groupOf = id => (id >= 1 && id <= 7 ? "solids" : id >= 9 ? "stripes" : null);

  /* Mulberry32: azar con semilla (partidas y pruebas reproducibles) */
  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /* Tri\u00e1ngulo: bola 8 en el centro, una lisa y una rayada en las esquinas traseras. */
  function rack(rand) {
    rand = rand || Math.random;
    const R = T.R, eps = 0.02;
    const solids = [1, 2, 3, 4, 5, 6, 7], stripes = [9, 10, 11, 12, 13, 14, 15];
    const shuffle = a => { for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    shuffle(solids); shuffle(stripes);
    const cornerA = solids.pop(), cornerB = stripes.pop();
    const rest = shuffle(solids.concat(stripes));
    const slots = [];
    for (let r = 0; r < 5; r++) for (let c = 0; c <= r; c++) slots.push([r, c]);
    const ids = new Array(15);
    ids[10] = rand() < 0.5 ? cornerA : cornerB;        // fila 4, col 0
    ids[14] = ids[10] === cornerA ? cornerB : cornerA; // fila 4, col 4
    ids[4] = 8;                                        // fila 2, col 1
    for (let i = 0; i < 15; i++) if (ids[i] === undefined) ids[i] = rest.pop();
    const balls = [{ id: 0, x: T.W * 0.25, y: T.H / 2, vx: 0, vy: 0, pocketed: false }];
    const x0 = T.W * 0.75;
    slots.forEach(([r, c], i) => balls.push({
      id: ids[i], x: x0 + r * (Math.sqrt(3) * R + eps), y: T.H / 2 + (c - r / 2) * (2 * R + eps),
      vx: 0, vy: 0, pocketed: false
    }));
    return balls;
  }

  const clone = balls => balls.map(b => ({ id: b.id, x: b.x, y: b.y, vx: b.vx, vy: b.vy, pocketed: b.pocketed }));

  function beginShot(balls, angle, power) {
    const bs = clone(balls), cue = bs[0];
    const p = Math.max(0, Math.min(1, power));
    cue.vx = Math.cos(angle) * p * C.MAX_SPEED;
    cue.vy = Math.sin(angle) * p * C.MAX_SPEED;
    return {
      balls: bs, acc: 0, time: 0, done: p === 0, timedOut: false,
      ev: { firstContact: null, pocketed: [], railAfterContact: false, cushionIds: [], hits: 0 }
    };
  }

  function step(w) {
    const dt = C.STEP, R = T.R, bs = w.balls, ev = w.ev;
    for (const b of bs) {
      if (b.pocketed) continue;
      b.x += b.vx * dt; b.y += b.vy * dt;
      const s = Math.hypot(b.vx, b.vy);
      if (s > 0) {
        const s2 = s - (C.ROLL_C + C.ROLL_K * s) * dt;
        if (s2 < C.STOP) { b.vx = 0; b.vy = 0; } else { const k = s2 / s; b.vx *= k; b.vy *= k; }
      }
      for (const p of POCKETS) {
        if ((b.x - p.x) ** 2 + (b.y - p.y) ** 2 < p.r * p.r) {
          b.pocketed = true; b.vx = 0; b.vy = 0; ev.pocketed.push(b.id); break;
        }
      }
      if (b.pocketed) continue;
      let hit = false;
      if (b.x < R) { b.x = R; if (b.vx < 0) b.vx = -b.vx * C.E_WALL; hit = true; }
      else if (b.x > T.W - R) { b.x = T.W - R; if (b.vx > 0) b.vx = -b.vx * C.E_WALL; hit = true; }
      if (b.y < R) { b.y = R; if (b.vy < 0) b.vy = -b.vy * C.E_WALL; hit = true; }
      else if (b.y > T.H - R) { b.y = T.H - R; if (b.vy > 0) b.vy = -b.vy * C.E_WALL; hit = true; }
      if (hit && Math.hypot(b.vx, b.vy) > 0) {
        if (ev.firstContact !== null) ev.railAfterContact = true;
        if (b.id !== 0 && ev.cushionIds.indexOf(b.id) < 0) ev.cushionIds.push(b.id);
      }
    }
    for (let it = 0; it < 2; it++) {
      for (let i = 0; i < bs.length; i++) {
        const a = bs[i]; if (a.pocketed) continue;
        for (let j = i + 1; j < bs.length; j++) {
          const b = bs[j]; if (b.pocketed) continue;
          const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy, m = 2 * R;
          if (d2 >= m * m || d2 === 0) continue;
          const d = Math.sqrt(d2), nx = dx / d, ny = dy / d;
          const rv = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rv > 0) {
            const jm = (1 + C.E_BALL) / 2 * rv;
            a.vx -= jm * nx; a.vy -= jm * ny; b.vx += jm * nx; b.vy += jm * ny;
            ev.hits++;
            if (ev.firstContact === null && (a.id === 0 || b.id === 0)) ev.firstContact = a.id === 0 ? b.id : a.id;
          }
          const o = (m - d) / 2; a.x -= nx * o; a.y -= ny * o; b.x += nx * o; b.y += ny * o;
        }
      }
    }
    w.time += dt;
    let moving = false;
    for (const b of bs) if (!b.pocketed && (b.vx !== 0 || b.vy !== 0)) { moving = true; break; }
    if (!moving) w.done = true;
    else if (w.time > C.MAX_TIME) { for (const b of bs) { b.vx = 0; b.vy = 0; } w.done = true; w.timedOut = true; }
  }

  /* Para dibujar: llama advance(w, segundosDelFotograma) en cada frame. */
  function advance(w, seconds) {
    w.acc += Math.min(seconds, 0.1);
    while (w.acc >= C.STEP && !w.done) { step(w); w.acc -= C.STEP; }
    return w.done;
  }

  /* Simulaci\u00f3n completa sin dibujar (IA, pruebas, validaci\u00f3n en servidor). */
  function simulate(balls, angle, power) {
    const w = beginShot(balls, angle, power);
    while (!w.done) step(w);
    return w;
  }

  const api = { T, C, POCKETS, groupOf, rng, rack, clone, beginShot, step, advance, simulate };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else { root.DMR = root.DMR || {}; root.DMR.physics = api; }
})(typeof window !== "undefined" ? window : globalThis);
