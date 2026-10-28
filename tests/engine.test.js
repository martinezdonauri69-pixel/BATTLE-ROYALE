const test = require("node:test");
const assert = require("node:assert/strict");
const P = require("../js/engine/physics.js");
const Rules = require("../js/engine/rules.js");
const { T } = P;

const minDist = bs => { let m = Infinity; const a = bs.filter(b => !b.pocketed);
  for (let i = 0; i < a.length; i++) for (let j = i + 1; j < a.length; j++) m = Math.min(m, Math.hypot(a[i].x - a[j].x, a[i].y - a[j].y)); return m; };
const only = (...bs) => bs.map(b => Object.assign({ vx: 0, vy: 0, pocketed: false }, b));
const EV = o => Object.assign({ firstContact: null, pocketed: [], railAfterContact: false, cushionIds: [] }, o);

test("triÃ¡ngulo: 16 bolas, ids Ãºnicos, 8 al centro, esquinas lisa+rayada, sin solapes", () => {
  for (let seed = 1; seed <= 50; seed++) {
    const b = P.rack(P.rng(seed));
    assert.equal(b.length, 16);
    assert.deepEqual(b.map(x => x.id).sort((a, c) => a - c), [...Array(16).keys()]);
    assert.equal(b[5].id, 8);
    assert.notEqual(P.groupOf(b[11].id), P.groupOf(b[15].id));
    assert.ok(minDist(b) >= 2 * T.R - 1e-6);
  }
});

test("choque frontal: la blanca transfiere casi todo su impulso", () => {
  const b = only({ id: 0, x: 600, y: 635 }, { id: 1, x: 1000, y: 635 });
  const w = P.simulate(b, 0, 0.3);
  assert.equal(w.ev.firstContact, 1);
  assert.ok(w.balls[1].x > 1000, "la bola 1 avanza");
  assert.ok(w.balls[0].x < w.balls[1].x, "no se atraviesan");
});

test("rebote en banda con pÃ©rdida de velocidad y registro de banda", () => {
  const b = only({ id: 0, x: 600, y: 635 }, { id: 1, x: 1200, y: 300 });
  const w = P.beginShot(b, Math.PI, 0.5);
  let vxBefore = 0, bounced = false;
  while (!w.done && !bounced) { vxBefore = w.balls[0].vx; P.step(w); if (w.balls[0].vx > 0) bounced = true; }
  assert.ok(bounced);
  assert.ok(Math.abs(w.balls[0].vx) < Math.abs(vxBefore));
});

test("la bola entra en tronera y queda registrada una sola vez", () => {
  const b = only({ id: 0, x: 1000, y: 635 }, { id: 5, x: 200, y: 635 });
  // empuja la 5 hacia la tronera de la esquina (0,0)
  b[1].x = 160; b[1].y = 120; b[0].x = 1500; b[0].y = 1000;
  const ang = Math.atan2(b[1].y - b[0].y, b[1].x - b[0].x);
  const w = P.simulate(b, ang, 0.35);
  assert.deepEqual(w.ev.pocketed.filter(i => i === 5), [5]);
});

test("toda partida termina: ninguna bola se mueve para siempre (saques con distintas fuerzas)", () => {
  for (let seed = 1; seed <= 20; seed++) {
    const rand = P.rng(seed), balls = P.rack(rand);
    const w = P.simulate(balls, (rand() - 0.5) * 0.1, 0.4 + rand() * 0.6);
    assert.ok(w.done && !w.timedOut, "seed " + seed + " terminÃ³ en " + w.time.toFixed(1) + "s");
    assert.ok(minDist(w.balls) >= 2 * T.R - 1.5, "sin solapes seed " + seed);
    for (const x of w.balls) if (!x.pocketed) assert.ok(x.x >= T.R - 1e-6 && x.x <= T.W - T.R + 1e-6 && x.y >= T.R - 1e-6 && x.y <= T.H - T.R + 1e-6);
  }
});

test("es determinista: mismo tiro, mismo resultado", () => {
  const a = P.simulate(P.rack(P.rng(7)), 0.01, 0.9), c = P.simulate(P.rack(P.rng(7)), 0.01, 0.9);
  assert.deepEqual(a.balls, c.balls);
});

test("potencia 0 no mueve nada", () => {
  assert.ok(P.beginShot(P.rack(P.rng(1)), 0, 0).done);
});

/* ---------- reglas ---------- */
test("saque ilegal (sin tronera y <4 bolas a banda) = falta con bola en mano", () => {
  const s = Rules.applyShot(Rules.newGame(), EV({ firstContact: 1, cushionIds: [1, 2] }));
  assert.equal(s.lastFoul, "illegalBreak"); assert.equal(s.turn, 1); assert.ok(s.ballInHand);
});
test("saque legal con bola embocada: sigue el mismo jugador y la mesa queda abierta", () => {
  const s = Rules.applyShot(Rules.newGame(), EV({ firstContact: 1, pocketed: [3], cushionIds: [1] }));
  assert.equal(s.turn, 0); assert.equal(s.phase, "open"); assert.deepEqual(s.groups, [null, null]);
});
test("mesa abierta: la primera bola embocada asigna grupos", () => {
  let s = Rules.newGame(); s.phase = "open";
  s = Rules.applyShot(s, EV({ firstContact: 10, pocketed: [10], railAfterContact: true }));
  assert.deepEqual(s.groups, ["stripes", "solids"]); assert.equal(s.turn, 0);
});
test("embocar bola del rival: cambia el turno sin falta", () => {
  let s = Rules.newGame(); s.phase = "play"; s.groups = ["solids", "stripes"];
  s = Rules.applyShot(s, EV({ firstContact: 2, pocketed: [11] }));
  assert.equal(s.turn, 1); assert.equal(s.lastFoul, null);
});
test("faltas: blanca embocada, tocar bola ajena primero, no tocar nada, sin banda", () => {
  const base = () => { const s = Rules.newGame(); s.phase = "play"; s.groups = ["solids", "stripes"]; return s; };
  assert.equal(Rules.applyShot(base(), EV({ firstContact: 2, pocketed: [0] })).lastFoul, "scratch");
  assert.equal(Rules.applyShot(base(), EV({ firstContact: 12, railAfterContact: true })).lastFoul, "wrongBall");
  assert.equal(Rules.applyShot(base(), EV({})).lastFoul, "noContact");
  assert.equal(Rules.applyShot(base(), EV({ firstContact: 2 })).lastFoul, "noRail");
});
test("bola 8: gana solo si el grupo estÃ¡ despejado y no hay falta", () => {
  const mk = pk => { const s = Rules.newGame(); s.phase = "play"; s.groups = ["solids", "stripes"]; s.pocketed = pk; return s; };
  const all = [1, 2, 3, 4, 5, 6, 7];
  let r = Rules.applyShot(mk(all), EV({ firstContact: 8, pocketed: [8] })); assert.equal(r.winner, 0);
  r = Rules.applyShot(mk(all), EV({ firstContact: 8, pocketed: [8, 0] })); assert.equal(r.winner, 1);
  r = Rules.applyShot(mk([1, 2]), EV({ firstContact: 3, pocketed: [8] })); assert.equal(r.winner, 1);
  assert.throws(() => Rules.applyShot(r, EV({})), /game_over/);
});
test("8 en el saque: nuevo triÃ¡ngulo, nadie gana", () => {
  const s = Rules.applyShot(Rules.newGame(), EV({ firstContact: 1, pocketed: [8] }));
  assert.ok(s.rerack && !s.over);
});
test("partida completa simulada: termina con ganador usando fÃ­sica + reglas", () => {
  for (let seed = 1; seed <= 5; seed++) {
    const rand = P.rng(seed * 11); let balls = P.rack(rand), st = Rules.newGame(), shots = 0;
    while (!st.over && shots < 600) {
      const live = balls.filter(b => !b.pocketed && b.id !== 0);
      const cue = balls[0];
      if (cue.pocketed) { cue.pocketed = false; cue.x = T.W * 0.25; cue.y = T.H / 2; }
      const tgt = live[Math.floor(rand() * live.length)];
      const ang = Math.atan2(tgt.y - cue.y, tgt.x - cue.x) + (rand() - 0.5) * 0.08;
      const w = P.simulate(balls, ang, 0.35 + rand() * 0.5);
      balls = w.balls; st = Rules.applyShot(st, w.ev); shots++;
      if (st.rerack) { balls = P.rack(rand); st = Rules.newGame(); }
    }
    assert.ok(st.over, "seed " + seed + " no terminÃ³ en 600 tiros");
    assert.ok(st.winner === 0 || st.winner === 1);
  }
});
