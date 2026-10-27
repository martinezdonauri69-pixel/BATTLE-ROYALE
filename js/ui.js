/* =====================================================================
   UI del menú: escalado, botones, ventanas (modales), tienda, perfil, ajustes.
   Cada botón del HTML tiene data-action="nombre" -> se ejecuta ACTIONS[nombre].
   ===================================================================== */
(function () {
  "use strict";
  const NS = "http://www.w3.org/2000/svg";
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const t = k => DMR.i18n.t(k);

  let scale = 1;

  /* ---------- helpers DOM ---------- */
  function h(tag, attrs) {
    const el = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (k === "class") el.className = v;
      else if (k.slice(0, 2) === "on") el.addEventListener(k.slice(2), v);
      else if (v !== false && v != null) el.setAttribute(k, v);
    }
    for (let i = 2; i < arguments.length; i++) {
      [].concat(arguments[i]).forEach(c => { if (c != null) el.append(c.nodeType ? c : document.createTextNode(c)); });
    }
    return el;
  }
  function icon(id, cls) {
    const s = document.createElementNS(NS, "svg");
    s.setAttribute("class", "ic " + (cls || ""));
    const u = document.createElementNS(NS, "use");
    u.setAttribute("href", "#i-" + id);
    s.append(u);
    return s;
  }

  /* ---------- escalado del escenario 1600x900 ---------- */
  function fit() {
    const vv = window.visualViewport;
    const w = vv ? vv.width : window.innerWidth;
    const hgt = vv ? vv.height : window.innerHeight;
    scale = Math.min(w / DMR.config.stage.w, hgt / DMR.config.stage.h);
    const x = (w - DMR.config.stage.w * scale) / 2;
    const y = (hgt - DMR.config.stage.h * scale) / 2;
    $("#stage").style.transform = "translate(" + x + "px," + y + "px) scale(" + scale + ")";
    document.body.classList.toggle("portrait", hgt > w);
  }

  /* ---------- toast ---------- */
  let toastTimer;
  function toast(msg) {
    const el = $("#toast");
    el.textContent = msg;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  /* ---------- modal ---------- */
  let lastFocus = null;
  function openModal(titleText, iconId, bodyNode) {
    lastFocus = document.activeElement;
    $("#mTitle").textContent = titleText;
    $("#mIcon").firstElementChild.setAttribute("href", "#i-" + (iconId || "star"));
    $("#mBody").replaceChildren(bodyNode);
    $("#modal").classList.add("open");
    $("#mClose").focus();
  }
  function closeModal() {
    $("#modal").classList.remove("open");
    if (lastFocus && lastFocus.focus) lastFocus.focus();
  }

  function devNotice(needs) {
    if (!DMR.config.showDevNotices || !needs || !needs.length) return null;
    return h("div", { class: "dev" },
      h("b", {}, t("devNotice") + " · " + t("missing")),
      h("ul", {}, needs.map(n => h("li", {}, n))));
  }

  /* ---------- secciones genéricas ----------
     id -> { title: clave i18n, icon, svc: área de DMR.services, call: método principal }
     Si el servicio responde ok:true, se usa DMR.ui.renderers[id](data) para dibujarlo.   */
  const SECTIONS = {
    friends:      { title: "friends",       icon: "users",     svc: "friends",     call: "list" },
    messages:     { title: "messages",      icon: "mail",      svc: "messages",    call: "list" },
    ranking:      { title: "ranking",       icon: "chart",     svc: "leaderboard", call: "getRanking" },
    ranks:        { title: "ranks",         icon: "crown",     svc: "ranks",       call: "list" },
    rewards:      { title: "rewards",       icon: "gift",      svc: "rewards",     call: "list" },
    events:       { title: "events",        icon: "calendar",  svc: "events",      call: "list" },
    tournaments:  { title: "tournaments",   icon: "trophy",    svc: "tournaments", call: "list" },
    pass:         { title: "seasonPass",    icon: "star",      svc: "pass",        call: "get" },
    missions:     { title: "dailyMissions", icon: "clipboard", svc: "missions",    call: "list" },
    offers:       { title: "specialOffer",  icon: "tag",       svc: "offers",      call: "list" },
    collection:   { title: "collection",    icon: "cards",     svc: "collection",  call: "list" },
    achievements: { title: "achievements",  icon: "trophy",    svc: "achievements",call: "list" },
    play:         { title: "play",          icon: "ball",      svc: "matchmaking" },
    friendly:     { title: "friendly",      icon: "users",     svc: "rooms" },
    online:       { title: "onlinePlayers", icon: "globe",     svc: "matchmaking" },
    coins:        { title: "getCoins",      icon: "cash",      svc: "wallet" },
    gems:         { title: "getCoins",      icon: "coin",      svc: "wallet" }
  };

  function placeholder(sec) {
    const svc = DMR.services[sec.svc];
    return h("div", { class: "empty" },
      icon(sec.icon, "big2"),
      h("p", { class: "soon" }, t("comingSoon")),
      h("p", { class: "sub" }, t("notReady")),
      devNotice(svc && svc.needs));
  }

  function openSection(id) {
    const sec = SECTIONS[id];
    if (!sec) return;
    const svc = DMR.services[sec.svc];
    const custom = DMR.ui.renderers[id];
    const finish = body => openModal(t(sec.title), sec.icon, body);
    if (sec.call && svc && typeof svc[sec.call] === "function") {
      Promise.resolve(svc[sec.call]()).then(r => {
        finish(r && r.ok && custom ? custom(r.data) : placeholder(sec));
      }).catch(() => finish(placeholder(sec)));
    } else {
      finish(custom ? custom() : placeholder(sec));
    }
  }

  /* ---------- tienda ---------- */
  const SHOP_TABS = [["cues", "cue"], ["balls", "ball"], ["tables", "table"]];

  function openShop(category) {
    const body = h("div", {});
    const tabs = h("div", { class: "tabs" });
    const grid = h("div", { class: "grid" });
    let current = category || "cues";

    SHOP_TABS.forEach(([key, ic]) => {
      tabs.append(h("button", { class: "tab btn" + (key === current ? " on" : ""), "data-tab": key,
        onclick: () => load(key) }, icon(ic), t(key)));
    });
    body.append(tabs, grid);
    openModal(t("shop"), "cart", body);

    async function load(key) {
      current = key;
      $$(".tab", tabs).forEach(b => b.classList.toggle("on", b.dataset.tab === key));
      grid.replaceChildren();
      let items = [];
      try { items = await DMR.catalog.get(key); } catch (e) { items = []; }
      if (!items.length) {
        grid.style.display = "block";
        grid.append(h("div", { class: "empty" },
          icon("cart", "big2"),
          h("p", { class: "soon" }, t("emptyCatalog")),
          devNotice(DMR.services.shop.needs)));
        return;
      }
      grid.style.display = "";
      const invOn = DMR.services.inventory.implemented;
      const iconId = SHOP_TABS.find(x => x[0] === key)[1];
      items.forEach(it => {
        const cur = it.price && it.price.currency === "gems" ? "coin" : "cash";
        const owned = invOn && DMR.services.inventory.owns(it.id);
        const card = h("div", { class: "item" },
          it.image ? h("img", { src: it.image, alt: "", width: 60, height: 60 }) : icon(iconId),
          h("div", { class: "nm" }, DMR.i18n.loc(it.name)),
          it.price ? h("div", { class: "pr" }, icon(cur, cur === "coin" ? "gold" : "green"), String(it.price.amount)) : null,
          invOn ? h("div", { class: "st" + (owned ? "" : " no") }, owned ? t("owned") : t("notOwned")) : null,
          h("button", { class: "buy btn", disabled: owned ? "" : false, onclick: () => buy(it) }, t("buy")),
          DMR.catalog.isDemo ? h("div", { class: "demo-tag" }, "DEMO") : null);
        grid.append(card);
      });
    }

    async function buy(item) {
      const r = await DMR.services.shop.purchase(item.id);
      if (r && r.ok) { toast(t("saved")); DMR.ui.refresh(); load(current); }
      else toast(t("notReady"));
    }
    load(current);
  }

  /* ---------- perfil ---------- */
  function openProfile() {
    const input = h("input", { type: "text", maxlength: "16", value: DMR.store.get("name", ""), placeholder: t("guest") });
    const save = h("button", { class: "primary btn", onclick: () => {
      const v = input.value.trim().slice(0, 16);
      DMR.store.set("name", v);
      DMR.ui.refresh();
      toast(t("saved"));
    } }, t("save"));
    const stats = h("div", { class: "stats" },
      h("div", {}, h("small", {}, t("level")), h("b", { id: "pfLevel" }, $("#pLevel").textContent)),
      h("div", {}, h("small", {}, t("xp")), h("b", { id: "pfXp" }, $("#xpText").textContent)),
      h("div", {}, h("small", {}, t("ranks")), h("b", { id: "pfRank" }, $("#pRank").textContent)));
    const body = h("div", {}, stats,
      h("div", { class: "form" }, h("label", {}, t("name")), input, save),
      devNotice(DMR.services.profile.needs));
    openModal(t("profile"), "user", body);
  }

  /* ---------- ajustes / idioma ---------- */
  function openSettings() {
    const grid = h("div", { class: "langgrid" });
    DMR.i18n.langs.forEach(l => {
      grid.append(h("button", { class: "lg btn" + (l.code === DMR.i18n.lang ? " on" : ""), onclick: () => {
        DMR.i18n.set(l.code);
        openSettings();
      } }, l.name));
    });
    openModal(t("settings"), "gear", h("div", {},
      h("p", { class: "about", style: "margin:0 0 12px;font-size:18px;font-weight:800;color:#8fd4ff" }, t("language")), grid,
      devNotice(DMR.services.settings.needs)));
  }

  /* ---------- más opciones ---------- */
  function openMore() {
    const items = [["friends", "users"], ["messages", "mail"], ["ranking", "chart"], ["events", "calendar"], ["rewards", "gift"], ["settings", "gear"]];
    const grid = h("div", { class: "menugrid" });
    items.forEach(([a, ic]) => {
      grid.append(h("button", { class: "mg btn", onclick: () => ACTIONS[a]() }, icon(ic), t(a)));
    });
    openModal(t("more"), "more", h("div", {}, grid,
      h("p", { class: "about" }, DMR.config.gameName + " · v" + DMR.config.version)));
  }

  /* ---------- acciones de juego (puntos de integración) ---------- */
  function startAction(sectionId, svcName, method, eventName) {
    const svc = DMR.services[svcName];
    Promise.resolve(svc[method]()).then(r => {
      if (r && r.ok) document.dispatchEvent(new CustomEvent(eventName, { detail: r.data }));
      else openSection(sectionId);
    }).catch(() => openSection(sectionId));
  }

  /* ---------- tabla de acciones: data-action -> función ---------- */
  const ACTIONS = {
    home()         { closeModal(); },
    shop()         { openShop("cues"); },
    cues()         { openShop("cues"); },
    balls()        { openShop("balls"); },
    tables()       { openShop("tables"); },
    profile()      { openProfile(); },
    settings()     { openSettings(); },
    more()         { openMore(); },
    play()         { startAction("play", "matchmaking", "quickMatch", "dmr:quick-match"); },
    friendly()     { startAction("friendly", "rooms", "createPrivate", "dmr:private-room"); },
    tournaments()  { openSection("tournaments"); },
    friends()      { openSection("friends"); },
    messages()     { openSection("messages"); },
    ranking()      { openSection("ranking"); },
    ranks()        { openSection("ranks"); },
    rewards()      { openSection("rewards"); },
    events()       { openSection("events"); },
    pass()         { openSection("pass"); },
    missions()     { openSection("missions"); },
    offers()       { openSection("offers"); },
    collection()   { openSection("collection"); },
    achievements() { openSection("achievements"); },
    online()       { openSection("online"); },
    getCoins()     { openSection("coins"); },
    getGems()      { openSection("gems"); }
  };

  /* ---------- cabecera (datos reales o "—") ---------- */
  function num(n) { return typeof n === "number" ? n.toLocaleString(DMR.i18n.lang) : "—"; }

  function refresh() {
    const S = DMR.services;
    $("#pName").textContent = DMR.store.get("name", "") || t("guest");
    $("#pRank").textContent = t("noRank");
    $("#pLevel").textContent = "—";
    $("#xpText").textContent = "— / —";
    $("#xpFill").style.width = "0";
    $("#coins").textContent = "—";
    $("#gems").textContent = "—";
    $("#onlineCount").textContent = "—";

    S.profile.getStats().then(r => {
      if (!r.ok) return;
      const d = r.data || {};
      if (d.rank) $("#pRank").textContent = d.rank;
      if (typeof d.level === "number") $("#pLevel").textContent = d.level;
      if (typeof d.xp === "number" && typeof d.xpNext === "number" && d.xpNext > 0) {
        $("#xpText").textContent = num(d.xp) + " / " + num(d.xpNext);
        $("#xpFill").style.width = Math.min(100, d.xp / d.xpNext * 100) + "%";
      }
    });
    S.wallet.getBalance().then(r => {
      if (!r.ok) return;
      $("#coins").textContent = num(r.data.coins);
      $("#gems").textContent = num(r.data.gems);
    });
    S.matchmaking.getOnlineCount().then(r => {
      if (r.ok) $("#onlineCount").textContent = num(r.data.count);
    });
    S.leaderboard.getLatestWinners().then(r => {
      if (!r.ok || !Array.isArray(r.data) || !r.data.length) return;
      const box = $("#winnersList");
      box.replaceChildren();
      r.data.slice(0, 3).forEach((w, i) => box.append(h("span", {}, (i + 1) + ". " + w.name + (w.prize ? " · " + w.prize : ""))));
    });
  }

  /* ---------- ripple ---------- */
  function ripple(e) {
    const btn = e.target.closest(".btn");
    if (!btn || btn.disabled) return;
    const r = btn.getBoundingClientRect();
    const size = Math.max(r.width, r.height) / scale * 2;
    const x = (e.clientX - r.left) / scale - size / 2;
    const y = (e.clientY - r.top) / scale - size / 2;
    const s = h("span", { class: "ripple" });
    s.style.cssText = "width:" + size + "px;height:" + size + "px;left:" + x + "px;top:" + y + "px";
    btn.append(s);
    setTimeout(() => s.remove(), 650);
  }

  /* ---------- arranque ---------- */
  function init() {
    // selector de idioma
    const sel = $("#langSel");
    DMR.i18n.langs.forEach(l => sel.append(h("option", { value: l.code }, l.name)));
    sel.addEventListener("change", () => { DMR.i18n.set(sel.value); refresh(); });

    DMR.i18n.set(DMR.i18n.detect(), true);

    document.addEventListener("pointerdown", ripple);
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-action]");
      if (!el) return;
      const fn = ACTIONS[el.dataset.action];
      if (fn) fn(el); else toast(t("notReady"));
    });
    $("#mClose").addEventListener("click", closeModal);
    $("#modal").addEventListener("click", e => { if (e.target.id === "modal") closeModal(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });
    document.addEventListener("dmr:lang", refresh);
    // evita el menú contextual al mantener pulsado en móvil
    document.addEventListener("contextmenu", e => { if (e.target.tagName !== "INPUT") e.preventDefault(); });

    window.addEventListener("resize", fit);
    window.addEventListener("orientationchange", () => setTimeout(fit, 150));
    if (window.visualViewport) window.visualViewport.addEventListener("resize", fit);
    fit();
    refresh();
  }

  DMR.ui = { init, refresh, toast, openModal, closeModal, openSection, openShop, renderers: {}, actions: ACTIONS };
})();