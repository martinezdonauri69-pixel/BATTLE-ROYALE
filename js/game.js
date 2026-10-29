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









/* Pantalla de juego (dibujo y controles). F\u00edsica y reglas: js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules;
  if (!P || !Rl) {
    DMR.game = { open() { alert("Falta cargar js/engine/physics.js o js/engine/rules.js (physics:" + !!P + " rules:" + !!Rl + ")"); }, close() {}, isOpen: () => false };
    return;
  }
  const T = P.T, R = T.R, RAIL = 90, M = { l: 66, r: 10, t: 66, b: 66 };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];
  const MSG = { break: "Saque: ajusta, apunta y tira", again: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano", rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo",
    win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo", scratch: "blanca embocada", noContact: "no tocaste ninguna bola",
    wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal" };
  const NAMES = ["Jugador 1", "Jugador 2"];

  let el, cv, g, S, balls, st, shot, strike, aim = 0, power = 0, spin = { x: 0, y: 0 };
  let placing = false, blocked = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0, msg = "";
  const opt = { sound: DMR.store.get("sound", true) !== false, traj: DMR.store.get("traj", true) !== false, lowq: DMR.store.get("lowq", false) === true };
  const save = () => { DMR.store.set("sound", opt.sound); DMR.store.set("traj", opt.traj); DMR.store.set("lowq", opt.lowq); };
  const $ = s => el.querySelector(s);

  let ac;
  function beep(f, d, v) {
    if (!opt.sound) return;
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
    el.innerHTML = '<canvas id="gc"></canvas><button id="gMenu" class="gx">\u2630</button>' +
      '<div id="gp0" class="gx gp" style="left:66px;right:calc(50% + 88px)"></div><div id="gTurn" class="gx"></div>' +
      '<div id="gp1" class="gx gp r" style="left:calc(50% + 88px);right:66px"></div>' +
      '<div id="gSpin" class="gx"><i></i></div>' +
      '<div id="gPow" class="gx"><b></b><span style="top:2px">MIN</span><span style="bottom:2px">MAX</span></div>' +
      '<div id="gBot" class="gx"><button data-b="set"><em>\u2699</em>Ajustes</button><button data-b="traj"><em>\u25ce</em>Vista de trayectoria</button><button data-b="cue"><em>\u2571\u2572</em>Tacos</button></div>' +
      '<button id="gPlace" class="gx">COLOCAR BOLA</button><div id="gBox" class="gov"><div class="gcard"></div></div>';
    document.body.append(el);
    cv = $("#gc"); g = cv.getContext("2d");
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); point(e); });
    cv.addEventListener("pointermove", e => { if (down) point(e); });
    cv.addEventListener("pointerup", () => { down = false; });
    cv.addEventListener("pointercancel", () => { down = false; });
    const pw = $("#gPow");
    const setP = e => { const r = pw.getBoundingClientRect(); power = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); $("#gPow b").style.top = power * 100 + "%"; };
    pw.addEventListener("pointerdown", e => { if (!canShoot()) return; pw.setPointerCapture(e.pointerId); pw._d = true; setP(e); });
    pw.addEventListener("pointermove", e => { if (pw._d) setP(e); });
    const rel = () => { if (!pw._d) return; pw._d = false; const p = power; power = 0; $("#gPow b").style.top = "0%"; if (p > 0.04) fire(p); };
    pw.addEventListener("pointerup", rel); pw.addEventListener("pointercancel", rel);
    const sp = $("#gSpin"), setS = e => {
      const r = sp.getBoundingClientRect(); let x = (e.clientX - r.left - r.width / 2) / 19, y = (e.clientY - r.top - r.height / 2) / 19;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } spin = { x, y };
      sp.firstChild.style.left = 19 + x * 19 + "px"; sp.firstChild.style.top = 19 + y * 19 + "px";
    };
    sp.addEventListener("pointerdown", e => { sp.setPointerCapture(e.pointerId); sp._d = true; setS(e); });
    sp.addEventListener("pointermove", e => { if (sp._d) setS(e); });
    sp.addEventListener("pointerup", () => { sp._d = false; });
    $("#gMenu").addEventListener("click", menu);
    $("#gPlace").addEventListener("click", () => { placing = false; hud(); });
    $("#gBot").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.b === "set") settings(); else if (b.dataset.b === "cue") cues(); else { opt.traj = !opt.traj; save(); hud(); }
    });
    document.addEventListener("keydown", e => { if (running && e.key === "Escape") blocked ? hideBox() : menu(); });
    window.addEventListener("resize", () => { if (running) layout(); });
  }

  function showBox(title, items) {
    const c = $("#gBox .gcard"); c.replaceChildren();
    const h = document.createElement("h2"); h.textContent = title; c.append(h);
    items.forEach(it => {
      if (typeof it === "string") { const p = document.createElement("p"); p.textContent = it; c.append(p); return; }
      const b = document.createElement("button"); b.className = "gb" + (it[2] ? " gold" : ""); b.textContent = it[0]; b.addEventListener("click", it[1]); c.append(b);
    });
    $("#gBox").classList.add("on"); blocked = true;
  }
  function hideBox() { $("#gBox").classList.remove("on"); blocked = false; }
  function menu() {
    showBox("Men\u00fa", [["Reanudar partida", hideBox, true], ["Ajustes", settings], ["Ayuda y controles", help],
      ["Volver al men\u00fa principal", () => showBox("\u00bfSalir de la partida?", ["Se perder\u00e1 la partida en curso.", ["Salir", close, true], ["Cancelar", menu]])]]);
  }
  function settings() {
    showBox("Ajustes", [["Sonido: " + (opt.sound ? "S\u00ed" : "No"), () => { opt.sound = !opt.sound; save(); settings(); }],
      ["Calidad gr\u00e1fica: " + (opt.lowq ? "Baja" : "Alta"), () => { opt.lowq = !opt.lowq; save(); settings(); }],
      "Volumen, vibraci\u00f3n y sensibilidad: pendientes de implementar.", ["Cerrar", hideBox, true]]);
  }
  function help() {
    showBox("Ayuda y controles", ["Arrastra sobre la mesa para apuntar.", "Arrastra la barra de potencia hacia abajo y su\u00e9ltala para tirar.",
      "El c\u00edrculo de arriba a la derecha mueve el punto de golpe de la blanca (efecto).", "Emboca tu grupo y por \u00faltimo la bola 8.", ["Cerrar", hideBox, true]]);
  }
  function cues() {
    showBox("Tacos", ["DMR Classic \u00b7 equipado", "A\u00fan no hay inventario ni tienda de tacos: los dem\u00e1s dise\u00f1os llegan con ese sistema.", ["Cerrar", hideBox, true]]);
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const aw = W - M.l - M.r, ah = H - M.t - M.b, s = Math.min(aw / (T.W + 2 * RAIL), ah / (T.H + 2 * RAIL));
    S = { s: s * dpr, x: (M.l + (aw - T.W * s) / 2) * dpr, y: (M.t + (ah - T.H * s) / 2) * dpr, dpr };
  }

  function point(e) {
    const r = cv.getBoundingClientRect();
    const px = ((e.clientX - r.left) * S.dpr - S.x) / S.s, py = ((e.clientY - r.top) * S.dpr - S.y) / S.s;
    if (blocked || shot || strike || st.over) return;
    const c = balls[0];
    if (placing) {
      const x = Math.max(R, Math.min(st.phase === "break" ? T.W * 0.25 : T.W - R, px)), y = Math.max(R, Math.min(T.H - R, py));
      if (balls.every(b => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1)) { c.x = x; c.y = y; }
    } else aim = Math.atan2(py - c.y, px - c.x);
  }

  function start() {
    balls = P.rack(); st = Rl.newGame({ firstTurn: 0 }); shot = null; strike = null; placing = false; aim = 0; power = 0;
    lastHits = 0; lastPk = 0; msg = MSG.break; hideBox(); hud();
  }
  const canShoot = () => running && !blocked && !shot && !strike && !placing && !st.over;
  function fire(p) { if (canShoot()) strike = { t: 0, pw: p, aim, spin: { x: spin.x, y: spin.y } }; }

  function endShot() {
    balls = shot.balls; const ev = shot.ev; shot = null;
    st = Rl.applyShot(st, ev);
    if (st.rerack) { balls = P.rack(); st = Rl.newGame({ firstTurn: st.turn }); msg = MSG.rerack; hud(); return; }
    if (st.over) { result(); return; }
    const cue = balls[0];
    if (cue.pocketed || st.ballInHand) {
      if (cue.pocketed) { cue.pocketed = false; cue.x = T.W * 0.25; cue.y = T.H / 2; }
      cue.vx = cue.vy = 0;
      let k = 0; while (balls.some(b => b.id !== 0 && !b.pocketed && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R + 1) && k++ < 50) cue.y = (cue.y + 3 * R) % (T.H - 2 * R) + R;
      placing = st.ballInHand;
    }
    msg = st.lastFoul ? MSG.foul + " (" + MSG[st.lastFoul] + ")" : MSG[st.message] || "";
    hud();
  }

  function result() {
    const w = st.winner;
    const s = DMR.store.get("stats", { games: 0, p1wins: 0 }); s.games++; if (w === 0) s.p1wins++; DMR.store.set("stats", s);
    const h = DMR.store.get("history", []); h.unshift({ at: Date.now(), winner: w, how: st.message }); DMR.store.set("history", h.slice(0, 20));
    beep(520, 0.4, 0.2); hud();
    showBox(NAMES[w] + " gana", [MSG[st.message] || "", ["Revancha", start, true], ["Men\u00fa principal", close]]);
  }

  function ballIcon(id, out) {
    const i = document.createElement("i"), c = COL[id > 8 ? id - 8 : id];
    i.style.background = id > 8 ? "linear-gradient(#fff 28%," + c + " 28% 72%,#fff 72%)" : c;
    i.style.color = id > 8 ? "#000" : "#fff"; i.textContent = id; if (out) i.className = "out"; return i;
  }
  function hud() {
    $("#gTurn").innerHTML = "<span>\u265b</span> Turno de " + NAMES[st.turn] + "<small></small>";
    $("#gTurn small").textContent = placing ? "Arrastra la blanca y pulsa COLOCAR" : msg;
    [0, 1].forEach(i => {
      const p = $("#gp" + i), gr = st.groups[i];
      p.innerHTML = '<img src="assets/avatar.svg" alt=""><div><b></b><small></small><div class="bl"></div></div>';
      p.querySelector("b").textContent = NAMES[i];
      p.querySelector("small").textContent = gr ? (gr === "solids" ? "Lisas" : "Rayadas") : "Mesa abierta";
      if (gr) (gr === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).forEach(id => p.querySelector(".bl").append(ballIcon(id, st.pocketed.indexOf(id) >= 0)));
      p.classList.toggle("act", st.turn === i && !st.over);
    });
    $("#gPlace").style.display = placing && !blocked ? "block" : "none";
    $("#gBot [data-b=traj]").classList.toggle("on", opt.traj);
  }

  /* ---------- dibujo ---------- */
  const X = x => S.x + x * S.s, Y = y => S.y + y * S.s;
  function ball(b) {
    const x = X(b.x), y = Y(b.y), r = R * S.s;
    if (!opt.lowq) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.35, r, r * 0.9, 0, 0, 7); g.fill(); }
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const id = b.id, base = id === 0 ? COL[0] : COL[id > 8 ? id - 8 : id];
    g.fillStyle = id > 8 ? "#f4f4f0" : base; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    if (id > 8) { g.fillStyle = base; g.fillRect(x - r, y - r * 0.55, 2 * r, r * 1.1); }
    if (id > 0) {
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r * 0.45, 0, 7); g.fill();
      g.fillStyle = "#111"; g.font = "bold " + Math.round(r * 0.7) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(id, x, y + 1);
    }
    const gl = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.05, x, y, r);
    gl.addColorStop(0, "rgba(255,255,255,.7)"); gl.addColorStop(0.35, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.4)");
    g.fillStyle = gl; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  }

  function table() {
    const s = S.s, x0 = X(-RAIL), y0 = Y(-RAIL), w = (T.W + 2 * RAIL) * s, h = (T.H + 2 * RAIL) * s;
    let f = g.createLinearGradient(0, y0, 0, y0 + h); f.addColorStop(0, "#2b3450"); f.addColorStop(0.5, "#111827"); f.addColorStop(1, "#1a2238");
    g.fillStyle = f; g.strokeStyle = "#2b6cff"; g.lineWidth = 3 * S.dpr;
    if (!opt.lowq) { g.shadowColor = "#2b6cff"; g.shadowBlur = 18 * S.dpr; }
    g.beginPath(); g.roundRect(x0, y0, w, h, 30 * s); g.fill(); g.stroke(); g.shadowBlur = 0;
    const cu = 42 * s; g.fillStyle = "#0b2a66"; g.fillRect(X(0) - cu, Y(0) - cu, T.W * s + 2 * cu, T.H * s + 2 * cu);
    f = g.createRadialGradient(X(T.W / 2), Y(T.H / 2), 50 * s, X(T.W / 2), Y(T.H / 2), T.W * 0.6 * s); f.addColorStop(0, "#1b6fe8"); f.addColorStop(1, "#0a3a94");
    g.fillStyle = f; g.fillRect(X(0), Y(0), T.W * s, T.H * s);
    g.fillStyle = "rgba(255,255,255,.12)"; [0.25, 0.75].forEach(k => { g.beginPath(); g.arc(X(T.W * k), Y(T.H / 2), 5 * s, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(T.W * 0.25), Y(0)); g.lineTo(X(T.W * 0.25), Y(T.H)); g.stroke();
    for (let i = 1; i < 14; i++) {                       // luces de las bandas
      const k = T.W * i / 14; g.fillStyle = i % 2 ? "#3c8cff" : "#ff4b4b";
      [Y(-RAIL * 0.55), Y(T.H + RAIL * 0.55)].forEach(yy => { g.beginPath(); g.arc(X(k), yy, 4 * s, 0, 7); g.fill(); });
    }
    P.POCKETS.forEach(p => {
      const r = p.r * 0.95 * s, c = g.createRadialGradient(X(p.x), Y(p.y), r * 0.1, X(p.x), Y(p.y), r);
      c.addColorStop(0, "#000"); c.addColorStop(0.8, "#05070d"); c.addColorStop(1, "#8a97b5");
      g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Y(p.y), r, 0, 7); g.fill();
    });
  }

  function guide(c) {
    const s = S.s, dx = Math.cos(aim), dy = Math.sin(aim);
    let t = 1e9, hit = null;
    [[1, 0, R, T.W - R], [0, 1, R, T.H - R]].forEach(([ax, , lo, hi]) => {
      const v = ax ? dx : dy, p = ax ? c.x : c.y;
      if (v > 1e-9) t = Math.min(t, (hi - p) / v); else if (v < -1e-9) t = Math.min(t, (lo - p) / v);
    });
    balls.forEach(b => {
      if (b.id === 0 || b.pocketed) return;
      const fx = b.x - c.x, fy = b.y - c.y, pr = fx * dx + fy * dy; if (pr <= 0) return;
      const d2 = fx * fx + fy * fy - pr * pr, m = 2 * R; if (d2 > m * m) return;
      const tt = pr - Math.sqrt(m * m - d2); if (tt < t) { t = tt; hit = b; }
    });
    const line = (x1, y1, x2, y2, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w * S.dpr; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.stroke(); g.setLineDash([]); };
    const len = opt.traj ? t : Math.min(t, 300);
    const ex = c.x + dx * len, ey = c.y + dy * len;
    line(c.x, c.y, ex, ey, "rgba(255,255,255,.9)", 1.6);
    if (!hit) {                                          // punta de flecha en el extremo
      const a = 55 * s / S.dpr * 0.0 + 38; g.fillStyle = "#fff"; g.beginPath();
      g.moveTo(X(ex), Y(ey)); g.lineTo(X(ex - dx * a + dy * a * 0.4), Y(ey - dy * a - dx * a * 0.4)); g.lineTo(X(ex - dx * a - dy * a * 0.4), Y(ey - dy * a + dx * a * 0.4)); g.fill();
    }
    if (opt.traj && hit) {
      let nx = hit.x - ex, ny = hit.y - ey; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5 * S.dpr; g.beginPath(); g.arc(X(ex), Y(ey), R * s, 0, 7); g.stroke();
      line(hit.x, hit.y, hit.x + nx * 260, hit.y + ny * 260, "#ff6b6b", 1.4, [8, 6]);                    // bola objetivo
      let tx = dx - (dx * nx + dy * ny) * nx, ty = dy - (dx * nx + dy * ny) * ny; const tl = Math.hypot(tx, ty);
      if (tl > 0.05) line(ex, ey, ex + tx / tl * 220, ey + ty / tl * 220, "#ffd25a", 1.4, [3, 6]);       // continuaci\u00f3n de la blanca
    }
  }

  function stick(c, back) {
    const s = S.s, len = 1150;
    g.save(); g.translate(X(c.x), Y(c.y)); g.rotate(aim);
    const w = 12 * s, x0 = -(back + len) * s;
    const gr = g.createLinearGradient(0, -w / 2, 0, w / 2); gr.addColorStop(0, "#6a4326"); gr.addColorStop(0.5, "#241409"); gr.addColorStop(1, "#6a4326");
    g.fillStyle = gr; g.fillRect(x0, -w / 2, len * s, w);
    g.fillStyle = "#b8c4de"; g.fillRect(x0 + len * s * 0.62, -w / 2, 22 * s, w);
    g.fillStyle = "#2b6cff"; g.fillRect(-(back + 14) * s, -w * 0.35, 14 * s, w * 0.7);
    g.restore();
  }

  function draw(B) {
    g.clearRect(0, 0, cv.width, cv.height);
    table();
    const c = B[0];
    if (!shot && !strike && !placing && !st.over && !blocked) guide(c);
    B.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) { g.strokeStyle = "#ffd25a"; g.lineWidth = 3; g.beginPath(); g.arc(X(c.x), Y(c.y), R * S.s * 1.6, 0, 7); g.stroke(); }
    if (!shot && !placing && !st.over && !c.pocketed) {
      if (strike) { const k = Math.min(1, strike.t / 0.14); stick(c, R + 12 + strike.pw * 240 * (1 - k * k)); }
      else stick(c, R + 12 + power * 240);
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (strike && !blocked) {
      strike.t += dt;
      if (strike.t >= 0.14) { shot = P.beginShot(balls, strike.aim, strike.pw, strike.spin); strike = null; lastHits = 0; lastPk = 0; beep(180, 0.08, 0.25); }
    }
    if (shot && !blocked) {
      P.advance(shot, dt);
      if (shot.ev.hits > lastHits) { beep(300 + Math.random() * 120, 0.05, 0.12); lastHits = shot.ev.hits; }
      if (shot.ev.pocketed.length > lastPk) { beep(110, 0.25, 0.25); lastPk = shot.ev.pocketed.length; }
      if (shot.done) endShot();
    }
    draw(shot ? shot.balls : balls);
    requestAnimationFrame(frame);
  }

  function open() {
    if (!el) build();
    el.classList.add("on"); running = true; layout(); start();
    last = performance.now(); requestAnimationFrame(frame);
  }
  function close() { running = false; shot = null; strike = null; if (el) { hideBox(); el.classList.remove("on"); } }
  DMR.game = { open, close, isOpen: () => running };
})();




/* Pantalla de juego (dibujo y controles). F\u00edsica y reglas: js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules;
  if (!P || !Rl) {
    DMR.game = { open() { alert("Falta cargar js/engine/physics.js o js/engine/rules.js (physics:" + !!P + " rules:" + !!Rl + ")"); }, close() {}, isOpen: () => false };
    return;
  }
  const T = P.T, R = T.R, RAIL = 70, M = { l: 84, r: 10, t: 70, b: 10 };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];
  const MSG = { break: "Saque: ajusta, apunta y tira", again: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano", rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo",
    win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo", scratch: "blanca embocada", noContact: "no tocaste ninguna bola",
    wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal" };
  const NAMES = ["Jugador 1", "Jugador 2"];

  let el, cv, g, S, balls, st, shot, strike, aim = 0, power = 0, spin = { x: 0, y: 0 };
  let dragBall = false, placing = false, blocked = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0, msg = "";
  const opt = { sound: DMR.store.get("sound", true) !== false, traj: DMR.store.get("traj", true) !== false, lowq: DMR.store.get("lowq", false) === true };
  const save = () => { DMR.store.set("sound", opt.sound); DMR.store.set("traj", opt.traj); DMR.store.set("lowq", opt.lowq); };
  const $ = s => el.querySelector(s);

  let ac;
  function beep(f, d, v) {
    if (!opt.sound) return;
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
    el.innerHTML = '<canvas id="gc"></canvas><button id="gMenu" class="gx">\u2630</button>' +
      '<div id="gp0" class="gx gp" style="left:66px;right:calc(50% + 88px)"></div><div id="gTurn" class="gx"></div>' +
      '<div id="gp1" class="gx gp r" style="left:calc(50% + 88px);right:66px"></div>' +
      '<div id="gSpin" class="gx"><i></i></div>' +
      '<div id="gPow" class="gx"><b></b><span style="top:2px">MIN</span><span style="bottom:2px">MAX</span></div>' +
      '<div id="gBot" class="gx"><button data-b="set"><em>\u2699</em>Ajustes</button><button data-b="traj"><em>\u25ce</em>Vista de trayectoria</button><button data-b="cue"><em>\u2573</em>Tacos</button></div>' +
      '<div id="gBox" class="gov"><div class="gcard"></div></div>';
    document.body.append(el);
    cv = $("#gc"); g = cv.getContext("2d");
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); point(e); });
    cv.addEventListener("pointermove", e => { if (down) point(e); });
    cv.addEventListener("pointerup", () => { down = false; dragBall = false; });
    cv.addEventListener("pointercancel", () => { down = false; });
    const pw = $("#gPow");
    const setP = e => { const r = pw.getBoundingClientRect(); power = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); $("#gPow b").style.top = power * 100 + "%"; };
    pw.addEventListener("pointerdown", e => { if (!canShoot()) return; pw.setPointerCapture(e.pointerId); pw._d = true; setP(e); });
    pw.addEventListener("pointermove", e => { if (pw._d) setP(e); });
    const rel = () => { if (!pw._d) return; pw._d = false; const p = power; power = 0; $("#gPow b").style.top = "0%"; if (p > 0.04) fire(p); };
    pw.addEventListener("pointerup", rel); pw.addEventListener("pointercancel", rel);
    const sp = $("#gSpin"), setS = e => {
      const r = sp.getBoundingClientRect(), rr = r.width / 2 - 10; let x = (e.clientX - r.left - r.width / 2) / rr, y = (e.clientY - r.top - r.height / 2) / rr;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } spin = { x, y };
      sp.firstChild.style.transform = "translate(" + x * rr + "px," + y * rr + "px)";
    };
    sp.addEventListener("pointerdown", e => { sp.setPointerCapture(e.pointerId); sp._d = true; setS(e); });
    sp.addEventListener("pointermove", e => { if (sp._d) setS(e); });
    sp.addEventListener("pointerup", () => { sp._d = false; });
    $("#gMenu").addEventListener("click", menu);
    $("#gBot").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.b === "set") settings(); else if (b.dataset.b === "cue") cues(); else { opt.traj = !opt.traj; save(); hud(); }
    });
    document.addEventListener("keydown", e => { if (running && e.key === "Escape") blocked ? hideBox() : menu(); });
    window.addEventListener("resize", () => { if (running) layout(); });
  }

  function showBox(title, items) {
    const c = $("#gBox .gcard"); c.replaceChildren();
    const h = document.createElement("h2"); h.textContent = title; c.append(h);
    items.forEach(it => {
      if (it.row) { const d = document.createElement("div"); d.className = "row"; d.innerHTML = "<span></span><b></b>"; d.firstChild.textContent = it.row; d.lastChild.textContent = it.val; d.addEventListener("click", it.fn); c.append(d); return; }
      if (typeof it === "string") { const p = document.createElement("p"); p.textContent = it; c.append(p); return; }
      const b = document.createElement("button"); b.className = "gb" + (it[2] ? " gold" : ""); b.textContent = it[0]; b.addEventListener("click", it[1]); c.append(b);
    });
    $("#gBox").classList.add("on"); blocked = true;
  }
  function hideBox() { $("#gBox").classList.remove("on"); blocked = false; }
  function menu() {
    showBox("Men\u00fa", [["Reanudar partida", hideBox, true], ["Ajustes", settings], ["Ayuda y controles", help],
      ["Volver al men\u00fa principal", () => showBox("\u00bfSalir de la partida?", ["Se perder\u00e1 la partida en curso.", ["Salir", close, true], ["Cancelar", menu]])]]);
  }
  function settings() {
    showBox("Ajustes", [{ row: "Sonido", val: opt.sound ? "S\u00cd" : "NO", fn: () => { opt.sound = !opt.sound; save(); settings(); } },
      { row: "Calidad gr\u00e1fica", val: opt.lowq ? "BAJA" : "ALTA", fn: () => { opt.lowq = !opt.lowq; save(); settings(); } },
      "Volumen, vibraci\u00f3n y sensibilidad: pendientes de implementar.", ["Cerrar", hideBox, true]]);
  }
  function help() {
    showBox("Ayuda y controles", ["Arrastra sobre la mesa para apuntar.", "Arrastra la barra de potencia hacia abajo y su\u00e9ltala para tirar.",
      "El c\u00edrculo de arriba a la derecha mueve el punto de golpe de la blanca (efecto).", "Emboca tu grupo y por \u00faltimo la bola 8.", ["Cerrar", hideBox, true]]);
  }
  const CUES = [
    { id: "classic", name: "DMR Classic", rar: "Com\u00fan", p: 5, a: 5, e: 5, price: 0, cur: "coins", c: ["#3a2412", "#b98a52"], glow: "#c9a15a", desc: "Taco inicial gratuito." },
    { id: "cyber", name: "Cyber Blue", rar: "\u00c9pico", p: 8, a: 9, e: 7, price: 8000, cur: "coins", c: ["#0a1f55", "#2d8cff"], glow: "#38b6ff", desc: "Tecnolog\u00eda y estilo en cada golpe." },
    { id: "inferno", name: "Inferno", rar: "\u00c9pico", p: 9, a: 8, e: 7, price: 8000, cur: "coins", c: ["#2a0707", "#ff3b2f"], glow: "#ff5a3c", desc: "Potencia ardiente." },
    { id: "dragon", name: "Drag\u00f3n", rar: "Legendario", p: 10, a: 9, e: 8, price: 15000, cur: "gems", c: ["#1a1206", "#f5c04a"], glow: "#ffd25a", desc: "Fuerza y elegancia dorada." },
    { id: "hielo", name: "Hielo", rar: "\u00c9pico", p: 8, a: 9, e: 8, ctl: 1, price: 8000, cur: "coins", c: ["#0b3a5c", "#9ee7ff"], glow: "#bff3ff", desc: "Control mejorado de la bola blanca." },
    { id: "nebulosa", name: "Nebulosa", rar: "Raro", p: 7, a: 8, e: 9, price: 5000, cur: "coins", c: ["#2a0b5c", "#c36bff"], glow: "#d08cff", desc: "El mejor efecto del cat\u00e1logo normal." },
    { id: "legendario", name: "Legendario", rar: "Legendario", p: 10, a: 10, e: 10, price: 20000, cur: "gems", c: ["#3a2a06", "#ffe28a"], glow: "#fff1b0", desc: "Lo m\u00e1ximo en todo." },
    { id: "vandalo", name: "V\u00e1ndalo", rar: "Raro", p: 7, a: 8, e: 7, price: 5000, cur: "coins", c: ["#2a0505", "#e8453c"], glow: "#ff6b6b", desc: "Estilo callejero y agresivo." },
    { id: "sombrio", name: "Sombr\u00edo", rar: "Com\u00fan", p: 6, a: 7, e: 6, price: 2500, cur: "coins", c: ["#05060c", "#5a4a8a"], glow: "#8a7ad0", desc: "Discreto y fiable." }
  ];
  const cst = () => Object.assign({ owned: ["classic"], equipped: "classic", coins: 10000, gems: 25000 }, DMR.store.get("cues", {}));
  const curCue = () => CUES.find(c => c.id === cst().equipped) || CUES[0];
  function drawCue(c2, w, h, k, rot) {
    const gr = c2.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, k.c[0]); gr.addColorStop(1, k.c[1]);
    c2.shadowColor = k.glow; c2.shadowBlur = 12; c2.fillStyle = gr; c2.fillRect(0, 0, w, h); c2.shadowBlur = 0;
    for (let i = 0; i < 7; i++) { const x = (((i / 7) + rot / 6.283) % 1) * w; c2.fillStyle = k.glow; c2.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(rot + i)); c2.fillRect(x, 0, w * 0.025, h); }
    c2.globalAlpha = 1; c2.fillStyle = "#c8d2ea"; c2.fillRect(w * 0.78, 0, w * 0.03, h); c2.fillStyle = "#111"; c2.fillRect(w * 0.9, 0, w * 0.1, h);
  }
  function cues() {
    const sh = document.createElement("div"); sh.id = "gShop"; sh.className = "gov on";
    sh.innerHTML = '<div class="shop"><header><button class="gb" id="sX">\u2190</button><h2>TIENDA DE TACOS</h2><span id="sBal"></span></header><div class="sb"><div id="sGrid"></div><div id="sDet"></div></div><small>Econom\u00eda de prueba local: monedas y gemas de prueba, no son compras reales.</small></div>';
    el.append(sh); blocked = true;
    let sel = cst().equipped, rot = 0, drag = null, alive = true;
    const close2 = () => { alive = false; sh.remove(); hideBox(); hud(); };
    sh.querySelector("#sX").addEventListener("click", close2);
    const bars = k => [["Potencia", k.p, "fuerza m\u00e1x. " + Math.round((0.80 + 0.02 * k.p) * 100) + "%"], ["Precisi\u00f3n", k.a, "desv\u00edo -" + Math.round(k.a * 10 * (k.ctl ? 1.25 : 1)) + "%"], ["Efecto", k.e, "giro " + Math.round((0.5 + 0.1 * k.e) * 100) + "%"]]
      .map(b => '<div class="st"><span>' + b[0] + '</span><b>' + b[1] + '/10</b><i style="width:' + b[1] * 10 + '%"></i><em>' + b[2] + '</em></div>').join("");
    function render() {
      const s = cst(), k = CUES.find(c => c.id === sel);
      sh.querySelector("#sBal").textContent = "\u25cf " + s.coins.toLocaleString() + "   \u25c6 " + s.gems.toLocaleString();
      sh.querySelector("#sGrid").innerHTML = CUES.map(c => '<div class="cc' + (c.id === sel ? " on" : "") + '" data-id="' + c.id + '"><div class="cb" style="background:linear-gradient(90deg,' + c.c[0] + ',' + c.c[1] + ');box-shadow:0 0 8px ' + c.glow + '"></div><b>' + c.name + '</b><u>' + c.rar + '</u><small>' + (s.equipped === c.id ? "EQUIPADO" : s.owned.includes(c.id) ? "TUYO" : (c.cur === "gems" ? "\u25c6 " : "\u25cf ") + c.price.toLocaleString()) + '</small></div>').join("");
      const own = s.owned.includes(k.id);
      sh.querySelector("#sDet").innerHTML = '<canvas id="sPrev" width="150" height="150"></canvas><h3>' + k.name + '</h3><u>' + k.rar + '</u><p>' + k.desc + '</p>' + bars(k) + '<button class="gb gold" id="sAct"' + (s.equipped === k.id ? " disabled" : "") + '>' + (s.equipped === k.id ? "Equipado" : own ? "Equipar" : "Comprar " + (k.cur === "gems" ? "\u25c6 " : "\u25cf ") + k.price.toLocaleString()) + '</button><small id="sMsg">Vista giratoria animada: arrastra para girar.</small>';
      sh.querySelector("#sAct").addEventListener("click", () => {
        const st2 = cst(), msg2 = sh.querySelector("#sMsg");
        if (st2.owned.includes(k.id)) { st2.equipped = k.id; csave(st2); render(); return; }
        if (st2[k.cur] < k.price) { msg2.textContent = "Saldo de prueba insuficiente."; return; }
        st2[k.cur] -= k.price; st2.owned.push(k.id); csave(st2); render();
      });
      const pv = sh.querySelector("#sPrev"); pv.addEventListener("pointerdown", e => { drag = e.clientX; pv.setPointerCapture(e.pointerId); });
      pv.addEventListener("pointermove", e => { if (drag !== null) { rot += (e.clientX - drag) * 0.03; drag = e.clientX; } });
      pv.addEventListener("pointerup", () => { drag = null; });
    }
    sh.querySelector("#sGrid").addEventListener("click", e => { const c = e.target.closest(".cc"); if (c) { sel = c.dataset.id; render(); } });
    render();
    (function loop() {
      if (!alive) return; const pv = sh.querySelector("#sPrev");
      if (pv) { const c2 = pv.getContext("2d"), k = CUES.find(c => c.id === sel); c2.clearRect(0, 0, 150, 150); c2.save(); c2.translate(10, 128); c2.rotate(-0.78); if (drag === null) rot += 0.02; drawCue(c2, 190, 10, k, rot); c2.restore(); }
      requestAnimationFrame(loop);
    })();
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const aw = W - M.l - M.r, ah = H - M.t - M.b, s = Math.min(aw / (T.W + 2 * RAIL), ah / (T.H + 2 * RAIL));
    const pw = $("#gPow"); pw.style.top = M.t + "px"; pw.style.height = Math.max(120, H - M.t - 84) + "px";
    S = { s: s * dpr, x: (M.l + (aw - T.W * s) / 2) * dpr, y: (M.t + (ah - T.H * s) / 2) * dpr, dpr };
  }

  function point(e) {
    const r = cv.getBoundingClientRect();
    const px = ((e.clientX - r.left) * S.dpr - S.x) / S.s, py = ((e.clientY - r.top) * S.dpr - S.y) / S.s;
    if (blocked || shot || strike || st.over) return;
    const c = balls[0];
    if (e.type === "pointerdown") dragBall = placing && Math.hypot(px - c.x, py - c.y) < 3.2 * R;
    if (dragBall) {
      const x = Math.max(R, Math.min(st.phase === "break" ? T.W * 0.25 : T.W - R, px)), y = Math.max(R, Math.min(T.H - R, py));
      if (balls.every(b => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1)) { c.x = x; c.y = y; }
    } else aim = Math.atan2(py - c.y, px - c.x);
  }

  function start() {
    balls = P.rack(); st = Rl.newGame({ firstTurn: 0 }); shot = null; strike = null; placing = false; aim = 0; power = 0;
    lastHits = 0; lastPk = 0; msg = MSG.break; hideBox(); hud();
  }
  const canShoot = () => running && !blocked && !shot && !strike && !st.over;
  function fire(p) {
    if (!canShoot()) return;
    const k = curCue(), dev = (1 - k.a / 10) * (k.ctl ? 0.75 : 1) * 0.012 * p * (Math.random() * 2 - 1), f = 0.5 + 0.1 * k.e;
    placing = false;
    strike = { t: 0, pw: Math.min(1, p * (0.80 + 0.02 * k.p)), aim: aim + dev, spin: { x: spin.x * f, y: spin.y * f } };
    hud();
  }

  function endShot() {
    balls = shot.balls; const ev = shot.ev; shot = null;
    st = Rl.applyShot(st, ev);
    if (st.rerack) { balls = P.rack(); st = Rl.newGame({ firstTurn: st.turn }); msg = MSG.rerack; hud(); return; }
    if (st.over) { result(); return; }
    const cue = balls[0];
    if (cue.pocketed || st.ballInHand) {
      if (cue.pocketed) { cue.pocketed = false; cue.x = T.W * 0.25; cue.y = T.H / 2; }
      cue.vx = cue.vy = 0;
      let k = 0; while (balls.some(b => b.id !== 0 && !b.pocketed && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R + 1) && k++ < 50) cue.y = (cue.y + 3 * R) % (T.H - 2 * R) + R;
      placing = st.ballInHand;
    }
    msg = st.lastFoul ? MSG.foul + " (" + MSG[st.lastFoul] + ")" : MSG[st.message] || "";
    hud();
  }

  function result() {
    const w = st.winner;
    const s = DMR.store.get("stats", { games: 0, p1wins: 0 }); s.games++; if (w === 0) s.p1wins++; DMR.store.set("stats", s);
    const h = DMR.store.get("history", []); h.unshift({ at: Date.now(), winner: w, how: st.message }); DMR.store.set("history", h.slice(0, 20));
    beep(520, 0.4, 0.2); hud();
    showBox(NAMES[w] + " gana", [MSG[st.message] || "", ["Revancha", start, true], ["Men\u00fa principal", close]]);
  }

  function ballIcon(id, out) {
    const i = document.createElement("i"), c = COL[id > 8 ? id - 8 : id];
    i.style.background = id > 8 ? "linear-gradient(#fff 28%," + c + " 28% 72%,#fff 72%)" : c;
    i.style.color = id > 8 ? "#000" : "#fff"; i.textContent = id; if (out) i.className = "out"; return i;
  }
  function hud() {
    $("#gTurn").innerHTML = "<span>\u265b</span> Turno de " + NAMES[st.turn] + "<small></small>";
    $("#gTurn small").textContent = placing ? "Mueve la blanca si quieres y tira" : msg;
    [0, 1].forEach(i => {
      const p = $("#gp" + i), gr = st.groups[i];
      p.innerHTML = '<img src="assets/avatar.svg" alt=""><div><b></b><small></small><div class="bl"></div></div>';
      p.querySelector("b").textContent = NAMES[i];
      p.querySelector("small").textContent = gr ? (gr === "solids" ? "Lisas" : "Rayadas") : "Mesa abierta";
      if (gr) (gr === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).forEach(id => p.querySelector(".bl").append(ballIcon(id, st.pocketed.indexOf(id) >= 0)));
      p.classList.toggle("act", st.turn === i && !st.over);
    });
    $("#gBot [data-b=traj]").classList.toggle("on", opt.traj);
  }

  /* ---------- dibujo ---------- */
  const X = x => S.x + x * S.s, Y = y => S.y + y * S.s;
  function ball(b) {
    const x = X(b.x), y = Y(b.y), r = R * S.s;
    if (!opt.lowq) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.35, r, r * 0.9, 0, 0, 7); g.fill(); }
    g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
    const id = b.id, base = id === 0 ? COL[0] : COL[id > 8 ? id - 8 : id];
    g.fillStyle = id > 8 ? "#f4f4f0" : base; g.fillRect(x - r, y - r, 2 * r, 2 * r);
    if (id > 8) { g.fillStyle = base; g.fillRect(x - r, y - r * 0.55, 2 * r, r * 1.1); }
    if (id > 0) {
      g.fillStyle = "#fff"; g.beginPath(); g.arc(x, y, r * 0.45, 0, 7); g.fill();
      g.fillStyle = "#111"; g.font = "bold " + Math.round(r * 0.7) + "px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(id, x, y + 1);
    }
    const gl = g.createRadialGradient(x - r * 0.4, y - r * 0.4, r * 0.05, x, y, r);
    gl.addColorStop(0, "rgba(255,255,255,.7)"); gl.addColorStop(0.35, "rgba(255,255,255,0)"); gl.addColorStop(1, "rgba(0,0,0,.4)");
    g.fillStyle = gl; g.fillRect(x - r, y - r, 2 * r, 2 * r); g.restore();
  }

  function table() {
    const s = S.s, x0 = X(-RAIL), y0 = Y(-RAIL), w = (T.W + 2 * RAIL) * s, h = (T.H + 2 * RAIL) * s;
    let f = g.createLinearGradient(0, y0, 0, y0 + h); f.addColorStop(0, "#2b3450"); f.addColorStop(0.5, "#111827"); f.addColorStop(1, "#1a2238");
    g.fillStyle = f; g.strokeStyle = "#2b6cff"; g.lineWidth = 3 * S.dpr;
    if (!opt.lowq) { g.shadowColor = "#2b6cff"; g.shadowBlur = 18 * S.dpr; }
    g.beginPath(); g.roundRect(x0, y0, w, h, 30 * s); g.fill(); g.stroke(); g.shadowBlur = 0;
    const cu = 42 * s; g.fillStyle = "#0b2a66"; g.fillRect(X(0) - cu, Y(0) - cu, T.W * s + 2 * cu, T.H * s + 2 * cu);
    f = g.createRadialGradient(X(T.W / 2), Y(T.H / 2), 50 * s, X(T.W / 2), Y(T.H / 2), T.W * 0.6 * s); f.addColorStop(0, "#1b6fe8"); f.addColorStop(1, "#0a3a94");
    g.fillStyle = f; g.fillRect(X(0), Y(0), T.W * s, T.H * s);
    g.fillStyle = "rgba(255,255,255,.12)"; [0.25, 0.75].forEach(k => { g.beginPath(); g.arc(X(T.W * k), Y(T.H / 2), 5 * s, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(T.W * 0.25), Y(0)); g.lineTo(X(T.W * 0.25), Y(T.H)); g.stroke();
    for (let i = 1; i < 14; i++) {                       // luces de las bandas
      const k = T.W * i / 14; g.fillStyle = i % 2 ? "#3c8cff" : "#ff4b4b";
      [Y(-RAIL * 0.55), Y(T.H + RAIL * 0.55)].forEach(yy => { g.beginPath(); g.arc(X(k), yy, 4 * s, 0, 7); g.fill(); });
    }
    P.POCKETS.forEach(p => {
      const r = p.r * 0.95 * s, c = g.createRadialGradient(X(p.x), Y(p.y), r * 0.1, X(p.x), Y(p.y), r);
      c.addColorStop(0, "#000"); c.addColorStop(0.8, "#05070d"); c.addColorStop(1, "#8a97b5");
      g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Y(p.y), r, 0, 7); g.fill();
    });
  }

  function guide(c) {
    const s = S.s, dx = Math.cos(aim), dy = Math.sin(aim);
    let t = 1e9, hit = null;
    [[1, 0, R, T.W - R], [0, 1, R, T.H - R]].forEach(([ax, , lo, hi]) => {
      const v = ax ? dx : dy, p = ax ? c.x : c.y;
      if (v > 1e-9) t = Math.min(t, (hi - p) / v); else if (v < -1e-9) t = Math.min(t, (lo - p) / v);
    });
    balls.forEach(b => {
      if (b.id === 0 || b.pocketed) return;
      const fx = b.x - c.x, fy = b.y - c.y, pr = fx * dx + fy * dy; if (pr <= 0) return;
      const d2 = fx * fx + fy * fy - pr * pr, m = 2 * R; if (d2 > m * m) return;
      const tt = pr - Math.sqrt(m * m - d2); if (tt < t) { t = tt; hit = b; }
    });
    const line = (x1, y1, x2, y2, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w * S.dpr; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.stroke(); g.setLineDash([]); };
    const len = opt.traj ? t : Math.min(t, 300);
    const ex = c.x + dx * len, ey = c.y + dy * len;
    line(c.x, c.y, ex, ey, "rgba(255,255,255,.9)", 1.6);
    if (!hit) {                                          // punta de flecha en el extremo
      const a = 55 * s / S.dpr * 0.0 + 38; g.fillStyle = "#fff"; g.beginPath();
      g.moveTo(X(ex), Y(ey)); g.lineTo(X(ex - dx * a + dy * a * 0.4), Y(ey - dy * a - dx * a * 0.4)); g.lineTo(X(ex - dx * a - dy * a * 0.4), Y(ey - dy * a + dx * a * 0.4)); g.fill();
    }
    if (opt.traj && hit) {
      let nx = hit.x - ex, ny = hit.y - ey; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5 * S.dpr; g.beginPath(); g.arc(X(ex), Y(ey), R * s, 0, 7); g.stroke();
      line(hit.x, hit.y, hit.x + nx * 260, hit.y + ny * 260, "#ff6b6b", 1.4, [8, 6]);                    // bola objetivo
      let tx = dx - (dx * nx + dy * ny) * nx, ty = dy - (dx * nx + dy * ny) * ny; const tl = Math.hypot(tx, ty);
      if (tl > 0.05) line(ex, ey, ex + tx / tl * 220, ey + ty / tl * 220, "#ffd25a", 1.4, [3, 6]);       // continuaci\u00f3n de la blanca
    }
  }

  function stick(c, back) {
    const s = S.s, len = 1150;
    g.save(); g.translate(X(c.x), Y(c.y)); g.rotate(aim);
    const w = 12 * s, x0 = -(back + len) * s;
    const k = curCue(), gr = g.createLinearGradient(x0, 0, x0 + len * s, 0); gr.addColorStop(0, k.c[1]); gr.addColorStop(1, k.c[0]);
    if (!opt.lowq) { g.shadowColor = k.glow; g.shadowBlur = 10 * S.dpr; }
    g.fillStyle = gr; g.fillRect(x0, -w / 2, len * s, w); g.shadowBlur = 0;
    g.fillStyle = "#b8c4de"; g.fillRect(x0 + len * s * 0.62, -w / 2, 22 * s, w);
    g.fillStyle = "#2b6cff"; g.fillRect(-(back + 14) * s, -w * 0.35, 14 * s, w * 0.7);
    g.restore();
  }

  function draw(B) {
    g.clearRect(0, 0, cv.width, cv.height);
    table();
    const c = B[0];
    if (!shot && !strike && !placing && !st.over && !blocked) guide(c);
    B.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) { g.strokeStyle = "#ffd25a"; g.lineWidth = 3; g.beginPath(); g.arc(X(c.x), Y(c.y), R * S.s * 1.6, 0, 7); g.stroke(); }
    if (!shot && !placing && !st.over && !c.pocketed) {
      if (strike) { const k = Math.min(1, strike.t / 0.14); stick(c, R + 12 + strike.pw * 240 * (1 - k * k)); }
      else stick(c, R + 12 + power * 240);
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (strike && !blocked) {
      strike.t += dt;
      if (strike.t >= 0.14) { shot = P.beginShot(balls, strike.aim, strike.pw, strike.spin); strike = null; lastHits = 0; lastPk = 0; beep(180, 0.08, 0.25); }
    }
    if (shot && !blocked) {
      P.advance(shot, dt);
      if (shot.ev.hits > lastHits) { beep(300 + Math.random() * 120, 0.05, 0.12); lastHits = shot.ev.hits; }
      if (shot.ev.pocketed.length > lastPk) { beep(110, 0.25, 0.25); lastPk = shot.ev.pocketed.length; }
      if (shot.done) endShot();
    }
    draw(shot ? shot.balls : balls);
    requestAnimationFrame(frame);
  }

  function open() {
    if (!el) build();
    el.classList.add("on"); running = true; layout(); start();
    last = performance.now(); requestAnimationFrame(frame);
  }
  function close() { running = false; shot = null; strike = null; if (el) { hideBox(); el.classList.remove("on"); } }
  DMR.game = { open, close, isOpen: () => running };
})();



/* Pantalla de juego (dibujo y controles). F\u00edsica y reglas: js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules;
  if (!P || !Rl) {
    DMR.game = { open() { alert("Falta cargar js/engine/physics.js o js/engine/rules.js (physics:" + !!P + " rules:" + !!Rl + ")"); }, close() {}, isOpen: () => false };
    return;
  }
  const T = P.T, R = T.R, RAIL = 70, M = { l: 84, r: 10, t: 70, b: 10 };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];
  const MSG = { break: "Saque: ajusta, apunta y tira", again: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano", rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo",
    win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo", scratch: "blanca embocada", noContact: "no tocaste ninguna bola",
    wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal" };
  const NAMES = ["Jugador 1", "Jugador 2"];

  let el, cv, g, S, balls, st, shot, strike, aim = 0, power = 0, spin = { x: 0, y: 0 };
  let dragBall = false, placing = false, blocked = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0, msg = "";
  const opt = { sound: DMR.store.get("sound", true) !== false, traj: DMR.store.get("traj", true) !== false, lowq: DMR.store.get("lowq", false) === true };
  const save = () => { DMR.store.set("sound", opt.sound); DMR.store.set("traj", opt.traj); DMR.store.set("lowq", opt.lowq); };
  const $ = s => el.querySelector(s);

  let ac;
  function beep(f, d, v) {
    if (!opt.sound) return;
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
    el.innerHTML = '<canvas id="gc"></canvas><button id="gMenu" class="gx">\u2630</button>' +
      '<div id="gp0" class="gx gp" style="left:66px;right:calc(50% + 88px)"></div><div id="gTurn" class="gx"></div>' +
      '<div id="gp1" class="gx gp r" style="left:calc(50% + 88px);right:66px"></div>' +
      '<div id="gSpin" class="gx"><i></i></div>' +
      '<div id="gPow" class="gx"><b></b><span style="top:2px">MIN</span><span style="bottom:2px">MAX</span></div>' +
      '<div id="gBot" class="gx"><button data-b="set"><em>\u2699</em>Ajustes</button><button data-b="traj"><em>\u25ce</em>Vista de trayectoria</button><button data-b="cue"><em>\u2573</em>Tacos</button></div>' +
      '<div id="gBox" class="gov"><div class="gcard"></div></div>';
    document.body.append(el);
    cv = $("#gc"); g = cv.getContext("2d");
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); point(e); });
    cv.addEventListener("pointermove", e => { if (down) point(e); });
    cv.addEventListener("pointerup", () => { down = false; dragBall = false; });
    cv.addEventListener("pointercancel", () => { down = false; });
    const pw = $("#gPow");
    const setP = e => { const r = pw.getBoundingClientRect(); power = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); $("#gPow b").style.top = power * 100 + "%"; };
    pw.addEventListener("pointerdown", e => { if (!canShoot()) return; pw.setPointerCapture(e.pointerId); pw._d = true; setP(e); });
    pw.addEventListener("pointermove", e => { if (pw._d) setP(e); });
    const rel = () => { if (!pw._d) return; pw._d = false; const p = power; power = 0; $("#gPow b").style.top = "0%"; if (p > 0.04) fire(p); };
    pw.addEventListener("pointerup", rel); pw.addEventListener("pointercancel", rel);
    const sp = $("#gSpin"), setS = e => {
      const r = sp.getBoundingClientRect(), rr = r.width / 2 - 10; let x = (e.clientX - r.left - r.width / 2) / rr, y = (e.clientY - r.top - r.height / 2) / rr;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } spin = { x, y };
      sp.firstChild.style.transform = "translate(" + x * rr + "px," + y * rr + "px)";
    };
    sp.addEventListener("pointerdown", e => { sp.setPointerCapture(e.pointerId); sp._d = true; setS(e); });
    sp.addEventListener("pointermove", e => { if (sp._d) setS(e); });
    sp.addEventListener("pointerup", () => { sp._d = false; });
    $("#gMenu").addEventListener("click", menu);
    $("#gBot").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.b === "set") settings(); else if (b.dataset.b === "cue") cues(); else { opt.traj = !opt.traj; save(); hud(); }
    });
    document.addEventListener("keydown", e => { if (running && e.key === "Escape") blocked ? hideBox() : menu(); });
    window.addEventListener("resize", () => { if (running) layout(); });
  }

  function showBox(title, items) {
    const c = $("#gBox .gcard"); c.replaceChildren();
    const h = document.createElement("h2"); h.textContent = title; c.append(h);
    items.forEach(it => {
      if (it.row) { const d = document.createElement("div"); d.className = "row"; d.innerHTML = "<span></span><b></b>"; d.firstChild.textContent = it.row; d.lastChild.textContent = it.val; d.addEventListener("click", it.fn); c.append(d); return; }
      if (typeof it === "string") { const p = document.createElement("p"); p.textContent = it; c.append(p); return; }
      const b = document.createElement("button"); b.className = "gb" + (it[2] ? " gold" : ""); b.textContent = it[0]; b.addEventListener("click", it[1]); c.append(b);
    });
    $("#gBox").classList.add("on"); blocked = true;
  }
  function hideBox() { $("#gBox").classList.remove("on"); blocked = false; }
  function menu() {
    showBox("Men\u00fa", [["Reanudar partida", hideBox, true], ["Ajustes", settings], ["Ayuda y controles", help],
      ["Volver al men\u00fa principal", () => showBox("\u00bfSalir de la partida?", ["Se perder\u00e1 la partida en curso.", ["Salir", close, true], ["Cancelar", menu]])]]);
  }
  function settings() {
    showBox("Ajustes", [{ row: "Sonido", val: opt.sound ? "S\u00cd" : "NO", fn: () => { opt.sound = !opt.sound; save(); settings(); } },
      { row: "Calidad gr\u00e1fica", val: opt.lowq ? "BAJA" : "ALTA", fn: () => { opt.lowq = !opt.lowq; save(); settings(); } },
      "Volumen, vibraci\u00f3n y sensibilidad: pendientes de implementar.", ["Cerrar", hideBox, true]]);
  }
  function help() {
    showBox("Ayuda y controles", ["Arrastra sobre la mesa para apuntar.", "Arrastra la barra de potencia hacia abajo y su\u00e9ltala para tirar.",
      "El c\u00edrculo de arriba a la derecha mueve el punto de golpe de la blanca (efecto).", "Emboca tu grupo y por \u00faltimo la bola 8.", ["Cerrar", hideBox, true]]);
  }
  const CUES = [
    { id: "classic", name: "DMR Classic", rar: "Com\u00fan", p: 5, a: 5, e: 5, price: 0, cur: "coins", c: ["#3a2412", "#b98a52"], glow: "#c9a15a", desc: "Taco inicial gratuito." },
    { id: "cyber", name: "Cyber Blue", rar: "\u00c9pico", p: 8, a: 9, e: 7, price: 8000, cur: "coins", c: ["#0a1f55", "#2d8cff"], glow: "#38b6ff", desc: "Tecnolog\u00eda y estilo en cada golpe." },
    { id: "inferno", name: "Inferno", rar: "\u00c9pico", p: 9, a: 8, e: 7, price: 8000, cur: "coins", c: ["#2a0707", "#ff3b2f"], glow: "#ff5a3c", desc: "Potencia ardiente." },
    { id: "dragon", name: "Drag\u00f3n", rar: "Legendario", p: 10, a: 9, e: 8, price: 15000, cur: "gems", c: ["#1a1206", "#f5c04a"], glow: "#ffd25a", desc: "Fuerza y elegancia dorada." },
    { id: "hielo", name: "Hielo", rar: "\u00c9pico", p: 8, a: 9, e: 8, ctl: 1, price: 8000, cur: "coins", c: ["#0b3a5c", "#9ee7ff"], glow: "#bff3ff", desc: "Control mejorado de la bola blanca." },
    { id: "nebulosa", name: "Nebulosa", rar: "Raro", p: 7, a: 8, e: 9, price: 5000, cur: "coins", c: ["#2a0b5c", "#c36bff"], glow: "#d08cff", desc: "El mejor efecto del cat\u00e1logo normal." },
    { id: "legendario", name: "Legendario", rar: "Legendario", p: 10, a: 10, e: 10, price: 20000, cur: "gems", c: ["#3a2a06", "#ffe28a"], glow: "#fff1b0", desc: "Lo m\u00e1ximo en todo." },
    { id: "vandalo", name: "V\u00e1ndalo", rar: "Raro", p: 7, a: 8, e: 7, price: 5000, cur: "coins", c: ["#2a0505", "#e8453c"], glow: "#ff6b6b", desc: "Estilo callejero y agresivo." },
    { id: "sombrio", name: "Sombr\u00edo", rar: "Com\u00fan", p: 6, a: 7, e: 6, price: 2500, cur: "coins", c: ["#05060c", "#5a4a8a"], glow: "#8a7ad0", desc: "Discreto y fiable." }
  ];
  const cst = () => Object.assign({ owned: ["classic"], equipped: "classic", coins: 10000, gems: 25000 }, DMR.store.get("cues", {}));
  const curCue = () => CUES.find(c => c.id === cst().equipped) || CUES[0];
  function drawCue(c2, w, h, k, rot) {
    const gr = c2.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, k.c[0]); gr.addColorStop(1, k.c[1]);
    c2.shadowColor = k.glow; c2.shadowBlur = 12; c2.fillStyle = gr; c2.fillRect(0, 0, w, h); c2.shadowBlur = 0;
    for (let i = 0; i < 7; i++) { const x = (((i / 7) + rot / 6.283) % 1) * w; c2.fillStyle = k.glow; c2.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(rot + i)); c2.fillRect(x, 0, w * 0.025, h); }
    c2.globalAlpha = 1; c2.fillStyle = "#c8d2ea"; c2.fillRect(w * 0.78, 0, w * 0.03, h); c2.fillStyle = "#111"; c2.fillRect(w * 0.9, 0, w * 0.1, h);
  }
  function cues() {
    const sh = document.createElement("div"); sh.id = "gShop"; sh.className = "gov on";
    sh.innerHTML = '<div class="shop"><header><button class="gb" id="sX">\u2190</button><h2>TIENDA DE TACOS</h2><span id="sBal"></span></header><div class="sb"><div id="sGrid"></div><div id="sDet"></div></div><small>Econom\u00eda de prueba local: monedas y gemas de prueba, no son compras reales.</small></div>';
    el.append(sh); blocked = true;
    let sel = cst().equipped, rot = 0, drag = null, alive = true;
    const close2 = () => { alive = false; sh.remove(); hideBox(); hud(); };
    sh.querySelector("#sX").addEventListener("click", close2);
    const bars = k => [["Potencia", k.p, "fuerza m\u00e1x. " + Math.round((0.80 + 0.02 * k.p) * 100) + "%"], ["Precisi\u00f3n", k.a, "desv\u00edo -" + Math.round(k.a * 10 * (k.ctl ? 1.25 : 1)) + "%"], ["Efecto", k.e, "giro " + Math.round((0.5 + 0.1 * k.e) * 100) + "%"]]
      .map(b => '<div class="st"><span>' + b[0] + '</span><b>' + b[1] + '/10</b><i style="width:' + b[1] * 10 + '%"></i><em>' + b[2] + '</em></div>').join("");
    function render() {
      const s = cst(), k = CUES.find(c => c.id === sel);
      sh.querySelector("#sBal").textContent = "\u25cf " + s.coins.toLocaleString() + "   \u25c6 " + s.gems.toLocaleString();
      sh.querySelector("#sGrid").innerHTML = CUES.map(c => '<div class="cc' + (c.id === sel ? " on" : "") + '" data-id="' + c.id + '"><div class="cb" style="background:linear-gradient(90deg,' + c.c[0] + ',' + c.c[1] + ');box-shadow:0 0 8px ' + c.glow + '"></div><b>' + c.name + '</b><u>' + c.rar + '</u><small>' + (s.equipped === c.id ? "EQUIPADO" : s.owned.includes(c.id) ? "TUYO" : (c.cur === "gems" ? "\u25c6 " : "\u25cf ") + c.price.toLocaleString()) + '</small></div>').join("");
      const own = s.owned.includes(k.id);
      sh.querySelector("#sDet").innerHTML = '<canvas id="sPrev" width="150" height="150"></canvas><h3>' + k.name + '</h3><u>' + k.rar + '</u><p>' + k.desc + '</p>' + bars(k) + '<button class="gb gold" id="sAct"' + (s.equipped === k.id ? " disabled" : "") + '>' + (s.equipped === k.id ? "Equipado" : own ? "Equipar" : "Comprar " + (k.cur === "gems" ? "\u25c6 " : "\u25cf ") + k.price.toLocaleString()) + '</button><small id="sMsg">Vista giratoria animada: arrastra para girar.</small>';
      sh.querySelector("#sAct").addEventListener("click", () => {
        const st2 = cst(), msg2 = sh.querySelector("#sMsg");
        if (st2.owned.includes(k.id)) { st2.equipped = k.id; csave(st2); render(); return; }
        if (st2[k.cur] < k.price) { msg2.textContent = "Saldo de prueba insuficiente."; return; }
        st2[k.cur] -= k.price; st2.owned.push(k.id); csave(st2); render();
      });
      const pv = sh.querySelector("#sPrev"); pv.addEventListener("pointerdown", e => { drag = e.clientX; pv.setPointerCapture(e.pointerId); });
      pv.addEventListener("pointermove", e => { if (drag !== null) { rot += (e.clientX - drag) * 0.03; drag = e.clientX; } });
      pv.addEventListener("pointerup", () => { drag = null; });
    }
    sh.querySelector("#sGrid").addEventListener("click", e => { const c = e.target.closest(".cc"); if (c) { sel = c.dataset.id; render(); } });
    render();
    (function loop() {
      if (!alive) return; const pv = sh.querySelector("#sPrev");
      if (pv) { const c2 = pv.getContext("2d"), k = CUES.find(c => c.id === sel); c2.clearRect(0, 0, 150, 150); c2.save(); c2.translate(10, 128); c2.rotate(-0.78); if (drag === null) rot += 0.02; drawCue(c2, 190, 10, k, rot); c2.restore(); }
      requestAnimationFrame(loop);
    })();
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const aw = W - M.l - M.r, ah = H - M.t - M.b, s = Math.min(aw / (T.W + 2 * RAIL), ah / (T.H + 2 * RAIL));
    const pw = $("#gPow"); pw.style.top = M.t + "px"; pw.style.height = Math.max(120, H - M.t - 84) + "px";
    S = { s: s * dpr, x: (M.l + (aw - T.W * s) / 2) * dpr, y: (M.t + (ah - T.H * s) / 2) * dpr, dpr };
  }

  function point(e) {
    const r = cv.getBoundingClientRect();
    const px = ((e.clientX - r.left) * S.dpr - S.x) / S.s, py = ((e.clientY - r.top) * S.dpr - S.y) / S.s;
    if (blocked || shot || strike || st.over) return;
    const c = balls[0];
    if (e.type === "pointerdown") dragBall = placing && Math.hypot(px - c.x, py - c.y) < 3.2 * R;
    if (dragBall) {
      const x = Math.max(R, Math.min(st.phase === "break" ? T.W * 0.25 : T.W - R, px)), y = Math.max(R, Math.min(T.H - R, py));
      if (balls.every(b => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1)) { c.x = x; c.y = y; }
    } else aim = Math.atan2(py - c.y, px - c.x);
  }

  function start() {
    ori = {}; balls = P.rack(); st = Rl.newGame({ firstTurn: 0 }); shot = null; strike = null; placing = false; aim = 0; power = 0;
    lastHits = 0; lastPk = 0; msg = MSG.break; hideBox(); hud();
  }
  const canShoot = () => running && !blocked && !shot && !strike && !st.over;
  function fire(p) {
    if (!canShoot()) return;
    const k = curCue(), dev = (1 - k.a / 10) * (k.ctl ? 0.75 : 1) * 0.012 * p * (Math.random() * 2 - 1), f = 0.5 + 0.1 * k.e;
    placing = false;
    strike = { t: 0, pw: Math.min(1, p * (0.80 + 0.02 * k.p)), aim: aim + dev, spin: { x: spin.x * f, y: spin.y * f } };
    hud();
  }

  function endShot() {
    balls = shot.balls; const ev = shot.ev; shot = null;
    st = Rl.applyShot(st, ev);
    if (st.rerack) { ori = {}; balls = P.rack(); st = Rl.newGame({ firstTurn: st.turn }); msg = MSG.rerack; hud(); return; }
    if (st.over) { result(); return; }
    const cue = balls[0];
    if (cue.pocketed || st.ballInHand) {
      if (cue.pocketed) { cue.pocketed = false; cue.x = T.W * 0.25; cue.y = T.H / 2; }
      cue.vx = cue.vy = 0;
      let k = 0; while (balls.some(b => b.id !== 0 && !b.pocketed && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R + 1) && k++ < 50) cue.y = (cue.y + 3 * R) % (T.H - 2 * R) + R;
      placing = st.ballInHand;
    }
    msg = st.lastFoul ? MSG.foul + " (" + MSG[st.lastFoul] + ")" : MSG[st.message] || "";
    hud();
  }

  function result() {
    const w = st.winner;
    const s = DMR.store.get("stats", { games: 0, p1wins: 0 }); s.games++; if (w === 0) s.p1wins++; DMR.store.set("stats", s);
    const h = DMR.store.get("history", []); h.unshift({ at: Date.now(), winner: w, how: st.message }); DMR.store.set("history", h.slice(0, 20));
    beep(520, 0.4, 0.2); hud();
    showBox(NAMES[w] + " gana", [MSG[st.message] || "", ["Revancha", start, true], ["Men\u00fa principal", close]]);
  }

  function ballIcon(id, out) {
    const i = document.createElement("i"), c = COL[id > 8 ? id - 8 : id];
    i.style.background = id > 8 ? "linear-gradient(#fff 28%," + c + " 28% 72%,#fff 72%)" : c;
    i.style.color = id > 8 ? "#000" : "#fff"; i.textContent = id; if (out) i.className = "out"; return i;
  }
  function hud() {
    $("#gTurn").innerHTML = "<span>\u265b</span> Turno de " + NAMES[st.turn] + "<small></small>";
    $("#gTurn small").textContent = placing ? "Mueve la blanca si quieres y tira" : msg;
    [0, 1].forEach(i => {
      const p = $("#gp" + i), gr = st.groups[i];
      p.innerHTML = '<img src="assets/avatar.svg" alt=""><div><b></b><small></small><div class="bl"></div></div>';
      const F = (n, o) => Object.keys(o).forEach(k => n.style.setProperty(k, o[k], "important"));
      F(p, { display: "flex", "flex-direction": "row", "align-items": "center", "justify-content": "flex-start", gap: "8px", "text-align": "left", "padding-left": "8px" });
      F(p.querySelector("img"), { width: "42px", height: "42px", flex: "none" });
      F(p.querySelector("div"), { flex: "1", "min-width": "0", "text-align": "left" });
      F(p.querySelector("b"), { display: "inline", "font-size": "15px", color: "#fff" });
      p.querySelector("b").textContent = NAMES[i];
      F(p.querySelector("small"), { display: "inline", "margin-left": "6px" });
      p.querySelector("small").textContent = gr ? (gr === "solids" ? "Lisas" : "Rayadas") : "Mesa abierta";
      if (gr) (gr === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).forEach(id => p.querySelector(".bl").append(ballIcon(id, st.pocketed.indexOf(id) >= 0)));
      p.classList.toggle("act", st.turn === i && !st.over);
    });
    $("#gBot [data-b=traj]").classList.toggle("on", opt.traj);
  }

  /* ---------- dibujo ---------- */
  const X = x => S.x + x * S.s, Y = y => S.y + y * S.s;
  /* Cada bola tiene una orientaci\u00f3n 3D (matriz). Al rodar se rota seg\u00fan el desplazamiento real,
     y el cuerpo, la franja y los n\u00fameros se dibujan proyectados sobre la esfera. */
  let ori = {}, bc = null, bimg = null;
  const RGB = COL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const mul = (A, B) => A.map((_, r) => [0, 1, 2].map(c => A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c]));
  function roll(b) {
    let o = ori[b.id];
    if (!o) { const a = Math.random() * 6.283, c = Math.cos(a), n = Math.sin(a); o = ori[b.id] = { R: [[c, -n, 0], [n, c, 0], [0, 0, 1]], x: b.x, y: b.y }; }
    const dx = b.x - o.x, dy = b.y - o.y, d = (placing && b.id === 0) ? 0 : Math.hypot(dx, dy); o.x = b.x; o.y = b.y;
    if (d > 0.01 && d < 450) {
      const kx = -dy / d, ky = dx / d, th = d / R, c = Math.cos(th), s2 = Math.sin(th), t = 1 - c;
      o.R = mul([[c + t * kx * kx, t * kx * ky, s2 * ky], [t * kx * ky, c + t * ky * ky, -s2 * kx], [-s2 * ky, s2 * kx, c]], o.R);
    }
    return o.R;
  }
  function ball(b) {
    const x = X(b.x), y = Y(b.y), r = Math.max(3, Math.round(R * S.s)), N = 2 * r, M = roll(b), id = b.id;
    if (!opt.lowq) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.35, r, r * 0.9, 0, 0, 7); g.fill(); }
    if (!bc || bc.width !== N) { bc = document.createElement("canvas"); bc.width = bc.height = N; bimg = bc.getContext("2d").createImageData(N, N); }
    const d = bimg.data, base = RGB[id > 8 ? id - 8 : id];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = (i + 0.5 - r) / r, v = (j + 0.5 - r) / r, q = u * u + v * v, k = (j * N + i) * 4;
      if (q >= 1) { d[k + 3] = 0; continue; }
      const z = Math.sqrt(1 - q);
      const l1 = M[0][1] * u + M[1][1] * v + M[2][1] * z, l2 = M[0][2] * u + M[1][2] * v + M[2][2] * z;
      let c = [244, 244, 240];
      if (id > 0) { if (id < 9) c = base; else if (Math.abs(l1) < 0.5) c = base; if (Math.abs(l2) > 0.9) c = [244, 244, 240]; }
      const dot = Math.max(0, -0.35 * u - 0.5 * v + 0.8 * z), sh = (0.4 + 0.75 * dot) * (0.6 + 0.4 * Math.pow(z, 0.4)), sp = Math.pow(dot, 28) * 150;
      d[k] = Math.min(255, c[0] * sh + sp); d[k + 1] = Math.min(255, c[1] * sh + sp); d[k + 2] = Math.min(255, c[2] * sh + sp); d[k + 3] = 255;
    }
    bc.getContext("2d").putImageData(bimg, 0, 0); g.drawImage(bc, x - r, y - r);
    if (id === 0) return;
    [1, -1].forEach(sg => {
      const wz = M[2][2] * sg; if (wz < 0.3) return;
      const k = r / 100, ax = M[0][0] * sg * k, ay = M[1][0] * sg * k, bx = M[0][1] * k, by = M[1][1] * k;
      g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
      g.transform(ax, ay, bx, by, x + M[0][2] * sg * r, y + M[1][2] * sg * r);
      g.fillStyle = "#111"; g.font = "bold 50px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(id, 0, 3); g.restore();
    });
  }

  function table() {
    const s = S.s, x0 = X(-RAIL), y0 = Y(-RAIL), w = (T.W + 2 * RAIL) * s, h = (T.H + 2 * RAIL) * s;
    let f = g.createLinearGradient(0, y0, 0, y0 + h); f.addColorStop(0, "#2b3450"); f.addColorStop(0.5, "#111827"); f.addColorStop(1, "#1a2238");
    g.fillStyle = f; g.strokeStyle = "#2b6cff"; g.lineWidth = 3 * S.dpr;
    if (!opt.lowq) { g.shadowColor = "#2b6cff"; g.shadowBlur = 18 * S.dpr; }
    g.beginPath(); g.roundRect(x0, y0, w, h, 30 * s); g.fill(); g.stroke(); g.shadowBlur = 0;
    const cu = 42 * s; g.fillStyle = "#0b2a66"; g.fillRect(X(0) - cu, Y(0) - cu, T.W * s + 2 * cu, T.H * s + 2 * cu);
    f = g.createRadialGradient(X(T.W / 2), Y(T.H / 2), 50 * s, X(T.W / 2), Y(T.H / 2), T.W * 0.6 * s); f.addColorStop(0, "#1b6fe8"); f.addColorStop(1, "#0a3a94");
    g.fillStyle = f; g.fillRect(X(0), Y(0), T.W * s, T.H * s);
    g.fillStyle = "rgba(255,255,255,.12)"; [0.25, 0.75].forEach(k => { g.beginPath(); g.arc(X(T.W * k), Y(T.H / 2), 5 * s, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(T.W * 0.25), Y(0)); g.lineTo(X(T.W * 0.25), Y(T.H)); g.stroke();
    for (let i = 1; i < 14; i++) {                       // luces de las bandas
      const k = T.W * i / 14; g.fillStyle = i % 2 ? "#3c8cff" : "#ff4b4b";
      [Y(-RAIL * 0.55), Y(T.H + RAIL * 0.55)].forEach(yy => { g.beginPath(); g.arc(X(k), yy, 4 * s, 0, 7); g.fill(); });
    }
    P.POCKETS.forEach(p => {
      const r = p.r * 0.95 * s, c = g.createRadialGradient(X(p.x), Y(p.y), r * 0.1, X(p.x), Y(p.y), r);
      c.addColorStop(0, "#000"); c.addColorStop(0.8, "#05070d"); c.addColorStop(1, "#8a97b5");
      g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Y(p.y), r, 0, 7); g.fill();
    });
  }

  function guide(c) {
    const s = S.s, dx = Math.cos(aim), dy = Math.sin(aim);
    let t = 1e9, hit = null;
    [[1, 0, R, T.W - R], [0, 1, R, T.H - R]].forEach(([ax, , lo, hi]) => {
      const v = ax ? dx : dy, p = ax ? c.x : c.y;
      if (v > 1e-9) t = Math.min(t, (hi - p) / v); else if (v < -1e-9) t = Math.min(t, (lo - p) / v);
    });
    balls.forEach(b => {
      if (b.id === 0 || b.pocketed) return;
      const fx = b.x - c.x, fy = b.y - c.y, pr = fx * dx + fy * dy; if (pr <= 0) return;
      const d2 = fx * fx + fy * fy - pr * pr, m = 2 * R; if (d2 > m * m) return;
      const tt = pr - Math.sqrt(m * m - d2); if (tt < t) { t = tt; hit = b; }
    });
    const line = (x1, y1, x2, y2, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w * S.dpr; g.beginPath(); g.moveTo(X(x1), Y(y1)); g.lineTo(X(x2), Y(y2)); g.stroke(); g.setLineDash([]); };
    const len = opt.traj ? t : Math.min(t, 300);
    const ex = c.x + dx * len, ey = c.y + dy * len;
    line(c.x, c.y, ex, ey, "rgba(255,255,255,.9)", 1.6);
    if (!hit) {                                          // punta de flecha en el extremo
      const a = 55 * s / S.dpr * 0.0 + 38; g.fillStyle = "#fff"; g.beginPath();
      g.moveTo(X(ex), Y(ey)); g.lineTo(X(ex - dx * a + dy * a * 0.4), Y(ey - dy * a - dx * a * 0.4)); g.lineTo(X(ex - dx * a - dy * a * 0.4), Y(ey - dy * a + dx * a * 0.4)); g.fill();
    }
    if (opt.traj && hit) {
      let nx = hit.x - ex, ny = hit.y - ey; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      g.strokeStyle = "rgba(255,255,255,.8)"; g.lineWidth = 1.5 * S.dpr; g.beginPath(); g.arc(X(ex), Y(ey), R * s, 0, 7); g.stroke();
      line(hit.x, hit.y, hit.x + nx * 260, hit.y + ny * 260, "#ff6b6b", 1.4, [8, 6]);                    // bola objetivo
      let tx = dx - (dx * nx + dy * ny) * nx, ty = dy - (dx * nx + dy * ny) * ny; const tl = Math.hypot(tx, ty);
      if (tl > 0.05) line(ex, ey, ex + tx / tl * 220, ey + ty / tl * 220, "#ffd25a", 1.4, [3, 6]);       // continuaci\u00f3n de la blanca
    }
  }

  function stick(c, back) {
    const s = S.s, len = 1150;
    g.save(); g.translate(X(c.x), Y(c.y)); g.rotate(aim);
    const w = 12 * s, x0 = -(back + len) * s;
    const k = curCue(), gr = g.createLinearGradient(x0, 0, x0 + len * s, 0); gr.addColorStop(0, k.c[1]); gr.addColorStop(1, k.c[0]);
    if (!opt.lowq) { g.shadowColor = k.glow; g.shadowBlur = 10 * S.dpr; }
    g.fillStyle = gr; g.fillRect(x0, -w / 2, len * s, w); g.shadowBlur = 0;
    g.fillStyle = "#b8c4de"; g.fillRect(x0 + len * s * 0.62, -w / 2, 22 * s, w);
    g.fillStyle = "#2b6cff"; g.fillRect(-(back + 14) * s, -w * 0.35, 14 * s, w * 0.7);
    g.restore();
  }

  function draw(B) {
    g.clearRect(0, 0, cv.width, cv.height);
    table();
    const c = B[0];
    if (!shot && !strike && !placing && !st.over && !blocked) guide(c);
    B.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) { g.strokeStyle = "#ffd25a"; g.lineWidth = 3; g.beginPath(); g.arc(X(c.x), Y(c.y), R * S.s * 1.6, 0, 7); g.stroke(); }
    if (!shot && !placing && !st.over && !c.pocketed) {
      if (strike) { const k = Math.min(1, strike.t / 0.14); stick(c, R + 12 + strike.pw * 240 * (1 - k * k)); }
      else stick(c, R + 12 + power * 240);
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (strike && !blocked) {
      strike.t += dt;
      if (strike.t >= 0.14) { shot = P.beginShot(balls, strike.aim, strike.pw, strike.spin); strike = null; lastHits = 0; lastPk = 0; beep(180, 0.08, 0.25); }
    }
    if (shot && !blocked) {
      P.advance(shot, dt);
      if (shot.ev.hits > lastHits) { beep(300 + Math.random() * 120, 0.05, 0.12); lastHits = shot.ev.hits; }
      if (shot.ev.pocketed.length > lastPk) { beep(110, 0.25, 0.25); lastPk = shot.ev.pocketed.length; }
      if (shot.done) endShot();
    }
    draw(shot ? shot.balls : balls);
    requestAnimationFrame(frame);
  }

  function open() {
    if (!el) build();
    el.classList.add("on"); running = true; layout(); start();
    last = performance.now(); requestAnimationFrame(frame);
  }
  function close() { running = false; shot = null; strike = null; if (el) { hideBox(); el.classList.remove("on"); } }
  DMR.game = { open, close, isOpen: () => running };
})();






/* Pantalla de juego (dibujo y controles). F\u00edsica y reglas: js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules;
  if (!P || !Rl) {
    DMR.game = { open() { alert("Falta cargar js/engine/physics.js o js/engine/rules.js (physics:" + !!P + " rules:" + !!Rl + ")"); }, close() {}, isOpen: () => false };
    return;
  }
  const T = P.T, R = T.R, RAIL = 70, M = { l: 84, r: 10, t: 70, b: 10 };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];
  const MSG = { break: "Saque: ajusta, apunta y tira", again: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano", rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo",
    win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo", scratch: "blanca embocada", noContact: "no tocaste ninguna bola",
    wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal" };
  const NAMES = ["Jugador 1", "Jugador 2"];

  let el, cv, g, S, balls, st, shot, strike, aim = 0, power = 0, spin = { x: 0, y: 0 };
  let r3 = null, zoom3 = 1, dragBall = false, placing = false, blocked = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0, msg = "";
  const opt = { sound: DMR.store.get("sound", true) !== false, traj: DMR.store.get("traj", true) !== false, lowq: DMR.store.get("lowq", false) === true };
  const save = () => { DMR.store.set("sound", opt.sound); DMR.store.set("traj", opt.traj); DMR.store.set("lowq", opt.lowq); };
  const $ = s => el.querySelector(s);

  let ac;
  function beep(f, d, v) {
    if (!opt.sound) return;
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
    el.innerHTML = '<canvas id="gc"></canvas><button id="gMenu" class="gx">\u2630</button>' +
      '<div id="gp0" class="gx gp" style="left:66px;right:calc(50% + 88px)"></div><div id="gTurn" class="gx"></div>' +
      '<div id="gp1" class="gx gp r" style="left:calc(50% + 88px);right:66px"></div>' +
      '<div id="gSpin" class="gx"><i></i></div>' +
      '<div id="gPow" class="gx"><b></b><span style="top:2px">MIN</span><span style="bottom:2px">MAX</span></div>' +
      '<div id="gBot" class="gx"><button data-b="set"><em>\u2699</em>Ajustes</button><button data-b="traj"><em>\u25ce</em>Vista de trayectoria</button><button data-b="cue"><em>\u2573</em>Tacos</button></div>' +
      '<div id="gBox" class="gov"><div class="gcard"></div></div>';
    document.body.append(el);
    cv = $("#gc"); g = cv.getContext("2d");
    cv.addEventListener("pointerdown", e => { down = true; cv.setPointerCapture(e.pointerId); point(e); });
    cv.addEventListener("pointermove", e => { if (down) point(e); });
    cv.addEventListener("pointerup", () => { down = false; dragBall = false; });
    cv.addEventListener("pointercancel", () => { down = false; });
    const pw = $("#gPow");
    const setP = e => { const r = pw.getBoundingClientRect(); power = Math.max(0, Math.min(1, (e.clientY - r.top) / r.height)); $("#gPow b").style.top = power * 100 + "%"; };
    pw.addEventListener("pointerdown", e => { if (!canShoot()) return; pw.setPointerCapture(e.pointerId); pw._d = true; setP(e); });
    pw.addEventListener("pointermove", e => { if (pw._d) setP(e); });
    const rel = () => { if (!pw._d) return; pw._d = false; const p = power; power = 0; $("#gPow b").style.top = "0%"; if (p > 0.04) fire(p); };
    pw.addEventListener("pointerup", rel); pw.addEventListener("pointercancel", rel);
    const sp = $("#gSpin"), setS = e => {
      const r = sp.getBoundingClientRect(), rr = r.width / 2 - 10; let x = (e.clientX - r.left - r.width / 2) / rr, y = (e.clientY - r.top - r.height / 2) / rr;
      const l = Math.hypot(x, y); if (l > 1) { x /= l; y /= l; } spin = { x, y };
      sp.firstChild.style.transform = "translate(" + x * rr + "px," + y * rr + "px)";
    };
    sp.addEventListener("pointerdown", e => { sp.setPointerCapture(e.pointerId); sp._d = true; setS(e); });
    sp.addEventListener("pointermove", e => { if (sp._d) setS(e); });
    sp.addEventListener("pointerup", () => { sp._d = false; });
    $("#gMenu").addEventListener("click", menu);
    $("#gBot").addEventListener("click", e => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.dataset.b === "set") settings(); else if (b.dataset.b === "cue") cues(); else { opt.traj = !opt.traj; save(); hud(); }
    });
    document.addEventListener("keydown", e => { if (running && e.key === "Escape") blocked ? hideBox() : menu(); });
    window.addEventListener("resize", () => { if (running) layout(); });
    cv.addEventListener("wheel", e => { if (!r3) return; e.preventDefault(); zoom3 = Math.max(0.7, Math.min(1.4, zoom3 * (e.deltaY > 0 ? 1.08 : 0.92))); r3.fit(); }, { passive: false });
  }

  function showBox(title, items) {
    const c = $("#gBox .gcard"); c.replaceChildren();
    const h = document.createElement("h2"); h.textContent = title; c.append(h);
    items.forEach(it => {
      if (it.row) { const d = document.createElement("div"); d.className = "row"; d.innerHTML = "<span></span><b></b>"; d.firstChild.textContent = it.row; d.lastChild.textContent = it.val; d.addEventListener("click", it.fn); c.append(d); return; }
      if (typeof it === "string") { const p = document.createElement("p"); p.textContent = it; c.append(p); return; }
      const b = document.createElement("button"); b.className = "gb" + (it[2] ? " gold" : ""); b.textContent = it[0]; b.addEventListener("click", it[1]); c.append(b);
    });
    $("#gBox").classList.add("on"); blocked = true;
  }
  function hideBox() { $("#gBox").classList.remove("on"); blocked = false; }
  function menu() {
    showBox("Men\u00fa", [["Reanudar partida", hideBox, true], ["Ajustes", settings], ["Ayuda y controles", help],
      ["Volver al men\u00fa principal", () => showBox("\u00bfSalir de la partida?", ["Se perder\u00e1 la partida en curso.", ["Salir", close, true], ["Cancelar", menu]])]]);
  }
  function settings() {
    showBox("Ajustes", [{ row: "Sonido", val: opt.sound ? "S\u00cd" : "NO", fn: () => { opt.sound = !opt.sound; save(); settings(); } },
      { row: "Calidad gr\u00e1fica", val: opt.lowq ? "BAJA" : "ALTA", fn: () => { opt.lowq = !opt.lowq; save(); settings(); } },
      "Volumen, vibraci\u00f3n y sensibilidad: pendientes de implementar.", ["Cerrar", hideBox, true]]);
  }
  function help() {
    showBox("Ayuda y controles", ["Arrastra sobre la mesa para apuntar.", "Arrastra la barra de potencia hacia abajo y su\u00e9ltala para tirar.",
      "El c\u00edrculo de arriba a la derecha mueve el punto de golpe de la blanca (efecto).", "Emboca tu grupo y por \u00faltimo la bola 8.", ["Cerrar", hideBox, true]]);
  }
  const CUES = [
    { id: "classic", name: "DMR Classic", rar: "Com\u00fan", p: 5, a: 5, e: 5, price: 0, cur: "coins", c: ["#3a2412", "#b98a52"], glow: "#c9a15a", desc: "Taco inicial gratuito." },
    { id: "cyber", name: "Cyber Blue", rar: "\u00c9pico", p: 8, a: 9, e: 7, price: 8000, cur: "coins", c: ["#0a1f55", "#2d8cff"], glow: "#38b6ff", desc: "Tecnolog\u00eda y estilo en cada golpe." },
    { id: "inferno", name: "Inferno", rar: "\u00c9pico", p: 9, a: 8, e: 7, price: 8000, cur: "coins", c: ["#2a0707", "#ff3b2f"], glow: "#ff5a3c", desc: "Potencia ardiente." },
    { id: "dragon", name: "Drag\u00f3n", rar: "Legendario", p: 10, a: 9, e: 8, price: 15000, cur: "gems", c: ["#1a1206", "#f5c04a"], glow: "#ffd25a", desc: "Fuerza y elegancia dorada." },
    { id: "hielo", name: "Hielo", rar: "\u00c9pico", p: 8, a: 9, e: 8, ctl: 1, price: 8000, cur: "coins", c: ["#0b3a5c", "#9ee7ff"], glow: "#bff3ff", desc: "Control mejorado de la bola blanca." },
    { id: "nebulosa", name: "Nebulosa", rar: "Raro", p: 7, a: 8, e: 9, price: 5000, cur: "coins", c: ["#2a0b5c", "#c36bff"], glow: "#d08cff", desc: "El mejor efecto del cat\u00e1logo normal." },
    { id: "legendario", name: "Legendario", rar: "Legendario", p: 10, a: 10, e: 10, price: 20000, cur: "gems", c: ["#3a2a06", "#ffe28a"], glow: "#fff1b0", desc: "Lo m\u00e1ximo en todo." },
    { id: "vandalo", name: "V\u00e1ndalo", rar: "Raro", p: 7, a: 8, e: 7, price: 5000, cur: "coins", c: ["#2a0505", "#e8453c"], glow: "#ff6b6b", desc: "Estilo callejero y agresivo." },
    { id: "sombrio", name: "Sombr\u00edo", rar: "Com\u00fan", p: 6, a: 7, e: 6, price: 2500, cur: "coins", c: ["#05060c", "#5a4a8a"], glow: "#8a7ad0", desc: "Discreto y fiable." }
  ];
  const cst = () => Object.assign({ owned: ["classic"], equipped: "classic", coins: 10000, gems: 25000 }, DMR.store.get("cues", {}));
  const curCue = () => CUES.find(c => c.id === cst().equipped) || CUES[0];
  function drawCue(c2, w, h, k, rot) {
    const gr = c2.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, k.c[0]); gr.addColorStop(1, k.c[1]);
    c2.shadowColor = k.glow; c2.shadowBlur = 12; c2.fillStyle = gr; c2.fillRect(0, 0, w, h); c2.shadowBlur = 0;
    for (let i = 0; i < 7; i++) { const x = (((i / 7) + rot / 6.283) % 1) * w; c2.fillStyle = k.glow; c2.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(rot + i)); c2.fillRect(x, 0, w * 0.025, h); }
    c2.globalAlpha = 1; c2.fillStyle = "#c8d2ea"; c2.fillRect(w * 0.78, 0, w * 0.03, h); c2.fillStyle = "#111"; c2.fillRect(w * 0.9, 0, w * 0.1, h);
  }
  function cues() {
    const sh = document.createElement("div"); sh.id = "gShop"; sh.className = "gov on";
    sh.innerHTML = '<div class="shop"><header><button class="gb" id="sX">\u2190</button><h2>TIENDA DE TACOS</h2><span id="sBal"></span></header><div class="sb"><div id="sGrid"></div><div id="sDet"></div></div><small>Econom\u00eda de prueba local: monedas y gemas de prueba, no son compras reales.</small></div>';
    el.append(sh); blocked = true;
    let sel = cst().equipped, rot = 0, drag = null, alive = true;
    const close2 = () => { alive = false; sh.remove(); hideBox(); hud(); };
    sh.querySelector("#sX").addEventListener("click", close2);
    const bars = k => [["Potencia", k.p, "fuerza m\u00e1x. " + Math.round((0.80 + 0.02 * k.p) * 100) + "%"], ["Precisi\u00f3n", k.a, "desv\u00edo -" + Math.round(k.a * 10 * (k.ctl ? 1.25 : 1)) + "%"], ["Efecto", k.e, "giro " + Math.round((0.5 + 0.1 * k.e) * 100) + "%"]]
      .map(b => '<div class="st"><span>' + b[0] + '</span><b>' + b[1] + '/10</b><i style="width:' + b[1] * 10 + '%"></i><em>' + b[2] + '</em></div>').join("");
    function render() {
      const s = cst(), k = CUES.find(c => c.id === sel);
      sh.querySelector("#sBal").textContent = "\u25cf " + s.coins.toLocaleString() + "   \u25c6 " + s.gems.toLocaleString();
      sh.querySelector("#sGrid").innerHTML = CUES.map(c => '<div class="cc' + (c.id === sel ? " on" : "") + '" data-id="' + c.id + '"><div class="cb" style="background:linear-gradient(90deg,' + c.c[0] + ',' + c.c[1] + ');box-shadow:0 0 8px ' + c.glow + '"></div><b>' + c.name + '</b><u>' + c.rar + '</u><small>' + (s.equipped === c.id ? "EQUIPADO" : s.owned.includes(c.id) ? "TUYO" : (c.cur === "gems" ? "\u25c6 " : "\u25cf ") + c.price.toLocaleString()) + '</small></div>').join("");
      const own = s.owned.includes(k.id);
      sh.querySelector("#sDet").innerHTML = '<canvas id="sPrev" width="150" height="150"></canvas><h3>' + k.name + '</h3><u>' + k.rar + '</u><p>' + k.desc + '</p>' + bars(k) + '<button class="gb gold" id="sAct"' + (s.equipped === k.id ? " disabled" : "") + '>' + (s.equipped === k.id ? "Equipado" : own ? "Equipar" : "Comprar " + (k.cur === "gems" ? "\u25c6 " : "\u25cf ") + k.price.toLocaleString()) + '</button><small id="sMsg">Vista giratoria animada: arrastra para girar.</small>';
      sh.querySelector("#sAct").addEventListener("click", () => {
        const st2 = cst(), msg2 = sh.querySelector("#sMsg");
        if (st2.owned.includes(k.id)) { st2.equipped = k.id; csave(st2); render(); return; }
        if (st2[k.cur] < k.price) { msg2.textContent = "Saldo de prueba insuficiente."; return; }
        st2[k.cur] -= k.price; st2.owned.push(k.id); csave(st2); render();
      });
      const pv = sh.querySelector("#sPrev"); pv.addEventListener("pointerdown", e => { drag = e.clientX; pv.setPointerCapture(e.pointerId); });
      pv.addEventListener("pointermove", e => { if (drag !== null) { rot += (e.clientX - drag) * 0.03; drag = e.clientX; } });
      pv.addEventListener("pointerup", () => { drag = null; });
    }
    sh.querySelector("#sGrid").addEventListener("click", e => { const c = e.target.closest(".cc"); if (c) { sel = c.dataset.id; render(); } });
    render();
    (function loop() {
      if (!alive) return; const pv = sh.querySelector("#sPrev");
      if (pv) { const c2 = pv.getContext("2d"), k = CUES.find(c => c.id === sel); c2.clearRect(0, 0, 150, 150); c2.save(); c2.translate(10, 128); c2.rotate(-0.78); if (drag === null) rot += 0.02; drawCue(c2, 190, 10, k, rot); c2.restore(); }
      requestAnimationFrame(loop);
    })();
  }

  function layout() {
    const dpr = window.devicePixelRatio || 1, W = window.innerWidth, H = window.innerHeight;
    cv.width = W * dpr; cv.height = H * dpr; cv.style.width = W + "px"; cv.style.height = H + "px";
    const aw = W - M.l - M.r, ah = H - M.t - M.b, s = Math.min(aw / (T.W + 2 * RAIL), ah / (T.H + 2 * RAIL));
    const pw = $("#gPow"); pw.style.top = M.t + "px"; pw.style.height = Math.max(120, H - M.t - 84) + "px";
    if (r3) r3.resize();
    S = { s: s * dpr, x: (M.l + (aw - T.W * s) / 2) * dpr, y: (M.t + (ah - T.H * s) / 2) * dpr, dpr };
  }

  function point(e) {
    const r = cv.getBoundingClientRect();
    let px = ((e.clientX - r.left) * S.dpr - S.x) / S.s, py = ((e.clientY - r.top) * S.dpr - S.y) / S.s;
    if (r3) { const q = r3.pick(e.clientX - r.left, e.clientY - r.top); if (!q) return; px = q[0]; py = q[1]; }
    if (blocked || shot || strike || st.over) return;
    const c = balls[0];
    if (e.type === "pointerdown") dragBall = placing && Math.hypot(px - c.x, py - c.y) < 3.2 * R;
    if (dragBall) {
      const x = Math.max(R, Math.min(st.phase === "break" ? T.W * 0.25 : T.W - R, px)), y = Math.max(R, Math.min(T.H - R, py));
      if (balls.every(b => b.id === 0 || b.pocketed || Math.hypot(b.x - x, b.y - y) >= 2 * R + 1)) { c.x = x; c.y = y; }
    } else aim = Math.atan2(py - c.y, px - c.x);
  }

  function start() {
    ori = {}; balls = P.rack(); st = Rl.newGame({ firstTurn: 0 }); shot = null; strike = null; placing = false; aim = 0; power = 0;
    lastHits = 0; lastPk = 0; msg = MSG.break; hideBox(); hud();
  }
  const canShoot = () => running && !blocked && !shot && !strike && !st.over;
  function fire(p) {
    if (!canShoot()) return;
    const k = curCue(), dev = (1 - k.a / 10) * (k.ctl ? 0.75 : 1) * 0.012 * p * (Math.random() * 2 - 1), f = 0.5 + 0.1 * k.e;
    placing = false;
    strike = { t: 0, pw: Math.min(1, p * (0.80 + 0.02 * k.p)), aim: aim + dev, spin: { x: spin.x * f, y: spin.y * f } };
    hud();
  }

  function endShot() {
    balls = shot.balls; const ev = shot.ev; shot = null;
    st = Rl.applyShot(st, ev);
    if (st.rerack) { ori = {}; balls = P.rack(); st = Rl.newGame({ firstTurn: st.turn }); msg = MSG.rerack; hud(); return; }
    if (st.over) { result(); return; }
    const cue = balls[0];
    if (cue.pocketed || st.ballInHand) {
      if (cue.pocketed) { cue.pocketed = false; cue.x = T.W * 0.25; cue.y = T.H / 2; }
      cue.vx = cue.vy = 0;
      let k = 0; while (balls.some(b => b.id !== 0 && !b.pocketed && Math.hypot(b.x - cue.x, b.y - cue.y) < 2 * R + 1) && k++ < 50) cue.y = (cue.y + 3 * R) % (T.H - 2 * R) + R;
      placing = st.ballInHand;
    }
    msg = st.lastFoul ? MSG.foul + " (" + MSG[st.lastFoul] + ")" : MSG[st.message] || "";
    hud();
  }

  function result() {
    const w = st.winner;
    const s = DMR.store.get("stats", { games: 0, p1wins: 0 }); s.games++; if (w === 0) s.p1wins++; DMR.store.set("stats", s);
    const h = DMR.store.get("history", []); h.unshift({ at: Date.now(), winner: w, how: st.message }); DMR.store.set("history", h.slice(0, 20));
    beep(520, 0.4, 0.2); hud();
    showBox(NAMES[w] + " gana", [MSG[st.message] || "", ["Revancha", start, true], ["Men\u00fa principal", close]]);
  }

  function ballIcon(id, out) {
    const i = document.createElement("i"), c = COL[id > 8 ? id - 8 : id];
    i.style.background = id > 8 ? "linear-gradient(#fff 28%," + c + " 28% 72%,#fff 72%)" : c;
    i.style.color = id > 8 ? "#000" : "#fff"; i.textContent = id; if (out) i.className = "out"; return i;
  }
  function hud() {
    $("#gTurn").innerHTML = "<span>\u265b</span> Turno de " + NAMES[st.turn] + "<small></small>";
    $("#gTurn small").textContent = placing ? "Mueve la blanca si quieres y tira" : msg;
    [0, 1].forEach(i => {
      const p = $("#gp" + i), gr = st.groups[i];
      p.innerHTML = '<img src="assets/avatar.svg" alt=""><div><b></b><small></small><div class="bl"></div></div>';
      const F = (n, o) => Object.keys(o).forEach(k => n.style.setProperty(k, o[k], "important"));
      F(p, { display: "flex", "flex-direction": "row", "align-items": "center", "justify-content": "flex-start", gap: "8px", "text-align": "left", "padding-left": "8px" });
      F(p.querySelector("img"), { width: "42px", height: "42px", flex: "none" });
      F(p.querySelector("div"), { flex: "1", "min-width": "0", "text-align": "left" });
      F(p.querySelector("b"), { display: "inline", "font-size": "15px", color: "#fff" });
      p.querySelector("b").textContent = NAMES[i];
      F(p.querySelector("small"), { display: "inline", "margin-left": "6px" });
      p.querySelector("small").textContent = gr ? (gr === "solids" ? "Lisas" : "Rayadas") : "Mesa abierta";
      if (gr) (gr === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).forEach(id => p.querySelector(".bl").append(ballIcon(id, st.pocketed.indexOf(id) >= 0)));
      p.classList.toggle("act", st.turn === i && !st.over);
    });
    $("#gBot [data-b=traj]").classList.toggle("on", opt.traj);
  }

  /* ---------- dibujo ---------- */
  const X = x => S.x + x * S.s, Y = y => S.y + y * S.s;
  const PT = (x, y) => r3 ? r3.project(x, y) : [X(x), Y(y)];
  function circ(x, y, rad, col, w) {
    g.strokeStyle = col; g.lineWidth = w * S.dpr; g.beginPath();
    for (let i = 0; i <= 28; i++) { const a = i / 28 * 6.2832, q = PT(x + Math.cos(a) * rad, y + Math.sin(a) * rad); i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]); }
    g.stroke();
  }
  /* Cada bola tiene una orientaci\u00f3n 3D (matriz). Al rodar se rota seg\u00fan el desplazamiento real,
     y el cuerpo, la franja y los n\u00fameros se dibujan proyectados sobre la esfera. */
  let ori = {}, bc = null, bimg = null;
  const RGB = COL.map(h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)]);
  const mul = (A, B) => A.map((_, r) => [0, 1, 2].map(c => A[r][0] * B[0][c] + A[r][1] * B[1][c] + A[r][2] * B[2][c]));
  function roll(b) {
    let o = ori[b.id];
    if (!o) { const a = Math.random() * 6.283, c = Math.cos(a), n = Math.sin(a); o = ori[b.id] = { R: [[c, -n, 0], [n, c, 0], [0, 0, 1]], x: b.x, y: b.y }; }
    const dx = b.x - o.x, dy = b.y - o.y, d = (placing && b.id === 0) ? 0 : Math.hypot(dx, dy); o.x = b.x; o.y = b.y;
    if (d > 0.01 && d < 450) {
      const kx = -dy / d, ky = dx / d, th = d / R, c = Math.cos(th), s2 = Math.sin(th), t = 1 - c;
      o.R = mul([[c + t * kx * kx, t * kx * ky, s2 * ky], [t * kx * ky, c + t * ky * ky, -s2 * kx], [-s2 * ky, s2 * kx, c]], o.R);
    }
    return o.R;
  }
  function ball(b) {
    const x = X(b.x), y = Y(b.y), r = Math.max(3, Math.round(R * S.s)), N = 2 * r, M = roll(b), id = b.id;
    if (!opt.lowq) { g.fillStyle = "rgba(0,0,0,.35)"; g.beginPath(); g.ellipse(x + r * 0.25, y + r * 0.35, r, r * 0.9, 0, 0, 7); g.fill(); }
    if (!bc || bc.width !== N) { bc = document.createElement("canvas"); bc.width = bc.height = N; bimg = bc.getContext("2d").createImageData(N, N); }
    const d = bimg.data, base = RGB[id > 8 ? id - 8 : id];
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) {
      const u = (i + 0.5 - r) / r, v = (j + 0.5 - r) / r, q = u * u + v * v, k = (j * N + i) * 4;
      if (q >= 1) { d[k + 3] = 0; continue; }
      const z = Math.sqrt(1 - q);
      const l1 = M[0][1] * u + M[1][1] * v + M[2][1] * z, l2 = M[0][2] * u + M[1][2] * v + M[2][2] * z;
      let c = [244, 244, 240];
      if (id > 0) { if (id < 9) c = base; else if (Math.abs(l1) < 0.5) c = base; if (Math.abs(l2) > 0.9) c = [244, 244, 240]; }
      const dot = Math.max(0, -0.35 * u - 0.5 * v + 0.8 * z), sh = (0.4 + 0.75 * dot) * (0.6 + 0.4 * Math.pow(z, 0.4)), sp = Math.pow(dot, 28) * 150;
      d[k] = Math.min(255, c[0] * sh + sp); d[k + 1] = Math.min(255, c[1] * sh + sp); d[k + 2] = Math.min(255, c[2] * sh + sp); d[k + 3] = 255;
    }
    bc.getContext("2d").putImageData(bimg, 0, 0); g.drawImage(bc, x - r, y - r);
    if (id === 0) return;
    [1, -1].forEach(sg => {
      const wz = M[2][2] * sg; if (wz < 0.3) return;
      const k = r / 100, ax = M[0][0] * sg * k, ay = M[1][0] * sg * k, bx = M[0][1] * k, by = M[1][1] * k;
      g.save(); g.beginPath(); g.arc(x, y, r, 0, 7); g.clip();
      g.transform(ax, ay, bx, by, x + M[0][2] * sg * r, y + M[1][2] * sg * r);
      g.fillStyle = "#111"; g.font = "bold 50px sans-serif"; g.textAlign = "center"; g.textBaseline = "middle"; g.fillText(id, 0, 3); g.restore();
    });
  }

  function table() {
    const s = S.s, x0 = X(-RAIL), y0 = Y(-RAIL), w = (T.W + 2 * RAIL) * s, h = (T.H + 2 * RAIL) * s;
    let f = g.createLinearGradient(0, y0, 0, y0 + h); f.addColorStop(0, "#2b3450"); f.addColorStop(0.5, "#111827"); f.addColorStop(1, "#1a2238");
    g.fillStyle = f; g.strokeStyle = "#2b6cff"; g.lineWidth = 3 * S.dpr;
    if (!opt.lowq) { g.shadowColor = "#2b6cff"; g.shadowBlur = 18 * S.dpr; }
    g.beginPath(); g.roundRect(x0, y0, w, h, 30 * s); g.fill(); g.stroke(); g.shadowBlur = 0;
    const cu = 42 * s; g.fillStyle = "#0b2a66"; g.fillRect(X(0) - cu, Y(0) - cu, T.W * s + 2 * cu, T.H * s + 2 * cu);
    f = g.createRadialGradient(X(T.W / 2), Y(T.H / 2), 50 * s, X(T.W / 2), Y(T.H / 2), T.W * 0.6 * s); f.addColorStop(0, "#1b6fe8"); f.addColorStop(1, "#0a3a94");
    g.fillStyle = f; g.fillRect(X(0), Y(0), T.W * s, T.H * s);
    g.fillStyle = "rgba(255,255,255,.12)"; [0.25, 0.75].forEach(k => { g.beginPath(); g.arc(X(T.W * k), Y(T.H / 2), 5 * s, 0, 7); g.fill(); });
    g.strokeStyle = "rgba(255,255,255,.12)"; g.lineWidth = 1; g.beginPath(); g.moveTo(X(T.W * 0.25), Y(0)); g.lineTo(X(T.W * 0.25), Y(T.H)); g.stroke();
    for (let i = 1; i < 14; i++) {                       // luces de las bandas
      const k = T.W * i / 14; g.fillStyle = i % 2 ? "#3c8cff" : "#ff4b4b";
      [Y(-RAIL * 0.55), Y(T.H + RAIL * 0.55)].forEach(yy => { g.beginPath(); g.arc(X(k), yy, 4 * s, 0, 7); g.fill(); });
    }
    P.POCKETS.forEach(p => {
      const r = p.r * 0.95 * s, c = g.createRadialGradient(X(p.x), Y(p.y), r * 0.1, X(p.x), Y(p.y), r);
      c.addColorStop(0, "#000"); c.addColorStop(0.8, "#05070d"); c.addColorStop(1, "#8a97b5");
      g.fillStyle = c; g.beginPath(); g.arc(X(p.x), Y(p.y), r, 0, 7); g.fill();
    });
  }

  function guide(c) {
    const s = S.s, dx = Math.cos(aim), dy = Math.sin(aim);
    let t = 1e9, hit = null;
    [[1, 0, R, T.W - R], [0, 1, R, T.H - R]].forEach(([ax, , lo, hi]) => {
      const v = ax ? dx : dy, p = ax ? c.x : c.y;
      if (v > 1e-9) t = Math.min(t, (hi - p) / v); else if (v < -1e-9) t = Math.min(t, (lo - p) / v);
    });
    balls.forEach(b => {
      if (b.id === 0 || b.pocketed) return;
      const fx = b.x - c.x, fy = b.y - c.y, pr = fx * dx + fy * dy; if (pr <= 0) return;
      const d2 = fx * fx + fy * fy - pr * pr, m = 2 * R; if (d2 > m * m) return;
      const tt = pr - Math.sqrt(m * m - d2); if (tt < t) { t = tt; hit = b; }
    });
    const line = (x1, y1, x2, y2, col, w, dash) => { g.setLineDash(dash || []); g.strokeStyle = col; g.lineWidth = w * S.dpr; const a = PT(x1, y1), b = PT(x2, y2); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.setLineDash([]); };
    const len = opt.traj ? t : Math.min(t, 300);
    const ex = c.x + dx * len, ey = c.y + dy * len;
    line(c.x, c.y, ex, ey, "rgba(255,255,255,.9)", 1.6);
    if (!hit) {                                          // punta de flecha en el extremo
      const a = 55 * s / S.dpr * 0.0 + 38; g.fillStyle = "#fff"; g.beginPath();
      const p0 = PT(ex, ey), p1 = PT(ex - dx * a + dy * a * 0.4, ey - dy * a - dx * a * 0.4), p2 = PT(ex - dx * a - dy * a * 0.4, ey - dy * a + dx * a * 0.4); g.moveTo(p0[0], p0[1]); g.lineTo(p1[0], p1[1]); g.lineTo(p2[0], p2[1]); g.fill();
    }
    if (opt.traj && hit) {
      let nx = hit.x - ex, ny = hit.y - ey; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      circ(ex, ey, R, "rgba(255,255,255,.85)", 1.5);
      line(hit.x, hit.y, hit.x + nx * 260, hit.y + ny * 260, "#ff6b6b", 1.4, [8, 6]);                    // bola objetivo
      let tx = dx - (dx * nx + dy * ny) * nx, ty = dy - (dx * nx + dy * ny) * ny; const tl = Math.hypot(tx, ty);
      if (tl > 0.05) line(ex, ey, ex + tx / tl * 220, ey + ty / tl * 220, "#ffd25a", 1.4, [3, 6]);       // continuaci\u00f3n de la blanca
    }
  }

  function stick(c, back) {
    if (r3) {
      const k = curCue(), dx = Math.cos(aim), dy = Math.sin(aim), tx = c.x - dx * back, ty = c.y - dy * back;
      const a = PT(tx, ty), b = PT(tx - dx * 1150, ty - dy * 1150), w1 = PT(tx - dy * 7, ty + dx * 7), w2 = PT(tx + dy * 7, ty - dx * 7);
      const gr = g.createLinearGradient(a[0], a[1], b[0], b[1]); gr.addColorStop(0, k.c[1]); gr.addColorStop(1, k.c[0]);
      g.lineCap = "round"; g.strokeStyle = gr; g.lineWidth = Math.max(3, Math.hypot(w1[0] - w2[0], w1[1] - w2[1]) * 1.3);
      if (!opt.lowq) { g.shadowColor = k.glow; g.shadowBlur = 10 * S.dpr; }
      g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); g.shadowBlur = 0; g.lineCap = "butt"; return;
    }
    const s = S.s, len = 1150;
    g.save(); g.translate(X(c.x), Y(c.y)); g.rotate(aim);
    const w = 12 * s, x0 = -(back + len) * s;
    const k = curCue(), gr = g.createLinearGradient(x0, 0, x0 + len * s, 0); gr.addColorStop(0, k.c[1]); gr.addColorStop(1, k.c[0]);
    if (!opt.lowq) { g.shadowColor = k.glow; g.shadowBlur = 10 * S.dpr; }
    g.fillStyle = gr; g.fillRect(x0, -w / 2, len * s, w); g.shadowBlur = 0;
    g.fillStyle = "#b8c4de"; g.fillRect(x0 + len * s * 0.62, -w / 2, 22 * s, w);
    g.fillStyle = "#2b6cff"; g.fillRect(-(back + 14) * s, -w * 0.35, 14 * s, w * 0.7);
    g.restore();
  }

  function draw(B) {
    g.clearRect(0, 0, cv.width, cv.height);
    if (r3) r3.render(B); else table();
    const c = B[0];
    if (!shot && !strike && !placing && !st.over && !blocked) guide(c);
    if (!r3) B.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) circ(c.x, c.y, R * 1.6, "#ffd25a", 3);
    if (!shot && !placing && !st.over && !c.pocketed) {
      if (strike) { const k = Math.min(1, strike.t / 0.14); stick(c, R + 12 + strike.pw * 240 * (1 - k * k)); }
      else stick(c, R + 12 + power * 240);
    }
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t;
    if (strike && !blocked) {
      strike.t += dt;
      if (strike.t >= 0.14) { shot = P.beginShot(balls, strike.aim, strike.pw, strike.spin); strike = null; lastHits = 0; lastPk = 0; beep(180, 0.08, 0.25); }
    }
    if (shot && !blocked) {
      P.advance(shot, dt);
      if (shot.ev.hits > lastHits) { beep(300 + Math.random() * 120, 0.05, 0.12); lastHits = shot.ev.hits; }
      if (shot.ev.pocketed.length > lastPk) { beep(110, 0.25, 0.25); lastPk = shot.ev.pocketed.length; }
      if (shot.done) endShot();
    }
    draw(shot ? shot.balls : balls);
    requestAnimationFrame(frame);
  }

  /* ====== Etapa 1: mesa y bolas en 3D real (Three.js r128 desde cdnjs). Si no carga, sigue el modo 2D. ====== */
  function make3D() {
    const TH = window.THREE, W = T.W, H = T.H, rd = new TH.WebGLRenderer({ antialias: true, alpha: true });
    rd.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); rd.shadowMap.enabled = !opt.lowq; rd.shadowMap.type = TH.PCFSoftShadowMap;
    rd.domElement.style.cssText = "position:absolute;left:0;top:0;pointer-events:none"; el.insertBefore(rd.domElement, cv);
    const sc = new TH.Scene(), cam = new TH.PerspectiveCamera(36, 1, 50, 9000), reg = { x: 0, y: 0, w: 1, h: 1 }, ray = new TH.Raycaster(), plane = new TH.Plane(new TH.Vector3(0, 1, 0), -R);
    sc.add(new TH.HemisphereLight(0xb8d0ff, 0x10121c, 0.75));
    const sun = new TH.DirectionalLight(0xffffff, 0.9); sun.position.set(-700, 2200, 900); sun.castShadow = !opt.lowq;
    Object.assign(sun.shadow.camera, { left: -1700, right: 1700, top: 1000, bottom: -1000, near: 500, far: 5000 }); sun.shadow.mapSize.set(2048, 1024); sc.add(sun);
    const blue = new TH.PointLight(0x2b6cff, 0.6, 3000); blue.position.set(-1100, 500, 0); sc.add(blue);
    const red = new TH.PointLight(0xff3b3b, 0.5, 3000); red.position.set(1100, 500, 0); sc.add(red);
    const box = (w, h, d, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; sc.add(m); return m; };
    const cloth = new TH.Mesh(new TH.PlaneGeometry(W, H), new TH.MeshStandardMaterial({ color: 0x1456b8, roughness: 0.95 })); cloth.rotation.x = -Math.PI / 2; cloth.receiveShadow = true; sc.add(cloth);
    const pad = new TH.MeshStandardMaterial({ color: 0x0b2f74, roughness: 0.8 }), frame = new TH.MeshStandardMaterial({ color: 0x1b2438, metalness: 0.6, roughness: 0.35 });
    const neonB = new TH.MeshBasicMaterial({ color: 0x3c8cff }), neonR = new TH.MeshBasicMaterial({ color: 0xff4b4b });
    const hw = W / 2, hh = H / 2, gc = 74, gm = 62, cz = 56, fz = 120;
    [[-1], [1]].forEach(([sg]) => {                                   // bandas largas (con hueco en las troneras)
      const L = hw - gc - gm, cx = L / 2 + gm;
      [-1, 1].forEach(sx => box(L, 38, cz, sx * cx, 19, sg * (hh + cz / 2), pad));
      box(W + 2 * (cz + fz), 80, fz, 0, 40, sg * (hh + cz + fz / 2), frame);
      box(W + 2 * cz, 3, 6, 0, 82, sg * (hh + cz + 4), sg < 0 ? neonB : neonR);
    });
    [-1, 1].forEach(sx => {                                           // bandas cortas
      box(cz, 38, H - 2 * gc, sx * (hw + cz / 2), 19, 0, pad);
      box(fz, 80, H + 2 * (cz + fz), sx * (hw + cz + fz / 2), 40, 0, frame);
      box(6, 3, H + 2 * cz, sx * (hw + cz + 4), 82, 0, sx < 0 ? neonR : neonB);
    });
    P.POCKETS.forEach(p => {
      const px = p.x - hw, pz = p.y - hh, hole = new TH.Mesh(new TH.CircleGeometry(p.r * 0.92, 32), new TH.MeshBasicMaterial({ color: 0x000000 }));
      hole.rotation.x = -Math.PI / 2; hole.position.set(px, 1.5, pz); sc.add(hole);
      const ring = new TH.Mesh(new TH.TorusGeometry(p.r * 0.95, 6, 10, 32), new TH.MeshStandardMaterial({ color: 0x9aa7c4, metalness: 0.9, roughness: 0.25 }));
      ring.rotation.x = Math.PI / 2; ring.position.set(px, 4, pz); sc.add(ring);
    });
    const tex = id => {
      const cn = document.createElement("canvas"); cn.width = 512; cn.height = 256; const c2 = cn.getContext("2d"), col = COL[id > 8 ? id - 8 : id];
      c2.fillStyle = id === 0 ? "#f4f4f0" : id > 8 ? "#f4f4f0" : col; c2.fillRect(0, 0, 512, 256);
      if (id > 8) { c2.fillStyle = col; c2.fillRect(0, 64, 512, 128); }
      if (id > 0) [0, 256, 512].forEach(x => { c2.fillStyle = "#f4f4f0"; c2.beginPath(); c2.arc(x, 128, 40, 0, 7); c2.fill(); c2.fillStyle = "#111"; c2.font = "bold 46px sans-serif"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText(id, x, 132); });
      return new TH.CanvasTexture(cn);
    };
    const geo = new TH.SphereGeometry(R, opt.lowq ? 16 : 36, opt.lowq ? 12 : 24), meshes = [];
    for (let id = 0; id < 16; id++) {
      const m = new TH.Mesh(geo, new TH.MeshPhysicalMaterial({ map: tex(id), roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.08 })); m.castShadow = true; sc.add(m);
      m.quaternion.setFromAxisAngle(new TH.Vector3(0, 1, 0), Math.random() * 6.28).multiply(new TH.Quaternion().setFromAxisAngle(new TH.Vector3(0, 0, 1), Math.PI / 2));
      m.userData = { x: null, y: null }; meshes[id] = m;
    }
    const dir = new TH.Vector3(), q2 = new TH.Quaternion(), ax = new TH.Vector3();
    const api = {
      resize() {
        const Wc = window.innerWidth, Hc = window.innerHeight; rd.setSize(Wc, Hc);
        reg.x = 84; reg.y = 70; reg.w = Wc - 94; reg.h = Hc - 70 - 76; cam.aspect = reg.w / reg.h; cam.updateProjectionMatrix(); api.fit();
      },
      fit() {
        const el2 = 1.05, ty = Math.sin(el2), tz = Math.cos(el2), ext = [[-hw - 190, -hh - 190], [hw + 190, -hh - 190], [-hw - 190, hh + 190], [hw + 190, hh + 190]];
        let d = 1500;
        for (; d < 9000; d += 40) {
          cam.position.set(0, ty * d, tz * d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
          if (ext.every(([x, z]) => { const v = new TH.Vector3(x, 60, z).project(cam); return Math.abs(v.x) < 0.98 && Math.abs(v.y) < 0.98; })) break;
        }
        d *= zoom3; cam.position.set(0, ty * d, tz * d); cam.lookAt(0, 0, 0); cam.updateMatrixWorld();
      },
      project(x, y) {
        const v = new TH.Vector3(x - hw, R, y - hh).project(cam), dpr = window.devicePixelRatio || 1;
        return [(reg.x + (v.x * 0.5 + 0.5) * reg.w) * dpr, (reg.y + (1 - (v.y * 0.5 + 0.5)) * reg.h) * dpr];
      },
      pick(cx, cy) {
        ray.setFromCamera({ x: ((cx - reg.x) / reg.w) * 2 - 1, y: -(((cy - reg.y) / reg.h) * 2 - 1) }, cam);
        const p = ray.ray.intersectPlane(plane, new TH.Vector3()); return p ? [p.x + hw, p.z + hh] : null;
      },
      render(B) {
        B.forEach(b => {
          const m = meshes[b.id], u = m.userData; m.visible = !b.pocketed; if (b.pocketed) { u.x = null; return; }
          m.position.set(b.x - hw, R, b.y - hh);
          if (u.x !== null && !(placing && b.id === 0)) {
            const dx = b.x - u.x, dy = b.y - u.y, d = Math.hypot(dx, dy);
            if (d > 0.01 && d < 450) { ax.set(dy, 0, -dx).normalize(); q2.setFromAxisAngle(ax, d / R); m.quaternion.premultiply(q2); }
          }
          u.x = b.x; u.y = b.y;
        });
        rd.setScissorTest(true); rd.setViewport(reg.x, window.innerHeight - reg.y - reg.h, reg.w, reg.h); rd.setScissor(reg.x, window.innerHeight - reg.y - reg.h, reg.w, reg.h);
        rd.setClearColor(0x000000, 0); rd.clear(); rd.render(sc, cam);
      }
    };
    return api;
  }
  function start3D() {
    const go = () => { try { r3 = make3D(); layout(); } catch (e) { r3 = null; if (window.console) console.error("3D no disponible:", e); } };
    if (window.THREE) return go();
    const sc = document.createElement("script"); sc.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
    sc.onload = go; sc.onerror = () => { r3 = null; }; document.head.append(sc);
  }

  function open() {
    if (!el) build();
    el.classList.add("on"); running = true; layout(); start(); if (!r3) start3D();
    last = performance.now(); requestAnimationFrame(frame);
  }
  function close() { running = false; shot = null; strike = null; if (el) { hideBox(); el.classList.remove("on"); } }
  DMR.game = { open, close, isOpen: () => running };
})();