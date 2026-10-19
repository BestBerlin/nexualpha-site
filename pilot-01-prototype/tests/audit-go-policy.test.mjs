import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { createGoRedirect, GO_ALIASES } from '../server/go-redirect.mjs';
import { buildPartnersFeed } from '../src/data/partners-feed.js';
import { publicCtaForVenue } from '../src/data/source-bound-cta.js';
import { BINANCE_OCTOBER_GO_SLUGS } from '../src/data/binance-october.js';
import { BITGET_ALLIANCE_GO_SLUG } from '../src/data/bitget-alliance.js';
import { KRAKEN_USDG_GO_SLUG } from '../src/data/kraken-usdg.js';
import { EXCHANGE_APK_BY_GO_SLUG } from '../src/data/exchange-apk.js';
import { BACKUP_SIGNUP_URLS } from '../src/data/backup-signup.js';
import { APPROVED_CAMPAIGNS } from '../src/data/campaign-autodraft.generated.js';

async function setup(t, options = {}) {
  const dir = await mkdtemp(path.join(tmpdir(), 'audit-go-policy-'));
  t.after(() => rm(dir, { recursive: true, force: true }));
  await mkdir(path.join(dir, 'intel'));
  await writeFile(path.join(dir, 'intel/partners.json'), JSON.stringify(buildPartnersFeed()));
  const eventFile = path.join(dir, 'events.jsonl');
  return { eventFile, handle: createGoRedirect({ clientRoot: dir, eventFile, now: () => new Date('2026-10-19T00:00:00Z'), mirrorHealth: async () => true, apkTargets: Object.fromEntries(Object.values(EXCHANGE_APK_BY_GO_SLUG).map(a => [a.venue, async () => a.officialUrl])), ...options }) };
}
const request = (route, headers = {}) => new Request(`https://nexualpha.com/go/${route}`, { headers: { 'user-agent': 'Mozilla/5.0', ...headers } });
const routes = [
  ...Object.keys(GO_ALIASES).map(alias => [alias, GO_ALIASES[alias] === 'binance-gifts' ? 'binance' : GO_ALIASES[alias]]),
  ['okx', 'okx'], ...Object.keys(BINANCE_OCTOBER_GO_SLUGS).map(s => [s, 'binance']),
  [BITGET_ALLIANCE_GO_SLUG, 'bitget'], [KRAKEN_USDG_GO_SLUG, 'kraken'],
  ...Object.entries(EXCHANGE_APK_BY_GO_SLUG).map(([s,a]) => [s,a.venue]),
  ...Object.keys(BACKUP_SIGNUP_URLS).map(v => [`${v}-alt`,v]),
  ['binance-page?to=%2Fen%2Fsupport', 'binance'],
  ...APPROVED_CAMPAIGNS.map(c => [`campaign-${c.id}`,c.venue]),
];
test('F02 all resolved routes deny neutral locales before counting, including aliases/campaigns/mirrors/APK', async t => {
  const {handle,eventFile}=await setup(t);
  for (const [route,venue] of routes) for(const locale of ['ru','ar','zh-Hant','ur','uk','vi']) {
    const res=await handle(request(`${route}${route.includes('?')?'&':'?'}locale=${locale}`));
    const prefix = {'zh-Hant':'zh-hant',uk:'uk-ua'}[locale] || locale;
    assert.equal(res.status,302,`${route} ${locale}`);
    assert.equal(res.headers.get('location'),`/${prefix}/exchanges/${venue}`,`${route} ${locale}`);
  }
  assert.equal(await readFile(eventFile,'utf8').catch(e=>e.code==='ENOENT'?'':Promise.reject(e)),'');
});
test('F02 independent language, URL market and edge country cannot override a deny',async t=>{
 const {handle}=await setup(t);
 for(const [query,headers] of [['locale=tr&market=US',{}],['locale=en&market=TR',{'cf-ipcountry':'US'}],['locale=en&market=US',{'cf-ipcountry':'TR'}],['lang=vi',{}],['locale=ru-RU&market=US',{}]]){
  const res=await handle(request(`bitget?${query}`,headers));
  assert.match(res.headers.get('location'),/^\/(?:tr\/|vi\/|ru\/)?exchanges\/bitget$/);
 }
});
test('F02 global feed routes keep exact existing registered target and code',async t=>{
 const {handle}=await setup(t);
 for(const p of buildPartnersFeed().partners){
  const res=await handle(request(`${p.slug}?src=tg-partners-feed`));
  assert.equal(res.headers.get('location'),publicCtaForVenue(p.slug,'en').registrationUrl,p.slug);
 }
});
test('F02 expired campaign requests remain neutral and allowed expiry preserves policy context',async t=>{
 const {handle}=await setup(t,{now:()=>new Date('2030-01-01')});
 for(const [slug,venue] of [[BITGET_ALLIANCE_GO_SLUG,'bitget'],...Object.keys(BINANCE_OCTOBER_GO_SLUGS).map(s=>[s,'binance'])]){
  assert.equal((await handle(request(`${slug}?locale=vi`))).headers.get('location'),`/vi/exchanges/${venue}`);
  const allowed=await handle(request(`${slug}?locale=es&market=GLOBAL`));
  const fallback=new URL(allowed.headers.get('location'),'https://nexualpha.com');
  assert.equal(fallback.searchParams.get('locale'),'es');
  assert.equal(fallback.searchParams.get('market'),'GLOBAL');
 }
});

test('F02 older site links inherit only same-origin referring-page context', async t => {
  const { handle } = await setup(t);
  const denied = await handle(request('bitget', { referer: 'https://nexualpha.com/tr/exchanges' }));
  assert.equal(denied.headers.get('location'), '/tr/exchanges/bitget');
  const external = await handle(request('bitget', { referer: 'https://untrusted.example/vi/exchanges' }));
  assert.equal(external.headers.get('location'), publicCtaForVenue('bitget', 'en').registrationUrl);
});

test('F02 explicit allowed query cannot erase a denied same-origin referring context', async t=>{
 const {handle}=await setup(t);
 for(const [route,ref] of [['bitget?locale=en','https://nexualpha.com/vi/exchanges/bitget'],['bitget?locale=en&market=GLOBAL','https://nexualpha.com/exchanges/bitget?market=TR']]) {
  const res=await handle(request(route,{referer:ref}));
  assert.equal(res.status,302);assert.equal(res.headers.get('location'),'/exchanges/bitget');
 }
});
