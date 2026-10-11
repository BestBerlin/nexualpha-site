import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateData, usd, percent, fundingPercent, buildPackage, DISCLAIMER} from './builders.mjs';
import {parseArgs} from './make-short.mjs';
const fixture = JSON.parse(readFileSync(new URL('./fixtures/market.json', import.meta.url)));
const now = Date.parse('2026-10-11T19:20:00Z');
const copy = () => structuredClone(fixture);

test('format USD conservatively, fractional rates as percentages', () => {
  assert.equal(usd(16488040), '$16.48M');
  assert.equal(usd(999999), '$999.99K');
  assert.equal(usd(999999999), '$999.99M');
  assert.equal(usd(0), '$0');
  assert.equal(percent(.8695685), '87.0%');
  assert.equal(fundingPercent(-.00276609), '-0.27661%');
  assert.equal(fundingPercent(0), '0.00000%');
  assert.throws(() => usd(NaN));
});
test('5-slide bilingual package preserves numbers, lower bound and snapshot scope', () => {
  const data = validateData(fixture, null, now);
  assert.deepEqual(data.rates.map(r=>[r.venue,r.symbol]), [['Binance','RLC'],['Binance','S'],['OKX','S']]);
  for (const lang of ['en','zh-Hans']) {
    const {slides,meta} = buildPackage(data,lang);
    assert.equal(slides.length,5);
    assert.equal(slides.reduce((s,r)=>s+r.duration,0),35);
    assert.ok(slides.every(s=>s.duration>=5 && s.duration<=8 && s.narration));
    assert.ok([...meta.title].length<=70);
    assert.ok(meta.description.split('\n').length>=2 && meta.description.split('\n').length<=4);
    assert.ok(meta.hashtags.length>=5 && meta.hashtags.length<=8);
    assert.ok(meta.description.includes(DISCLAIMER));
    assert.ok(meta.description.includes('https://nexualpha.com/zh-hans/liquidations?src=yt-short'));
    assert.ok(meta.description.includes('https://t.me/NexuAlphaClub'));
    assert.match(meta.title,/16\.48M/);
    assert.doesNotMatch(meta.title,/暴跌|崩盘|送钱|buy|sell/i);
    assert.ok(slides[2].lines.includes('OKX · ETHUSDT'));
    assert.match(slides[2].lines[2],/15:40:26 UTC/);
    assert.equal(slides[3].rates[0].rate,-.00276609);
    assert.ok(Math.abs(slides[1].bar.longShare - 2150379/16488040)<1e-12);
  }
});
test('freshness applies independently to market and funding; exact 60-minute boundary', () => {
  assert.doesNotThrow(()=>validateData(fixture,null,Date.parse(fixture.funding.generatedAt)+3600000));
  for (const mutate of [x=>x.generatedAt='2026-10-11T18:19:00Z', x=>x.funding.generatedAt='2026-10-11T18:19:00Z', x=>x.generatedAt='2026-10-11T19:21:00Z', x=>delete x.generatedAt]) {
    const x=copy(); mutate(x); assert.throws(()=>validateData(x,null,now),/timestamp/);
  }
});
test('missing/inconsistent fields fail; null funding never becomes zero', () => {
  for (const mutate of [x=>delete x.liquidations.h24.longUsd, x=>x.liquidations.h24.totalUsd+=2, x=>x.liquidations.h24.largest.side='BUY', x=>x.liquidations.h24.largest.symbol='OTHER:ETH', x=>x.liquidations.h24.largest.at='2026-10-10T18:00:00Z', x=>x.funding.rows[0].binanceRate='0.1', x=>delete x.funding.rows[0].okxRate, x=>x.funding.rows=[], x=>x.liquidations.h24.totalUsd=0]) {
    const x=copy(); mutate(x); assert.throws(()=>validateData(x,null,now));
  }
  const x=copy(); x.liquidations.h24.largest.symbol='ETHUSDT';
  assert.equal(validateData(x,null,now).largest.venue,'Binance');
  x.liquidations.h24.largest.symbol='OKX:ETH:USDT';
  assert.throws(()=>validateData(x,null,now),/Malformed/);
});
test('fallback funding validates venue read time, interval and preserves zero rates', () => {
  const x=copy(); delete x.funding;
  const f={generatedAt:fixture.generatedAt,venues:{binance:{ok:true,readAt:fixture.generatedAt,rows:[{symbol:'BTC',rate:0,intervalH:8},{symbol:'ETH',rate:-.001,intervalH:4},{symbol:'SOL',rate:.0001,intervalH:1}]},unavailable:{ok:false}}};
  const data=validateData(x,f,now);
  assert.equal(data.rates[2].rate,0);
  assert.equal(data.rates[0].intervalH,4);
  f.venues.binance.readAt='2026-10-11T18:00:00Z';
  assert.throws(()=>validateData(x,f,now),/timestamp/);
});
test('CLI rejects unsupported languages, typos and missing arguments', () => {
  assert.deepEqual(parseArgs(['--lang','en','--voice','--out','/tmp/example']), {lang:'en',voice:true,out:'/tmp/example'});
  for (const args of [[],['--lang','zh'],['--lang'],['--out','--voice'],['--wat']]) assert.throws(()=>parseArgs(args));
});
