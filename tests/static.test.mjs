import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { inflateSync } from 'node:zlib';
import vm from 'node:vm';
import test from 'node:test';
import { readDemoRom } from '../scripts/rom-inputs.mjs';
const root = new URL('../', import.meta.url);
const read = (path, encoding='utf8') => readFile(new URL(path, root), encoding);
const index = await read('index.html');
const config = JSON.parse(await read('config/demo.json'));
const catalog = JSON.parse(await read('src/catalog.json'));
const manifest = JSON.parse(await read('rom/demo-manifest.json'));
const games = JSON.parse(index.match(/const demoGames = (\{[^\n]*\});/)[1]);
const hash = (data) => createHash('sha256').update(data).digest('hex');

test('emulator and compression vendor sources stay identical to the previous player', async () => {
  assert.equal(hash(await read('src/vendor/emulator.js', null)), '92d6f0e756a454cbea7c2ff89c7a6511104f59b3d37ca0511eb42d875920a88f');
  assert.equal(hash(await read('src/vendor/pako.js', null)), '635ec8888baee7435fb63c68de9f37b9b3ab922d40ed83007caf70fd470dfafe');
});

test('bounded game payloads match the imported language-specific ROMs and exclude later scenes', async () => {
  assert.deepEqual(Object.keys(games), config.gameLanguages);
  for (const entry of manifest.roms) {
    const data = await readDemoRom(entry);
    const embedded = inflateSync(Buffer.from(games[entry.language].payload, 'base64'));
    assert.deepEqual(embedded, data);
    assert.equal(data.length, 524288);
    assert.equal(hash(data), entry.sha256);
    assert.equal(data.subarray(0x134,0x143).toString('ascii').split('\0')[0], 'HOBDEMO'+entry.language.toUpperCase());
    assert.equal(entry.retained_scene_ids.length, 25);
    assert.ok(!entry.retained_scene_ids.includes(manifest.endpoint.next_scene_id));
    assert.ok(entry.completion_signal.address >= 0xC000 && entry.completion_signal.address <= 0xDFFE);
  }
});

test('legacy standalone artifact is preserved and is not embedded in the new shell', async () => {
  const old = await read('rom/HeroOfBitcoin_DEMO.gb', null);
  assert.equal(hash(old), '9b9f67d0ae02a91a9909e4f342d74290bfe825672120805ce57e591e085ac133');
  assert.ok(Object.values(games).every((entry) => entry.sha256 !== hash(old)));
});

test('nine UI languages have complete player, error, offline and completion copy', () => {
  assert.deepEqual(config.uiLanguages, ['en','es','it','ja','de','ko','fr','nl','fi']);
  const keys = Object.keys(catalog.en).sort();
  for (const language of config.uiLanguages) {
    assert.deepEqual(Object.keys(catalog[language]).sort(), keys);
    assert.ok(Object.values(catalog[language]).every((value) => typeof value === 'string' && value.trim()));
  }
  const displayed = [...index.matchAll(/data-copy="([^"]+)"/g)].map((match) => match[1]);
  for (const key of displayed) assert.ok(catalog.en[key], key);
});

test('offline shell needs no external scripts, styles, images or fonts and has valid JavaScript', () => {
  assert.doesNotMatch(index, /<(?:script|link)[^>]+(?:src|href)="https?:|<img[^>]+src="https?:/);
  // Audit every resource, including relative paths; ordinary outbound anchors are allowed.
  const markup = index.replace(/(<script[^>]*>)[\s\S]*?(<\/script>)/g, '$1$2');
  const resources = [...markup.matchAll(/<(?:script|img|link)[^>]+(?:src|href)="([^"]+)"/g)].map(match => match[1]);
  assert.ok(resources.length >= 4);
  assert.ok(resources.every(url => url.startsWith('data:')), 'External or relative runtime resource found');
  const styles = index.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.doesNotMatch(styles, /@import/i);
  for (const match of styles.matchAll(/url\(['"]?([^)'"\s]+)['"]?\)/g)) assert.ok(match[1].startsWith('data:'));
  assert.doesNotMatch(index, /\{\{[A-Z_]+\}\}/);
  assert.match(index, /data:font\/woff2;base64,/);
  for (const match of index.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)) {
    if (!match[1].includes('application/json') && !match[1].includes('text/plain')) new vm.Script(match[2]);
  }
});

test('player preserves keyboard input, focus and cancellation contracts', async () => {
  const player = await read('src/player.js');
  assert.match(player, /pointercancel/);
  assert.match(player, /lostpointercapture/);
  assert.match(player, /keyup/);
  assert.match(player, /visibilitychange/);
  assert.match(player, /event\.target\.closest\('input,select,textarea,button,a,summary'\)/);
  assert.doesNotMatch(player, /document\.activeElement\.blur|contextmenu|selectstart|alert\(/);
  assert.match(player, /signal\.address/);
  assert.doesNotMatch(player, /writeAddress/);
});

test('save adapter keeps editions and languages separate and survives denied browser storage', async () => {
  const source = await read('src/storage.js');
  const context = { Map, Proxy, Object, String, window: { get localStorage() { throw Error('denied'); } }, demoConfig: config, demoGames: games };
  vm.createContext(context); vm.runInContext(source, context);
  vm.runInContext("demoSaveStorage.HOBDEMOEN = '1,2'; demoSaveStorage.HOBDEMONL = '3,4';", context);
  assert.equal(vm.runInContext('demoSaveStorage.HOBDEMOEN', context), '1,2');
  assert.equal(vm.runInContext('demoSaveStorage.HOBDEMONL', context), '3,4');
  assert.equal(vm.runInContext("'HOBDEMOFI' in demoSaveStorage", context), false);
  const written = new Map();
  context.window = { localStorage: { getItem: key => written.get(key) ?? null, setItem: (key, value) => written.set(key, value) } };
  vm.runInContext("demoSaveStorage['HOBDEMOEN\\0\\0\\0\\0\\0\\0\\0€'] = '5,6'; demoSaveStorage['HOBDEMOFITIME'] = '7,8';", context);
  assert.ok([...written.keys()].some(key => key.startsWith(config.savePrefix + games.en.save_schema + '/HOBDEMOEN')));
  assert.ok([...written.keys()].some(key => key.startsWith(config.savePrefix + games.fi.save_schema + '/HOBDEMOFI')));
  assert.ok([...written.keys()].every(key => !key.includes('/unknown/')));
});

test('health descriptor and favicon stay valid', async () => {
  assert.deepEqual(JSON.parse(await read('healthz.json')), { ok:true, service:'hero-of-bitcoin-browser-demo', schema_version:1 });
  const favicon = await read('favicon.ico', null);
  assert.deepEqual([...favicon.subarray(0,4)], [0,0,1,0]);
});

test('standalone dependency sections are named and ordered for readable offline distribution', () => {
  const ids = ['demo-data', 'demo-save-storage', 'demo-compression', 'demo-emulator', 'demo-qr', 'demo-player'];
  let previous = -1;
  for (const id of ids) {
    const position = index.indexOf('<script id="' + id + '">');
    assert.ok(position > previous, id);
    previous = position;
  }
  assert.equal(config.offlineFilename, 'index.html');
  assert.equal(new URL(config.trailerUrl).protocol, 'https:');
});
