/* =====================================================================
   CATÁLOGO DE LA TIENDA (tacos, bolas, mesas)

   Por defecto está VACÍO: no se inventan artículos ni precios.
   Rellena CATALOG.items cuando decidas qué vendes, o conecta
   DMR.services.shop.getCatalog() a tu servidor.

   Formato de un artículo:
     {
       id: "cue_001",                       // único
       name: "Nombre" ó { es:"..", en:".." },
       price: { amount: 500, currency: "coins" },   // "coins" o "gems"
       image: "assets/cues/cue_001.png"     // opcional (si no, se usa un icono)
     }

   Para ver la tienda con artículos de EJEMPLO (solo para probar el diseño):
   abre el juego con  ?demo=1  al final de la URL.  No son datos reales.
   ===================================================================== */
(function () {
  const CATALOG = {
    cues: [],
    balls: [],
    tables: []
  };

  const DEMO = {
    cues: [
      { id: "demo_cue_1", name: { es: "Taco de ejemplo A", en: "Sample cue A" }, price: { amount: 100, currency: "coins" } },
      { id: "demo_cue_2", name: { es: "Taco de ejemplo B", en: "Sample cue B" }, price: { amount: 250, currency: "coins" } },
      { id: "demo_cue_3", name: { es: "Taco de ejemplo C", en: "Sample cue C" }, price: { amount: 20, currency: "gems" } }
    ],
    balls: [
      { id: "demo_ball_1", name: { es: "Bolas de ejemplo A", en: "Sample balls A" }, price: { amount: 150, currency: "coins" } },
      { id: "demo_ball_2", name: { es: "Bolas de ejemplo B", en: "Sample balls B" }, price: { amount: 15, currency: "gems" } }
    ],
    tables: [
      { id: "demo_table_1", name: { es: "Mesa de ejemplo A", en: "Sample table A" }, price: { amount: 400, currency: "coins" } },
      { id: "demo_table_2", name: { es: "Mesa de ejemplo B", en: "Sample table B" }, price: { amount: 40, currency: "gems" } }
    ]
  };

  const isDemo = /[?&]demo=1\b/.test(location.search);

  DMR.catalog = {
    isDemo,
    /* Devuelve los artículos de una categoría: "cues" | "balls" | "tables" */
    async get(category) {
      const r = await DMR.services.shop.getCatalog();
      if (r && r.ok && r.data) return r.data[category] || [];
      if (isDemo) return DEMO[category] || [];
      return CATALOG[category] || [];
    }
  };
})();