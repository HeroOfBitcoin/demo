// Player shell. The embedded emulator owns emulation; this file owns UI and input.
const { GameBoy, Display, Sound } = window.HobEmulator;
const names = { en: 'English', es: 'Español', it: 'Italiano', ja: '日本語', de: 'Deutsch', ko: '한국어', fr: 'Français', nl: 'Nederlands', fi: 'Suomi' };
const languagePicker = document.getElementById('languagePicker');
const gameLanguagePicker = document.getElementById('gameLanguagePicker');
const canvas = document.getElementById('canvas');
let gb = null;
let language = demoConfig.defaultLanguage;
let gameLanguage = demoConfig.defaultLanguage;
let running = false;
let paused = false;
let completed = false;
let autoPaused = false;
let animationId = null;
let deterministic = false;
let cycles = 0;
let frames = 0;
let lastTime = 0;
let frameDebt = 0;
let settings = { sound: true, scanlines: false };

function saved(key) { try { return window.localStorage.getItem(key); } catch { return null; } }
function remember(key, value) { try { window.localStorage.setItem(key, value); } catch { /* URL remains authoritative. */ } }
function chooseLanguage(values, explicit, key) {
  if (values.includes(explicit)) return explicit;
  const stored = saved(key);
  if (values.includes(stored)) return stored;
  for (const preference of navigator.languages || [navigator.language]) {
    const code = preference.toLowerCase().split('-')[0];
    if (values.includes(code)) return code;
  }
  return demoConfig.defaultLanguage;
}
const initialUrl = new URL(window.location.href);
const hostedPage = initialUrl.protocol === 'http:' || initialUrl.protocol === 'https:';
const offlineChoice = JSON.parse(document.getElementById('offline-choice').textContent);
const eventCode = initialUrl.searchParams.get('event') || offlineChoice.event;
const eventConfig = Object.hasOwn(demoConfig.events, eventCode) ? demoConfig.events[eventCode] : null;
language = chooseLanguage(demoConfig.uiLanguages, initialUrl.searchParams.get('lang') || offlineChoice.ui, demoConfig.languageStorageKey);
gameLanguage = chooseLanguage(demoConfig.gameLanguages, initialUrl.searchParams.get('game') || offlineChoice.game || initialUrl.searchParams.get('lang'), demoConfig.gameLanguageStorageKey);
function copy() { return demoCatalog[language]; }
function purchaseUrl() {
  const url = new URL(demoConfig.purchaseUrl);
  url.searchParams.set('lang', language);
  url.searchParams.set('source', demoConfig.purchaseSource);
  if (eventConfig) url.searchParams.set('event', eventCode);
  return url.href;
}
function applyCopy() {
  const texts = copy();
  document.documentElement.lang = language;
  document.title = 'Hero of Bitcoin | ' + texts.eyebrow;
  document.querySelector('meta[name=description]').content = texts.intro;
  document.querySelectorAll('[data-copy]').forEach((node) => { node.textContent = texts[node.dataset.copy]; });
  document.querySelectorAll('[data-copy-aria]').forEach((node) => { node.setAttribute('aria-label', texts[node.dataset.copyAria]); });
  languagePicker.value = language;
  gameLanguagePicker.value = gameLanguage;
  languagePicker.setAttribute('aria-label', texts.language);
  gameLanguagePicker.setAttribute('aria-label', texts.gameLanguage);
  document.querySelectorAll('[data-purchase]').forEach((node) => { node.href = purchaseUrl(); });
  document.querySelector('[data-trailer]').href = demoConfig.trailerUrl;
  document.querySelector('[data-trailer]').hidden = !hostedPage;
  document.getElementById('offlineDownload').hidden = !hostedPage;
  document.querySelector('[data-home]').href = (eventConfig?.pageUrl || demoConfig.websiteUrl) + '?lang=' + language;
  const eventBrand = document.querySelector('.event');
  eventBrand.hidden = !eventConfig;
  if (eventConfig) eventBrand.href = eventConfig.websiteUrl;
  updateControls();
  if (completed) renderQr();
  const url = new URL(window.location.href);
  url.searchParams.set('lang', language);
  url.searchParams.set('game', gameLanguage);
  try { window.history.replaceState({}, '', url); } catch { /* Some file browsers restrict history. */ }
  remember(demoConfig.languageStorageKey, language);
  remember(demoConfig.gameLanguageStorageKey, gameLanguage);
}
for (const [picker, values] of [[languagePicker, demoConfig.uiLanguages], [gameLanguagePicker, demoConfig.gameLanguages]]) {
  values.forEach((code) => {
    const beta = picker === gameLanguagePicker && demoConfig.betaGameLanguages.includes(code);
    picker.add(new Option(names[code] + (beta ? ' (Beta)' : ''), code));
  });
}
// Release all inputs on pause, focus loss and cancellation to prevent stuck controls.
function releaseInput() {
  if (gb) for (const key of ['up', 'down', 'left', 'right', 'a', 'b', 'start', 'select']) gb.joypad[key] = false;
  document.querySelectorAll('.pressed').forEach((node) => node.classList.remove('pressed'));
}
function save() { if (gb) gb.cartridge.save(); }
function stopLoop() { if (animationId !== null) cancelAnimationFrame(animationId); animationId = null; }
function updateControls() {
  const texts = copy();
  document.getElementById('pauseToggle').disabled = !running || completed;
  document.getElementById('restartButton').disabled = !gb;
  document.getElementById('exitButton').disabled = !gb;
  document.getElementById('pauseToggle').textContent = paused ? texts.resume : texts.pause;
  document.getElementById('soundToggle').setAttribute('aria-pressed', String(settings.sound));
  document.getElementById('scanlinesToggle').setAttribute('aria-pressed', String(settings.scanlines));
  document.getElementById('playerStatus').textContent = completed ? texts.completeTitle : !gb ? texts.ready : paused ? texts.pause : '';
}
function loadGameData() {
  const data = Uint8Array.from(atob(demoGames[gameLanguage].payload), (character) => character.charCodeAt(0));
  return pako.inflate(data);
}
function renderQr() {
  const code = qrcode(0, 'Q');
  code.addData(purchaseUrl());
  code.make();
  document.getElementById('purchaseQr').innerHTML = code.createSvgTag({ cellSize: 4, margin: 16, scalable: true });
}
function checkCompletion() {
  const signal = demoGames[gameLanguage].completion_signal;
  const value = gb.readAddress(signal.address) | (gb.readAddress(signal.address + 1) << 8);
  if (value === signal.value && !completed) {
    completed = true;
    paused = true;
    releaseInput();
    save();
    renderQr();
    document.getElementById('demoComplete').hidden = false;
    updateControls();
    document.querySelector('#demoComplete [data-purchase]').focus({ preventScroll: true });
  }
}
// Frame timing is shared by normal animation and deterministic browser QA.
function runFrame() {
  if (!running || paused) return;
  if (gb.cartridge.hasRTC) gb.cartridge.rtc.updateTime();
  while (cycles < Display.cpuCyclesPerFrame) cycles += gb.cycle();
  cycles -= Display.cpuCyclesPerFrame;
  frames++;
  checkCompletion();
}
function fail(error) {
  stopLoop(); running = false; paused = false; releaseInput();
  document.getElementById('playerStatus').textContent = copy().error;
  document.getElementById('startOverlay').hidden = false;
  document.getElementById('pauseToggle').disabled = true;
  console.error('Demo runtime failed', error);
}
function tick(now) {
  animationId = null;
  if (!running || paused || deterministic) return;
  const interval = 1000 / demoConfig.frameRate;
  frameDebt = Math.min(frameDebt + Math.max(0, now - lastTime), interval * demoConfig.maximumCatchUpFrames);
  lastTime = now;
  try { while (frameDebt >= interval && !paused) { runFrame(); frameDebt -= interval; } }
  catch (error) { fail(error); return; }
  if (running && !paused) animationId = requestAnimationFrame(tick);
}
function resumeLoop() {
  stopLoop(); lastTime = performance.now(); frameDebt = 0;
  if (running && !paused && !deterministic) animationId = requestAnimationFrame(tick);
}
function startGame() {
  stopLoop(); releaseInput(); save();
  try {
    gb?.sound?.gainNode?.disconnect();
    gb = new GameBoy();
    gb.cartridge.load(loadGameData());
    gb.sound.gainNode.gain.value = settings.sound ? Sound.volume : 0;
    Sound.ctx.resume().catch(() => {});
    running = true; paused = false; completed = false; autoPaused = false; frames = 0; cycles = 0;
    document.getElementById('startOverlay').hidden = true;
    document.getElementById('demoComplete').hidden = true;
    canvas.focus({ preventScroll: true });
    if (window.matchMedia('(max-width: 800px)').matches) document.getElementById('player').scrollIntoView({ block: 'start' });
    updateControls(); resumeLoop();
  } catch (error) { fail(error); }
}
function pauseGame() {
  if (!running || completed) return;
  paused = !paused; autoPaused = false;
  releaseInput(); save(); updateControls(); resumeLoop();
  if (!paused) canvas.focus({ preventScroll: true });
}
function exitGame() {
  save(); stopLoop(); releaseInput(); gb?.sound?.gainNode?.disconnect();
  gb = null; running = false; paused = false; completed = false; autoPaused = false;
  document.getElementById('startOverlay').hidden = false;
  document.getElementById('demoComplete').hidden = true;
  updateControls();
  document.getElementById('playButton').focus();
}
function toggleSound() {
  settings.sound = !settings.sound;
  if (gb) gb.sound.gainNode.gain.value = settings.sound ? Sound.volume : 0;
  if (settings.sound) Sound.ctx.resume().catch(() => {});
  updateControls();
  if (gb && running && !completed) canvas.focus({ preventScroll: true });
}
function toggleScanlines() {
  settings.scanlines = !settings.scanlines;
  document.querySelector('.canvas-container').classList.toggle('no-scanlines', !settings.scanlines);
  updateControls();
  if (gb && running && !completed) canvas.focus({ preventScroll: true });
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen();
    else if (document.getElementById('player').requestFullscreen) await document.getElementById('player').requestFullscreen();
    else if (document.getElementById('player').webkitRequestFullscreen) document.getElementById('player').webkitRequestFullscreen();
  } catch { /* Inline player remains available. */ }
}
languagePicker.addEventListener('change', () => { language = languagePicker.value; applyCopy(); });
gameLanguagePicker.addEventListener('change', () => {
  save(); stopLoop(); releaseInput(); gb?.sound?.gainNode?.disconnect();
  gb = null; running = false; paused = false; completed = false;
  gameLanguage = gameLanguagePicker.value;
  document.getElementById('startOverlay').hidden = false;
  document.getElementById('demoComplete').hidden = true;
  applyCopy();
});
for (const id of ['playButton', 'startOverlay', 'restartButton', 'completionRestart']) document.getElementById(id).addEventListener('click', startGame);
document.getElementById('pauseToggle').addEventListener('click', pauseGame);
document.getElementById('exitButton').addEventListener('click', exitGame);
document.getElementById('soundToggle').addEventListener('click', toggleSound);
document.getElementById('scanlinesToggle').addEventListener('click', toggleScanlines);
document.getElementById('fullscreenToggle').addEventListener('click', toggleFullscreen);
const keyMap = { Enter: 'start', ShiftLeft: 'select', ShiftRight: 'select', KeyX: 'a', KeyZ: 'b', ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' };
document.addEventListener('keydown', (event) => {
  if (event.target.closest('input,select,textarea,button,a,summary') || event.metaKey || event.ctrlKey || event.altKey) return;
  if (keyMap[event.code] && running && !paused) { event.preventDefault(); gb.joypad[keyMap[event.code]] = true; }
  if (event.repeat) return;
  const action = { KeyP: pauseGame, KeyF: toggleFullscreen, KeyM: toggleSound, KeyS: toggleScanlines }[event.code];
  if (action) { event.preventDefault(); action(); }
  else if (event.code === 'Escape' && gb && !document.fullscreenElement) { event.preventDefault(); exitGame(); }
  else if (!gb && ['Enter', 'Space'].includes(event.code)) { event.preventDefault(); startGame(); }
});
document.addEventListener('keyup', (event) => { if (gb && keyMap[event.code]) gb.joypad[keyMap[event.code]] = false; });
window.addEventListener('blur', releaseInput);
window.addEventListener('beforeunload', save);
document.addEventListener('visibilitychange', () => {
  releaseInput(); save();
  if (document.hidden && running && !paused) { autoPaused = true; paused = true; stopLoop(); }
  else if (!document.hidden && autoPaused) { autoPaused = false; paused = false; resumeLoop(); }
  updateControls();
});
for (const button of document.querySelectorAll('[data-button]')) {
  button.addEventListener('pointerdown', (event) => {
    event.preventDefault(); button.setPointerCapture(event.pointerId);
    if (!gb && button.dataset.button === 'start') startGame();
    if (gb && running && !paused) { gb.joypad[button.dataset.button] = true; button.classList.add('pressed'); }
  });
  const release = () => { if (gb) gb.joypad[button.dataset.button] = false; button.classList.remove('pressed'); };
  button.addEventListener('pointerup', release); button.addEventListener('pointercancel', release); button.addEventListener('lostpointercapture', release);
}
// Fetch the original generated source, never serialize the running DOM or save data.
// This hosted-only action changes only the export's UI/game language preference.
document.getElementById('offlineDownload').addEventListener('click', async (event) => {
  event.preventDefault();
  if (!hostedPage) return;
  const button = event.currentTarget;
  if (button.dataset.busy) return;
  button.dataset.busy = 'true';
  try {
    const response = await fetch(window.location.href.split('#')[0], { cache: 'no-store' });
    if (!response.ok) throw Error('Offline HTML unavailable');
    const source = (await response.text()).replace(/(<script id="offline-choice" type="application\/json">)[\s\S]*?(<\/script>)/, (_, open, close) => open + JSON.stringify({ ui: language, game: gameLanguage, ...(eventConfig ? { event: eventCode } : {}) }) + close);
    const blob = new Blob([source], { type: 'text/html;charset=utf-8' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a'); link.href = href; link.download = demoConfig.offlineFilename; link.click();
    setTimeout(() => URL.revokeObjectURL(href), 1000);
  } catch {
    // A file:// copy already is the offline demo; allow Save As without trapping shortcuts.
    document.getElementById('playerStatus').textContent = copy().offlineHint;
  } finally { delete button.dataset.busy; }
});
// Readable QA hooks advance ordinary CPU frames; no game-state mutation or scene skips.
window.render_game_to_text = () => JSON.stringify({ mode: completed ? 'complete' : !gb ? 'ready' : paused ? 'paused' : running ? 'playing' : 'error', uiLanguage: language, gameLanguage, frames, sound: settings.sound, scanlines: settings.scanlines, controls: { move: 'arrows', a: 'X', b: 'Z', start: 'Enter' }, display: 'Game Boy pixels; origin top-left, x right, y down', input: gb ? { up: gb.joypad.up, down: gb.joypad.down, left: gb.joypad.left, right: gb.joypad.right, a: gb.joypad.a, b: gb.joypad.b, start: gb.joypad.start, select: gb.joypad.select } : null });
window.advanceTime = (ms) => { deterministic = true; stopLoop(); for (let count = 0; count < Math.round(ms * demoConfig.frameRate / 1000); count++) { if (paused) break; runFrame(); } };
applyCopy();
