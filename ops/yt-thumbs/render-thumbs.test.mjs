import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { accentFor, tokens, fit, measure, buildThumbnail, validateItems } from './render-thumbs.mjs';
const fixture = JSON.parse(readFileSync(new URL('./fixture.json', import.meta.url)));
test('exactly one semantic accent, with bearish precedence and numeric fallback', () => {
  for (const word of ['跌', '跌破', '失守', '破位', '下跌']) assert.equal(accentFor(`BTC ${word} 11 万`).color, '#ff5c5c');
  for (const word of ['反弹', '上涨', '重回', '新高']) assert.equal(accentFor(word).color, '#3ddc97');
  assert.equal(accentFor('反弹后跌破').word, '跌破');
  assert.deepEqual(accentFor('关键位 11 万'), {word:'11 万', index:4, color:'#4f7cff'});
});
test('numbers, decimals, percentages and Latin words stay together', () => {
  assert.deepEqual(tokens('BTC 跌破 11 万'), ['BTC',' ','跌破',' ','11 万']);
  assert.ok(tokens('ETH 12.87% 与 5.4 亿美元').includes('12.87%'));
  assert.ok(tokens('ETH 12.87% 与 5.4 亿美元').includes('5.4 亿美元'));
  const layout = fit('BTC 跌破 11 万',170,650);
  assert.ok(layout.lines.some(line => line.includes('11 万')));
  assert.throws(() => fit('12345678901234567890',170,5), /cannot fit/);
});
test('fixture text fits measured bounds and duration exclusion, with a maximum of two hero lines', () => {
  for (const item of fixture) {
    const {svg,layout} = buildThumbnail(item);
    assert.ok(layout.hero.lines.length <= 2);
    for (const line of layout.hero.lines) assert.ok(measure(line,layout.hero.size).width <= 835);
    for (const box of layout.bounds) {
      assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= 1280 && box.y+box.height <= 720);
      assert.ok(box.x+box.width <= 1060 || box.y+box.height <= 640);
    }
    assert.equal((svg.match(/<tspan fill=/g)||[]).length,1);
  }
  assert.equal(buildThumbnail(fixture[8]).layout.date,undefined);
  assert.equal(buildThumbnail(fixture[0]).layout.date,'2025-11-27');
  assert.equal(buildThumbnail(fixture[8]).layout.hero.size,170);
  assert.ok(buildThumbnail(fixture[10]).layout.hero.size < 170);
});
test('input rejects traversal, output name collisions and missing fields', () => {
  validateItems(fixture);
  for (const id of ['../escape','a/b','contact-sheet-001']) assert.throws(()=>validateItems([{...fixture[0],id}]));
  assert.throws(()=>validateItems([fixture[0],fixture[0]]));
  assert.throws(()=>validateItems([{...fixture[0],thumb_main:''}]));
});
test('rendered JPEGs have expected dimensions and byte limits (fixture integration)', () => {
  function dimensions(buf) {
    assert.equal(buf.readUInt16BE(0),0xffd8);
    let at=2;
    while(at<buf.length) {
      assert.equal(buf[at],0xff);
      const marker=buf[at+1]; const length=buf.readUInt16BE(at+2);
      if ([0xc0,0xc1,0xc2].includes(marker)) return [buf.readUInt16BE(at+7),buf.readUInt16BE(at+5)];
      at+=length+2;
    }
    throw new Error('No JPEG frame');
  }
  const out = process.env.YT_THUMB_TEST_OUT || fileURLToPath(new URL('./out/fixture-final/', import.meta.url));
  const manifest = JSON.parse(readFileSync(join(out, 'manifest.json')));
  assert.equal(manifest.count, manifest.items.length);
  if (process.env.YT_THUMB_TEST_INPUT) {
    const source = JSON.parse(readFileSync(process.env.YT_THUMB_TEST_INPUT));
    assert.deepEqual(manifest.items.map(item => item.id), source.map(item => item.id));
  }
  for (const item of manifest.items) {
    const buf=readFileSync(join(out, `${item.id}.jpg`));
    assert.equal(buf.length, item.bytes);
    for (const box of item.bounds) {
      assert.ok(box.x >= 0 && box.y >= 0 && box.x+box.width <= 1280 && box.y+box.height <= 720);
      assert.ok(box.x+box.width <= 1060 || box.y+box.height <= 640);
    }
    assert.deepEqual(dimensions(buf),[1280,720]);
    assert.ok(buf.length<1_500_000);
  }
  const sheets = readdirSync(out).filter(name => /^contact-sheet-\d+\.jpg$/.test(name));
  assert.equal(sheets.length, Math.ceil(manifest.count / 12));
  for (const name of sheets) {
    const buf = readFileSync(join(out, name));
    assert.deepEqual(dimensions(buf), [1280,540]);
    assert.ok(buf.length < 1_500_000);
  }
});
