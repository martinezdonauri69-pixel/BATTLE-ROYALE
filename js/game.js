/* Pantalla de juego: dibuja la mesa y maneja controles. La f\u00edsica y las reglas est\u00e1n en js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules, T = P.T, R = T.R, RAIL = 90;
  const L = {
    es: { p1: "Jugador 1", p2: "Jugador 2", shoot: "TIRAR", place: "COLOCAR", power: "Fuerza", pause: "Pausa", resume: "Continuar",
      restart: "Reiniciar", menu: "Men\u00fa", again: "Revancha", wins: "\u00a1gana!", result: "Resultado", solids: "Lisas", stripes: "Rayadas", open: "Mesa abierta",
      break: "Saque: apunta, ajusta la fuerza y pulsa TIRAR", again_: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano para el rival",
      rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo", win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo",
      scratch: "blanca embocada", noContact: "no tocaste ninguna bola", wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal",
      placeHint: "Arrastra la blanca y pulsa COLOCAR", games: "partidas" },
    en: { p1: "Player 1", p2: "Player 2", shoot: "SHOOT", place: "PLACE", power: "Power", pause: "Pause", resume: "Resume",
      restart: "Restart", menu: "Menu", again: "Rematch", wins: "wins!", result: "Result", solids: "Solids", stripes: "Stripes", open: "Open table",
      break: "Break: aim, set power and press SHOOT", again_: "Shoot again!", turnChange: "Turn change", foul: "Foul: ball in hand for opponent",
      rerack: "8-ball on the break: re-racking", win8: "8-ball pocketed", lose8foul: "8-ball with a foul", lose8early: "8-ball too early",
      scratch: "cue ball pocketed", noContact: "no ball was hit", wrongBall: "wrong ball first", noRail: "no ball hit a rail", illegalBreak: "illegal break",
      placeHint: "Drag the cue ball and press PLACE", games: "games" }
  };
  const tx = k => { const l = (DMR.i18n && DMR.i18n.lang) || "es"; return (L[l] || L.en)[k] || L.en[k] || k; };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];

  let el, cv, g, S = { x: 0, y: 0, s: 1 };
  let balls, st, shot, aim = 0, power = 0.5, placing = false, paused = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0;

  /* ---------- audio simple (WebAudio, sin archivos) ---------- */
  let ac;
  function beep(f, d, v) {
    if (DMR.store.get("sound", true) === false) return;
    try {
      ac = ac || new (window.AudioContext || window.webkitAudioContext)();
      const o = ac.createOscillator(), a = ac.createGain();
      o.frequency.value = f; o.type = "triangle"; a.gain.value = v || 0.15;
      a.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + d);
      o.connect(a); a.connect(ac.destination); o.start(); o.stop(ac.currentTime + d);
    } catch (e) { /* sin audio */ }
  }

  function build() {
    el = document.createElement("div"); el.id = "game";
    el.innerHTML =
      '<canvas id="gc"></canvas>' +
      '<div id="gHud"><div class="gp" id="gp0"></div><div id="gMsg"></div><div class="gp" id="gp1"></div>' +
      '<button class="gb" id="gPause"></button></div>' +
      '<div id="gBar"><label id="gPowL"></label><input id="gPow" type="range" min="5" max="100" value="50"><button id="gShoot" class="gb gold"></button></div>' +
      '<div id="gPauseBox" class="gov"><div class="gcard"><h2></h2><button class="gb" data-g="resume"></button><button class="gb" data-g="restart"></button><button class="gb" data-g="menu"></button></div></div>' +
      '<div id="gResult" class="gov"><div class="gcard"><h2></h2><p></p><button class="gb gold" data-g="restart"></button><button class="gb" data-g="menu"></button></div></div>';
    document.body.append(el);
    cv = el.querySelector("#gc"); g = cv.getContext("2d");
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); point(e); });
    cv.addEventListener("pointermove", e => { if (down) point(e); });
    cv.addEventListener("pointerup", () => { down = false; });
    cv.addEventListener("pointercancel", () => { down = false; });
    el.querySelector("#gPow").addEventListener("input", e => { power = e.target.value / 100; });
    el.querySelector("#gShoot").addEventListener("click", onMain);
    el.querySelector("#gPause").addEventListener("click", () => setPause(true));
    el.addEventListener("click", e => {
      const a = e.target.dataset.g; if (!a) return;
      if (a === "resume") setPause(false); else if (a === "restart") start(); else if (a === "menu") close();
    });
    document.addEventListener("keydown", e => { if (running && e.key === "Escape") setPause(!paused); if (running && e.key === " ") onMain(); });
    window.addEventListener("resize", () => { if (running) layout(); });
    document.addEventListener("dmr:lang", () => { if (running) texts(); });
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const top = 64, bot = 76, aw = W - 16, ah = H - top - bot;
    const s = Math.min(aw / (T.W + 2 * RAIL), ah / (T.H + 2 * RAIL));
    S = { s: s * dpr, x: (W * dpr - T.W * s * dpr) / 2, y: (top * dpr + (ah * dpr - T.H * s * dpr) / 2), css: s };
  }

  function point(e) {
    const r = cv.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
    const px = ((e.clientX - r.left) * dpr - S.x) / S.s, py = ((e.clientY - r.top) * dpr - S.y) / S.s;
    if (shot || paused || st.over) return;
    const c = balls[0];
    if (placing) {
      const maxX = st.phase === "break" ? T.W * 0.25 : T.W - R;
      const x = Math.max(R, Math.min(maxX, px)), y = Math.max(R, Math.min(T.H - R, py));
      if (balls.every(b => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1)) { c.x = x; c.y = y; }
    } else aim = Math.atan2(py - c.y, px - c.x);
  }

  function start() {
    balls = P.rack(); st = Rl.newGame({ firstTurn: 0 }); shot = null; placing = false; aim = 0;
    lastHits = 0; lastPk = 0; setPause(false); el.querySelector("#gResult").classList.remove("on");
    texts(); hud(st.phase === "break" ? tx("break") : "");
  }

  function onMain() {
    if (!running || paused || st.over) return;
    if (placing) { placing = false; hud(""); return; }
    if (shot) return;
    shot = P.beginShot(balls, aim, power); lastHits = 0; lastPk = 0; beep(180, 0.08, 0.25);
  }

  function endShot() {
    balls = shot.balls; const ev = shot.ev; shot = null;
    st = Rl.applyShot(st, ev);
    if (st.rerack) { balls = P.rack(); st = Rl.newGame({ firstTurn: st.turn }); hud(tx("rerack")); return; }
    if (st.over) { result(); return; }
    const cue = balls[0];
    if (cue.pocketed || st.ballInHand) {
      cue.pocketed = false; cue.vx = cue.vy = 0;
      if (cue.x === undefined || st.lastFoul === "scratch") { cue.x = T.W * 0.25; cue.y = T.H / 2; }
      let tries = 0; while (balls.some(b => b.id !== 0 && !b.pocketed && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R + 1) && tries++ < 50) cue.y = (cue.y + 3 * R) % (T.H - 2 * R) + R;
      placing = st.ballInHand;
    }
    let m = tx(st.message === "again" ? "again_" : st.message);
    if (st.lastFoul) m = tx("foul") + " (" + tx(st.lastFoul) + ")";
    hud(m + (placing ? " \u00b7 " + tx("placeHint") : ""));
  }

  function name(i) { return tx(i ? "p2" : "p1"); }
  function result() {
    const w = st.winner, box = el.querySelector("#gResult");
    box.querySelector("h2").textContent = name(w) + " " + tx("wins");
    box.querySelector("p").textContent = tx(st.message);
    box.classList.add("on");
    const s = DMR.store.get("stats", { games: 0, p1wins: 0 }); s.games++; if (w === 0) s.p1wins++; DMR.store.set("stats", s);
    const h = DMR.store.get("history", []); h.unshift({ at: Date.now(), winner: w, how: st.message }); DMR.store.set("history", h.slice(0, 20));
    beep(520, 0.4, 0.2);
  }

  function setPause(v) {
    paused = v; if (el) el.querySelector("#gPauseBox").classList.toggle("on", v);
  }
  function texts() {
    el.querySelector("#gPowL").textContent = tx("power");
    el.querySelector("#gPause").textContent = "II";
    el.querySelector("#gPauseBox h2").textContent = tx("pause");
    const b = el.querySelectorAll("#gPauseBox [data-g]"), k = ["resume", "restart", "menu"];
    b.forEach((x, i) => { x.textContent = tx(k[i]); });
    const r = el.querySelectorAll("#gResult [data-g]"); r[0].textContent = tx("again"); r[1].textContent = tx("menu");
    hud();
  }
  function hud(msg) {
    if (msg !== undefined) el.querySelector("#gMsg").textContent = msg;
    el.querySelector("#gShoot").textContent = placing ? tx("place") : tx("shoot");
    [0, 1].forEach(i => {
      const gr = st.groups[i], rem = gr ? Rl.remaining(st, gr).length : null;
      const p = el.querySelector("#gp" + i);
      p.innerHTML = "<b>" + name(i) + "</b><small>" + (gr ? tx(gr) + " \u00b7 " + rem : tx("open")) + "</small>";
      p.classList.toggle("act", st.turn === i && !st.over);
    });
  }

  /* ---------- dibujo ---------- */
  function ball(b) {
    const x = S.x + b.x * S.s, y = S.y + b.y * S.s, r = R * S.s;
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const id = b.id, base = id === 0 ? COL[0] : COL[id > 8 ? id - 8 : id];
    g.fillStyle = id > 8 ? "#f4f4f0" : base; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    if (id > 8) { g.fillStyle = base; g.fillRect(x - r, y - r * 0.55, 2 * r, r * 1.1); }
    if (id > 0) {
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r * 0.45, 0, 7); g.fill();
      g.fillStyle = "#111"; g.font = "bold " + Math.round(r * 0.7) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(id, x, y + 1);
    }
    const gl = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.1, x, y, r);
    gl.addColorStop(0, "rgba(255,255,255,.55)"); gl.addColorStop(0.5, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.35)");
    g.fillStyle = gl; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  }

  function draw() {
    g.clearRect(0, 0, cv.width, cv.height);
    const s = S.s, x0 = S.x - RAIL * s, y0 = S.y - RAIL * s, w = (T.W + 2 * RAIL) * s, h = (T.H + 2 * RAIL) * s;
    g.fillStyle = "#2a1a0c"; g.strokeStyle = "#f5c04a"; g.lineWidth = 3 * (window.devicePixelRatio || 1);
    g.beginPath(); g.roundRect(x0, y0, w, h, 26 * s); g.fill(); g.stroke();
    g.fillStyle = "#1456b8"; g.fillRect(S.x, S.y, T.W * s, T.H * s);
    g.fillStyle = "#000";
    P.POCKETS.forEach(p => { g.beginPath(); g.arc(S.x + p.x * s, S.y + p.y * s, p.r * 0.85 * s, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.15)"; g.lineWidth = 1; g.beginPath(); g.moveTo(S.x + T.W * 0.25 * s, S.y); g.lineTo(S.x + T.W * 0.25 * s, S.y + T.H * s); g.stroke();
    const c = balls[0];
    if (!shot && !placing && !st.over) guide(c);
    balls.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) { g.strokeStyle = "#f5c04a"; g.lineWidth = 3; g.beginPath(); g.arc(S.x + c.x * s, S.y + c.y * s, R * s * 1.5, 0, 7); g.stroke(); }
  }

  function guide(c) {
    const s = S.s, dx = Math.cos(aim), dy = Math.sin(aim);
    let t = 1e9;
    [[1, 0, R, T.W - R], [0, 1, R, T.H - R]].forEach(([ax, ay, lo, hi]) => {
      const v = ax ? dx : dy, p = ax ? c.x : c.y;
      if (v > 1e-9) t = Math.min(t, (hi - p) / v); else if (v < -1e-9) t = Math.min(t, (lo - p) / v);
    });
    balls.forEach(b => {
      if (b.id === 0 || b.pocketed) return;
      const fx = b.x - c.x, fy = b.y - c.y, pr = fx * dx + fy * dy; if (pr <= 0) return;
      const d2 = fx * fx + fy * fy - pr * pr, m = 2 * R; if (d2 > m * m) return;
      t = Math.min(t, pr - Math.sqrt(m * m - d2));
    });
    const ex = c.x + dx * t, ey = c.y + dy * t;
    g.setLineDash([10, 8]); g.strokeStyle = "rgba(255,255,255,.7)"; g.lineWidth = 2;
    g.beginPath(); g.moveTo(S.x + c.x * s, S.y + c.y * s); g.lineTo(S.x + ex * s, S.y + ey * s); g.stroke(); g.setLineDash([]);
    g.beginPath(); g.arc(S.x + ex * s, S.y + ey * s, R * s, 0, 7); g.stroke();
    const back = R + 14 + power * 260, len = 1100, wd = 11 * s;
    g.save(); g.translate(S.x + c.x * s, S.y + c.y * s); g.rotate(aim);
    const gr = g.createLinearGradient(0, 0, 0, 0); void gr;
    g.fillStyle = "#e9c66a"; g.fillRect(-(back + len) * s, -wd / 2, len * s, wd);
    g.fillStyle = "#5ab4ff"; g.fillRect(-(back + 14) * s, -wd / 2, 14 * s, wd);
    g.restore();
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (shot && !paused) {
      P.advance(shot, dt);
      if (shot.ev.hits > lastHits) { beep(300 + Math.random() * 120, 0.05, 0.12); lastHits = shot.ev.hits; }
      if (shot.ev.pocketed.length > lastPk) { beep(110, 0.25, 0.25); lastPk = shot.ev.pocketed.length; }
      if (shot.done) endShot();
    }
    if (shot) { const f = shot; const saved = balls; balls = f.balls; draw(); balls = saved; } else draw();
    requestAnimationFrame(frame);
  }

  function open() {
    if (!el) build();
    el.classList.add("on"); running = true; layout(); start();
    last = performance.now(); requestAnimationFrame(frame);
  }
  function close() { running = false; shot = null; if (el) { el.classList.remove("on"); setPause(false); } }

  DMR.game = { open, close, isOpen: () => running };
})();
