import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const root = new URL('../', import.meta.url);
const index = await readFile(new URL('index.html', root), 'utf8');
const rom = await readFile(new URL('rom/HeroOfBitcoin_DEMO.gb', root));
const favicon = await readFile(new URL('favicon.ico', root));
const health = JSON.parse(await readFile(new URL('healthz.json', root), 'utf8'));

test('canonical demo ROM identity is unchanged', () => {
  assert.equal(rom.length, 1_048_576);
  assert.equal(
    createHash('sha256').update(rom).digest('hex'),
    '9b9f67d0ae02a91a9909e4f342d74290bfe825672120805ce57e591e085ac133',
  );
});

test('browser shell includes a valid favicon asset', () => {
  assert.deepEqual([...favicon.subarray(0, 4)], [0, 0, 1, 0]);
  assert.equal(favicon.readUInt16LE(4), 7);
  assert.ok(favicon.length > 4_000);
});

test('self-contained page retains the emulator boot contract', () => {
  assert.match(index, /<title>Hero of Bitcoin<\/title>/);
  assert.match(index, /function loadGameData\(userEvent\)/);
  assert.match(index, /function loadAndStart\(rom\)/);
  assert.match(index, /function startGame\(userEvent\)/);
  assert.match(index, /const cartridgeImageData = "data:image\/png;base64,/);
  assert.match(index, /<canvas id="canvas" width="160" height="144"><\/canvas>/);
});

test('player-facing controls remain wired', () => {
  for (const id of ['scanlinesToggle', 'fullscreenToggle', 'soundToggle']) {
    assert.match(index, new RegExp(`id="${id}"`));
    assert.match(index, new RegExp(`getElementById\\('${id}'\\)\\.addEventListener`));
  }
  for (const code of ['Enter', 'KeyZ', 'KeyX', 'ArrowLeft', 'ArrowRight', 'KeyP', 'KeyF']) {
    assert.match(index, new RegExp(`case "${code}"`));
  }
});

test('production root exposes a stable health descriptor', () => {
  assert.deepEqual(health, {
    ok: true,
    service: 'hero-of-bitcoin-browser-demo',
    schema_version: 1,
  });
});
