import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { requireCurrentMarket } from './alert-sender.mjs';

for (const mode of ['rejected', 'unknown']) test(`reboot fanout ${mode}: retry eligible recipients, retain unknown outcomes, avoid regrouping duplicates`, () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'alert-reboot-'));
  const now = '2026-10-15T07:00:00Z'; // no English rhythm/digest slot, focus on event and listing fanout
  try {
    writeFileSync(path.join(dir, 'bot.env'), 'COMMUNITY_BOT_TOKEN=fixture-only\n');
    writeFileSync(path.join(dir, 'state.json'), JSON.stringify({ initialized: true, sentEvents: {}, sentListings: {}, digestDates: [] }));
    writeFileSync(path.join(dir, 'subs.json'), JSON.stringify({ users: { '100': { topics: ['moves'], lang: 'en' }, '200': { topics: ['listings'], lang: 'en' }, '300': { topics: ['listings'], lang: 'en' } } }));
    writeFileSync(path.join(dir, 'calls.jsonl'), '');
    const item = (id) => ({ id, venue: 'okx', category: 'listing', title: `OKX lists ${id.toUpperCase()}`, url: `https://www.okx.com/help/listing-${id}`, publishedAt: now });
    const bootstrap = `import {readFileSync, appendFileSync} from 'node:fs';
const NativeDate=Date; globalThis.Date=class extends NativeDate { constructor(...args){super(...(args.length?args:[${JSON.stringify(now)}]));} static now(){return NativeDate.parse(${JSON.stringify(now)});} };
globalThis.fetch=async(url,opts={})=>{
  if(url.includes('api.telegram.org')) {
    const payload=JSON.parse(opts.body), chat=String(payload.chat_id);
    appendFileSync(process.env.FIXTURE_DIR+'/calls.jsonl',JSON.stringify({phase:process.env.FIXTURE_PHASE,chat,text:payload.text})+'\\n');
    if(process.env.FIXTURE_PHASE==='1' && chat==='100' && process.env.FIXTURE_MODE==='unknown') throw new Error('timeout after possible accept');
    if(process.env.FIXTURE_PHASE==='1' && ['100','300'].includes(chat)) return Response.json({ok:false,error_code:400,description:'temporary rejection'},{status:400});
    return Response.json({ok:true,result:{message_id:1}});
  }
  if(url.includes('market-events')) return Response.json({generatedAt:${JSON.stringify(now)},sourceStatus:{markets:{status:'ok'}},events:[{type:'sharp-move',severity:'high'}],market:{majors:[]},liquidations:{h1:{longUsd:1,shortUsd:1},h24:{longUsd:1,shortUsd:1}}});
  if(url.includes('partners.json')) return Response.json({partners:[{slug:'okx',name:'OKX'}]});
  if(url.includes('official-announcements')) return Response.json(JSON.parse(readFileSync(process.env.FIXTURE_DIR+'/ann.json','utf8')));
  return Response.json({items:[]});
};`;
    const run = (phase) => spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`, fileURLToPath(new URL('./alert-sender.mjs', import.meta.url)), '--once'], {
      encoding: 'utf8', env: { ...process.env, ALERT_STATE_FILE: path.join(dir, 'state.json'), ALERT_SUBSCRIPTIONS_FILE: path.join(dir, 'subs.json'), ALERT_TRIGGERS_FILE: path.join(dir, 'missing.json'), BOT_ENV_FILE: path.join(dir, 'bot.env'), ALERT_CHANNELS: 'en:@en', OWNER_CHAT_ID: '', FIXTURE_PHASE: String(phase), FIXTURE_MODE: mode, FIXTURE_DIR: dir },
    });
    writeFileSync(path.join(dir, 'ann.json'), JSON.stringify({ items: [item('a')] }));
    const first = run(1);
    assert.equal(first.status, 1, first.stdout + first.stderr);
    let state = JSON.parse(readFileSync(path.join(dir, 'state.json')));
    assert.deepEqual(state.sentEvents, {});
    assert.deepEqual(state.sentListings, {});
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'heartbeat.json'))).status, 'degraded');
    writeFileSync(path.join(dir, 'ann.json'), JSON.stringify({ items: [item('a'), item('b')] }));
    const second = run(2);
    assert.equal(second.status, mode === 'unknown' ? 1 : 0, second.stdout + second.stderr);
    state = JSON.parse(readFileSync(path.join(dir, 'state.json')));
    assert.deepEqual(Object.keys(state.sentListings).sort(), ['a', 'b']);
    assert.equal(Object.keys(state.sentEvents).length, mode === 'unknown' ? 0 : 1);
    const before = readFileSync(path.join(dir, 'calls.jsonl'), 'utf8');
    run(3);
    assert.equal(readFileSync(path.join(dir, 'calls.jsonl'), 'utf8'), before);
    const calls = before.trim().split('\n').map(JSON.parse);
    assert.equal(calls.filter((c) => c.chat === '@en').length, 1);
    assert.equal(calls.filter((c) => c.chat === '100').length, mode === 'unknown' ? 1 : 2);
    const recovered200 = calls.find((c) => c.phase === '2' && c.chat === '200');
    assert.ok(recovered200);
    assert.doesNotMatch(recovered200.text, /OKX lists A/);
    assert.match(recovered200.text, /OKX lists B/);
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'heartbeat.json'))).status, mode === 'unknown' ? 'degraded' : 'ok');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('root stale false cannot override a failed underlying market collector source', () => {
  assert.throws(() => requireCurrentMarket({ stale: true }), /stale/);
  assert.throws(() => requireCurrentMarket({ stale: false, sourceStatus: { markets: { status: 'error' }, headlines: { status: 'ok' } } }), /markets unavailable/);
  assert.throws(() => requireCurrentMarket({ sourceStatus: { 'fapi.binance.com/fapi/v1/ticker/24hr': { status: 'open' } } }), /waiting for recovery/);
  assert.doesNotThrow(() => requireCurrentMarket({ sourceStatus: { markets: { status: 'ok' } } }));
});

test('daemon survives reboot DNS failures, backs off and resumes its normal cadence after recovery', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'alert-startup-'));
  try {
    writeFileSync(path.join(dir, 'bot.env'), 'COMMUNITY_BOT_TOKEN=fixture-only\n');
    const bootstrap = `import {appendFileSync} from 'node:fs';
let requests=0;
globalThis.fetch=async(url)=>{
  if(++requests<=6) throw new Error('fixture startup DNS unavailable');
  return Response.json(url.includes('partners')?{partners:[]}:url.includes('official-announcements')?{items:[]}:{events:[],market:{majors:[]},liquidations:{h24:{longUsd:0,shortUsd:0}}});
};
const wait=setTimeout;
globalThis.setTimeout=(callback,ms)=>{appendFileSync(process.env.FIXTURE_DIR+'/delays',''+ms+'\\n');if(ms===120000)process.exit(0);return wait(callback,0);};`;
    const result = spawnSync(process.execPath, ['--import', `data:text/javascript,${encodeURIComponent(bootstrap)}`,
      fileURLToPath(new URL('./alert-sender.mjs', import.meta.url))], { encoding: 'utf8', timeout: 10000,
      env: { ...process.env, BOT_ENV_FILE: path.join(dir, 'bot.env'), ALERT_STATE_FILE: path.join(dir, 'state.json'), ALERT_SUBSCRIPTIONS_FILE: path.join(dir, 'no-subs.json'), ALERT_TRIGGERS_FILE: path.join(dir, 'no-triggers.json'), ALERT_CHANNELS: 'xx:@none', OWNER_CHAT_ID: '', FIXTURE_DIR: dir },
    });
    assert.equal(result.status, 0, result.stdout + result.stderr);
    assert.equal(readFileSync(path.join(dir, 'delays'), 'utf8'), '1000\n2000\n120000\n');
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'heartbeat.json'))).status, 'ok');
    assert.equal(JSON.parse(readFileSync(path.join(dir, 'state.json'))).initialized, true);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
