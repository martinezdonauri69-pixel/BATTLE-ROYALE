/* Pantalla de juego (dibujo y controles). F\u00edsica y reglas: js/engine/. */
(function () {
  "use strict";
  const P = DMR.physics, Rl = DMR.rules;
  if (!P || !Rl) {
    DMR.game = { open() { alert("Falta cargar js/engine/physics.js o js/engine/rules.js (physics:" + !!P + " rules:" + !!Rl + ")"); }, close() {}, isOpen: () => false };
    return;
  }
  (function () { const st = document.createElement("style"); st.id = "gstyle"; st.textContent = "#game{position:fixed;inset:0;z-index:100;display:none;background:radial-gradient(ellipse at 50% 45%,#0a1838,#02040a 75%);touch-action:none;user-select:none;color:#eaf2ff;font-family:system-ui,sans-serif}\n#game.on{display:block}#gc{position:absolute;inset:0;touch-action:none}\n.gx{position:absolute;box-sizing:border-box;border:2px solid #2b6cff;border-radius:14px;background:linear-gradient(180deg,#14203d,#080d1a);box-shadow:0 0 14px rgba(43,108,255,.5)}\n#gMenu{left:8px;top:8px;width:56px;height:56px;font-size:30px;color:#eaf2ff;cursor:pointer}\n.gp{top:8px;height:58px;display:flex;align-items:center;justify-content:flex-start;gap:8px;padding:0 10px;overflow:hidden}\n.gp img{width:40px;height:40px;border-radius:9px;border:2px solid #2b6cff;flex:none}.gp.r img{border-color:#e83a3a}\n.gp.act{border-color:#ffd25a;box-shadow:0 0 18px rgba(255,210,90,.75)}\n.gp b{font-size:15px;white-space:nowrap}.gp small{color:#8fd4ff;font-size:12px;margin-left:6px}\n.bl{display:flex;gap:4px;margin-top:3px}.bl i{width:20px;height:20px;border-radius:50%;font:700 11px/20px sans-serif;text-align:center;border:1px solid #fff9}.bl i.out{opacity:.25}\n#gTurn{top:8px;height:58px;left:50%;transform:translateX(-50%);width:170px;text-align:center;padding:5px 8px;font-weight:800;font-size:15px;color:#ffe9a6;border-color:#e83a3a;overflow:hidden}\n#gTurn small{display:block;color:#8fd4ff;font-weight:600;font-size:11px;line-height:1.15}\n#gSpin{right:8px;top:8px;width:64px;height:64px;border-radius:50%;touch-action:none}\n#gSpin i{position:absolute;left:50%;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;background:#e83a3a;box-shadow:0 0 10px #f33;pointer-events:none}\n#gPow{left:8px;width:60px;touch-action:none;background:linear-gradient(180deg,#2ecc40,#e6d92e 50%,#e83a3a)}\n#gPow b{position:absolute;left:-8px;right:-8px;top:0;height:22px;margin-top:-11px;border-radius:8px;background:linear-gradient(#fff,#9fb4d8);border:3px solid #2b6cff;pointer-events:none}\n#gPow span{position:absolute;left:0;right:0;text-align:center;font-size:12px;font-weight:800;color:#000b;pointer-events:none}\n#gBot{left:8px;bottom:8px;display:flex;height:64px;overflow:hidden}\n#gBot button{width:84px;background:none;border:0;border-right:1px solid #2b6cff66;color:#eaf2ff;font-size:11px;cursor:pointer;line-height:1.1}\n#gBot button:last-child{border:0}#gBot button.on{background:#2b6cff66;color:#ffe9a6}#gBot em{display:block;font-style:normal;font-size:26px;line-height:30px}\n.gov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:rgba(2,4,10,.82)}.gov.on{display:flex}\n.gcard{display:flex;flex-direction:column;gap:10px;width:min(340px,90vw);max-height:92vh;overflow:auto;padding:22px;border-radius:18px;border:2px solid #2b6cff;background:linear-gradient(#101a33,#070b17);box-shadow:0 0 24px rgba(43,108,255,.5);text-align:center}\n.gcard h2{color:#ffe9a6;letter-spacing:1px}.gcard p{color:#9fc9ff;font-size:14px;text-align:left}\n.row{display:flex;justify-content:space-between;align-items:center;padding:12px 14px;border-radius:12px;border:1px solid #2b6cff88;background:#0c1630;font-weight:700;cursor:pointer}\n.row b{padding:4px 14px;border-radius:20px;background:#2b6cff;color:#fff;font-size:13px}\n.gb{min-height:46px;padding:0 16px;border-radius:12px;border:2px solid #2b6cff;background:linear-gradient(#18274a,#0a1224);color:#eaf2ff;font-weight:800;font-size:15px;cursor:pointer}.gb.gold{background:linear-gradient(#ffe9a6,#f5c04a);color:#1a1206;border-color:#ffe9a6}.gb:disabled{opacity:.55}\n.shop{width:min(96vw,900px);height:min(94vh,520px);display:flex;flex-direction:column;gap:6px;padding:10px;border-radius:16px;border:2px solid #2b6cff;background:linear-gradient(#0d1730,#05080f);box-shadow:0 0 30px rgba(43,108,255,.6)}\n.shop header{display:flex;align-items:center;gap:10px}.shop h2{flex:1;color:#eaf2ff;font-size:20px}#sBal{color:#ffe9a6;font-weight:800;white-space:pre}\n.sb{flex:1;display:flex;gap:10px;min-height:0}#sGrid{flex:1.4;overflow:auto;display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;align-content:start}\n.cc{padding:8px;border-radius:12px;border:2px solid #2b6cff55;background:#0b1428;cursor:pointer;display:flex;flex-direction:column;gap:3px}.cc.on{border-color:#38b6ff;box-shadow:0 0 12px #38b6ff}\n.cb{height:10px;border-radius:5px;margin:8px 0}.cc b{font-size:14px}.cc u{font-size:11px;text-decoration:none;color:#c9a6ff}.cc small{color:#ffe9a6;font-weight:800}\n#sDet{flex:1;overflow:auto;padding:8px;border-radius:12px;border:2px solid #2b6cff55;background:#0b1428;display:flex;flex-direction:column;gap:5px}#sDet h3{color:#fff}#sDet u{text-decoration:none;color:#c9a6ff;font-size:12px}#sDet p{font-size:12px;color:#9fc9ff}\n#sPrev{width:100%;height:110px;touch-action:none}.st{position:relative;font-size:12px;display:flex;gap:6px;flex-wrap:wrap;align-items:center}.st span{width:62px}.st b{margin-left:auto}.st i{display:block;height:6px;border-radius:3px;background:#38b6ff;flex-basis:100%}.st em{font-style:normal;color:#8fd4ff;font-size:11px;flex-basis:100%}\n.shop small{color:#8fd4ff;font-size:11px}\n\n#game #gPow{width:30px!important;border-radius:15px;box-shadow:0 0 8px rgba(43,108,255,.6)}\n#game #gPow::after{content:\"\";position:absolute;left:0;right:0;top:8px;bottom:8px;background:repeating-linear-gradient(180deg,transparent 0 16px,rgba(0,0,0,.4) 16px 18px);pointer-events:none}\n#game #gPow b{left:-5px;right:-5px;height:12px;margin-top:-6px;border-width:2px;border-radius:6px}\n#game #gPow span{display:none}\n#game .bl i.out{visibility:hidden}\n#game .gov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;background:radial-gradient(ellipse at 50% 40%,rgba(18,40,90,.85),rgba(2,4,10,.92))}\n#game .gov.on{display:flex}\n#game .gcard{border-radius:22px;border:2px solid #38b6ff;background:radial-gradient(ellipse at 50% 0,#1f3f80,#0a1224 62%);box-shadow:0 0 0 4px #070b16,0 0 34px rgba(56,182,255,.6),0 24px 50px rgba(0,0,0,.7);transform:perspective(900px) rotateX(3deg)}\n#game .gcard h2{font-size:26px;letter-spacing:2px;color:#ffe9a6;text-shadow:0 0 14px #38b6ff}\n#game .row{background:linear-gradient(#142a55,#0a1530);box-shadow:inset 0 1px 0 #ffffff22}\n#game .shop{border:2px solid #38b6ff;background:radial-gradient(ellipse at 50% 0,#17306a,#060a16 70%);box-shadow:0 0 0 4px #070b16,0 0 40px rgba(56,182,255,.55)}\n#game #sDet{display:flex;flex-direction:column;gap:5px;overflow:hidden}\n#game #sPrev{flex:1;min-height:110px;width:100%;height:auto;background:radial-gradient(ellipse at 50% 60%,#1c3a78,#08101f);border-radius:10px}\n#game #sInfo{flex:none}#game #sBtn{flex:none;display:flex;flex-direction:column;gap:4px}\n#game .st{display:grid;grid-template-columns:62px 1fr 34px;align-items:center;gap:6px;font-size:12px;flex-wrap:nowrap}\n#game .st span{width:auto}#game .st i{display:block;height:6px;border-radius:3px;background:linear-gradient(90deg,#38b6ff,#9ee7ff);flex-basis:auto}#game .st b{margin:0;text-align:right}\n#game .fx{font-size:11px;color:#8fd4ff}\n#mBody .item{background:linear-gradient(#16264a,#080d1a)!important;border:2px solid #2b6cff99!important;border-radius:14px!important;box-shadow:0 0 14px rgba(43,108,255,.35)}\n#mBody .item img{width:100px!important;height:100px!important;object-fit:contain}\n"; document.head.append(st); })();
  P.T.R = 33;                                   // bolas m\u00e1s grandes (la f\u00edsica las usa igual)
  const T = P.T, R = T.R, RAIL = 70, M = { l: 84, r: 10, t: 70, b: 10 };
  const COL = ["#f4f4f0", "#f5c518", "#1e4fd8", "#d62828", "#6a2fb5", "#f57c00", "#1b8a3a", "#7b1f1f", "#111"];
  const MSG = { break: "Saque: ajusta, apunta y tira", again: "\u00a1Sigue tirando!", turnChange: "Cambio de turno", foul: "Falta: bola en mano", rerack: "La 8 cay\u00f3 en el saque: nuevo tri\u00e1ngulo",
    win8: "Bola 8 embocada", lose8foul: "Bola 8 con falta", lose8early: "Bola 8 antes de tiempo", scratch: "blanca embocada", noContact: "no tocaste ninguna bola",
    wrongBall: "bola equivocada", noRail: "ninguna bola toc\u00f3 banda", illegalBreak: "saque ilegal" };
  const NAMES = ["Jugador 1", "Jugador 2"];

  let el, cv, g, S, balls, st, shot, strike, aim = 0, power = 0, spin = { x: 0, y: 0 };
  let fdt = 0.016, r3 = null, zoom3 = 1, dragBall = false, placing = false, blocked = false, running = false, last = 0, down = false, lastHits = 0, lastPk = 0, msg = "";
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
    el = document.createElement("div"); el.id = "game"; el.style.background = "linear-gradient(#10204a,#0a1126)";
    el.innerHTML = '<canvas id="gc"></canvas><button id="gMenu" class="gx">\u2630</button>' +
      '<div id="gp0" class="gx gp" style="left:66px;right:calc(50% + 88px)"></div><div id="gTurn" class="gx"></div>' +
      '<div id="gp1" class="gx gp r" style="left:calc(50% + 88px);right:84px"></div>' +
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
  const csave = s => DMR.store.set("cues", s);
  const curCue = () => CUES.find(c => c.id === cst().equipped) || CUES[0];
  /* ====== Los tacos tambi\u00e9n aparecen en la Tienda del lobby (misma econom\u00eda de prueba local) ====== */
  (function () {
    if (!DMR.catalog || !DMR.services) return;
    const og = DMR.catalog.get.bind(DMR.catalog);
    const icon = k => "data:image/svg+xml;utf8," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120"><defs><linearGradient id="g"><stop offset="0" stop-color="' + k.c[0] + '"/><stop offset="1" stop-color="' + k.c[1] + '"/></linearGradient></defs><g transform="rotate(-40 60 60)"><rect x="-25" y="52" width="170" height="16" rx="8" fill="url(#g)" stroke="' + k.glow + '" stroke-width="2.5"/><rect x="118" y="52" width="14" height="16" fill="#c8d2ea"/></g></svg>');
    DMR.catalog.get = async cat => cat === "cues" ? CUES.map(k => ({ id: k.id, name: k.name, price: { amount: k.price, currency: k.cur }, image: icon(k) })) : og(cat);
    DMR.services.inventory.implemented = true;
    DMR.services.inventory.owns = id => cst().owned.includes(id);
    DMR.services.shop.purchase = async id => {
      const k = CUES.find(c => c.id === id); if (!k) return { ok: false };
      const s = cst(); if (s.owned.includes(id) || s[k.cur] < k.price) return { ok: false };
      s[k.cur] -= k.price; s.owned.push(id); csave(s); return { ok: true };
    };
    DMR.services.wallet.implemented = true;
    DMR.services.wallet.getBalance = async () => ({ ok: true, data: { coins: cst().coins, gems: cst().gems } });
  })();

  function drawCue(c2, w, h, k, rot) {
    const gr = c2.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, k.c[0]); gr.addColorStop(1, k.c[1]);
    c2.shadowColor = k.glow; c2.shadowBlur = 12; c2.fillStyle = gr; c2.fillRect(0, 0, w, h); c2.shadowBlur = 0;
    for (let i = 0; i < 7; i++) { const x = (((i / 7) + rot / 6.283) % 1) * w; c2.fillStyle = k.glow; c2.globalAlpha = 0.25 + 0.35 * Math.abs(Math.sin(rot + i)); c2.fillRect(x, 0, w * 0.025, h); }
    c2.globalAlpha = 1; c2.fillStyle = "#c8d2ea"; c2.fillRect(w * 0.78, 0, w * 0.03, h); c2.fillStyle = "#111"; c2.fillRect(w * 0.9, 0, w * 0.1, h);
  }
  function cues() {
    const sh = document.createElement("div"); sh.id = "gShop"; sh.className = "gov on";
    sh.innerHTML = '<div class="shop"><header><button class="gb" id="sX">\u2190</button><h2>TIENDA DE TACOS</h2><span id="sBal"></span></header><div class="sb"><div id="sGrid"></div><div id="sDet"><canvas id="sPrev"></canvas><div id="sInfo"></div><div id="sBtn"></div></div></div><small>Econom\u00eda de prueba local: monedas y gemas de prueba, no son compras reales.</small></div>';
    el.append(sh); blocked = true;
    let sel = cst().equipped, rot = 0, pitch = 0, drag = null, alive = true, TH = window.THREE, prd = null, psc = null, pcam = null, ppiv = null, pid = null;
    const close2 = () => { alive = false; if (prd) prd.dispose(); sh.remove(); hideBox(); hud(); };
    sh.querySelector("#sX").addEventListener("click", close2);
    const bars = k => [["Potencia", k.p], ["Precisi\u00f3n", k.a], ["Efecto", k.e]].map(b => '<div class="st"><span>' + b[0] + '</span><i style="width:' + b[1] * 10 + '%"></i><b>' + b[1] + '</b></div>').join("");
    function render() {
      const s = cst(), k = CUES.find(c => c.id === sel), own = s.owned.includes(k.id), eq = s.equipped === k.id;
      sh.querySelector("#sBal").textContent = "\u25cf " + s.coins.toLocaleString() + "   \u25c6 " + s.gems.toLocaleString();
      sh.querySelector("#sGrid").innerHTML = CUES.map(c => '<div class="cc' + (c.id === sel ? " on" : "") + '" data-id="' + c.id + '"><div class="cb" style="background:linear-gradient(90deg,' + c.c[0] + ',' + c.c[1] + ');box-shadow:0 0 8px ' + c.glow + '"></div><b>' + c.name + '</b><u>' + c.rar + '</u><small>' + (s.equipped === c.id ? "EQUIPADO" : s.owned.includes(c.id) ? "TUYO" : (c.cur === "gems" ? "\u25c6 " : "\u25cf ") + c.price.toLocaleString()) + '</small></div>').join("");
      sh.querySelector("#sInfo").innerHTML = '<h3>' + k.name + ' <u>' + k.rar + '</u></h3>' + bars(k) + '<div class="fx">Fuerza ' + Math.round((0.80 + 0.02 * k.p) * 100) + '% \u00b7 Desv\u00edo -' + Math.round(k.a * 10 * (k.ctl ? 1.25 : 1)) + '% \u00b7 Giro ' + Math.round((0.5 + 0.1 * k.e) * 100) + '%</div>';
      sh.querySelector("#sBtn").innerHTML = '<button class="gb gold" id="sAct"' + (eq ? " disabled" : "") + '>' + (eq ? "Equipado" : own ? "Equipar" : "Comprar " + (k.cur === "gems" ? "\u25c6 " : "\u25cf ") + k.price.toLocaleString()) + '</button><small id="sMsg"></small>';
      sh.querySelector("#sAct").addEventListener("click", () => {
        const st2 = cst(), msg2 = sh.querySelector("#sMsg");
        if (st2.owned.includes(k.id)) { st2.equipped = k.id; csave(st2); render(); return; }
        if (st2[k.cur] < k.price) { msg2.textContent = "Saldo de prueba insuficiente."; return; }
        st2[k.cur] -= k.price; st2.owned.push(k.id); csave(st2); render();
      });
    }
    const pv = sh.querySelector("#sPrev"); pv.addEventListener("pointerdown", e => { drag = [e.clientX, e.clientY]; pv.setPointerCapture(e.pointerId); });
    pv.addEventListener("pointermove", e => { if (drag) { rot += (e.clientX - drag[0]) * 0.03; pitch += (e.clientY - drag[1]) * 0.01; drag = [e.clientX, e.clientY]; } });
    pv.addEventListener("pointerup", () => { drag = null; });
    sh.querySelector("#sGrid").addEventListener("click", e => { const c = e.target.closest(".cc"); if (c) { sel = c.dataset.id; render(); } });
    render();
    if (TH) {
      try {
        prd = new TH.WebGLRenderer({ canvas: pv, antialias: true, alpha: true }); psc = new TH.Scene(); pcam = new TH.PerspectiveCamera(30, 1, 50, 6000); pcam.position.set(0, 0, 1500);
        psc.add(new TH.HemisphereLight(0xb8d0ff, 0x202030, 0.9)); const dl = new TH.DirectionalLight(0xffffff, 1.1); dl.position.set(-600, 800, 900); psc.add(dl);
        const bl = new TH.DirectionalLight(0x38b6ff, 0.6); bl.position.set(800, -300, -500); psc.add(bl); ppiv = new TH.Group(); psc.add(ppiv);
      } catch (e) { prd = null; }
    }
    (function loop() {
      if (!alive) return;
      if (prd) {
        const k = CUES.find(c => c.id === sel), w = pv.clientWidth, h = pv.clientHeight;
        if (pv.width !== w * 2 || pv.height !== h * 2) { prd.setSize(w, h, false); prd.setPixelRatio(2); pcam.aspect = w / h; pcam.updateProjectionMatrix(); }
        if (pid !== k.id) { while (ppiv.children.length) ppiv.remove(ppiv.children[0]); const m = cueModel(TH, k); m.position.y = -725; const holder = new TH.Group(); holder.add(m); holder.name = "h"; ppiv.add(holder); pid = k.id; }
        if (!drag) rot += 0.02;
        const hd = ppiv.children[0]; hd.rotation.y = rot; ppiv.rotation.z = -0.5; ppiv.rotation.x = pitch; ppiv.scale.set(1.25, 0.62, 1.25);
        prd.setClearColor(0x000000, 0); prd.render(psc, pcam);
      } else {
        const pv2 = pv.getContext("2d"), k = CUES.find(c => c.id === sel); if (!pv2) { requestAnimationFrame(loop); return; } pv.width = 150; pv.height = 150; pv2.save(); pv2.translate(10, 128); pv2.rotate(-0.78); if (!drag) rot += 0.02; drawCue(pv2, 190, 10, k, rot); pv2.restore();
      }
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
    const pt = st.turn; st = Rl.applyShot(st, ev);
    if (st.turn !== pt) aim = st.turn === 0 ? 0 : Math.PI;      // J1 tira desde la izquierda, J2 desde la derecha
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
      if (gr) (gr === "solids" ? [1, 2, 3, 4, 5, 6, 7] : [9, 10, 11, 12, 13, 14, 15]).forEach(id => { if (st.pocketed.indexOf(id) < 0) p.querySelector(".bl").append(ballIcon(id, false)); });
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
    let f = g.createLinearGradient(0, y0, 0, y0 + h); f.addColorStop(0, "#a52a2a"); f.addColorStop(0.5, "#7a1616"); f.addColorStop(1, "#5a0e0e");
    g.fillStyle = f; g.strokeStyle = "#d9b45a"; g.lineWidth = 3 * S.dpr;
    g.beginPath(); g.roundRect(x0, y0, w, h, 30 * s); g.fill(); g.stroke(); g.shadowBlur = 0;
    const cu = 42 * s; g.fillStyle = "#3aa6dd"; g.fillRect(X(0) - cu, Y(0) - cu, T.W * s + 2 * cu, T.H * s + 2 * cu);
    f = g.createRadialGradient(X(T.W / 2), Y(T.H / 2), 50 * s, X(T.W / 2), Y(T.H / 2), T.W * 0.6 * s); f.addColorStop(0, "#52b9e8"); f.addColorStop(1, "#1f7fb8");
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

  function legal(id) {
    const gr = st.groups[st.turn]; if (st.phase === "break") return true; if (st.phase === "open") return id !== 8;
    return Rl.remaining(st, gr).length === 0 ? id === 8 : Rl.groupOf(id) === gr;
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
    if (hit && !legal(hit.id)) {                       // bola no permitida: s\u00edmbolo de prohibido, sin predicci\u00f3n
      circ(ex, ey, R, "#ff3b3b", 3); line(ex - R * 0.7, ey - R * 0.7, ex + R * 0.7, ey + R * 0.7, "#ff3b3b", 3);
    } else if (opt.traj && hit) {
      let nx = hit.x - ex, ny = hit.y - ey; const nl = Math.hypot(nx, ny); nx /= nl; ny /= nl;
      circ(ex, ey, R, "rgba(255,255,255,.85)", 1.5);
      line(hit.x, hit.y, hit.x + nx * 260, hit.y + ny * 260, "#ff6b6b", 1.4, [8, 6]);                    // bola objetivo
      let tx = dx - (dx * nx + dy * ny) * nx, ty = dy - (dx * nx + dy * ny) * ny; const tl = Math.hypot(tx, ty);
      if (tl > 0.05) line(ex, ey, ex + tx / tl * 220, ey + ty / tl * 220, "#ffd25a", 1.4, [3, 6]);       // continuaci\u00f3n de la blanca
    }
  }

  function stick(c, back) {
    if (r3) { r3.cueState = { c, back }; return; }
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
    if (!r3) table(); else r3.cueState = null;
    const c = B[0];
    if (!shot && !strike && !st.over && !blocked) guide(c);
    if (!r3) B.forEach(b => { if (!b.pocketed) ball(b); });
    if (placing) circ(c.x, c.y, R * 1.6, "#ffd25a", 3);
    if (!shot && !st.over && !c.pocketed) {
      if (strike) { const k = Math.min(1, strike.t / 0.14); stick(c, R + 12 + strike.pw * 240 * (1 - k * k)); }
      else stick(c, R + 12 + power * 240);
    }
    if (r3) r3.render(B);
  }

  function frame(t) {
    if (!running) return;
    const dt = Math.min(0.05, (t - last) / 1000 || 0); last = t; fdt = dt;
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

  /* ====== Etapa 2: tacos 3D con texturas \u00fanicas (geometr\u00eda real + textura procedural) ====== */
  const texCache = {};
  function cueTex(TH, k) {
    if (texCache[k.id]) return texCache[k.id];
    const cn = document.createElement("canvas"); cn.width = 256; cn.height = 1024; const c = cn.getContext("2d"); let seed = k.id.length * 977 + k.p;
    const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    const base = (a, b) => { const gr = c.createLinearGradient(0, 0, 0, 1024); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(0, 0, 256, 1024); };
    const line = (pts, col, w, glow) => { c.strokeStyle = col; c.lineWidth = w; c.shadowColor = glow || col; c.shadowBlur = glow === 0 ? 0 : 10; c.beginPath(); pts.forEach((q, i) => i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1])); c.stroke(); c.shadowBlur = 0; };
    const id = k.id;
    if (id === "cyber") { base("#05070d", "#0a1430"); for (let x = 20; x < 256; x += 42) { const p = []; for (let y = 0; y <= 1024; y += 64) p.push([x + ((y / 64) % 2 ? 14 : -14), y]); line(p, "#38b6ff", 4); } line([[0, 30], [256, 30]], "#9ee7ff", 8); line([[0, 994], [256, 994]], "#9ee7ff", 8); }
    else if (id === "inferno") { base("#080304", "#1a0505"); for (let i = 0; i < 16; i++) { let x = rnd() * 256, y = rnd() * 1024; const p = [[x, y]]; for (let j = 0; j < 7; j++) { x += (rnd() - 0.5) * 60; y += 40 + rnd() * 60; p.push([x, y]); } line(p, i % 3 ? "#ff3b2f" : "#ffb347", 2 + rnd() * 3); } }
    else if (id === "dragon") { base("#f5c04a", "#9a6410"); for (let w = 0; w < 3; w++) { const p = []; for (let y = 0; y <= 1024; y += 16) p.push([128 + 70 * Math.sin(y * 0.018 + w * 2.1), y]); line(p, "#5a3a05", 4, 0); } for (let y = 80; y < 1024; y += 170) { c.strokeStyle = "#5a3a05"; c.lineWidth = 3; c.beginPath(); c.arc(128, y, 34, 0, 7); c.stroke(); c.beginPath(); c.arc(128, y, 18, 0, 7); c.stroke(); } }
    else if (id === "hielo") { base("#e8fbff", "#4aa8e0"); for (let i = 0; i < 40; i++) { const x = rnd() * 256, y = rnd() * 1024, s2 = 20 + rnd() * 50; line([[x, y], [x + s2, y + s2 * 0.5], [x + s2 * 0.3, y + s2], [x, y]], "rgba(255,255,255,.9)", 2, "#bff3ff"); } line([[0, 20], [256, 20]], "#c8d2ea", 10, 0); }
    else if (id === "nebulosa") { base("#14062e", "#0a1a55"); ["#c36bff", "#38b6ff", "#ff6bd6", "#6b8cff"].forEach(col => { for (let i = 0; i < 3; i++) { const x = rnd() * 256, y = rnd() * 1024, g2 = c.createRadialGradient(x, y, 0, x, y, 120); g2.addColorStop(0, col); g2.addColorStop(1, "rgba(0,0,0,0)"); c.globalAlpha = 0.5; c.fillStyle = g2; c.fillRect(x - 120, y - 120, 240, 240); c.globalAlpha = 1; } }); c.fillStyle = "#fff"; for (let i = 0; i < 160; i++) { c.beginPath(); c.arc(rnd() * 256, rnd() * 1024, rnd() * 2 + 0.5, 0, 7); c.fill(); } }
    else if (id === "legendario") { base("#ffe28a", "#b8860b"); for (let d = -1024; d < 1280; d += 64) { line([[0, d], [256, d + 256]], "#7a5206", 2, 0); line([[0, d + 256], [256, d]], "#fff6c8", 2, 0); } }
    else if (id === "vandalo") { base("#060608", "#14090a"); for (let i = 0; i < 12; i++) { const x = rnd() * 256, y = rnd() * 1024; line([[x, y], [x + 70, y + 40 + rnd() * 50]], "#e8453c", 5 + rnd() * 6); } line([[0, 40], [256, 40]], "#9aa0aa", 6, 0); }
    else if (id === "sombrio") { base("#040308", "#120a22"); for (let w = 0; w < 2; w++) { const p = []; for (let y = 0; y <= 1024; y += 16) p.push([128 + 80 * Math.sin(y * 0.03 + w * 3), y]); line(p, "#8a7ad0", 3); } }
    else { base("#b98a52", "#3a2412"); [100, 900].forEach(y => line([[0, y], [256, y]], "#f4e3c0", 6, 0)); }
    const t = new TH.CanvasTexture(cn); t.anisotropy = 4; return (texCache[k.id] = t);
  }
  function cueModel(TH, k) {
    const grp = new TH.Group(), t = cueTex(TH, k);
    const part = (y0, y1, r0, r1, mat) => { const m = new TH.Mesh(new TH.CylinderGeometry(r1, r0, y1 - y0, 20), mat); m.position.y = (y0 + y1) / 2; m.castShadow = true; grp.add(m); };
    const metal = new TH.MeshStandardMaterial({ color: 0xc8d2ea, metalness: 0.95, roughness: 0.2 });
    part(0, 12, 5.4, 5.6, new TH.MeshStandardMaterial({ color: 0x3a6fd0, roughness: 0.9 }));
    part(12, 37, 6, 6.1, new TH.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }));
    part(37, 560, 6.2, 7.6, new TH.MeshStandardMaterial({ color: 0xe6cfa0, roughness: 0.45 }));
    part(560, 580, 8.4, 8.4, metal);
    part(580, 1390, 8.4, 12.6, new TH.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.22, metalness: 0.35, roughness: 0.3 }));
    part(1390, 1402, 12.8, 12.8, metal);
    part(1402, 1450, 12.6, 12.2, new TH.MeshStandardMaterial({ color: 0x15151c, roughness: 0.4 }));
    return grp;
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
    [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([a, b]) => { const l = new TH.PointLight(0xff2b2b, 0.7, 900); l.position.set(a * 1450, 140, b * 800); sc.add(l); });
    const bl = new TH.PointLight(0x2b6cff, 0.5, 3500); bl.position.set(0, 700, 0); sc.add(bl);
    const box = (w, h, d, x, y, z, mat) => { const m = new TH.Mesh(new TH.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.receiveShadow = true; m.castShadow = true; sc.add(m); return m; };
    const tx = (w, h, fn) => { const cn = document.createElement("canvas"); cn.width = w; cn.height = h; fn(cn.getContext("2d"), w, h); const t = new TH.CanvasTexture(cn); t.anisotropy = 4; return t; };
    const felt = tx(512, 256, (c2, w, h) => {
      const gr = c2.createRadialGradient(w / 2, h / 2, 20, w / 2, h / 2, w * 0.62); gr.addColorStop(0, "#1f78f0"); gr.addColorStop(1, "#0a3a94"); c2.fillStyle = gr; c2.fillRect(0, 0, w, h);
      for (let i = 0; i < 9000; i++) { c2.fillStyle = Math.random() < 0.5 ? "rgba(255,255,255,.06)" : "rgba(0,20,70,.10)"; c2.fillRect(Math.random() * w, Math.random() * h, 2, 2); }
      c2.strokeStyle = "rgba(120,190,255,.16)"; c2.lineWidth = 3; c2.beginPath(); c2.arc(w / 2, h / 2, 52, 0, 7); c2.stroke(); c2.beginPath(); c2.arc(w / 2, h / 2, 38, 0, 7); c2.stroke();
      c2.fillStyle = "rgba(120,190,255,.16)"; c2.font = "bold 40px sans-serif"; c2.textAlign = "center"; c2.textBaseline = "middle"; c2.fillText("DMR", w / 2, h / 2 + 2);
    });
    const wood = tx(256, 256, (c2, w, h) => {
      c2.fillStyle = "#8f1d1d"; c2.fillRect(0, 0, w, h);
      for (let i = 0; i < 90; i++) { c2.strokeStyle = Math.random() < 0.5 ? "rgba(60,5,5,.35)" : "rgba(220,90,70,.18)"; c2.lineWidth = 1 + Math.random() * 2; const y = Math.random() * h; c2.beginPath(); c2.moveTo(0, y); c2.bezierCurveTo(w * 0.3, y + 6, w * 0.7, y - 6, w, y + 2); c2.stroke(); }
    });
    wood.wrapS = wood.wrapT = TH.RepeatWrapping; wood.repeat.set(6, 1);
    const cloth = new TH.Mesh(new TH.PlaneGeometry(W, H), new TH.MeshStandardMaterial({ map: felt, roughness: 0.95 })); cloth.rotation.x = -Math.PI / 2; cloth.receiveShadow = true; sc.add(cloth);
    const pad = new TH.MeshStandardMaterial({ color: 0x0f3a94, roughness: 0.7, emissive: 0x05163f }), frame = new TH.MeshStandardMaterial({ color: 0x1a2233, metalness: 0.75, roughness: 0.32 });
    const neonB = new TH.MeshBasicMaterial({ color: 0x38b6ff }), neonR = new TH.MeshBasicMaterial({ color: 0xff4b4b });
    const hw = W / 2, hh = H / 2, gc = 74, gm = 62, cz = 56, fz = 70;
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
    const dia = new TH.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.3 });
    for (let i = 1; i < 8; i++) if (i !== 4) [-1, 1].forEach(sg => { const m = new TH.Mesh(new TH.CylinderGeometry(7, 7, 3, 12), dia); m.position.set(-hw + W * i / 8, 81, sg * (hh + cz + fz / 2)); sc.add(m); });
    for (let i = 1; i < 4; i++) [-1, 1].forEach(sx => { const m = new TH.Mesh(new TH.CylinderGeometry(7, 7, 3, 12), dia); m.position.set(sx * (hw + cz + fz / 2), 81, -hh + H * i / 4); sc.add(m); });
    P.POCKETS.forEach(p => {
      const px = p.x - hw, pz = p.y - hh, hole = new TH.Mesh(new TH.CircleGeometry(p.r * 0.92, 32), new TH.MeshBasicMaterial({ color: 0x000000 }));
      hole.rotation.x = -Math.PI / 2; hole.position.set(px, 1.5, pz); sc.add(hole);
      const ring = new TH.Mesh(new TH.TorusGeometry(p.r * 0.95, 6, 10, 32), new TH.MeshStandardMaterial({ color: 0x9aa7c4, metalness: 0.9, roughness: 0.25 }));
      ring.rotation.x = Math.PI / 2; ring.position.set(px, 4, pz); sc.add(ring);
      const glow = new TH.Mesh(new TH.TorusGeometry(p.r * 0.84, 3, 8, 32), new TH.MeshBasicMaterial({ color: 0xff3b3b })); glow.rotation.x = Math.PI / 2; glow.position.set(px, 3, pz); sc.add(glow);
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
    const dir = new TH.Vector3(), q2 = new TH.Quaternion(), ax = new TH.Vector3(), pivot = new TH.Group(); sc.add(pivot);
    let cueId = null, cueObj = null;
    const api = {
      cueState: null,
      resize() {
        const Wc = window.innerWidth, Hc = window.innerHeight; rd.setSize(Wc, Hc);
        reg.x = 190; reg.y = 62; reg.w = Wc - 196; reg.h = Hc - 62 - 4; cam.aspect = reg.w / reg.h; cam.updateProjectionMatrix(); api.fit();
      },
      fit() {
        const el2 = 1.5, ty = Math.sin(el2), tz = Math.cos(el2), ext = [[-hw - 140, -hh - 140], [hw + 140, -hh - 140], [-hw - 140, hh + 140], [hw + 140, hh + 140]];
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
          const m = meshes[b.id], u = m.userData;
          if (b.pocketed) {
            if (!u.sink) { let bp = P.POCKETS[0], bd = 1e9; P.POCKETS.forEach(p => { const dd = Math.hypot(p.x - b.x, p.y - b.y); if (dd < bd) { bd = dd; bp = p; } }); u.sink = { t: 0, x: b.x, y: b.y, p: bp }; }
            const sk = u.sink; sk.t += fdt; const kk = Math.min(1, sk.t / 0.45);
            m.visible = kk < 1; m.position.set(sk.x + (sk.p.x - sk.x) * kk - hw, R - kk * R * 2.2, sk.y + (sk.p.y - sk.y) * kk - hh); m.scale.setScalar(1 - 0.25 * kk);
            m.quaternion.premultiply(q2.setFromAxisAngle(ax.set(1, 0, 0), 0.25)); u.x = null; return;
          }
          if (u.sink) { u.sink = null; m.scale.setScalar(1); }
          m.visible = true;
          m.position.set(b.x - hw, R, b.y - hh);
          if (u.x !== null && !(placing && b.id === 0)) {
            const dx = b.x - u.x, dy = b.y - u.y, d = Math.hypot(dx, dy);
            if (d > 0.01 && d < 450) { ax.set(dy, 0, -dx).normalize(); q2.setFromAxisAngle(ax, d / R); m.quaternion.premultiply(q2); }
          }
          u.x = b.x; u.y = b.y;
        });
        const cs = api.cueState;
        if (cs) {
          const k = curCue(); if (cueId !== k.id) { if (cueObj) pivot.remove(cueObj); cueObj = cueModel(TH, k); pivot.add(cueObj); cueId = k.id; }
          const dx = Math.cos(aim), dz = Math.sin(aim), tl = 0.07;
          pivot.position.set(cs.c.x - hw - dx * cs.back, R, cs.c.y - hh - dz * cs.back);
          pivot.quaternion.setFromUnitVectors(new TH.Vector3(0, 1, 0), new TH.Vector3(-dx * Math.cos(tl), Math.sin(tl), -dz * Math.cos(tl)));
          pivot.visible = true;
        } else pivot.visible = false;
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