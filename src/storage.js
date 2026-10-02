// The emulator receives this adapter rather than the browser's storage object.
// Demo saves remain separated by schema and ROM title, including offline files.
const demoSaveStorage = (() => {
  const memory = new Map();
  const keyFor = (title) => {
    const clean = String(title).replace(/\0/g, '');
    // The legacy decoder includes the CGB header byte after the ROM title;
    // RTC records also append TIME. Match the declared title prefix.
    const game = Object.values(demoGames).find((entry) => clean.startsWith(entry.title));
    return demoConfig.savePrefix + (game?.save_schema ?? 'unknown') + '/' + clean;
  };
  function read(title) {
    const key = keyFor(title);
    try { return window.localStorage.getItem(key) ?? memory.get(key); }
    catch { return memory.get(key); }
  }
  return new Proxy({}, {
    has: (_, title) => read(title) != null,
    get: (_, title) => read(title),
    set: (_, title, value) => {
      const key = keyFor(title);
      const text = String(value);
      memory.set(key, text);
      try { window.localStorage.setItem(key, text); } catch { /* Session-only saves still work. */ }
      return true;
    },
  });
})();
