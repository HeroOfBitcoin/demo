import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const read = (path, encoding = 'utf8') => readFile(new URL('../' + path, import.meta.url), encoding);

test('the demo has an always-visible, localized referral with both PNG assets embedded', async () => {
  const page = await read('index.html');
  const config = JSON.parse(await read('config/demo.json'));
  const notices = [...page.matchAll(/<aside class="hob-referral"[\s\S]*?<\/aside>/g)];
  assert.equal(notices.length, 1);
  const notice = notices[0][0];
  assert.match(notice, /href="https:\/\/app\.bullbitcoin\.com\/registration\/unfiat" target="_blank" rel="sponsored noopener noreferrer" referrerpolicy="no-referrer"/);
  for (const lang of config.uiLanguages) {
    assert.equal([...notice.matchAll(new RegExp(`data-referral-copy="${lang}"`, 'g'))].length, 2, lang);
  }
  const images = [...notice.matchAll(/src="data:image\/png;base64,([A-Za-z0-9+/=]+)"/g)];
  assert.equal(images.length, 2);
  for (const [index, asset] of ['bull-bitcoin.png', 'bullbitcoin-qr.png'].entries()) {
    assert.deepEqual(Buffer.from(images[index][1], 'base64'), await read('src/referral/' + asset, null));
  }
  assert.doesNotMatch(notice, /<details|<summary|<script|<iframe|<img[^>]*src="https?:|0[.,]5\s*%/);
});
