import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {validateData, usd, percent, fundingPercent, buildPackage, DISCLAIMER, captionLines} from './builders.mjs';
import {parseArgs} from './make-short.mjs';
import {LIQUIDATION_REACTION_THRESHOLD_USD, PLATFORM_KEYS, STRINGS, SUPPORTED_LOCALES} from './strings.mjs';
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
test('5-slide global package preserves numbers, lower bound and snapshot scope', () => {
  const data = validateData(fixture, null, now);
  assert.deepEqual(data.rates.map(r=>[r.venue,r.symbol]), [['Binance','RLC'],['Binance','S'],['OKX','S']]);
  const requiredCopy = ['fullData','scope','disclaimer','negativeFunding','snapshot','intervals','observed','longs','shorts','long','short'];
  assert.deepEqual(Object.keys(STRINGS), SUPPORTED_LOCALES);
  for (const lang of SUPPORTED_LOCALES) {
    const {slides,meta} = buildPackage(data,lang);
    assert.equal(slides.length,5);
    assert.equal(slides.reduce((s,r)=>s+r.duration,0),30);
    assert.ok(slides.every(s=>s.duration>=5 && s.duration<=8 && s.narration));
    assert.ok([...meta.title].length<=70);
    assert.ok(meta.description.split('\n').length>=2 && meta.description.split('\n').length<=4);
    assert.ok(meta.hashtags.length>=5 && meta.hashtags.length<=8);
    assert.equal(meta.disclaimer, DISCLAIMER);
    assert.equal(meta.reactionThresholdUsd, LIQUIDATION_REACTION_THRESHOLD_USD);
    assert.equal(meta.dir, lang === 'ar' ? 'rtl' : 'ltr');
    assert.equal(meta.rtl, lang === 'ar');
    assert.deepEqual(Object.keys(meta.platforms), PLATFORM_KEYS);
    for (const platform of PLATFORM_KEYS) {
      const entry = meta.platforms[platform];
      assert.ok([...entry.title].length<=70, `${lang} ${platform} title too long`);
      assert.ok(entry.description.includes(entry.cta.url));
      assert.ok(entry.description.includes(STRINGS[lang].copy.disclaimer));
      assert.ok(entry.cta.url.endsWith(`/liquidations?src=${platform}-short`));
      assert.ok(entry.cta.url.startsWith(`https://nexualpha.com/${lang.toLowerCase()}/`));
      assert.doesNotMatch(entry.cta.url,/code=|ref=|partner|invite/i);
      assert.ok(entry.hashtags.length>=5 && entry.hashtags.length<=8);
    }
    assert.match(meta.title,/\$16\.48M/);
    assert.doesNotMatch(meta.title,/暴跌|崩盘|送钱|buy|sell/i);
    assert.deepEqual(slides.map(s=>s.kind), ['hero','split','receipt','funding','end']);
    assert.ok(slides.every(s=>Array.isArray(s.captions) && s.captions.length && s.captions.every(c=>/[。！？.!?]$/u.test(c))));
    for (const slide of slides) {
      assert.equal(slide.dir, lang === 'ar' ? 'rtl' : 'ltr');
      assert.equal(slide.rtl, lang === 'ar');
      assert.deepEqual(Object.keys(slide.copy), [...requiredCopy, 'cta', 'domain']);
      for (const key of requiredCopy) assert.equal(typeof slide.copy[key], 'string', `${lang} ${slide.kind} copy.${key}`);
      assert.deepEqual(slide.reaction, {pose:'point-right', antenna:'green', thresholdUsd:LIQUIDATION_REACTION_THRESHOLD_USD, metric:'liquidation.totalUsd'});
      assert.deepEqual(slide.mascot, {pose:'point-right', antenna:'green', antennaThresholdUsd:LIQUIDATION_REACTION_THRESHOLD_USD});
    }
    assert.deepEqual(slides[0].hero, {value:16488040, format:'usd'});
    assert.equal(slides[1].hero.value, 14337661/16488040);
    assert.equal(slides[1].hero.format, 'percent');
    assert.equal(slides[1].hero.side, 'short');
    assert.ok(slides[2].lines.some(line => line.includes('OKX') && line.includes('ETHUSDT')));
    assert.equal(slides[2].hero.value, 2528150);
    assert.equal(slides[2].hero.format, 'usd');
    assert.deepEqual(Object.keys(slides[2].receipt), ['venue','symbol','side','time']);
    if (lang === 'zh-Hans') assert.match(slides[2].receipt.time,/2026-10-11 23:40:26 UTC\+8/);
    else assert.match(slides[2].receipt.time,/2026-10-11 15:40:26 UTC/);
    assert.ok(slides[2].lines.some(line => line.includes(slides[2].receipt.time)));
    assert.equal(slides[3].hero.value, -.00276609);
    assert.equal(slides[3].hero.format, 'funding');
    assert.equal(slides[3].support[0], STRINGS[lang].slides.funding.support()[0]);
    assert.equal(slides[3].rates[0].rate,-.00276609);
    assert.deepEqual(Object.keys(slides[3].rates[0]), ['venue','symbol','text','rate','intervalH']);
    assert.ok(Math.abs(slides[1].bar.longShare - 2150379/16488040)<1e-12);
    assert.equal(slides[4].domain, 'nexualpha.com');
    assert.equal(slides[4].lines[0], 'nexualpha.com');
    assert.equal(slides[4].cta, STRINGS[lang].copy.cta);
  }
});
test('captions stay as complete decimal-safe sentences', () => {
  assert.deepEqual(captionLines('At least $16.48M was liquidated. Shorts account for 87.0%.', 'en'), [
    'At least $16.48M was liquidated.',
    'Shorts account for 87.0%.',
  ]);
  assert.deepEqual(captionLines('Top rates: RLC, -0.27661%; S, -0.22452%.', 'en'), [
    'Top rates: RLC, -0.27661%; S, -0.22452%.',
  ]);
  assert.deepEqual(captionLines('覆盖交易所显示，24小时爆仓至少1648.80万美元。空头占87.0%。', 'zh-Hans'), [
    '覆盖交易所显示，24小时爆仓至少1648.80万美元。',
    '空头占87.0%。',
  ]);
});
test('Nexubo antenna switches to red at the documented liquidation threshold', () => {
  const fixtureCopy = copy();
  fixtureCopy.liquidations.h24.totalUsd = LIQUIDATION_REACTION_THRESHOLD_USD;
  fixtureCopy.liquidations.h24.longUsd = 40_000_000;
  fixtureCopy.liquidations.h24.shortUsd = 60_000_000;
  fixtureCopy.liquidations.h24.largest.usd = 10_000_000;
  const slides = buildPackage(validateData(fixtureCopy, null, now), 'en').slides;
  assert.ok(slides.every(slide => slide.reaction.antenna === 'red'));
  assert.ok(slides.every(slide => slide.mascot.pose === 'point-right'));
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
