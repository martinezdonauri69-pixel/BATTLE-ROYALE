/* Almacenamiento local seguro (solo preferencias del dispositivo: idioma y nombre). */
DMR.store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(DMR.config.storagePrefix + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(DMR.config.storagePrefix + key, JSON.stringify(value)); return true; }
    catch (e) { return false; }
  }
};