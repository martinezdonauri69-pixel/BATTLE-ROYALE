/* =====================================================================
   CAPA DE SERVICIOS — aquí se conectan los sistemas reales del juego.

   Cada área (partidas, torneos, monedero, amigos...) es un objeto con métodos
   que devuelven una Promise con este formato:

     { ok: true,  data: ... }                  -> funciona, el menú muestra los datos
     { ok: false, reason: "not_implemented" }  -> aún no existe (estado actual)

   Hoy TODOS están sin implementar a propósito: el menú no inventa jugadores,
   monedas, compras, recompensas ni resultados. Para conectar un sistema real:

     DMR.services.wallet.getBalance = async () => {
       const r = await fetch("https://tu-servidor/api/wallet");
       return { ok: true, data: await r.json() };          // { coins: 1200, gems: 30 }
     };
     DMR.services.wallet.implemented = true;
     DMR.ui.refresh();                                      // repinta la cabecera

   Formato de datos esperado por cada método: ver comentarios en cada área.
   ===================================================================== */
(function () {
  function area(name, needs, methods) {
    const o = { name, needs, implemented: false };
    methods.forEach(m => {
      o[m] = function () {
        return Promise.resolve({ ok: false, reason: "not_implemented", service: name, needs });
      };
    });
    return o;
  }

  DMR.services = {
    // Cuentas / sesión.   getSession -> { id, name, avatarUrl? }
    auth: area("auth", [
      "Sistema de cuentas o inicio de sesión (p. ej. Firebase Auth, Supabase, PlayFab o servidor propio)"
    ], ["getSession", "signIn", "signOut"]),

    // Estadísticas del jugador.   getStats -> { level, xp, xpNext, rank }
    profile: area("profile", [
      "Base de datos de jugadores con nivel, experiencia y rango",
      "Cuentas de usuario (auth)"
    ], ["getStats"]),

    // Monedero.   getBalance -> { coins, gems }
    wallet: area("wallet", [
      "Monedero del jugador guardado en servidor (no en el dispositivo, para evitar trampas)",
      "Pasarela de pago real (Google Play Billing para Android) para comprar monedas"
    ], ["getBalance"]),

    // Partidas.   quickMatch -> { matchId, opponent, ... }   getOnlineCount -> { count }
    matchmaking: area("matchmaking", [
      "Escena de juego de billar (mesa, físicas, reglas del 8 ball)",
      "Servidor de partidas en tiempo real (WebSocket, Colyseus, Photon, Nakama, etc.)",
      "Emparejamiento 1 vs 1 y contador de jugadores conectados"
    ], ["quickMatch", "getOnlineCount"]),

    // Salas privadas.   createPrivate -> { roomCode }   joinByCode(code)
    rooms: area("rooms", [
      "Servidor de partidas en tiempo real con salas privadas",
      "Sistema de amigos / invitaciones",
      "Modo contra la IA (si lo quieres: motor de bot)"
    ], ["createPrivate", "joinByCode"]),

    // Torneos.   list -> [{ id, name, prize, startsAt, entry }]   join(id)
    tournaments: area("tournaments", [
      "Backend de torneos (inscripción, cuadros, premios, calendario)",
      "Servidor de partidas en tiempo real",
      "Sistema de premios conectado al monedero"
    ], ["list", "join"]),

    // Amigos.   list -> [{ id, name, online }]
    friends: area("friends", ["Backend de amigos (solicitudes, lista, estado en línea)", "Cuentas de usuario (auth)"], ["list"]),
    // Mensajes.   list -> [{ id, from, text, at }]
    messages: area("messages", ["Backend de mensajes / chat", "Cuentas de usuario (auth)"], ["list"]),
    // Ranking.   getRanking -> [{ pos, name, score }]   getLatestWinners -> [{ name, prize }]
    leaderboard: area("leaderboard", ["Backend de ranking con resultados reales de partidas", "Registro de ganadores de torneos"], ["getRanking", "getLatestWinners"]),
    // Rangos.     list -> [{ id, name, minPoints }]
    ranks: area("ranks", ["Definición de rangos y puntos necesarios", "Sistema de puntos por partida"], ["list"]),
    // Recompensas.  list -> [{ id, name, claimable }]   claim(id)
    rewards: area("rewards", ["Sistema de recompensas con validación en servidor"], ["list", "claim"]),
    // Eventos.   list -> [{ id, name, endsAt }]
    events: area("events", ["Backend de eventos con fechas de inicio y fin"], ["list"]),
    // Pase de temporada.   get -> { level, xp, xpNext, tiers: [...] }
    pass: area("pass", ["Sistema de pase de temporada (niveles, premios, fechas)", "Monedero / inventario para entregar premios"], ["get"]),
    // Misiones diarias.   list -> [{ id, text, progress, goal }]
    missions: area("missions", ["Sistema de misiones diarias y progreso por partida"], ["list"]),
    // Ofertas.   list -> [{ id, title, discount, endsAt }]
    offers: area("offers", ["Sistema de ofertas + pasarela de pago real"], ["list"]),
    // Colección.   list -> [{ id, name, owned }]
    collection: area("collection", ["Inventario del jugador guardado en servidor"], ["list"]),
    // Logros.   list -> [{ id, name, progress, goal }]
    achievements: area("achievements", ["Sistema de logros conectado a estadísticas reales"], ["list"]),

    // Tienda.   getCatalog -> { cues:[], balls:[], tables:[] }   purchase(itemId)
    shop: area("shop", [
      "Catálogo real de artículos (rellena js/catalog.js o conecta getCatalog)",
      "Compra con validación en servidor y descuento del monedero"
    ], ["getCatalog", "purchase"]),
    // Inventario.   owns(itemId) -> true/false   (cuando implemented=true se muestran los estados "En propiedad")
    inventory: {
      name: "inventory", implemented: false,
      needs: ["Inventario del jugador (qué tacos, bolas y mesas posee)"],
      owns: function () { return false; }
    },

    // Ajustes (solo informativo para la ventana de ajustes)
    settings: { name: "settings", implemented: false, needs: [
      "Sonido y música (no hay audio todavía)",
      "Calidad gráfica",
      "Cuenta (cerrar sesión, borrar datos)",
      "Notificaciones"
    ] }
  };
})();