import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { createRequire } from 'node:module';
import { readDemoRom } from './rom-inputs.mjs';
const root = new URL('../', import.meta.url);
const read = (path, encoding = 'utf8') => readFile(new URL(path, root), encoding);
const config = JSON.parse(await read('config/demo.json'));
const catalog = JSON.parse(await read('src/catalog.json'));
const manifest = JSON.parse(await read('rom/demo-manifest.json'));
if (manifest.edition !== 'demo' || manifest.schema_version !== 1) throw Error('Expected bounded demo manifest');
if (Object.keys(catalog).sort().join() !== [...config.uiLanguages].sort().join()) throw Error('UI languages differ from central configuration');
const keys = Object.keys(catalog.en).sort().join();
for (const [code, texts] of Object.entries(catalog)) {
  if (Object.keys(texts).sort().join() !== keys || Object.values(texts).some((value) => typeof value !== 'string' || !value.trim())) throw Error('Incomplete UI catalog: ' + code);
}
if (!Array.isArray(config.betaGameLanguages) || new Set(config.betaGameLanguages).size !== config.betaGameLanguages.length || config.betaGameLanguages.some(code => !config.gameLanguages.includes(code))) throw Error('Invalid beta game languages');
const games = {};
for (const language of config.gameLanguages) {
  const entry = manifest.roms.find((record) => record.language === language);
  if (!entry || !entry.title.startsWith('HOBDEMO') || entry.retained_scene_ids.length !== 25 || entry.retained_scene_ids.includes(manifest.endpoint.next_scene_id)) throw Error('Unbounded or absent demo: ' + language);
  const data = await readDemoRom(entry);
  if (data.length !== entry.size || createHash('sha256').update(data).digest('hex') !== entry.sha256) throw Error('Demo ROM identity changed: ' + language);
  games[language] = { ...entry, payload: deflateSync(data, { level: 9 }).toString('base64') };
}
const require = createRequire(import.meta.url);
const qr = await readFile(require.resolve('qrcode-generator'), 'utf8');
const notices = await Promise.all(['inter', 'pako', 'zlib', 'qrcode-generator'].map(async name => name + '\n\n' + await read('src/licenses/' + name + '.txt')));
const dataUrl = async (path, type) => 'data:' + type + ';base64,' + (await read(path, null)).toString('base64');
let styles = await read('src/demo.css');
styles = styles.replace('{{FONT_LATIN}}', await dataUrl('src/assets/inter-latin.woff2', 'font/woff2')).replace('{{FONT_EXT}}', await dataUrl('src/assets/inter-latin-ext.woff2', 'font/woff2'));
const emulator = `(function(localStorage) {\n${await read('src/vendor/emulator.js')}\nwindow.HobEmulator = { GameBoy, Display, Sound };\n})(demoSaveStorage);`;
const substitutions = {
  PLANB: await dataUrl('src/assets/planb-forum-2026.svg', 'image/svg+xml'), STYLES: styles, LOGO: await dataUrl('src/assets/logo.webp', 'image/webp'), AIRPORT: await dataUrl('src/assets/airport.png', 'image/png'), COMPLETION_ART: await dataUrl('src/assets/completion-art.png', 'image/png'),
  FAVICON: (await read('favicon.ico', null)).toString('base64'), PAKO: await read('src/vendor/pako.js'), EMULATOR: emulator,
  STORAGE: await read('src/storage.js'), QR: qr, CONFIG: JSON.stringify(config), CATALOG: JSON.stringify(catalog), GAMES: JSON.stringify(games), PLAYER: await read('src/player.js'),
  NOTICES: notices.join('\n\n'),
};
let html = await read('src/index.template.html');
html = html.replace(/\{\{([A-Z_]+)\}\}/g, (_, key) => {
  if (!(key in substitutions)) throw Error('Unknown template input: ' + key);
  return substitutions[key];
});
await writeFile(new URL('index.html', root), html);
console.log(`Built self-contained demo: ${config.uiLanguages.length} UI languages, games ${Object.keys(games).join(', ')}, ${Buffer.byteLength(html)} bytes`);
