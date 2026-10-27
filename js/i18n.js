/* Traducciones. Orden de idiomas: es, en, fr, de, pt, it, zh, ja, ko, ru
   Para añadir un texto: agrega una línea con las 10 traducciones.
   Para añadir un idioma: agrégalo en LANGS y añade un valor más a cada línea. */
(function () {
  const LANGS = [
    { code: "es", name: "Español" },  { code: "en", name: "English" },
    { code: "fr", name: "Français" }, { code: "de", name: "Deutsch" },
    { code: "pt", name: "Português" },{ code: "it", name: "Italiano" },
    { code: "zh", name: "中文" },      { code: "ja", name: "日本語" },
    { code: "ko", name: "한국어" },    { code: "ru", name: "Русский" }
  ];

  const T = {
    home:["Inicio","Home","Accueil","Start","Início","Home","主页","ホーム","홈","Главная"],
    shop:["Tienda","Shop","Boutique","Shop","Loja","Negozio","商店","ショップ","상점","Магазин"],
    profile:["Perfil","Profile","Profil","Profil","Perfil","Profilo","个人资料","プロフィール","프로필","Профиль"],
    friends:["Amigos","Friends","Amis","Freunde","Amigos","Amici","好友","フレンド","친구","Друзья"],
    messages:["Mensajes","Messages","Messages","Nachrichten","Mensagens","Messaggi","消息","メッセージ","메시지","Сообщения"],
    ranking:["Ranking","Ranking","Classement","Rangliste","Ranking","Classifica","排行榜","ランキング","랭킹","Рейтинг"],
    settings:["Ajustes","Settings","Paramètres","Einstellungen","Configurações","Impostazioni","设置","設定","설정","Настройки"],
    play:["JUGAR","PLAY","JOUER","SPIELEN","JOGAR","GIOCA","开始","プレイ","플레이","ИГРАТЬ"],
    playSub:["Partida rápida 1 vs 1","Quick match 1 vs 1","Partie rapide 1 contre 1","Schnelles Spiel 1 gegen 1","Partida rápida 1 contra 1","Partita veloce 1 contro 1","快速对战 1 对 1","クイックマッチ 1対1","빠른 대전 1 대 1","Быстрая игра 1 на 1"],
    tournaments:["TORNEOS","TOURNAMENTS","TOURNOIS","TURNIERE","TORNEIOS","TORNEI","锦标赛","トーナメント","토너먼트","ТУРНИРЫ"],
    tournamentsSub:["Compite y gana grandes premios","Compete and win great prizes","Participe et gagne de gros prix","Tritt an und gewinne große Preise","Compita e ganhe grandes prêmios","Competi e vinci grandi premi","参赛赢取丰厚奖励","競って豪華賞品をゲット","겨루고 큰 상품을 받으세요","Соревнуйся и выигрывай призы"],
    friendly:["AMISTOSO","FRIENDLY","AMICAL","FREUNDSCHAFT","AMISTOSO","AMICHEVOLE","友谊赛","フレンドマッチ","친선전","ТОВАРИЩЕСКИЙ"],
    friendlySub:["Juega en privado con tus amigos","Play privately with your friends","Joue en privé avec tes amis","Spiele privat mit Freunden","Jogue em particular com amigos","Gioca in privato con gli amici","与好友私人对战","フレンドと非公開で対戦","친구와 비공개로 대전","Играй с друзьями в закрытой комнате"],
    ranks:["Rangos","Ranks","Rangs","Ränge","Patentes","Ranghi","段位","ランク","등급","Ранги"],
    rewards:["Recompensas","Rewards","Récompenses","Belohnungen","Recompensas","Ricompense","奖励","報酬","보상","Награды"],
    events:["Eventos","Events","Événements","Events","Eventos","Eventi","活动","イベント","이벤트","События"],
    tournamentsShort:["Torneos","Tournaments","Tournois","Turniere","Torneios","Tornei","锦标赛","大会","토너먼트","Турниры"],
    shopSub:["Tacos, bolas, mesas, skins","Cues, balls, tables, skins","Queues, boules, tables, skins","Queues, Bälle, Tische, Skins","Tacos, bolas, mesas, skins","Stecche, palle, tavoli, skin","球杆、球、球桌、皮肤","キュー、ボール、テーブル、スキン","큐, 공, 테이블, 스킨","Кии, шары, столы, скины"],
    seasonPass:["Pase de temporada","Season pass","Pass de saison","Saisonpass","Passe de temporada","Pass stagionale","赛季通行证","シーズンパス","시즌 패스","Сезонный пропуск"],
    dailyMissions:["Misión diaria","Daily mission","Mission quotidienne","Tägliche Mission","Missão diária","Missione giornaliera","每日任务","デイリーミッション","일일 미션","Ежедневное задание"],
    noMissions:["Sin misiones activas","No active missions","Aucune mission active","Keine aktiven Missionen","Sem missões ativas","Nessuna missione attiva","暂无任务","ミッションはありません","진행 중인 미션 없음","Нет активных заданий"],
    specialOffer:["Oferta especial","Special offer","Offre spéciale","Sonderangebot","Oferta especial","Offerta speciale","特别优惠","特別オファー","특별 할인","Спецпредложение"],
    noOffers:["Sin ofertas activas","No active offers","Aucune offre active","Keine aktiven Angebote","Sem ofertas ativas","Nessuna offerta attiva","暂无优惠","現在オファーはありません","진행 중인 할인 없음","Нет активных предложений"],
    noActive:["Sin eventos activos","No active events","Aucun événement actif","Keine aktiven Events","Nenhum evento ativo","Nessun evento attivo","暂无进行中的活动","開催中のイベントはありません","진행 중인 이벤트 없음","Нет активных событий"],
    cues:["Tacos","Cues","Queues","Queues","Tacos","Stecche","球杆","キュー","큐","Кии"],
    balls:["Bolas","Balls","Boules","Bälle","Bolas","Palle","球","ボール","공","Шары"],
    tables:["Mesas","Tables","Tables","Tische","Mesas","Tavoli","球桌","テーブル","테이블","Столы"],
    collection:["Colección","Collection","Collection","Sammlung","Coleção","Collezione","收藏","コレクション","컬렉션","Коллекция"],
    achievements:["Logros","Achievements","Succès","Erfolge","Conquistas","Obiettivi","成就","実績","업적","Достижения"],
    more:["Más","More","Plus","Mehr","Mais","Altro","更多","その他","더보기","Ещё"],
    playNow:["JUEGA AHORA","PLAY NOW","JOUE MAINTENANT","JETZT SPIELEN","JOGUE AGORA","GIOCA ORA","立即开始","今すぐプレイ","지금 플레이","ИГРАЙ СЕЙЧАС"],
    onlinePlayers:["Jugadores en línea","Players online","Joueurs en ligne","Spieler online","Jogadores online","Giocatori online","在线玩家","オンライン人数","접속 중인 플레이어","Игроков онлайн"],
    lastWinners:["Últimos ganadores","Latest winners","Derniers gagnants","Letzte Gewinner","Últimos vencedores","Ultimi vincitori","最新获胜者","最近の勝者","최근 우승자","Последние победители"],
    noWinners:["Aún no hay ganadores registrados","No winners recorded yet","Aucun gagnant enregistré","Noch keine Gewinner erfasst","Ainda não há vencedores registrados","Nessun vincitore registrato","暂无获胜记录","勝者の記録はまだありません","아직 기록된 우승자가 없습니다","Победителей пока нет"],
    language:["Idioma","Language","Langue","Sprache","Idioma","Lingua","语言","言語","언어","Язык"],
    comingSoon:["Próximamente","Coming soon","Bientôt disponible","Demnächst","Em breve","Prossimamente","即将推出","近日公開","곧 출시","Скоро"],
    notReady:["Esta función aún no está conectada.","This feature is not connected yet.","Cette fonction n'est pas encore connectée.","Diese Funktion ist noch nicht verbunden.","Este recurso ainda não está conectado.","Questa funzione non è ancora collegata.","此功能尚未接入。","この機能はまだ接続されていません。","이 기능은 아직 연결되지 않았습니다.","Эта функция ещё не подключена."],
    close:["Cerrar","Close","Fermer","Schließen","Fechar","Chiudi","关闭","閉じる","닫기","Закрыть"],
    guest:["Invitado","Guest","Invité","Gast","Convidado","Ospite","访客","ゲスト","게스트","Гость"],
    noRank:["Sin rango","Unranked","Sans rang","Ohne Rang","Sem patente","Senza rango","未定级","ランクなし","등급 없음","Без ранга"],
    level:["Nivel","Level","Niveau","Level","Nível","Livello","等级","レベル","레벨","Уровень"],
    xp:["Experiencia","Experience","Expérience","Erfahrung","Experiência","Esperienza","经验","経験値","경험치","Опыт"],
    getCoins:["Obtener monedas","Get coins","Obtenir des pièces","Münzen erhalten","Obter moedas","Ottieni monete","获取金币","コインを入手","코인 받기","Получить монеты"],
    coins:["Monedas","Coins","Pièces","Münzen","Moedas","Monete","金币","コイン","코인","Монеты"],
    gems:["Moneda premium","Premium currency","Monnaie premium","Premium-Währung","Moeda premium","Valuta premium","高级货币","プレミアム通貨","프리미엄 재화","Премиум-валюта"],
    tagline:["Grandes jugadores, grandes historias","Great players, great stories","De grands joueurs, de grandes histoires","Große Spieler, große Geschichten","Grandes jogadores, grandes histórias","Grandi giocatori, grandi storie","伟大的玩家，伟大的故事","偉大なプレイヤー、偉大な物語","위대한 플레이어, 위대한 이야기","Великие игроки, великие истории"],
    logoSlogan:["El billar es más que un juego, es un estilo de vida","Pool is more than a game, it's a lifestyle","Le billard est plus qu'un jeu, c'est un style de vie","Billard ist mehr als ein Spiel, es ist ein Lebensstil","A sinuca é mais que um jogo, é um estilo de vida","Il biliardo è più di un gioco, è uno stile di vita","台球不只是游戏，更是一种生活方式","ビリヤードはゲーム以上の生き方だ","당구는 게임 이상의 라이프스타일입니다","Бильярд — больше, чем игра, это стиль жизни"],
    rotate:["Gira tu dispositivo en horizontal para jugar","Rotate your device to landscape to play","Tourne ton appareil en mode paysage","Drehe dein Gerät ins Querformat","Gire o dispositivo na horizontal para jogar","Ruota il dispositivo in orizzontale","请将设备横屏使用","端末を横向きにしてください","기기를 가로로 돌려 주세요","Поверните устройство горизонтально"],
    devNotice:["Aviso para desarrolladores","Developer notice","Note pour les développeurs","Hinweis für Entwickler","Aviso para desenvolvedores","Avviso per sviluppatori","开发者提示","開発者向け通知","개발자 안내","Заметка для разработчиков"],
    missing:["Falta integrar","Still to integrate","À intégrer","Noch zu integrieren","Falta integrar","Da integrare","待接入","未連携","연동 필요","Нужно подключить"],
    owned:["En propiedad","Owned","Possédé","Im Besitz","Adquirido","Posseduto","已拥有","所持","보유 중","Есть"],
    notOwned:["No adquirido","Not owned","Non possédé","Nicht im Besitz","Não adquirido","Non posseduto","未拥有","未所持","미보유","Нет"],
    buy:["Comprar","Buy","Acheter","Kaufen","Comprar","Acquista","购买","購入","구매","Купить"],
    emptyCatalog:["Aún no hay artículos en el catálogo","No items in the catalog yet","Aucun article au catalogue pour l'instant","Noch keine Artikel im Katalog","Ainda não há itens no catálogo","Nessun articolo nel catalogo","目录中暂无商品","カタログにアイテムがありません","카탈로그에 아이템이 없습니다","В каталоге пока нет товаров"],
    name:["Nombre","Name","Nom","Name","Nome","Nome","昵称","名前","이름","Имя"],
    save:["Guardar","Save","Enregistrer","Speichern","Salvar","Salva","保存","保存","저장","Сохранить"],
    saved:["Guardado","Saved","Enregistré","Gespeichert","Salvo","Salvato","已保存","保存しました","저장됨","Сохранено"]
  };

  const idx = {}; LANGS.forEach((l, i) => idx[l.code] = i);
  let current = DMR.config.defaultLang;

  DMR.i18n = {
    langs: LANGS,
    get lang() { return current; },
    t(key) {
      const row = T[key];
      if (!row) return key;
      return row[idx[current]] || row[0];
    },
    /* Textos que vienen de datos ({es:"..",en:".."} o string) */
    loc(v) {
      if (v == null) return "";
      if (typeof v === "string") return v;
      return v[current] || v.es || v.en || Object.values(v)[0] || "";
    },
    detect() {
      const saved = DMR.store.get("lang", null);
      if (saved && idx[saved] !== undefined) return saved;
      const nav = ((navigator.languages && navigator.languages[0]) || navigator.language || "es").slice(0, 2).toLowerCase();
      return idx[nav] !== undefined ? nav : DMR.config.defaultLang;
    },
    set(code, silent) {
      if (idx[code] === undefined) return;
      current = code;
      DMR.store.set("lang", code);
      document.documentElement.lang = code;
      this.apply();
      if (!silent) document.dispatchEvent(new CustomEvent("dmr:lang", { detail: code }));
    },
    apply(root) {
      (root || document).querySelectorAll("[data-i18n]").forEach(el => { el.textContent = this.t(el.dataset.i18n); });
      (root || document).querySelectorAll("[data-i18n-title]").forEach(el => {
        const s = this.t(el.dataset.i18nTitle); el.title = s; el.setAttribute("aria-label", s);
      });
      const sel = document.getElementById("langSel");
      if (sel) sel.value = current;
      const rt = document.getElementById("rotateText");
      if (rt) rt.textContent = this.t("rotate");
    }
  };
})();